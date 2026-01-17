import world from '../world.js';
import { scaleToKm } from '../constants.js';
import { cartesianToPolar, polarToCartesian, normalizeLongitude } from '../utils.js';
import { MILKYWAY_TEXTURES, updateMilkyWayTexture, displayAxis, updateGrid } from '../scene/scene.js';
import { updateCannonWithParams, fireCannonball, cannonParams } from '../scene/cannon.js';
import { TRAIL_STYLES } from '../scene/trails.js';
import {
    EARTH_MAIN_TEXTURES, EARTH_BUMP_TEXTURES, EARTH_ROUGHNESS_TEXTURES, updateEarthMainTexture, updateEarthRoughnessTexture,
    updateEarthHeightTexture, earthRotationDisabled, disableEarthRotation, earthSettings, updateEarthSegments
} from '../scene/earth.js';
import { MOON_MAIN_TEXTURES, MOON_BUMP_TEXTURES, updateMoonMainTexture, updateMoonBumpTexture, disableMoonRotation } from '../scene/moon.js';
import { ATMOSPHERE_REGULAR_HEIGHT_KM, ATMOSPHERE_REGULAR_DENSITY_SURFACE, setAtmosphereHeight, setAtmosphereDensity } from '../scene/atmosphere.js';
import { CAMERA_MODES, CAMERA_TARGETS, initCameraControls, switchCameraMode, switchCameraTarget, registerCameraModeSelect, registerCameraTargetSelect } from './camera.js'
import { initDraggings } from './dragging.js'
import { addSlider, addCheckbox, addCustomSelect, addPanel, addSubPanel, addReadOnly, addEditableText } from './widgets.js'

export let timePaused = false;
export let timeAcceleration = 100;

let cannonLatDisplay, cannonLonDisplay, cannonAltDisplay, cannonAzDisplay, cannonElDisplay;
let cannonLatSlider, cannonLonSlider, cannonAltSlider, cannonAzSlider, cannonElSlider;

let currentEntityName = 'Satellite-1', entityPanelContainer = null, entitySelectRef = null;
const entityWidgets = {}, entitySelectOptions = [];;

export function initControls() {

    initCameraControls();

    createInterface();

    initDraggings();

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyT' && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const currentEntityIndex = entitySelectOptions.findIndex(e => e.value === currentEntityName);
            const nextEntityIndex = currentEntityIndex < entitySelectOptions.length - 1 ? currentEntityIndex + 1 : 0;
            entitySelectRef.value = entitySelectOptions[nextEntityIndex].value;
        }
    });
}

