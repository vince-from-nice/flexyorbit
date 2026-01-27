import * as THREE from 'three';
import world from '../world.js';
import { printPosInKm, showTemporaryMessage } from '../utils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { EARTH_RADIUS, scaleFromKm, scaleToKm } from '../constants.js';
import { camera, renderer } from '../scene/scene.js';
import { earth } from '../scene/earth.js';
import { MOON_RADIUS } from '../scene/moon.js';
import { cannonGroup } from '../scene/cannon.js';

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

export let CAMERA_TARGETS = [];
let cameraCurrentTarget = 'Earth';
let cameraCurrentTargetObject = null;
let cameraTargetSelectRef = null;

const CAMERA_ORBIT_ROTATE_SPEED_BASE = 0.8;
const CAMERA_ORBIT_ROTATE_SPEED_RATIO_MIN = 0.1;
const CAMERA_ORBIT_ROTATE_SPEED_RATIO_MAX = 3.0;

const CAMERA_ORBIT_MIN_DISTANCE_FOR_EARTH = EARTH_RADIUS + scaleFromKm(1000);
const CAMERA_ORBIT_MIN_DISTANCE_FOR_MOON = MOON_RADIUS + scaleFromKm(500);
const CAMERA_ORBIT_MIN_DISTANCE_FOR_OBJECTS = scaleFromKm(0.01); // 10 meters

const CAMERA_ORBIT_INIT_DISTANCE_FOR_EARTH = EARTH_RADIUS * 5;
const CAMERA_ORBIT_INIT_DISTANCE_FOR_MOON = MOON_RADIUS * 5;
const CAMERA_ORBIT_INIT_DISTANCE_FOR_OBJECTS = scaleFromKm(4000);

const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_EARTH = EARTH_RADIUS * 5
const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_MOON = MOON_RADIUS * 5
const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_OBJECTS = scaleFromKm(0.1) // 100 meters

let orbitControls = null;
let flyControls = null;

let isUserInteracting = false;

const earthCenter = new THREE.Vector3(0, 0, 0);

