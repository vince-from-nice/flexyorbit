import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EARTH_RADIUS_SCALED, scaleFromKm, scaleToKm } from '../constants.js';
import { camera, renderer } from '../scene/scene.js';
import { earth } from '../scene/earth.js';
import { cannonGroup, cannonball } from '../scene/cannon.js';

export const CAMERA_MODES = [
    { value: 'orbit', label: 'Orbit controls (default)' },
    // { value: 'map', label: 'Map controls (orbit style)' },
    { value: 'fly', label: 'Fly controls (FPS style)' },
    // { value: 'fps', label: 'First Person Shooter' },
    // { value: 'pointerLock', label: 'Pointer Lock (not clear)' }
];
let cameraCurrentMode = 'orbit';
export let cameraCurrentControls = null;
let cameraCurrentModeIndex = 0;
let cameraModeSelectRef = null;

export let CAMERA_TARGETS = [
    //{ value: 'universe', label: 'Universe', object: null }
];
let cameraCurrentTarget = 'universe';
let cameraCurrentTargetObject = null;
let cameraCurrentTargetIndex = 0;
let cameraTargetSelectRef = null;

const CAMERA_ORBIT_ROTATE_SPEED_BASE = 0.3;
const CAMERA_ORBIT_ROTATE_SPEED_RATIO_MIN = 0.3;
const CAMERA_ORBIT_ROTATE_SPEED_RATIO_MAX = 3.0;
const CAMERA_ORBIT_MIN_DISTANCE_LARGE = EARTH_RADIUS_SCALED + scaleFromKm(500);
const CAMERA_ORBIT_MIN_DISTANCE_SMALL = scaleFromKm(0.01); // 10 meters
const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_LARGE = EARTH_RADIUS_SCALED * 3
const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_SMALL = scaleFromKm(0.01) // 10 meters

let orbitControls = null;
let flyControls = null;
let fpsControls = null;
let pointerLockControls = null;
let mapControls = null;

export function initCameraControls() {
    initOrbitControls();
    cameraCurrentControls = orbitControls;

    addCameraTarget('earth', 'Earth', earth);
    addCameraTarget('cannon', 'Cannon', cannonGroup);
    addCameraTarget('cannonball', 'Cannonball', cannonball);

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyC' && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            cameraCurrentModeIndex = (cameraCurrentModeIndex + 1) % CAMERA_MODES.length;
            const nextMode = CAMERA_MODES[cameraCurrentModeIndex].value;
            cameraModeSelectRef.value = nextMode;
            if (cameraModeSelectRef && cameraModeSelectRef.value !== cameraCurrentMode) {
                cameraModeSelectRef.value = cameraCurrentMode;
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyT' && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            cameraCurrentTargetIndex = (cameraCurrentTargetIndex + 1) % CAMERA_TARGETS.length;
            const nextTarget = CAMERA_TARGETS[cameraCurrentTargetIndex].value;
            cameraTargetSelectRef.value = nextTarget;
            if (cameraTargetSelectRef && cameraTargetSelectRef.value !== cameraCurrentTarget) {
                cameraTargetSelectRef.value = cameraCurrentTarget;
            }
        }
    });
}

function initOrbitControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.rotateSpeed = CAMERA_ORBIT_ROTATE_SPEED_BASE;
    orbitControls.panSpeed = 1.0;
    orbitControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_LARGE;
    orbitControls.maxDistance = EARTH_RADIUS_SCALED * 20;
    orbitControls.enablePan = false;

    orbitControls.addEventListener('change', adjustOrbitControlsSpeed);
}

function initFlyControls() {
    flyControls = new FlyControls(camera, renderer.domElement);
    flyControls.rollSpeed = 0.01;
    flyControls.movementSpeed = 5;
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
        if (cameraCurrentMode === 'pointerLock') {
            pointerLockControls.lock();
        }
    });
    pointerLockControls.addEventListener('lock', () => console.log('Pointer locked'));
    pointerLockControls.addEventListener('unlock', () => console.log('Pointer unlocked'));
}