function createInterface() {
    const controlsDiv = document.getElementById('controls');
    if (!controlsDiv) {
        console.error("Element #controls not found !");
        return;
    }

    const contentWrapper = controlsDiv.querySelector('.main-content-wrapper');
    if (!contentWrapper) {
        console.error('Element #main-content-wrapper not found in #controls');
        return;
    }

    const mainDetails = controlsDiv.querySelector('#main-controls-toggle');

    // Controls are closed by default on mobile
    let isMobile = false;
    if (window.innerWidth <= 768) {
        isMobile = true;
    }
    if (isMobile) {
        mainDetails.open = false;
    } else {
        mainDetails.open = true;
    }

    // Time panel    
    const timePanel = addPanel(contentWrapper, 'Time control');
    const timeButton = document.createElement('button');
    timeButton.textContent = 'Stop';
    timeButton.classList.add('time-button');
    timeButton.addEventListener('click', () => {
        timePaused = !timePaused;
        timeButton.textContent = timePaused ? 'Resume' : 'Stop';
    });
    timePanel.appendChild(timeButton);
    addSlider(timePanel, 'Time acceleration', 1, 100000, timeAcceleration, value => {
        timeAcceleration = value;
    }, 1.0, { logarithmic: true });
    addCheckbox(timePanel, 'Disable Earth & Moon rotation', '', earthRotationDisabled, value => {
        disableEarthRotation(value);
        disableMoonRotation(value);
    });
    if (isMobile) {
        timePanel.parentElement.open = false;
    } else {
        timePanel.parentElement.open = true;
    }

    // Entity panel
    const entityPanel = addPanel(contentWrapper, 'Objects');
    let cameraTargetSelect;
    entitySelectRef = addCustomSelect(entityPanel, 'Select an object or press \'t\' to switch', null, [], null,
        name => {
            currentEntityName = name;
            rebuildEntityPanel();
            //switchCameraTarget(name);
            if (cameraTargetSelect) cameraTargetSelect.value = name;
        }
    );
    entityPanelContainer = document.createElement('div');
    entityPanel.appendChild(entityPanelContainer);
    refreshEntitySelect();
    if (isMobile) {
        entityPanel.parentElement.open = false;
    } else {
        entityPanel.parentElement.open = true;
    }

    // Atmosphere panel
    const atmoshpereGroupDiv = addPanel(contentWrapper, 'Atmosphere');
    addSlider(atmoshpereGroupDiv, 'Height (km)', 0, 600, ATMOSPHERE_REGULAR_HEIGHT_KM, value => {
        setAtmosphereHeight(value);
    }, 5);
    addSlider(atmoshpereGroupDiv, 'Density at sea level (kg/m³)', 0.0, 2.0, ATMOSPHERE_REGULAR_DENSITY_SURFACE, value => {
        setAtmosphereDensity(value);
    }, 0.01);
    // addSlider(atmoshpereGroupDiv, 'Opacity', 0.0, 1.0, 0.7, value => {
    //     setAtmosphereOpacity(value);
    // }, 0.1);
    // addSlider(atmoshpereGroupDiv, 'PowFactor', 0.0, 10.0, 2.0, value => {
    //     setAtmosphereParam1(value);
    // }, 0.1);
    // addSlider(atmoshpereGroupDiv, 'Multiplier', 0.0, 10.0, 5.0, value => {
    //     setAtmosphereParam2(value);
    // }, 0.1);

    // Cannon panel
    const cannonPanel = addPanel(contentWrapper, 'Cannon');
    [cannonLatDisplay, cannonLatSlider] = addSlider(cannonPanel, 'Latitude (°)', -90, 90, cannonParams.lat, value => {
        cannonParams.lat = value;
        updateCannonWithParams();
    }, 0.1);
    [cannonLonDisplay, cannonLonSlider] = addSlider(cannonPanel, 'Longitude (°)', -180, 180, cannonParams.lon, value => {
        cannonParams.lon = value;
        updateCannonWithParams();
    }, 0.1);
    [cannonAltDisplay, cannonAltSlider] = addSlider(cannonPanel, 'Altitude (km)', 0, 3000, cannonParams.altitude, value => {
        cannonParams.altitude = value;
        updateCannonWithParams();
    }, 1);
    [cannonAzDisplay, cannonAzSlider] = addSlider(cannonPanel, 'Azimuth (°)', 0, 360, cannonParams.azimuth, value => {
        cannonParams.azimuth = value;
        updateCannonWithParams();
    }, 1);

    // Camera panel    
    const cameraPanel = addPanel(contentWrapper, 'Camera');
    cameraTargetSelect = addCustomSelect(cameraPanel, 'Camera target', '(or press \'t\' to switch target)', CAMERA_TARGETS, 'universe',
        value => { switchCameraTarget(value); });
    registerCameraTargetSelect(cameraTargetSelect);
    const cameraModeSelect = addCustomSelect(cameraPanel, 'Camera mode', '(or press \'c\' to switch mode)', CAMERA_MODES, 'orbit',
        value => { switchCameraMode(value); });
    registerCameraModeSelect(cameraModeSelect);
    cameraTargetSelect.value = 'Earth';

    // Display panel 
    const displayPanel = addPanel(contentWrapper, 'Display');
    let defaultEarthMainTexture = 'assets/earth/bluemarble-5k.jpg';
    let defaultEarthRoughnessTexture = 'assets/earth/ocean-4k.png';
    let defaultEarthBumpTexture = 'assets/earth/bump-4k.jpg';
    let defaultMoonMainTexture = 'assets/moon/nasa-4k.jpg';
    let defaultMoonBumpTexture = 'assets/moon/bump-5k.jpg';
    let defaultMilkyWayTexture = 'assets/milkyway/solarsystemscope-8k.jpg';
    if (isMobile) {
        defaultEarthMainTexture = 'assets/earth/bluemarble-5k.jpg';
        defaultEarthRoughnessTexture = 'none';
        defaultEarthBumpTexture = 'none';
        defaultMoonMainTexture = 'assets/moon/nasa-2k.jpg';
        defaultMoonBumpTexture = 'none';
        defaultMilkyWayTexture = 'assets/milkyway/solarsystemscope-4k.jpg';
    }
    // Earth sub panel
    const earthPanel = addSubPanel(displayPanel, 'Earth', false);
    addCustomSelect(earthPanel, 'Earth main texture', null, EARTH_MAIN_TEXTURES, defaultEarthMainTexture,
        value => { updateEarthMainTexture(value); });
    updateEarthMainTexture(defaultEarthMainTexture);
    addCustomSelect(earthPanel, 'Earth roughness texture', null, EARTH_ROUGHNESS_TEXTURES, defaultEarthRoughnessTexture,
        value => { updateEarthRoughnessTexture(value); });
    updateEarthRoughnessTexture(defaultEarthRoughnessTexture);
    const earthHeightTextureSelect = addCustomSelect(earthPanel, 'Earth height texture', null, EARTH_BUMP_TEXTURES, defaultEarthBumpTexture,
        value => { updateEarthHeightTexture(value); });
    updateEarthHeightTexture(defaultEarthBumpTexture);
    addCheckbox(earthPanel, 'Use as displacement (BETA)', '', false, value => {
        earthSettings.useDisplacement = value;
        updateEarthHeightTexture(earthHeightTextureSelect.value);
    });
    addSlider(earthPanel, 'Height scale', 0.1, 100, earthSettings.heightScale, value => {
        earthSettings.heightScale = value;
        updateEarthHeightTexture(earthHeightTextureSelect.value);
    }, 1);
    const earthSegmentsSlider = addSlider(earthPanel, 'Sphere segments (width)', 32, 2048, earthSettings.segments.width, val => {
        updateEarthSegments(val, Math.round(val / 2));
    }, 32);
    earthSegmentsSlider.value = earthSettings.segments.width;
    // Moon sub panel
    const moonPanel = addSubPanel(displayPanel, 'Moon', false);
    addCustomSelect(moonPanel, 'Moon main texture', null, MOON_MAIN_TEXTURES, defaultMoonMainTexture,
        value => { updateMoonMainTexture(value); });
    updateMoonMainTexture(defaultMoonMainTexture);
    addCustomSelect(moonPanel, 'Moon bump texture', null, MOON_BUMP_TEXTURES, defaultMoonBumpTexture,
        value => { updateMoonBumpTexture(value); });
    updateMoonBumpTexture(defaultMoonBumpTexture);
    // Universe sub panel
    const universePanel = addSubPanel(displayPanel, 'Universe', false);
    addCustomSelect(universePanel, 'Milky Way background', null, MILKYWAY_TEXTURES, defaultMilkyWayTexture,
        value => { updateMilkyWayTexture(value); });
    updateMilkyWayTexture(defaultMilkyWayTexture);
    addCheckbox(universePanel, 'Display referential axes', '', false, value => {
        displayAxis(value);
    });
    //const gridPanel = addSubPanel(universePanel, 'Grid', false);
    const spacer = document.createElement('div');
    spacer.style.height = '12px';
    universePanel.appendChild(spacer);
    const gridShowCheckbox = addCheckbox(universePanel, 'Display space grid', '', false, value => {
        updateGrid(value, parseFloat(gridSizeDisplay.value), parseFloat(gridResDisplay.value));
    });
    let gridSizeDisplay, gridSizeSlider;
    [gridSizeDisplay, gridSizeSlider] = addSlider(universePanel, 'Size (km)', 10000, 1000000, 1000000, value => {
        if (gridShowCheckbox.checked) {
            updateGrid(true, value, parseFloat(gridResDisplay.value));
        }
    }, 10000, { logarithmic: false });
    let gridResDisplay, gridResSlider;
    [gridResDisplay, gridResSlider] = addSlider(universePanel, 'Resolution (km)', 1000, 100000, 100000, value => {
        if (gridShowCheckbox.checked) {
            updateGrid(true, parseFloat(gridSizeDisplay.value), value);
        }
    }, 1000, { logarithmic: false });

    // Fire control panel
    const firePanel = addPanel(contentWrapper, 'Fire control');
    [cannonElDisplay, cannonElSlider] = addSlider(firePanel, 'Elevation (°)', 0, 90, cannonParams.elevation, value => {
        cannonParams.elevation = value;
        updateCannonWithParams();
    }, 1);
    addSlider(firePanel, 'Muzzle speed (km/s)', 0, 15, cannonParams.speed, value => {
        cannonParams.speed = value;
    }, 0.01);
    const fireButton = document.createElement('button');
    fireButton.textContent = 'Fire the cannonball !';
    fireButton.classList.add('fire-button');
    fireButton.addEventListener('click', () => {
        fireCannonball();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key == " " || e.code == "Space") {
            fireCannonball();
        }
    });
    firePanel.parentElement.open = true;
    firePanel.appendChild(fireButton);
}

