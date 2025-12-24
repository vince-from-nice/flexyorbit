import * as THREE from 'three';
import { EARTH_RADIUS } from './constants.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { camera, renderer, scene, cannonGroup, earth, cannonParams, earthTextures, updateCannonWithParams, cannonball } from './scene.js';

export let orbitControls;

export let timePaused = false;
export let timeAcceleration = 100;

const baseRotateSpeed = 1.0;
const basePanSpeed = 1.0;

let isDraggingCannon = false;
let dragButton = -1; // 0 = left, 2 = right
let previousMouse = new THREE.Vector2();

let latDisplay, lonDisplay, altDisplay, azDisplay, elDisplay;

export function initControls() {
    const controlsDiv = document.getElementById('controls');
    if (!controlsDiv) {
        console.error("Élément #controls non trouvé !");
        return;
    }

    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.rotateSpeed = baseRotateSpeed;
    orbitControls.panSpeed = basePanSpeed;
    orbitControls.minDistance = EARTH_RADIUS + 300;
    orbitControls.maxDistance = EARTH_RADIUS * 10;
    orbitControls.enablePan = true;

    orbitControls.addEventListener('change', adjustOrbitControlsSpeed);
    initSpecialKeyForOrbitControls();

    initCannonDrag();

    createHTMLControls(controlsDiv);
}

function adjustOrbitControlsSpeed() {
    const cameraDistance = camera.position.distanceTo(orbitControls.target);
    const scaleFactor = Math.min(1, cameraDistance / orbitControls.maxDistance);
    orbitControls.rotateSpeed = baseRotateSpeed * scaleFactor;
    orbitControls.panSpeed = basePanSpeed * scaleFactor;
}

function initSpecialKeyForOrbitControls() {
    const ORBIT_SPECIAL_KEY = 'x';
    const originalTarget = new THREE.Vector3().copy(orbitControls.target);
    let modifierKeyPressed = false;
    let dynamicTargetSet = false;

    window.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === ORBIT_SPECIAL_KEY) modifierKeyPressed = true;
    });
    window.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === ORBIT_SPECIAL_KEY) modifierKeyPressed = false;
    });

    renderer.domElement.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !modifierKeyPressed) {
            dynamicTargetSet = false;
            return;
        }
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(earth, true);
        if (intersects.length > 0) {
            orbitControls.target.copy(intersects[0].point);
            dynamicTargetSet = true;
            orbitControls.update();
        }
    });

    orbitControls.addEventListener('end', () => {
        if (dynamicTargetSet || !modifierKeyPressed) {
            orbitControls.target.lerp(originalTarget, 0.15);
            orbitControls.update();
            dynamicTargetSet = false;
        }
    });
}

// Initialize cannon drag controls
function initCannonDrag() {
    const domElement = renderer.domElement;

    domElement.addEventListener('pointerdown', onCannonPointerDown);
    domElement.addEventListener('pointermove', onCannonPointerMove);
    domElement.addEventListener('pointerup', onCannonPointerUp);
    domElement.addEventListener('pointercancel', onCannonPointerUp);
    domElement.addEventListener('contextmenu', e => e.preventDefault()); // Block right-click menu
}

function onCannonPointerDown(event) {
    if (event.target !== renderer.domElement) return;

    // Only process left (0) or right (2) clicks
    if (event.button !== 0 && event.button !== 2) return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(cannonGroup, true);
    if (intersects.length === 0) return;

    isDraggingCannon = true;
    dragButton = event.button;
    previousMouse.copy(mouse);

    orbitControls.enabled = false;

    // Set appropriate cursor based on drag mode
    const dom = renderer.domElement;
    if (event.button === 0) { // Left click
        if (event.ctrlKey || event.shiftKey) {
            dom.style.cursor = 'ns-resize';     // Vertical for altitude/elevation
        } else {
            dom.style.cursor = 'all-scroll';    // 4-way for lat/lon free move
        }
    } else if (event.button === 2) { // Right click
        dom.style.cursor = 'ew-resize';         // Horizontal for azimuth
        // Alternative nicer feel: dom.style.cursor = 'grab';
    }

    event.preventDefault();
    event.stopPropagation();
}

