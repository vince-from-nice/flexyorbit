import world from '../world.js';
import { scaleToKm } from '../constants.js';
import { cartesianToPolar, polarToCartesian, normalizeLongitude } from '../utils.js';
import { displayAxis } from '../scene/scene.js';
import { updateCannonWithParams, fireCannonball, cannonParams, cannonballMesh } from '../scene/cannon.js';
import { TRAIL_STYLES } from '../scene/trails.js';
import { EARTH_TEXTURES, earth, setEarthTexture, earthRotationDisabled, disableEarthRotation } from '../scene/earth.js';
import { disableMoonRotation } from '../scene/moon.js';
import { ATMOSPHERE_REGULAR_HEIGHT_KM, ATMOSPHERE_REGULAR_DENSITY_SURFACE, setAtmosphereHeight, setAtmosphereDensity } from '../scene/atmosphere.js';
import { CAMERA_MODES, CAMERA_TARGETS, initCameraControls, switchCameraMode, switchCameraTarget, registerCameraModeSelect, registerCameraTargetSelect } from './camera.js'
import { initDraggings } from './dragging.js'
import { addSlider, addCheckbox, addCustomSelect, addPanel, addSubPanel, addReadOnly, addEditableText } from './widgets.js'

export let timePaused = false;
export let timeAcceleration = 100;

let cannonLatDisplay, cannonLonDisplay, cannonAltDisplay, cannonAzDisplay, cannonElDisplay;
let cannonLatSlider, cannonLonSlider, cannonAltSlider, cannonAzSlider, cannonElSlider;

let currentEntityName = 'Satellite-1', entityPanelContainer = null, entitySelectRef = null;
const entityWidgets = {};