export function updateCannonWidgets() {
    if (cannonLatDisplay && cannonLatSlider) {
        cannonLatDisplay.value = cannonParams.lat.toFixed(1);
        cannonLatSlider.value = cannonParams.lat.toFixed(1);
        cannonLatSlider.dispatchEvent(new Event('input'));
    }
    if (cannonLonDisplay && cannonLonSlider) {
        cannonLonDisplay.value = cannonParams.lon.toFixed(1);
        cannonLonSlider.value = cannonParams.lon.toFixed(1);
        cannonLonSlider.dispatchEvent(new Event('input'));
    }
    if (cannonAltDisplay && cannonAltSlider) {
        cannonAltDisplay.value = cannonParams.altitude.toFixed(0);
        cannonAltSlider.value = cannonParams.altitude.toFixed(0);
        cannonAltSlider.dispatchEvent(new Event('input'));
    }
    if (cannonAzDisplay && cannonAzSlider) {
        cannonAzDisplay.value = cannonParams.azimuth.toFixed(0);
        cannonAzSlider.value = cannonParams.azimuth.toFixed(0);
        cannonAzSlider.dispatchEvent(new Event('input'));
    }
    if (cannonElDisplay && cannonElSlider) {
        cannonElDisplay.value = cannonParams.elevation.toFixed(0);
        cannonElSlider.value = cannonParams.elevation.toFixed(0);
        cannonElSlider.dispatchEvent(new Event('input'));
    }
}