function adjustOrbitControlsSpeed() {
    const cameraDistance = camera.position.distanceTo(orbitControls.target);
    const ratioDistance = ['universe', 'earth'].includes(cameraCurrentTarget) ?
        CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_LARGE : CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_SMALL;
    let scaleFactor = cameraDistance / ratioDistance;
    if (scaleFactor < CAMERA_ORBIT_ROTATE_SPEED_RATIO_MIN) scaleFactor = CAMERA_ORBIT_ROTATE_SPEED_RATIO_MIN;
    if (scaleFactor > CAMERA_ORBIT_ROTATE_SPEED_RATIO_MAX) scaleFactor = CAMERA_ORBIT_ROTATE_SPEED_RATIO_MAX;
    orbitControls.rotateSpeed = CAMERA_ORBIT_ROTATE_SPEED_BASE * scaleFactor;
    //orbitControls.panSpeed = CAMERA_ORBIT_BASE_PAN_SPEED * scaleFactor;
    false && console.log("orbit controls speed: "
        + " cameraDistance=" + scaleToKm(cameraDistance).toFixed(3) + "km"
        + " ratioDistance=" + scaleToKm(ratioDistance).toFixed(3) + "km"
        + " scaleFactor=" + scaleFactor.toFixed(2)
        + " rotateSpeed: " + orbitControls.rotateSpeed.toFixed(2));
}

export function updateCamera(delta) {
    updateCameraControls(delta);
    updateCameraTargetFollow(delta);
}

export function switchCameraMode(type) {
    const prevPosition = camera.position.clone();
    const prevQuaternion = camera.quaternion.clone();
    const prevTarget = cameraCurrentControls?.target?.clone?.() || new THREE.Vector3();

    if (cameraCurrentControls) {
        cameraCurrentControls.enabled = false;
        if (cameraCurrentControls instanceof OrbitControls || cameraCurrentControls instanceof MapControls) {
            cameraCurrentControls.dispose();
        }
        if (cameraCurrentControls instanceof PointerLockControls) {
            cameraCurrentControls.unlock();
        }
        if (cameraCurrentControls === orbitControls) orbitControls = null;
        if (cameraCurrentControls === mapControls) mapControls = null;
    }

    cameraCurrentMode = type;
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

    cameraCurrentControls = newControls;
    cameraCurrentControls.enabled = true;

    camera.position.copy(prevPosition);
    camera.quaternion.copy(prevQuaternion);

    if (cameraCurrentControls.update) {
        cameraCurrentControls.update(0);
    }

    console.log(`Camera mode has switched to ${type}`);
}

export function registerCameraModeSelect(selectElement) {
    cameraModeSelectRef = selectElement;
}

export function updateCameraControls(deltaTime) {
    if (cameraCurrentControls?.update) {
        cameraCurrentControls.update(deltaTime);
    }
}

export function switchCameraTarget(value) {
    cameraCurrentTarget = value;

    const target = CAMERA_TARGETS.find(e => e.value === value);
    cameraCurrentTargetObject = target?.object;

    const position = getCurrentCameraTargetPosition();

    if (['orbit', 'map'].includes(cameraCurrentMode) && cameraCurrentControls) {
        cameraCurrentControls.target.copy(position);
        if (['universe', 'earth'].includes(value)) {
            cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_LARGE;
            camera.position.set(0, 0, EARTH_RADIUS_SCALED * 4);
            camera.lookAt(new THREE.Vector3(0, 0, 0));
        } else {
            cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_SMALL;
            repositionCameraAlignedWithEarth(position);
        }
    } else {
        repositionCameraInFrontOf(position, value);
    }

    cameraCurrentControls.update();

    console.log("Camera target has switched to " + value + " with position (" + cameraCurrentControls.target?.x.toFixed(0) + " " + cameraCurrentControls.target?.y.toFixed(0) + " " + cameraCurrentControls.target?.z.toFixed(0) + ")");
}

// Repositions camera so that Earth center, target and camera are on the same line
function repositionCameraAlignedWithEarth(targetPos) {
    const earthCenter = new THREE.Vector3(0, 0, 0);
    const earthToTarget = targetPos.clone().sub(earthCenter).normalize();
    const originalAlt = camera.position.distanceTo(earthCenter);
    const targetAlt = targetPos.distanceTo(earthCenter);
    let desiredCameraDistance;
    if (targetAlt < originalAlt * 0.85) {
        desiredCameraDistance = originalAlt;
    } else {
        desiredCameraDistance = targetAlt + scaleFromKm(800);
    }
    const newPosition = earthToTarget.multiplyScalar(desiredCameraDistance);
    camera.position.copy(newPosition);
    camera.lookAt(earthCenter);
    console.log(
        `Aligned camera → Earth center → ${cameraCurrentTarget} | ` +
        `cam dist=${scaleToKm(desiredCameraDistance).toFixed(0)} km | ` +
        `target alt=${scaleToKm(targetAlt).toFixed(0)} km`
    );
}