export function initControls() {

    createInterface();

    initCameraControls();

    initDraggings();
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
    entitySelectRef = addCustomSelect(entityPanel, null, null, [], null,
        name => { currentEntityName = name; rebuildEntityPanel(); }
    );
    entityPanelContainer = document.createElement('div');
    entityPanel.appendChild(entityPanelContainer);
    //refreshEntitySelect();
    //currentEntityName = 'Satellite-1';
    refreshEntitySelect();

    if (isMobile) {
        entityPanel.parentElement.open = false;
    } else {
        entityPanel.parentElement.open = false;
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
    const cannonGroupDiv = addPanel(contentWrapper, 'Cannon');
    [cannonLatDisplay, cannonLatSlider] = addSlider(cannonGroupDiv, 'Latitude (°)', -90, 90, cannonParams.lat, value => {
        cannonParams.lat = value;
        updateCannonWithParams();
    }, 0.1);
    [cannonLonDisplay, cannonLonSlider] = addSlider(cannonGroupDiv, 'Longitude (°)', -180, 180, cannonParams.lon, value => {
        cannonParams.lon = value;
        updateCannonWithParams();
    }, 0.1);
    [cannonAltDisplay, cannonAltSlider] = addSlider(cannonGroupDiv, 'Altitude (km)', 0, 3000, cannonParams.altitude, value => {
        cannonParams.altitude = value;
        updateCannonWithParams();
    }, 1);
    [cannonAzDisplay, cannonAzSlider] = addSlider(cannonGroupDiv, 'Azimuth (°)', 0, 360, cannonParams.azimuth, value => {
        cannonParams.azimuth = value;
        updateCannonWithParams();
    }, 1);

    // Camera panel    
    const cameraPanel = addPanel(contentWrapper, 'Camera');
    const cameraTargetSelect = addCustomSelect(cameraPanel, 'Camera target', '(or press \'t\' to switch target)', CAMERA_TARGETS, 'universe',
        value => { switchCameraTarget(value); });
    registerCameraTargetSelect(cameraTargetSelect);
    const cameraModeSelect = addCustomSelect(cameraPanel, 'Camera mode', '(or press \'c\' to switch mode)', CAMERA_MODES, 'orbit',
        value => { switchCameraMode(value); });
    registerCameraModeSelect(cameraModeSelect);

    // Display panel 
    const displayGroup = addPanel(contentWrapper, 'Display');
    // addCustomSelect(displayGroup, 'Change cannonball trail style', null, TRAIL_STYLES, cannonballMesh.userData.trails.current.style,
    //     value => { updateTrailStyle(value); });
    addCustomSelect(displayGroup, 'Change Earth texture', null, EARTH_TEXTURES, 'assets/earth/bluemarble-5k.jpg',
        value => { setEarthTexture(value); });
    addCheckbox(displayGroup, null, 'Display referential axes', false, value => {
        displayAxis(value);
    });

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

    // ── Infos ───────────────────────────────────────────────
    const infosGroup = addSubPanel(entityPanelContainer, 'Infos', false);
    addReadOnly(infosGroup, 'Type', entity.type);
    entityWidgets.status = addReadOnly(infosGroup, 'Status', entity.isFreeFalling ? 'Flying' : 'Crashed', entity.isFreeFalling ? 'rgba(37, 233, 40, 1)' : '#f44');
    addEditableText(infosGroup, 'Description', entity.description, v => entity.description = v);
    addSlider(infosGroup, 'Mass (kg)', 1, 10000, entity.mass, v => entity.mass = v, 1, { logarithmic: true });
    addSlider(infosGroup, 'Drag coeff.', 0.0001, 0.01, entity.dragCoefficient, v => entity.dragCoefficient = v, 0.0001);
    //addReadOnly(basic, 'Cross-section (m²)', entity.crossSectionArea.toExponential(2));

    // ── Position ────────────────────────────────────────────
    const posGroup = addSubPanel(entityPanelContainer, 'Position', true);

    const polarGroup = addSubPanel(posGroup, 'Earth coords', true);
    const pos = entity.body.position;
    const polar = cartesianToPolar(pos);
    //polar.lon = normalizeLongitude(polar.lon - (earth.rotation.y * 180 / Math.PI));
    entityWidgets.lat = addSlider(polarGroup, 'Latitude (°)', -90, 90, polar.lat, updateEntityLat, 0.1);
    entityWidgets.lon = addSlider(polarGroup, 'Longitude (°)', -180, 180, polar.lon, updateEntityLon, 0.1);
    entityWidgets.alt = addSlider(polarGroup, 'Altitude (km)', 1, 500000, polar.alt, updateEntityAlt, 1, { logarithmic: true });

    const worldGroup = addSubPanel(posGroup, 'World coords', true);
    entityWidgets.posX = addReadOnly(worldGroup, 'X (km)', scaleToKm(pos.x).toFixed(0));
    entityWidgets.posY = addReadOnly(worldGroup, 'Y (km)', scaleToKm(pos.y).toFixed(0));
    entityWidgets.posZ = addReadOnly(worldGroup, 'Z (km)', scaleToKm(pos.z).toFixed(0));

    // ── Velocity ────────────────────────────────────────────
    const velGroup = addSubPanel(entityPanelContainer, 'Velocity', false);
    entityWidgets.vx = addReadOnly(velGroup, 'Vx (km/s)', scaleToKm(entity.velocity.x).toFixed(3));
    entityWidgets.vy = addReadOnly(velGroup, 'Vy (km/s)', scaleToKm(entity.velocity.y).toFixed(3));
    entityWidgets.vz = addReadOnly(velGroup, 'Vz (km/s)', scaleToKm(entity.velocity.z).toFixed(3));
    entityWidgets.speed = addReadOnly(velGroup, 'Speed (km/s)', scaleToKm(entity.velocity.length()).toFixed(3));

    addCheckbox(velGroup, 'Show velocity vector', false, v => {
        // À implémenter plus tard (flèche 3D temporaire)
    });

    // ── Accelerations ───────────────────────────────────────
    const accGroup = addSubPanel(entityPanelContainer, 'Acceleration', false);
    const fmt = v => v.toExponential(2);

    entityWidgets.totalAcc = addReadOnly(accGroup, 'Total (km/s²)', fmt(scaleToKm(entity.accelerations.total.length())));
    entityWidgets.gravAcc = addReadOnly(accGroup, '→ Gravity (km/s²)', fmt(scaleToKm(entity.accelerations.gravity.length())));
    entityWidgets.dragAcc = addReadOnly(accGroup, '→ Drag (km/s²)', fmt(scaleToKm(entity.accelerations.friction.length())));
    entityWidgets.engineAcc = addReadOnly(accGroup, '→ Engine (km/s²)', fmt(scaleToKm(entity.accelerations.engine.length())));

    addCheckbox(accGroup, 'Show acceleration vector', false, v => { /* futur */ });

    // ── Trail config ───────────────────────────────────────────────
    const trailGroup = addSubPanel(entityPanelContainer, 'Trail display', false);

    entityWidgets.trailEnabled = addCheckbox(trailGroup, 'Enabled', entity.trail?.enabled, entity.trail.enabled, enabled => {
        if (entity.trail) {
            entity.trail.enabled = enabled;
        }
    });

    entityWidgets.trailStyle = addCustomSelect(
        trailGroup,
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
    trailGroup.appendChild(colorInput);
    addSlider(trailGroup, 'Lifetime (seconds)', 0, 100, entity.trail.lifetime, v => entity.trail.lifetime = v, 1);

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
}

export function updateEntityWidgets() {
    if (!currentEntityName) return;
    const e = world.getEntityByName(currentEntityName);
    if (!e) return;

    entityWidgets.status.textContent = e.isFreeFalling ? 'Flying' : 'Crashed';
    entityWidgets.status.style.color= e.isFreeFalling ? 'rgba(37, 233, 40, 1)' : '#f44';

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
    entityWidgets.alt[1].value = polarPos.alt.toFixed(0);

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

    let options = [];
    for (const entity of world.getPhysicalEntities()) {
        options.push({ value: entity.name, label: entity.name })
    }

    entitySelectRef.updateOptions(options, currentEntityName);

    if (!world.getEntityByName(currentEntityName)) {
        currentEntityName = options[0]?.value || null;
        rebuildEntityPanel();
    }
}