function rebuildEntityPanel() {
    entityPanelContainer.innerHTML = '';
    if (!currentEntityName) return;

    const entity = world.getEntityByName(currentEntityName);
    if (!entity) return;

    entityWidgets.current = entity;

    // ── Infos panel ───────────────────────────────────────────────
    const infosPanel = addSubPanel(entityPanelContainer, 'Infos', false);
    addReadOnly(infosPanel, 'Type', entity.type);
    entityWidgets.status = addReadOnly(infosPanel, 'Status', entity.isFreeFalling ? 'Flying' : 'Crashed', entity.isFreeFalling ? 'rgba(37, 233, 40, 1)' : '#f44');
    addEditableText(infosPanel, 'Description', entity.description, v => entity.description = v);
    addSlider(infosPanel, 'Mass (kg)', 1, 10000, entity.mass, v => entity.mass = v, 1, { logarithmic: true });
    addSlider(infosPanel, 'Drag coeff.', 0.0001, 0.01, entity.dragCoefficient, v => entity.dragCoefficient = v, 0.0001);
    //addReadOnly(basic, 'Cross-section (m²)', entity.crossSectionArea.toExponential(2));

    // ────────────────── Scaling panel ─────────────────────────────────────
    const scalingPanel = addSubPanel(entityPanelContainer, 'Scaling', false);
    const currentScale = entity.body.scale;
    const initialGlobal = (currentScale.x + currentScale.y + currentScale.z) / 3;
    let xSlider, ySlider, zSlider;
    addSlider(
        scalingPanel, 'Global scale', 1, 100000, initialGlobal,
        value => {
            entity.body.scale.set(value, value, value);
            if (xSlider) xSlider.setValue(value);
            if (ySlider) ySlider.setValue(value);
            if (zSlider) zSlider.setValue(value);
        },
        1,
        { logarithmic: true }
    );
    addSlider(scalingPanel, 'Scale X', 1, 100000, currentScale.x,
        value => { entity.body.scale.x = value; }, 1, { logarithmic: true }
    );
    xSlider = scalingPanel.querySelectorAll('input[type="range"]')[1];  // le 2e slider (index 1)

    addSlider(scalingPanel, 'Scale Y', 1, 100000, currentScale.y,
        value => { entity.body.scale.y = value; }, 1, { logarithmic: true }
    );
    ySlider = scalingPanel.querySelectorAll('input[type="range"]')[2];

    addSlider(scalingPanel, 'Scale Z', 1, 100000, currentScale.z,
        value => { entity.body.scale.z = value; }, 1, { logarithmic: true }
    );
    zSlider = scalingPanel.querySelectorAll('input[type="range"]')[3];

    // ── Position panel ────────────────────────────────────────────
    const positionPanel = addSubPanel(entityPanelContainer, 'Position', true);

    const polarGroup = addSubPanel(positionPanel, 'Earth coords', true);
    const pos = entity.body.position;
    const polar = cartesianToPolar(pos);
    //polar.lon = normalizeLongitude(polar.lon - (earth.rotation.y * 180 / Math.PI));
    entityWidgets.lat = addSlider(polarGroup, 'Latitude (°)', -90, 90, polar.lat, updateEntityLat, 0.1);
    entityWidgets.lon = addSlider(polarGroup, 'Longitude (°)', -180, 180, polar.lon, updateEntityLon, 0.1);
    entityWidgets.alt = addSlider(polarGroup, 'Altitude (km)', 1, 500000, polar.alt, updateEntityAlt, 1, { logarithmic: true });

    const worldGroup = addSubPanel(positionPanel, 'World coords', true);
    entityWidgets.posX = addReadOnly(worldGroup, 'X (km)', scaleToKm(pos.x).toFixed(0));
    entityWidgets.posY = addReadOnly(worldGroup, 'Y (km)', scaleToKm(pos.y).toFixed(0));
    entityWidgets.posZ = addReadOnly(worldGroup, 'Z (km)', scaleToKm(pos.z).toFixed(0));

    function updateEntityLat(value) {
        const entity = entityWidgets.current;
        if (!entity) return;
        const polar = cartesianToPolar(entity.body.position);
        polar.lat = value;
        //polar.lon = normalizeLongitude(polar.lon + (earth.rotation.y * 180 / Math.PI) % 360);
        entity.body.position.copy(polarToCartesian(polar.lat, polar.lon, polar.alt));
    }

    function updateEntityLon(value) {
        const entity = entityWidgets.current;
        if (!entity) return;
        const polar = cartesianToPolar(entity.body.position);
        polar.lon = value;
        //polar.lon = normalizeLongitude(value + (earth.rotation.y * 180 / Math.PI) % 360);
        entity.body.position.copy(polarToCartesian(polar.lat, polar.lon, polar.alt));
    }

    function updateEntityAlt(value) {
        const entity = entityWidgets.current;
        if (!entity) return;
        const polar = cartesianToPolar(entity.body.position);
        polar.alt = value;
        //polar.lon = normalizeLongitude(polar.lon + (earth.rotation.y * 180 / Math.PI) % 360);
        entity.body.position.copy(polarToCartesian(polar.lat, polar.lon, polar.alt));
    }

    // ── Velocity panel ────────────────────────────────────────────
    const velocityPanel = addSubPanel(entityPanelContainer, 'Velocity', false);
    entityWidgets.vx = addReadOnly(velocityPanel, 'Vx (km/s)', scaleToKm(entity.velocity.x).toFixed(3));
    entityWidgets.vy = addReadOnly(velocityPanel, 'Vy (km/s)', scaleToKm(entity.velocity.y).toFixed(3));
    entityWidgets.vz = addReadOnly(velocityPanel, 'Vz (km/s)', scaleToKm(entity.velocity.z).toFixed(3));
    entityWidgets.speed = addReadOnly(velocityPanel, 'Speed (km/s)', scaleToKm(entity.velocity.length()).toFixed(3));

    addCheckbox(velocityPanel, 'Show velocity vector', null, entity.vectors.showVelocity, v => {
        entity.vectors.showVelocity = v;
    });

    // ── Acceleration panel ───────────────────────────────────────
    const accelerationPanel = addSubPanel(entityPanelContainer, 'Acceleration', false);
    const fmt = v => v.toExponential(2);

    const container = document.createElement('div');
    Object.assign(container.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        margin: '2px 0',
        width: '100%'
    });
    accelerationPanel.appendChild(container);

    entityWidgets.totalAcc = addReadOnly(container, 'Total (km/s²)', fmt(scaleToKm(entity.accelerations.total.length())));

    const makeRow = () => {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            minWidth: '100%',
            boxSizing: 'border-box'
        });
        container.appendChild(row);
        return row;
    };

    const gravRow = makeRow();
    entityWidgets.gravAcc = addReadOnly(gravRow, '→ Gravity (km/s²)', fmt(scaleToKm(entity.accelerations.gravity.length())));
    addCheckbox(gravRow, null, null, entity.vectors.showAccelerationForGravity, v => { entity.vectors.showAccelerationForGravity = v; });

    const dragRow = makeRow();
    entityWidgets.dragAcc = addReadOnly(dragRow, '→ Drag (km/s²)', fmt(scaleToKm(entity.accelerations.friction.length())));
    addCheckbox(dragRow, null, null, entity.vectors.showAccelerationForDrag, v => { entity.vectors.showAccelerationForDrag = v; });

    const engineRow = makeRow();
    entityWidgets.engineAcc = addReadOnly(engineRow, '→ Engine (km/s²)', fmt(scaleToKm(entity.accelerations.engine.length())));
    addCheckbox(engineRow, null, null, entity.vectors.showAccelerationForEngine, v => { entity.vectors.showAccelerationForEngine = v; });

    const totalRow = makeRow();
    const spacer = document.createElement('div');
    spacer.style.width = '200px'; // fake space to align the global checkbox with others
    spacer.style.visibility = 'hidden';
    totalRow.style.marginTop = '10px';
    totalRow.appendChild(spacer);
    addCheckbox(totalRow, 'Show total acceleration vector', null, entity.vectors.showAcceleration, v => { entity.vectors.showAcceleration = v; });

    // ── Trail panel ───────────────────────────────────────────────
    const trailPanel = addSubPanel(entityPanelContainer, 'Trail display', false);

    entityWidgets.trailEnabled = addCheckbox(trailPanel, 'Enabled', null, entity.trail.enabled, enabled => {
        if (entity.trail) {
            entity.trail.enabled = enabled;
        }
    });

    entityWidgets.trailStyle = addCustomSelect(
        trailPanel,
        'Style and color',
        null,
        TRAIL_STYLES,
        entity.trail.style,
        newStyle => entity.trail.updateTrailStyle(newStyle)
    );
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = entity.trail.color;
    colorInput.onchange = () => {
        entity.trail.updateTrailColor(colorInput.value);
    };
    trailPanel.appendChild(colorInput);
    addSlider(trailPanel, 'Lifetime (seconds)', 0, 100, entity.trail.lifetime, v => entity.trail.lifetime = v, 1);
}

