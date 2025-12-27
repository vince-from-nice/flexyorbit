import * as THREE from 'three';
import { updateCannonWithParams, fireCannonball, cannonParams, cannonball } from '../scene/cannon.js';
import { updateTrailStyle } from '../scene/trails.js';
import { EARTH_TEXTURES, setEarthTexture, earthRotationDisabled, disableEarthRotation } from '../scene/earth.js';
import { setAtmosphereHeight, setAtmosphereDensity } from '../scene/atmosphere.js';
import { TRAIL_STYLES } from '../scene/trails.js';
import { initDraggings } from './dragging.js'
import { CAMERA_MODES, initCameraControls, switchCameraControl, registerCameraModeSelect } from './camera.js'

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
    addSlider(timeGroup, 'Time acceleration', 1, 1000, timeAcceleration, value => {
        timeAcceleration = value;
    }, 0.1);
    addCheckbox(timeGroup, 'Disable Earth rotation', '', earthRotationDisabled, value => {
        disableEarthRotation();
    });
    if (isMobile) {
        timeGroup.parentElement.open = false;
    } else {
        timeGroup.parentElement.open = true;
    }

    // Cannon wigets
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

    // Atmosphere wigets
    const atmoshpereGroupDiv = addGroup(contentWrapper, 'Atmosphere');
    [latDisplay] = addSlider(atmoshpereGroupDiv, 'Height (km)', 0, 400, 100, value => {
        setAtmosphereHeight(value);
    }, 5);
    [latDisplay] = addSlider(atmoshpereGroupDiv, 'Density factor', 0.0, 5.0, 1.0, value => {
        setAtmosphereDensity(value);
    }, 0.1);

    // Camera wigets    
    const cameraGroup = addGroup(contentWrapper, 'Camera');
    const cameraModeSelect = addCustomSelect(cameraGroup, 'Change camera control', '(or press "c" to switch mode)', CAMERA_MODES, 'orbit',
        value => { switchCameraControl(value); });
    registerCameraModeSelect(cameraModeSelect);

    // Display wigets 
    const displayGroup = addGroup(contentWrapper, 'Display settings');
    addCustomSelect(displayGroup, 'Change cannonball trail style', null, TRAIL_STYLES, cannonball.userData.trails.current.userData.style,
        value => { updateTrailStyle(value); });
    addCustomSelect(displayGroup, 'Change Earth texture', null, EARTH_TEXTURES, 'assets/earth/bluemarble-5k.jpg',
        value => { setEarthTexture(value); });
    addCheckbox(displayGroup, null, 'Display referential axes', false, async () => {
        const { scene, axesGroup } = await import('../scene/scene.js');
        if (checkbox.checked) {
            scene.add(axesGroup);
        } else {
            scene.remove(axesGroup);
        }
    });

    // Fire button
    const fireButton = document.createElement('button');
    fireButton.textContent = 'Fire the cannonball !';
    fireButton.classList.add('fire-button');
    fireButton.addEventListener('click', () => {
        fireCannonball();
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

function addCheckbox(parentEl, labelBefore, labelAfter, initialValue, onChange) {
    const row = document.createElement("div");
    row.className = "checkbox-wrapper";

    if (labelBefore) {
        const lblB = document.createElement("label");
        lblB.textContent = labelBefore;
        //lblB.className = "ui-checkbox-label-before";
        row.appendChild(lblB);
    }

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = Boolean(initialValue);

    cb.addEventListener("change", () => {
        onChange(cb.checked);
    });

    row.appendChild(cb);

    if (labelAfter) {
        const lblA = document.createElement("label");
        lblA.textContent = labelAfter;
        //lblA.className = "ui-checkbox-label-after";
        row.appendChild(lblA);
    }

    parentEl.appendChild(row);

    return cb;
}

function addCustomSelect(parentEl, labelBefore, labelAfter, options, initialValue, onChange) {
    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";

    if (labelBefore) {
        const lblBefore = document.createElement("label");
        lblBefore.className = "custom-select-label-before";
        lblBefore.textContent = labelBefore;
        wrapper.appendChild(lblBefore);
    }

    const box = document.createElement("div");
    box.className = "custom-select-box";

    const selected = document.createElement("div");
    selected.className = "custom-select-selected";

    const selectedText = document.createElement("span");
    selectedText.className = "custom-select-selected-text";

    const arrow = document.createElement("span");
    arrow.classNameName = "custom-select-arrow";
    arrow.textContent = "▾";

    selected.appendChild(selectedText);
    selected.appendChild(arrow);
    box.appendChild(selected);

    const list = document.createElement("div");
    list.className = "custom-select-list";

    let currentValue = initialValue ?? options[0]?.value;

    function setValue(value, trigger = true) {
        const opt = options.find(o => o.value === value);
        if (!opt) return;
        currentValue = value;
        selectedText.textContent = opt.label;
        if (trigger) onChange(value);
    }

    options.forEach(opt => {
        const item = document.createElement("div");
        item.className = "custom-select-item";
        item.textContent = opt.label;
        item.addEventListener("click", () => {
            setValue(opt.value);
            list.classList.remove("open");
        });
        list.appendChild(item);
    });

    selected.addEventListener("click", e => {
        e.stopPropagation();
        list.classList.toggle("open");
    });

    document.addEventListener("click", () => {
        list.classList.remove("open");
    });

    box.appendChild(list);
    wrapper.appendChild(box);

    if (labelAfter) {
        const lblAfter = document.createElement("div");
        lblAfter.className = "custom-select-label-after";
        lblAfter.textContent = labelAfter;
        wrapper.appendChild(lblAfter);
    }

    parentEl.appendChild(wrapper);

    setValue(currentValue, false);

    return {
        get value() { return currentValue; },
        set value(v) { setValue(v); }
    };
}

export function updateHTMLDisplays() {
    if (latDisplay) latDisplay.value = cannonParams.lat.toFixed(1);
    if (lonDisplay) lonDisplay.value = cannonParams.lon.toFixed(1);
    if (altDisplay) altDisplay.value = cannonParams.altitude.toFixed(0);
    if (azDisplay) azDisplay.value = cannonParams.azimuth.toFixed(0);
    if (elDisplay) elDisplay.value = cannonParams.elevation.toFixed(0);
}