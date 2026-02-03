import {
    EARTH_MAIN_TEXTURES, EARTH_NIGHT_TEXTURES, EARTH_ROUGHNESS_TEXTURES, EARTH_BUMP_TEXTURES,
    updateEarthMainTexture, updateEarthNightTexture, updateEarthRoughnessTexture, updateEarthHeightTexture,
    earthSettings, updateEarthSegments, earthRotationDisabled, disableEarthRotation
} from '../scene/earth.js';
import { MOON_MAIN_TEXTURES, MOON_BUMP_TEXTURES, updateMoonMainTexture, updateMoonBumpTexture, disableMoonRotation } from '../scene/moon.js';
import { ATMOSPHERE_REGULAR_HEIGHT_KM, ATMOSPHERE_REGULAR_DENSITY_SURFACE, setAtmosphereHeight, setAtmosphereDensity } from '../scene/atmosphere.js';
import { MILKYWAY_TEXTURES, updateMilkyWayTexture, displayAxis, updateGrid } from '../scene/scene.js';
import { CAMERA_MODES, CAMERA_TARGETS, initCameraControls, switchCameraMode, switchCameraTarget, registerCameraModeSelect, registerCameraTargetSelect, selectCameraTarget, updateCamera } from './camera.js'
import { initDraggings } from './dragging.js'
import { addSlider, addCheckbox, addCustomSelect, addPanel, addSubPanel } from './widgets.js'
import { createCannonWidgets } from './ui_cannon.js';
import { createEntityWidgets, selectEntity, updateEntityWidgets } from './ui_entity.js';
import { createSpaceshipWidgets, updateSpaceshiptWidgets } from './ui_spaceship.js';