export function updateEntityWidgets() {
    if (!currentEntityName) return;
    const e = world.getEntityByName(currentEntityName);
    if (!e) return;

    entityWidgets.status.textContent = e.isFreeFalling ? 'Flying' : 'Crashed';
    entityWidgets.status.style.color = e.isFreeFalling ? 'rgba(37, 233, 40, 1)' : '#f44';

    // Position
    const pos = e.body.position;
    entityWidgets.posX.textContent = scaleToKm(pos.x).toFixed(0);
    entityWidgets.posY.textContent = scaleToKm(pos.y).toFixed(0);
    entityWidgets.posZ.textContent = scaleToKm(pos.z).toFixed(0);
    const polarPos = cartesianToPolar(pos);
    entityWidgets.lat[0].value = polarPos.lat.toFixed(1);
    entityWidgets.lon[0].value = polarPos.lon.toFixed(1);
    entityWidgets.alt[0].value = polarPos.alt.toFixed(0);
    entityWidgets.lat[1].value = polarPos.lat.toFixed(1);
    entityWidgets.lon[1].value = polarPos.lon.toFixed(1);
    entityWidgets.alt[1].setValue(polarPos.alt);

    // Speed
    entityWidgets.vx.textContent = scaleToKm(e.velocity.x).toFixed(3);
    entityWidgets.vy.textContent = scaleToKm(e.velocity.y).toFixed(3);
    entityWidgets.vz.textContent = scaleToKm(e.velocity.z).toFixed(3);
    entityWidgets.speed.textContent = scaleToKm(e.velocity.length()).toFixed(3);

    // Accelerations
    const s = scaleToKm;
    entityWidgets.totalAcc.textContent = s(e.accelerations.total.length()).toExponential(2);
    entityWidgets.gravAcc.textContent = s(e.accelerations.gravity.length()).toExponential(2);
    entityWidgets.dragAcc.textContent = s(e.accelerations.friction.length()).toExponential(2);
}

export function refreshEntitySelect() {
    if (!entitySelectRef) return;

    entitySelectOptions.length = 0;
    for (const entity of world.getPhysicalEntities()) {
        entitySelectOptions.push({ value: entity.name, label: entity.name })
    }

    entitySelectRef.updateOptions(entitySelectOptions, currentEntityName);

    if (!world.getEntityByName(currentEntityName)) {
        currentEntityName = entitySelectOptions[0]?.value || null;
        rebuildEntityPanel();
    }
}