export function initCameraControls() {
    initOrbitControls();
    initFlyControls();

    cameraCurrentControls = orbitControls;

    refreshCameraTargets();

    window.addEventListener('keydown', (e) => {
        if (!e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            if (e.key === 'c') {
                cameraCurrentModeIndex = (cameraCurrentModeIndex + 1) % CAMERA_MODES.length;
                const nextMode = CAMERA_MODES[cameraCurrentModeIndex].value;
                cameraModeSelectRef.value = nextMode;
            } else if (e.key === 'e') {
                cameraTargetSelectRef.value = 'Earth';
            } else if (e.key === 'm') {
                cameraTargetSelectRef.value = 'Moon';
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
    orbitControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_EARTH;
    orbitControls.maxDistance = scaleFromKm(2000000);
    orbitControls.enablePan = false;

    orbitControls.addEventListener('change', adjustOrbitControlsSpeed);
    orbitControls.addEventListener('start', () => { isUserInteracting = true; });
    orbitControls.addEventListener('end', () => { isUserInteracting = false; });
}

function initFlyControls() {
    flyControls = new FlyControls(camera, renderer.domElement);
    flyControls.rollSpeed = 0.01;
    flyControls.movementSpeed = 5;
    flyControls.autoForward = false;
    flyControls.dragToLook = true;
}

function adjustOrbitControlsSpeed() {
    const cameraDistance = camera.position.distanceTo(orbitControls.target);
    let ratioDistance;
    if (['Universe', 'Earth'].includes(cameraCurrentTarget)) {
        ratioDistance = CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_EARTH;
    } else if (['Moon'].includes(cameraCurrentTarget)) {
        ratioDistance = CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_MOON;
    } else {
        ratioDistance = CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_OBJECTS;
    }
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

export function switchCameraMode(type) {
    const prevPosition = camera.position.clone();
    const prevQuaternion = camera.quaternion.clone();
    const prevTarget = cameraCurrentControls?.target?.clone?.() || new THREE.Vector3();

    if (cameraCurrentControls) {
        cameraCurrentControls.enabled = false;
    }

    cameraCurrentMode = type;
    switch (type) {
        case 'orbit':
            cameraCurrentControls = orbitControls;
            cameraCurrentControls.target.copy(prevTarget);
            break;

        case 'fly':
            cameraCurrentControls = flyControls;
            break;

        default:
            console.warn('Unknown camera mode:', type);
            return;
    }
    cameraCurrentControls.enabled = true;

    camera.position.copy(prevPosition);
    camera.quaternion.copy(prevQuaternion);

    cameraCurrentControls.update(0);

    showTemporaryMessage("Camera mode has changed to " + type);

    console.log(`Camera mode has switched to ${type}`);
}

export function switchCameraTarget(newTarget) {
    if (!cameraCurrentControls) return;
    cameraCurrentTarget = newTarget;

    const target = CAMERA_TARGETS.find(e => e.value === newTarget);
    cameraCurrentTargetObject = target?.object;

    if (['Universe', 'Earth'].includes(cameraCurrentTarget)) {
        cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_EARTH;
    } else if (['Moon'].includes(cameraCurrentTarget)) {
        cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_MOON;
    } else {
        cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_OBJECTS;
    }

    const newTargetPosition = getCurrentCameraTargetPosition();
    let newCameraDistance;
    if (['Universe', 'Earth'].includes(cameraCurrentTarget)) {
        newCameraDistance = CAMERA_ORBIT_INIT_DISTANCE_FOR_EARTH;
    } else {
        let targetAlt = newTargetPosition.distanceTo(earthCenter);
        if (['Moon'].includes(cameraCurrentTarget)) {
            newCameraDistance = targetAlt + CAMERA_ORBIT_INIT_DISTANCE_FOR_MOON;
        } else {
            newCameraDistance = targetAlt + CAMERA_ORBIT_INIT_DISTANCE_FOR_OBJECTS;
        }
    }

    if (['orbit', 'map'].includes(cameraCurrentMode) && cameraCurrentControls) {
        cameraCurrentControls.target.copy(newTargetPosition);
        repositionCameraAlignedWithEarthAndTarget(newTargetPosition, newCameraDistance, true);
    } else {
        repositionCameraInFrontOf(newTargetPosition, newTarget);
    }

    cameraCurrentControls.update();

    showTemporaryMessage("Camera target has changed to " + target?.label);

    console.log("Camera target has switched to " + newTarget + " with position " + printPosInKm(newTargetPosition) + " and camera distance is " + scaleToKm(newCameraDistance).toFixed(0) + " km");
}

// Repositions camera so that Earth center, target and camera are on the same line
function repositionCameraAlignedWithEarthAndTarget(targetPos, newDistance, forceInstant = false) {
    let newDirection;
    if (['Universe', 'Earth'].includes(cameraCurrentTarget)) {
        newDirection = camera.position.clone().sub(earthCenter).normalize();
    } else {
        newDirection = targetPos.clone().sub(earthCenter).normalize();
    }
    const newPosition = newDirection.multiplyScalar(newDistance);
    if (forceInstant) {
        camera.position.copy(newPosition);
    } else {
        camera.position.lerp(newPosition, 0.1);
    }
    camera.lookAt(targetPos);
}

function repositionCameraInFrontOf(targetPos, targetType) {
    const baseOffset = ['Cannon', 'Cannonball'].includes(targetType)
        ? scaleFromKm(1.5)
        : scaleFromKm(800);
    let direction = camera.position.clone().sub(targetPos);
    if (direction.lengthSq() < 0.0001) {
        direction.set(0, 0, 1); // arbitrary direction
    }
    direction.normalize().multiplyScalar(baseOffset);
    camera.position.copy(targetPos).add(direction);
    camera.lookAt(targetPos);
    cameraCurrentControls?.update?.(0);
}

export function updateCameraToFollowTarget(delta) {
    if (!cameraCurrentControls) return;
    const targetPos = getCurrentCameraTargetPosition();
    const isLargeTarget = ['Universe', 'Earth'].includes(cameraCurrentTarget);
    const isOrbital = ['orbit', 'map'].includes(cameraCurrentMode);

    // For orbital mode : follow the target smoothly
    if (isOrbital) {
        cameraCurrentControls.target.copy(targetPos);
        if (!isUserInteracting) {
            // Disable respositionning for now
            //const newDistance = camera.position.distanceTo(targetPos) + targetPos.distanceTo(earthCenter);
            //repositionCameraAlignedWithEarthAndTarget(cameraCurrentControls.target, newDistance, false);
        }
    }
    // For non orbital modes : classic chase camera 
    else {
        // const desiredDistance = isLargeTarget ? scaleFromKm(800) : scaleFromKm(1.5);
        // const currentDir = camera.position.clone().sub(targetPos).normalize();
        // const desiredPos = targetPos.clone().add(currentDir.multiplyScalar(desiredDistance));
        // camera.position.lerp(desiredPos, 0.10);
        // camera.lookAt(targetPos);
    }
}

function getCurrentCameraTargetPosition() {
    if (!cameraCurrentTargetObject) return new THREE.Vector3(0, 0, 0);
    const worldPos = new THREE.Vector3();
    cameraCurrentTargetObject.getWorldPosition(worldPos);
    return worldPos;
}

export function updateCamera(deltaTime) {
    cameraCurrentControls.update(deltaTime);
    updateCameraToFollowTarget(deltaTime);
}

export function refreshCameraTargets() {
    CAMERA_TARGETS = [];
    CAMERA_TARGETS.push({ value: 'Earth', label: 'Earth', object: earth });
    CAMERA_TARGETS.push({ value: 'Cannon', label: 'Cannon', object: cannonGroup });
    for (const entity of world.getPhysicalEntities()) {
        CAMERA_TARGETS.push({ value: entity.name, label: entity.name, object: entity.body });
    }
    if (cameraTargetSelectRef) cameraTargetSelectRef.updateOptions(CAMERA_TARGETS);
}

export function selectCameraTarget(targetName) {
    if (cameraTargetSelectRef) {
        cameraTargetSelectRef.value = targetName;
    }
}

export function registerCameraTargetSelect(selectElement) {
    cameraTargetSelectRef = selectElement;
}

export function registerCameraModeSelect(selectElement) {
    cameraModeSelectRef = selectElement;
}
