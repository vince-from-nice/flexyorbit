import * as THREE from 'three';
import { scene } from '../scene/scene.js';
import { scaleFromKm } from '../constants.js';
import { cannonGroup, cannonParams, cannonball, updateCannonWithParams } from '../scene/cannon.js';
import { updateTrailStyle, createNewCannonballTrail } from '../scene/trails.js';
import { earthTextures } from '../scene/earth.js';
import { setAtmosphereHeight, setAtmosphereDensity } from '../scene/atmosphere.js';
import { trailStyles } from '../scene/trails.js';
import { initDraggings } from './dragging.js'
import { initCameraControls, switchCameraControl, registerCameraModeSelect } from './camera.js'


export let timePaused = false;
export let timeAcceleration = 100;

let latDisplay, lonDisplay, altDisplay, azDisplay, elDisplay;

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

    let isMobile = false;
    if (window.innerWidth <= 768) {
        isMobile = true;
    }

    // All controls are closed by default on mobile
    if (isMobile) {
        mainDetails.open = false;
    } else {
        mainDetails.open = true;
    }

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

    ///////////////////////////////////////////////////////////////////////////
    // Time
    ///////////////////////////////////////////////////////////////////////////

    const timeGroup = addGroup(contentWrapper, 'Time control');

    const timeButton = document.createElement('button');
    timeButton.textContent = 'Stop';
    timeButton.classList.add('time-button');
    timeButton.addEventListener('click', () => {
        timePaused = !timePaused;
        timeButton.textContent = timePaused ? 'Resume' : 'Stop';
    });
    if (isMobile) {
        timeGroup.parentElement.open = false;
    } else {
        timeGroup.parentElement.open = true;
    }
    timeGroup.appendChild(timeButton);

    addSlider(timeGroup, 'Time acceleration', 1, 1000, timeAcceleration, value => {
        timeAcceleration = value;
    }, 0.1);

    ///////////////////////////////////////////////////////////////////////////
    // Cannon
    ///////////////////////////////////////////////////////////////////////////

    const cannonGroupDiv = addGroup(contentWrapper, 'Cannon');

    [latDisplay] = addSlider(cannonGroupDiv, 'Latitude (°)', -90, 90, cannonParams.lat, value => {
        cannonParams.lat = value;
        updateCannonWithParams();
    }, 0.1);

    [lonDisplay] = addSlider(cannonGroupDiv, 'Longitude (°)', -180, 180, cannonParams.lon, value => {
        cannonParams.lon = value;
        updateCannonWithParams();
    }, 0.1);

    [altDisplay] = addSlider(cannonGroupDiv, 'Altitude (km)', 0, 3000, cannonParams.altitude, value => {
        cannonParams.altitude = value;
        updateCannonWithParams();
    }, 1);

    [azDisplay] = addSlider(cannonGroupDiv, 'Azimuth (°)', 0, 360, cannonParams.azimuth, value => {
        cannonParams.azimuth = value;
        updateCannonWithParams();
    }, 1);

    [elDisplay] = addSlider(cannonGroupDiv, 'Elevation (°)', 0, 90, cannonParams.elevation, value => {
        cannonParams.elevation = value;
        updateCannonWithParams();
    }, 1);

    addSlider(cannonGroupDiv, 'Muzzle speed (km/s)', 0, 15, cannonParams.speed, value => {
        cannonParams.speed = value;
    }, 0.01);

    ///////////////////////////////////////////////////////////////////////////
    // Atmosphere
    ///////////////////////////////////////////////////////////////////////////

    const atmoshpereGroupDiv = addGroup(contentWrapper, 'Atmosphere');

    [latDisplay] = addSlider(atmoshpereGroupDiv, 'Height (km)', 0, 400, 400, value => {
        setAtmosphereHeight(value);
    }, 5);

    [latDisplay] = addSlider(atmoshpereGroupDiv, 'Density factor', 0.0, 5.0, 1.0, value => {
        setAtmosphereDensity(value);
    }, 0.1);

    ///////////////////////////////////////////////////////////////////////////
    // Camera
    ///////////////////////////////////////////////////////////////////////////

    const cameraGroup = addGroup(contentWrapper, 'Camera');

    const cameraModeWrapper = document.createElement('div');
    const cameraModeLabel = document.createElement('label');
    cameraModeLabel.textContent = 'Change camera control';
    const cameraModeSelect = document.createElement('select');
    cameraModeSelect.classList.add('camera-mode-select');
    cameraModeSelect.innerHTML = `
        <option value="orbit">Orbit controls</option>
        <option value="map">Map controls</option>
        <option value="fly">Fly controls</option>
        <option value="fps">First Person Shooter</option>
        <option value="pointerLock">Pointer Lock</option>
        `;
    cameraModeSelect.addEventListener('change', (e) => {
        switchCameraControl(e.target.value);
    });
    registerCameraModeSelect(cameraModeSelect);
    const cameraModeLabel2 = document.createElement('label');
    cameraModeLabel2.textContent = '(or press "c" to switch mode)';
    cameraModeLabel2.style.fontSize = 'small';
    cameraModeWrapper.appendChild(cameraModeLabel);
    cameraModeWrapper.appendChild(cameraModeSelect);
    cameraModeWrapper.appendChild(cameraModeLabel2);
    cameraGroup.appendChild(cameraModeWrapper);

    ///////////////////////////////////////////////////////////////////////////
    // Display settings
    ///////////////////////////////////////////////////////////////////////////

    const displayGroup = addGroup(contentWrapper, 'Display settings');

    // Trail style
    const trailStyleWrapper = document.createElement('div');
    const trailStyleLabel = document.createElement('label');
    trailStyleLabel.textContent = 'Change trail style of the cannonball';
    const trailStyleSelect = document.createElement('select');
    trailStyles.forEach(style => {
        const option = document.createElement('option');
        option.value = style.code;
        option.textContent = style.label;
        if (style.code === cannonball.userData.trails.current.userData.style) {
            option.selected = true;
        } else {
            option.selected = false;
        }
        trailStyleSelect.appendChild(option);
    });
    trailStyleSelect.addEventListener('change', async (event) => {
        updateTrailStyle(event.target.value);
    });
    trailStyleWrapper.appendChild(trailStyleLabel);
    trailStyleWrapper.appendChild(trailStyleSelect);
    displayGroup.appendChild(trailStyleWrapper);

    // Earth texture
    const textureWrapper = document.createElement('div');
    const textureLabel = document.createElement('label');
    textureLabel.textContent = 'Change Earth texture ';
    const textureSelect = document.createElement('select');
    earthTextures.forEach(tex => {
        const option = document.createElement('option');
        option.value = tex.value;
        option.textContent = tex.label;
        if (tex.value.includes('bluemarble-5k')) {
            option.selected = true;
        } else {
            option.selected = false;
        }
        textureSelect.appendChild(option);
    });
    textureSelect.addEventListener('change', async () => {
        const selectedUrl = textureSelect.value;
        const { setEarthTexture } = await import('../scene/earth.js');
        setEarthTexture(selectedUrl);
    });
    textureWrapper.appendChild(textureLabel);
    textureWrapper.appendChild(textureSelect);
    displayGroup.appendChild(textureWrapper);

    // Axis diplay
    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.classList.add('checkbox-wrapper');
    const checkboxLabel = document.createElement('label');
    checkboxLabel.classList.add('checkbox-label');
    checkboxLabel.textContent = 'Display referential axes';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = false;
    checkbox.classList.add('styled-checkbox');
    checkbox.addEventListener('change', async () => {
        const { scene, axesGroup } = await import('../scene/scene.js');
        if (checkbox.checked) {
            scene.add(axesGroup);
        } else {
            scene.remove(axesGroup);
        }
    });
    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(checkboxLabel);
    displayGroup.appendChild(checkboxWrapper);

    ///////////////////////////////////////////////////////////////////////////
    // Fire button
    /////////////////////////////////////////////////////////////////////////// 

    const fireButton = document.createElement('button');
    fireButton.textContent = 'Fire the cannonball !';
    fireButton.classList.add('fire-button');
    fireButton.addEventListener('click', () => {
        console.log('Fire cannon with :', cannonParams);
        cannonball.material.color.set(0xff0000);
        const elevationGroup = cannonGroup.userData.elevationGroup;
        // Reattach to elevationGroup and reset local position
        if (cannonball.parent !== elevationGroup) {
            scene.remove(cannonball);
            elevationGroup.add(cannonball);
        }
        cannonball.position.copy(cannonball.userData.initialLocalPosition);
        // Compute world position
        const worldPos = new THREE.Vector3();
        cannonball.getWorldPosition(worldPos);
        // Compute world direction (local Z of tube)
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(elevationGroup.getWorldQuaternion(new THREE.Quaternion())).normalize();
        // Set initial velocity (direction * speed in km/s)
        cannonball.userData.velocity.copy(direction).multiplyScalar(scaleFromKm(cannonParams.speed));
        // Detach from cannon and add to scene (for inertial frame)
        elevationGroup.remove(cannonball);
        scene.add(cannonball);
        cannonball.position.copy(worldPos);
        cannonball.userData.isInFlight = true;
        createNewCannonballTrail();
        console.log("Cannonball fired !", cannonball)
    });
    contentWrapper.appendChild(fireButton);
}