// TOFIX: Reposition camera in front of the target
function repositionCameraInFrontOf(targetPos, targetType) {
    const baseOffset = ['cannon', 'cannonball'].includes(targetType)
        ? scaleFromKm(1.5)
        : scaleFromKm(800);
    let direction = camera.position.clone().sub(targetPos);
    // Avoid division by zero if the camera is already exactly on the target
    if (direction.lengthSq() < 0.0001) {
        direction.set(0, 0, 1); // arbitrary direction
    }
    direction.normalize().multiplyScalar(baseOffset);
    camera.position.copy(targetPos).add(direction);
    camera.lookAt(targetPos);
    // Some adjustments depending on the type of control
    // if (cameraCurrentControls) {
    //     if (cameraCurrentControls instanceof FirstPersonControls) {
    //         cameraCurrentControls.lookAt(targetPos.x, targetPos.y, targetPos.z);
    //     } else if (cameraCurrentControls instanceof PointerLockControls ||
    //         cameraCurrentControls instanceof FlyControls) {
    //         const dir = targetPos.clone().sub(camera.position).normalize();
    //         const euler = new THREE.Euler().setFromVector3(dir, 'YXZ');
    //         camera.quaternion.setFromEuler(euler);
    //     }
    // }
    cameraCurrentControls?.update?.(0);
}

export function updateCameraTargetFollow(delta) {
    if (!cameraCurrentControls) return;
    const targetPos = getCurrentCameraTargetPosition();
    const isLargeTarget = ['universe', 'earth'].includes(cameraCurrentTarget);
    const isOrbital = ['orbit', 'map'].includes(cameraCurrentMode);

    // For orbital mode : follow the target smoothly
    if (isOrbital) {
        cameraCurrentControls.target.lerp(targetPos, 0.12);
    }
    // For non orbital modes : classic chase camera 
    else {
        // const desiredDistance = isLargeTarget ? scaleFromKm(800) : scaleFromKm(1.5);
        // const currentDir = camera.position.clone().sub(targetPos).normalize();
        // const desiredPos = targetPos.clone().add(currentDir.multiplyScalar(desiredDistance));

        // camera.position.lerp(desiredPos, 0.10);
        // camera.lookAt(targetPos);
    }

    // TOFIX: Follow target rotation
    if (isOrbital && cameraCurrentTargetObject) {
        // Update directly the quaternion doesn't work 
        //console.log("Camera quaternion before: " + camera.quaternion.x + " " + camera.quaternion.y + " " + camera.quaternion.z + " " + camera.quaternion.w);
        //camera.quaternion.copy(cameraCurrentTargetObject.quaternion);
        //console.log("Camera quaternion after: " + camera.quaternion.x + " " + camera.quaternion.y + " " + camera.quaternion.z + " " + camera.quaternion.w);

        // Update directly the rotation doesn't work 
        // console.log("Camera rotation before: " + camera.rotation.x + " " + camera.rotation.y + " " + camera.rotation.z);
        // camera.rotation.x = cameraCurrentTargetObject.rotation.x;
        // camera.rotation.y = cameraCurrentTargetObject.rotation.y;
        // camera.rotation.z = cameraCurrentTargetObject.rotation.z;
        // console.log("Camera rotation after: " + camera.rotation.x + " " + camera.rotation.y + " " + camera.rotation.z);

        // There is no fields or getters/setters for azimuthal and polar angles in OrbitControls ???
        // console.log("Camera azimuthal and polar angles before: " + cameraCurrentControls.azimuthalAngle + " " + cameraCurrentControls.polarAngle);
        // cameraCurrentControls.azimuthalAngle += cameraCurrentTargetObject.rotation.y * delta;
        // cameraCurrentControls.polarAngle += cameraCurrentTargetObject.rotation.x * delta;
        // console.log("Camera azimuthal and polar angles after: " + cameraCurrentControls.azimuthalAngle + " " + cameraCurrentControls.polarAngle);

        // Try to set manually a new camera position
        // const target = cameraCurrentControls.target;    
        // const currentDistance = camera.position.distanceTo(target);
        // const fromTargetToCam = camera.position.clone().sub(target);
        // let quat = cameraCurrentTargetObject.quaternion.clone();
        // //quat.invert();
        // fromTargetToCam.applyQuaternion(quat);
        // camera.position.copy(target).add(fromTargetToCam);
        // camera.lookAt(target);
    }
}

function getCurrentCameraTargetPosition() {
    if (!cameraCurrentTargetObject) return new THREE.Vector3(0, 0, 0);
    const worldPos = new THREE.Vector3();
    cameraCurrentTargetObject.getWorldPosition(worldPos);
    return worldPos;
}

export function addCameraTarget(value, label, object) {
    if (CAMERA_TARGETS.some(o => o.value === value)) return;
    CAMERA_TARGETS.push({ value, label, object });
    if (cameraTargetSelectRef) cameraTargetSelectRef.updateOptions(CAMERA_TARGETS);
}

export function registerCameraTargetSelect(selectElement) {
    cameraTargetSelectRef = selectElement;
}