function onCannonPointerMove(event) {
    if (!isDraggingCannon) return;

    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const delta = new THREE.Vector2().subVectors(mouse, previousMouse);
    previousMouse.copy(mouse);

    // Sensitivities for modifier modes
    const altSensitivity  = 800;   // km per full screen
    const elevSensitivity = 130;   // deg per full screen

    if (dragButton === 0) { // Left button
        const ctrl  = event.ctrlKey;
        const shift = event.shiftKey;

        if (ctrl) {
            // Altitude: mouse up increases value
            cannonParams.altitude += delta.y * altSensitivity;
            cannonParams.altitude = Math.max(0, Math.min(3000, cannonParams.altitude));
        }
        else if (shift) {
            // Elevation: mouse up increases value
            cannonParams.elevation += delta.y * elevSensitivity;
            cannonParams.elevation = Math.max(0, Math.min(90, cannonParams.elevation));
        }
        else {
            // Direct cursor projection on sphere (exact position under cursor)
            const currentR = cannonGroup.position.length();

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            const intersection = new THREE.Vector3();
            const sphere = new THREE.Sphere(new THREE.Vector3(0,0,0), currentR);

            if (raycaster.ray.intersectSphere(sphere, intersection)) {
                const localPos = earth.worldToLocal(intersection.clone());

                const phi   = Math.acos(localPos.y / currentR);
                const theta = Math.atan2(localPos.z, localPos.x);

                cannonParams.lat = (Math.PI / 2 - phi) * 180 / Math.PI;
                cannonParams.lon = -theta * 180 / Math.PI;

                cannonParams.lon = ((cannonParams.lon + 180) % 360) - 180;
                cannonParams.lat = Math.max(-89.9, Math.min(89.9, cannonParams.lat));
            }
        }
    }
    else if (dragButton === 2) { // Right button - azimuth only horizontal
        const aziSensitivity = 600;
        cannonParams.azimuth += delta.x * aziSensitivity;
        cannonParams.azimuth = ((cannonParams.azimuth % 360) + 360) % 360;
    }

    updateCannonWithParams();
    updateHTMLDisplays();
}

function onCannonPointerUp() {
    if (!isDraggingCannon) return;

    isDraggingCannon = false;
    dragButton = -1;
    orbitControls.enabled = true;
    renderer.domElement.style.cursor = 'auto';
}

function createHTMLControls(container) {
    const contentWrapper = container.querySelector('.main-content-wrapper');
    if (!contentWrapper) {
        console.error('main-content-wrapper non trouvé dans #controls');
        return;
    }

    const mainDetails = container.querySelector('#main-controls-toggle');    
    // Closed by default on mobile
    if (window.innerWidth <= 768) {
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

    // Time
    const timeGroup = addGroup(contentWrapper, 'Time control');

    const timeButton = document.createElement('button');
    timeButton.textContent = 'Stop';
    timeButton.classList.add('time-button');
    timeButton.addEventListener('click', () => {
        timePaused = !timePaused;
        timeButton.textContent = timePaused ? 'Resume' : 'Stop';
    });
    timeGroup.parentElement.open = true;
    timeGroup.appendChild(timeButton);

    addSlider(timeGroup, 'Time acceleration', 1, 1000, timeAcceleration, value => {
        timeAcceleration = value;
    }, 0.1);

    // Cannon
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
    }, 0.1);

    // Atmosphere
    addGroup(contentWrapper, 'Atmosphere');

    // Camera
    addGroup(contentWrapper, 'Camera');

    // Display settings

    // Axis diplay
    const displayGroup = addGroup(contentWrapper, 'Display settings');

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
        const { scene, axesGroup } = await import('./scene.js');
        if (checkbox.checked) {
            scene.add(axesGroup);
        } else {
            scene.remove(axesGroup);
        }
    });

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(checkboxLabel);
    displayGroup.appendChild(checkboxWrapper);


    // Earth texture
    const textureWrapper = document.createElement('div');
    textureWrapper.style.marginTop = '20px';
    textureWrapper.style.marginBottom = '18px';

    const textureLabel = document.createElement('label');
    textureLabel.textContent = 'Change Earth texture ';
    textureLabel.style.display = 'block';
    textureLabel.style.marginBottom = '8px';
    textureLabel.style.fontSize = '14px';
    textureLabel.style.color = '#eee';

    const textureSelect = document.createElement('select');
    textureSelect.classList.add('texture-select'); 

    earthTextures.forEach(tex => {
        const option = document.createElement('option');
        option.value = tex.value;
        option.textContent = tex.label;
        if (tex.value.includes('BlueMarble-5k')) option.selected = true;
        textureSelect.appendChild(option);
    });

    textureSelect.addEventListener('change', async () => {
        const selectedUrl = textureSelect.value;
        const { setEarthTexture } = await import('./scene.js');
        setEarthTexture(selectedUrl);
    });

    textureWrapper.appendChild(textureLabel);
    textureWrapper.appendChild(textureSelect);
    displayGroup.appendChild(textureWrapper);

    // Fire button 
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
        cannonball.userData.velocity.copy(direction).multiplyScalar(cannonParams.speed);
        // Detach from cannon and add to scene (for inertial frame)
        elevationGroup.remove(cannonball);
        scene.add(cannonball);
        cannonball.position.copy(worldPos);
        cannonball.userData.isInFlight = true;
        //console.log("Cannonball fired !", cannonball)
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

    // Gradient dynamique (reste en JS car plus flexible)
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

function updateHTMLDisplays() {
  if (latDisplay) latDisplay.value = cannonParams.lat.toFixed(1);
  if (lonDisplay) lonDisplay.value = cannonParams.lon.toFixed(1);
  if (altDisplay) altDisplay.value = cannonParams.altitude.toFixed(0);
  if (azDisplay) azDisplay.value = cannonParams.azimuth.toFixed(0);
  if (elDisplay) elDisplay.value = cannonParams.elevation.toFixed(0);
}