import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EARTH_RADIUS_SCALED, scaleFromKm, scaleToKm } from '../constants.js';
import { camera, renderer } from '../scene/scene.js';

export let currentControls = null;
export let controlType = 'orbit';
const CONTROL_MODES = ['orbit', 'map', 'fly', 'fps', 'pointerLock'];
let currentModeIndex = 0;
let cameraModeSelectRef = null;

let orbitControls = null;
let flyControls = null;
let fpsControls = null;
let pointerLockControls = null;
let mapControls = null;

const baseRotateSpeed = 0.1;
const basePanSpeed = 1.0;

export function initCameraControls() {
    initOrbitControls();

    currentControls = orbitControls;

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyC' && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            currentModeIndex = (currentModeIndex + 1) % CONTROL_MODES.length;
            const nextMode = CONTROL_MODES[currentModeIndex];
            switchCameraControl(nextMode);
            console.log(`Camera mode → ${nextMode}`);
        }
    });
}

function initOrbitControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.rotateSpeed = 1.0;
    orbitControls.panSpeed = 1.0;
    orbitControls.minDistance = EARTH_RADIUS_SCALED + scaleFromKm(300);
    orbitControls.maxDistance = EARTH_RADIUS_SCALED * 20;
    orbitControls.enablePan = true;

    orbitControls.addEventListener('change', adjustOrbitControlsSpeed);
}

function initFlyControls() {
    flyControls = new FlyControls(camera, renderer.domElement);
    flyControls.rollSpeed = 1.0;
    flyControls.movementSpeed = 200;
    flyControls.autoForward = false;
    flyControls.dragToLook = true;
}

function initMapControls() {
    mapControls = new MapControls(camera, renderer.domElement);
    mapControls.enableDamping = true;
    mapControls.dampingFactor = 0.05;
    mapControls.minDistance = EARTH_RADIUS_SCALED + scaleFromKm(300);
    mapControls.maxDistance = EARTH_RADIUS_SCALED * 20;
    mapControls.maxPolarAngle = Math.PI / 2;
}

function initFPSControls() {
    fpsControls = new FirstPersonControls(camera, renderer.domElement);
    fpsControls.movementSpeed = 200;
    fpsControls.lookSpeed = 0.1;
    fpsControls.lookVertical = true;
    fpsControls.constrainVerticalLook = true;
    fpsControls.heightMin = scaleFromKm(2);
    fpsControls.heightMax = scaleFromKm(5000);
}

function initPointerLockControls() {
    pointerLockControls = new PointerLockControls(camera, renderer.domElement);
    renderer.domElement.addEventListener('click', () => {
        if (controlType === 'pointerLock') {
            pointerLockControls.lock();
        }
    });
    pointerLockControls.addEventListener('lock', () => console.log('Pointer locked'));
    pointerLockControls.addEventListener('unlock', () => console.log('Pointer unlocked'));
}

function adjustOrbitControlsSpeed() {
    const cameraDistance = camera.position.distanceTo(orbitControls.target);
    const scaleFactor = Math.max(0.3, Math.max(1, cameraDistance / EARTH_RADIUS_SCALED * 2));
    console.log("scale and cameraDistance: " + scaleFactor + " " + cameraDistance)
    orbitControls.rotateSpeed = baseRotateSpeed * scaleFactor;
    orbitControls.panSpeed = basePanSpeed * scaleFactor;
    console.log("orbit speed: " + orbitControls.rotateSpeed + " " + orbitControls.panSpeed)
}

export function switchCameraControl(type) {
    const prevPosition = camera.position.clone();
    const prevQuaternion = camera.quaternion.clone();
    const prevTarget = currentControls?.target?.clone?.() || new THREE.Vector3();

    if (currentControls) {
        currentControls.enabled = false;
        if (currentControls instanceof OrbitControls || currentControls instanceof MapControls) {
            currentControls.dispose();
        }
        if (currentControls instanceof PointerLockControls) {
            currentControls.unlock();
        }
        if (currentControls === orbitControls) orbitControls = null;
        if (currentControls === mapControls) mapControls = null;
    }

    controlType = type;
    let newControls = null;

    switch (type) {
        case 'orbit':
            initOrbitControls();
            newControls = orbitControls;
            newControls.target.copy(prevTarget);
            break;

        case 'map':
            initMapControls();
            newControls = mapControls;
            newControls.target.copy(prevTarget);
            break;

        case 'fly':
            if (!flyControls) initFlyControls();
            newControls = flyControls;
            break;

        case 'fps':
            if (!fpsControls) initFPSControls();
            newControls = fpsControls;
            break;

        case 'pointerLock':
            if (!pointerLockControls) initPointerLockControls();
            newControls = pointerLockControls;
            break;

        default:
            console.warn('Mode inconnu:', type);
            return;
    }

    currentControls = newControls;
    currentControls.enabled = true;

    camera.position.copy(prevPosition);
    camera.quaternion.copy(prevQuaternion);

    if (currentControls.update) {
        currentControls.update(0);
    }

    if (cameraModeSelectRef && cameraModeSelectRef.value !== controlType) {
        cameraModeSelectRef.value = controlType;
    }
}

export function registerCameraModeSelect(selectElement) {
    cameraModeSelectRef = selectElement;
}

export function updateCameraControls(deltaTime) {
    if (currentControls?.update) {
        currentControls.update(deltaTime);
    }
}