function addSlider(container, labelText, min, max, initial, onChange, step = 1) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('slider-wrapper');

    const topRow = document.createElement('div');
    topRow.classList.add('slider-top-row');

    const label = document.createElement('label');
    label.textContent = labelText;
    topRow.appendChild(label);

    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.min = min;
    numberInput.max = max;
    numberInput.step = step;
    numberInput.value = initial;
    numberInput.classList.add('number-input');
    topRow.appendChild(numberInput);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = initial;
    slider.classList.add('custom-slider');

    // Dynamic gradient (in JS instead of CSS)
    slider.addEventListener('input', () => {
        const percent = (slider.value - min) / (max - min) * 100;
        slider.style.background = `linear-gradient(to right, #00aaff ${percent}%, #444 ${percent}%)`;
    });
    slider.dispatchEvent(new Event('input'));

    const update = (val) => {
        let parsed = parseFloat(val);
        if (isNaN(parsed)) return;
        val = Math.max(min, Math.min(max, parsed));
        slider.value = val;
        numberInput.value = val;
        onChange(val);
        const percent = (val - min) / (max - min) * 100;
        slider.style.background = `linear-gradient(to right, #00aaff ${percent}%, #444 ${percent}%)`;
    };

    slider.addEventListener('input', () => update(slider.value));
    numberInput.addEventListener('change', () => update(numberInput.value));  // change au lieu de input pour éviter boucle

    wrapper.appendChild(topRow);
    wrapper.appendChild(slider);
    container.appendChild(wrapper);

    return [numberInput];
}

export function updateHTMLDisplays() {
    if (latDisplay) latDisplay.value = cannonParams.lat.toFixed(1);
    if (lonDisplay) lonDisplay.value = cannonParams.lon.toFixed(1);
    if (altDisplay) altDisplay.value = cannonParams.altitude.toFixed(0);
    if (azDisplay) azDisplay.value = cannonParams.azimuth.toFixed(0);
    if (elDisplay) elDisplay.value = cannonParams.elevation.toFixed(0);
}