export let timePaused = false;
export let timeAcceleration = 50;

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
    addSlider(timePanel, 'Time acceleration', 1, 100000, timeAcceleration, 1.0, value => {
        timeAcceleration = value;
    }, { logarithmic: true });
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
    createEntityWidgets(entityPanel);
    if (isMobile) {
        entityPanel.parentElement.open = false;
    } else {
        entityPanel.parentElement.open = false;
    }
    //selectEntity('Spaceship-Delta1');

    // Cannon panel
    const cannonPanel = addPanel(contentWrapper, 'Cannon');
    cannonPanel.parentElement.open = false;
    createCannonWidgets(cannonPanel);

    // Spaceship panel
    const spaceshipPanel = addPanel(contentWrapper, 'Spaceship');
    spaceshipPanel.parentElement.open = false;
    createSpaceshipWidgets(spaceshipPanel);

    // Settings panel 
    const settingsPanel = addPanel(contentWrapper, 'Settings');

    // Atmosphere sub panel
    const atmoshperePanel = addSubPanel(settingsPanel, 'Atmosphere', false);
    addSlider(atmoshperePanel, 'Height (km)', 0, 600, ATMOSPHERE_REGULAR_HEIGHT_KM, 5, value => {
        setAtmosphereHeight(value);
    });
    addSlider(atmoshperePanel, 'Density at sea level (kg/m³)', 0.0, 2.0, ATMOSPHERE_REGULAR_DENSITY_SURFACE, 0.01, value => {
        setAtmosphereDensity(value);
    });
    // addSlider(atmoshpereGroupDiv, 'Opacity', 0.0, 1.0, 0.7, value => {
    //     setAtmosphereOpacity(value);
    // }, 0.1);
    // addSlider(atmoshpereGroupDiv, 'PowFactor', 0.0, 10.0, 2.0, value => {
    //     setAtmosphereParam1(value);
    // }, 0.1);
    // addSlider(atmoshpereGroupDiv, 'Multiplier', 0.0, 10.0, 5.0, value => {
    //     setAtmosphereParam2(value);
    // }, 0.1);

    // Camera sub panel    
    const cameraPanel = addSubPanel(settingsPanel, 'Camera', false);
    const cameraTargetSelect = addCustomSelect(cameraPanel, 'Camera target', '(or press \'t\' to switch target)', CAMERA_TARGETS, 'universe',
        value => { switchCameraTarget(value); });
    registerCameraTargetSelect(cameraTargetSelect);
    const cameraModeSelect = addCustomSelect(cameraPanel, 'Camera mode', '(or press \'v\' to switch mode)', CAMERA_MODES, 'orbit',
        value => { switchCameraMode(value); });
    registerCameraModeSelect(cameraModeSelect);
    //selectCameraTarget('Earth');

    // Universe sub panel
    const universePanel = addSubPanel(settingsPanel, 'Universe', false);
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
    [gridSizeDisplay, gridSizeSlider] = addSlider(universePanel, 'Size (km)', 10000, 1000000, 1000000, 10000, value => {
        if (gridShowCheckbox.checked) {
            updateGrid(true, value, parseFloat(gridResDisplay.value));
        }
    }, { logarithmic: false });
    let gridResDisplay, gridResSlider;
    [gridResDisplay, gridResSlider] = addSlider(universePanel, 'Resolution (km)', 1000, 100000, 100000, 1000, value => {
        if (gridShowCheckbox.checked) {
            updateGrid(true, parseFloat(gridSizeDisplay.value), value);
        }
    }, { logarithmic: false });

    // Textures panel
    const texturesPanel = addSubPanel(settingsPanel, 'Textures', false);
    const texturesSettings = {
        low: {
            earthMainTexture: 'assets/earth/bluemarble-5k.jpg',
            earthNightTexture: 'assets/earth/night-4k.jpg',
            earthRoughnessTexture: 'none',
            earthBumpTexture: 'assets/earth/bump-4k.jpg',
            moonMainTexture: 'assets/moon/nasa-2k.jpg',
            moonBumpTexture: 'none',
            milkyWayTexture: 'assets/milkyway/solarsystemscope-4k.jpg',
        },
        medium: {
            earthMainTexture: 'assets/earth/bluemarble-5k.jpg',
            earthNightTexture: 'assets/earth/night-4k.jpg',
            earthRoughnessTexture: 'assets/earth/ocean-4k.png',
            earthBumpTexture: 'assets/earth/bump-4k.jpg',
            moonMainTexture: 'assets/moon/nasa-4k.jpg',
            moonBumpTexture: 'assets/moon/bump-5k.jpg',
            milkyWayTexture: 'assets/milkyway/solarsystemscope-8k.jpg',
        },
        high: {
            earthMainTexture: 'assets/earth/bluemarble-16k.jpg',
            earthNightTexture: 'assets/earth/night-13k.jpg',
            earthRoughnessTexture: 'assets/earth/ocean-4k.png',
            earthBumpTexture: 'assets/earth/bump-10k.jpg',
            moonMainTexture: 'assets/moon/nasa-4k.jpg',
            moonBumpTexture: 'assets/moon/bump-5k.jpg',
            milkyWayTexture: 'assets/milkyway/solarsystemscope-8k.jpg',
        }
    };

    const texturesSettingsOptions = [
        { value: 'high', label: 'High Definition (10k-16k textures – modern GPU needed)' },
        { value: 'medium', label: 'Standard Definition (4k-8k – good compromise)' },
        { value: 'low', label: 'Low Definition (2k–4k – mobile & old computers)' },
    ];

    let defaultTexturesSettings = 'medium';
    if (isMobile) {
        defaultTexturesSettings = 'low';
    }

    let earthMainTextureSelect, earthNightTextureSelect, earthRoughnessTextureSelect, earthHeightTextureSelect,
        moonMainTextureSelect, moonBumpTextureSelect, milkyWayTextureSelect;

    const textureSettingsSelect = addCustomSelect(texturesPanel, 'You can load a set of textures',
        'Or you can select textures separatly below', texturesSettingsOptions, defaultTexturesSettings, (value) => {
            const selected = texturesSettings[value];
            if (!selected) return;
            updateEarthMainTexture(selected.earthMainTexture);
            updateEarthNightTexture(selected.earthNightTexture);
            updateEarthRoughnessTexture(selected.earthRoughnessTexture);
            updateEarthHeightTexture(selected.earthBumpTexture);
            updateMoonMainTexture(selected.moonMainTexture);
            updateMoonBumpTexture(selected.moonBumpTexture);
            updateMilkyWayTexture(selected.milkyWayTexture);
            earthMainTextureSelect.value = selected.earthMainTexture;
            earthNightTextureSelect.value = selected.earthNightTexture;
            earthRoughnessTextureSelect.value = selected.earthRoughnessTexture;
            earthHeightTextureSelect.value = selected.earthBumpTexture;
            moonMainTextureSelect.value = selected.moonMainTexture;
            moonBumpTextureSelect.value = selected.moonBumpTexture;
            milkyWayTextureSelect.value = selected.milkyWayTexture;
        });

    // Earth sub panel
    const earthPanel = addSubPanel(texturesPanel, 'Earth', false);
    earthMainTextureSelect = addCustomSelect(earthPanel, 'Main texture', null, EARTH_MAIN_TEXTURES, null,
        value => { updateEarthMainTexture(value); });
    earthNightTextureSelect = addCustomSelect(earthPanel, 'Night texture', null, EARTH_NIGHT_TEXTURES, null,
        value => { updateEarthNightTexture(value); });
    earthRoughnessTextureSelect = addCustomSelect(earthPanel, 'Roughness texture', null, EARTH_ROUGHNESS_TEXTURES, null,
        value => { updateEarthRoughnessTexture(value); });
    earthHeightTextureSelect = addCustomSelect(earthPanel, 'Height texture', null, EARTH_BUMP_TEXTURES, null,
        value => { updateEarthHeightTexture(value); });
    addCheckbox(earthPanel, 'Use as displacement (BETA!!)', '', false, value => {
        earthSettings.useDisplacement = value;
        updateEarthHeightTexture(earthHeightTextureSelect.value);
    });
    addSlider(earthPanel, 'Height scale', 0.1, 100, earthSettings.heightScale, 1, value => {
        earthSettings.heightScale = value;
        updateEarthHeightTexture(earthHeightTextureSelect.value);
    });
    const earthSegmentsSlider = addSlider(earthPanel, 'Sphere segments (width)', 32, 2048, earthSettings.segments.width, 32, val => {
        updateEarthSegments(val, Math.round(val / 2));
    });
    earthSegmentsSlider.value = earthSettings.segments.width;

    // Moon sub panel
    const moonPanel = addSubPanel(texturesPanel, 'Moon', false);
    moonMainTextureSelect = addCustomSelect(moonPanel, 'Main texture', null, MOON_MAIN_TEXTURES, null,
        value => { updateMoonMainTexture(value); });
    moonBumpTextureSelect = addCustomSelect(moonPanel, 'Bump texture', null, MOON_BUMP_TEXTURES, null,
        value => { updateMoonBumpTexture(value); });

    // Milkyway sub panel
    const milkywayPanel = addSubPanel(texturesPanel, 'Milkyway', false);
    milkyWayTextureSelect = addCustomSelect(milkywayPanel, 'Milky Way background', null, MILKYWAY_TEXTURES, null,
        value => { updateMilkyWayTexture(value); });

    // Load default settings once all select widgets has been created
    textureSettingsSelect.value = defaultTexturesSettings;
}

export function updateInterface(deltaTime) {
    updateEntityWidgets();
    updateSpaceshiptWidgets();
    updateCamera(deltaTime);
}

