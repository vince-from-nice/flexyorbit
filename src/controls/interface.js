import { displayAxis } from '../scene/scene.js';
import { updateCannonWithParams, fireCannonball, cannonParams, cannonball } from '../scene/cannon.js';
import { TRAIL_STYLES, updateTrailStyle } from '../scene/trails.js';
import { EARTH_TEXTURES, setEarthTexture, earthRotationDisabled, disableEarthRotation } from '../scene/earth.js';
import { disableMoonRotation } from '../scene/moon.js';
import { ATMOSPHERE_REGULAR_HEIGHT_KM, ATMOSPHERE_REGULAR_DENSITY_SURFACE, setAtmosphereHeight, setAtmosphereDensity } from '../scene/atmosphere.js';
import { CAMERA_MODES, CAMERA_TARGETS, initCameraControls, switchCameraMode, switchCameraTarget, registerCameraModeSelect, registerCameraTargetSelect } from './camera.js'
import { initDraggings } from './dragging.js'
import { addSlider, addCheckbox, addCustomSelect } from './widgets.js'

export let timePaused = false;
export let timeAcceleration = 100;

let cannonLatDisplay, cannonLonDisplay, cannonAltDisplay, cannonAzDisplay, cannonElDisplay;
let cannonLatSlider, cannonLonSlider, cannonAltSlider, cannonAzSlider, cannonElSlider;

export function initControls() {

    createHTMLControls();

    initCameraControls();

    initDraggings();
}

function createHTMLControls() {
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

    function addGroup(parent, name) {
        const details = document.createElement('details');
        details.open = false;
        details.classList.add('control-group');

        const summary = document.createElement('summary');
        summary.textContent = name;
        details.appendChild(summary);

        const groupDiv = document.createElement('div');
        groupDiv.classList.add('group-content');
        details.appendChild(groupDiv);
        parent.appendChild(details);

        return groupDiv;
    }

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

    // Time wigets    
    const timeGroup = addGroup(contentWrapper, 'Time control');
    const timeButton = document.createElement('button');
    timeButton.textContent = 'Stop';
    timeButton.classList.add('time-button');
    timeButton.addEventListener('click', () => {
        timePaused = !timePaused;
        timeButton.textContent = timePaused ? 'Resume' : 'Stop';
    });
    timeGroup.appendChild(timeButton);
    addSlider(timeGroup, 'Time acceleration', 1, 100000, timeAcceleration, value => {
        timeAcceleration = value;
    }, 1.0, { logarithmic: true });
    addCheckbox(timeGroup, 'Disable Earth & Moon rotation', '', earthRotationDisabled, value => {
        disableEarthRotation(value);
        disableMoonRotation(value);
    });
    if (isMobile) {
        timeGroup.parentElement.open = false;
    } else {
        timeGroup.parentElement.open = true;
    }

    // Cannon wigets
    const cannonGroupDiv = addGroup(contentWrapper, 'Cannon');
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

    // Atmosphere wigets
    const atmoshpereGroupDiv = addGroup(contentWrapper, 'Atmosphere');
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

    // Camera wigets    
    const cameraGroup = addGroup(contentWrapper, 'Camera');
    const cameraTargetSelect = addCustomSelect(cameraGroup, 'Camera target', '(or press \'t\' to switch target)', CAMERA_TARGETS, 'universe',
        value => { switchCameraTarget(value); });
    registerCameraTargetSelect(cameraTargetSelect);
    const cameraModeSelect = addCustomSelect(cameraGroup, 'Camera mode', '(or press \'c\' to switch mode)', CAMERA_MODES, 'orbit',
        value => { switchCameraMode(value); });
    registerCameraModeSelect(cameraModeSelect);

    // Display wigets 
    const displayGroup = addGroup(contentWrapper, 'Display');
    addCustomSelect(displayGroup, 'Change cannonball trail style', null, TRAIL_STYLES, cannonball.userData.trails.current.style,
        value => { updateTrailStyle(value); });
    addCustomSelect(displayGroup, 'Change Earth texture', null, EARTH_TEXTURES, 'assets/earth/bluemarble-5k.jpg',
        value => { setEarthTexture(value); });
    addCheckbox(displayGroup, null, 'Display referential axes', false, value => {
        displayAxis(value);
    });

    // Fire control 
    const fireGroup = addGroup(contentWrapper, 'Fire control');
    [cannonElDisplay, cannonElSlider] = addSlider(fireGroup, 'Elevation (°)', 0, 90, cannonParams.elevation, value => {
        cannonParams.elevation = value;
        updateCannonWithParams();
    }, 1);
    addSlider(fireGroup, 'Muzzle speed (km/s)', 0, 15, cannonParams.speed, value => {
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
    fireGroup.parentElement.open = true;
    fireGroup.appendChild(fireButton);
}

export function updateHTMLDisplays() {
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