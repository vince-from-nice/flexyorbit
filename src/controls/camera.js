import * as THREE from 'three';
import world from '../world.js';
import { printPos, showTemporaryMessage } from '../utils.js';
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

export let CAMERA_TARGETS = [
    //{ value: 'universe', label: 'Universe', object: null }
];
let cameraCurrentTarget = 'Earth';
let cameraCurrentTargetObject = null;
let cameraCurrentTargetIndex = 0;
let cameraTargetSelectRef = null;

const CAMERA_ORBIT_ROTATE_SPEED_BASE = 0.6;
const CAMERA_ORBIT_ROTATE_SPEED_RATIO_MIN = 0.1;
const CAMERA_ORBIT_ROTATE_SPEED_RATIO_MAX = 3.0;

const CAMERA_ORBIT_MIN_DISTANCE_FOR_EARTH = EARTH_RADIUS + scaleFromKm(1000);
const CAMERA_ORBIT_MIN_DISTANCE_FOR_MOON = MOON_RADIUS + scaleFromKm(500);
const CAMERA_ORBIT_MIN_DISTANCE_FOR_OBJECTS = scaleFromKm(0.01); // 10 meters

const CAMERA_ORBIT_INIT_DISTANCE_FOR_EARTH = EARTH_RADIUS * 3;
const CAMERA_ORBIT_INIT_DISTANCE_FOR_MOON = MOON_RADIUS * 3;
const CAMERA_ORBIT_INIT_DISTANCE_FOR_OBJECTS = scaleFromKm(2000);

const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_EARTH = EARTH_RADIUS * 5
const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_MOON = MOON_RADIUS * 5
const CAMERA_ORBIT_ZOOM_RATIO_DISTANCE_OBJECTS = scaleFromKm(0.1) // 100 meters

let orbitControls = null;
let flyControls = null;

export function initCameraControls() {
    initOrbitControls();
    initFlyControls();

    cameraCurrentControls = orbitControls;

    refreshCameraTargets();

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
    orbitControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_EARTH;
    orbitControls.maxDistance = scaleFromKm(1000000);
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
    true && console.log("orbit controls speed: "
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
    let cameraNewControls = null;
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
    cameraCurrentTarget = newTarget;

    const target = CAMERA_TARGETS.find(e => e.value === newTarget);
    cameraCurrentTargetObject = target?.object;

    const position = getCurrentCameraTargetPosition();

    if (['orbit', 'map'].includes(cameraCurrentMode) && cameraCurrentControls) {
        cameraCurrentControls.target.copy(position);
        repositionCameraAlignedWithEarthAndTarget(position, newTarget);
    } else {
        repositionCameraInFrontOf(position, newTarget);
    }

    cameraCurrentControls.update();

    showTemporaryMessage("Camera target has changed to " + target?.label);

    console.log("Camera target has switched to " + newTarget + " with position " + printPos(cameraCurrentControls.target));
}

// Repositions camera so that Earth center, target and camera are on the same line
function repositionCameraAlignedWithEarthAndTarget(targetPos) {
    const earthCenter = new THREE.Vector3(0, 0, 0);
    const targetAlt = targetPos.distanceTo(earthCenter);
    let newDistance, newDirection;
    if (['Universe', 'Earth'].includes(cameraCurrentTarget)) {
        cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_EARTH;
        newDistance = CAMERA_ORBIT_INIT_DISTANCE_FOR_EARTH;
    } else if (['Moon'].includes(cameraCurrentTarget)) {
        cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_MOON;
        newDistance = targetAlt + CAMERA_ORBIT_INIT_DISTANCE_FOR_MOON;
    } else {
        cameraCurrentControls.minDistance = CAMERA_ORBIT_MIN_DISTANCE_FOR_OBJECTS;
        newDistance = targetAlt + CAMERA_ORBIT_INIT_DISTANCE_FOR_OBJECTS;
    }
    // When the target is earth or universe a hard direction is used
    if (['Universe', 'Earth'].includes(cameraCurrentTarget)) {
        newDirection = new THREE.Vector3(0, 0, 1)
        //newDirection = camera.position.clone().sub(earthCenter).normalize();
    } else {
        newDirection = targetPos.clone().sub(earthCenter).normalize();
    }
    const newPosition = newDirection.multiplyScalar(newDistance);
    camera.position.copy(newPosition);
    camera.lookAt(earthCenter);
    //console.log(`Aligned camera → ${cameraCurrentTarget} → Earth center | cam dist=${scaleToKm(newDistance).toFixed(0)} km | target alt=${scaleToKm(targetAlt).toFixed(0)} km`);
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

export function updateCameraTargetFollow(delta) {
    if (!cameraCurrentControls) return;
    const targetPos = getCurrentCameraTargetPosition();
    const isLargeTarget = ['Universe', 'Earth'].includes(cameraCurrentTarget);
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

export function updateCamera(deltaTime) {
    cameraCurrentControls.update(deltaTime);
    updateCameraTargetFollow(deltaTime);
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

export function registerCameraTargetSelect(selectElement) {
    cameraTargetSelectRef = selectElement;
}

export function registerCameraModeSelect(selectElement) {
    cameraModeSelectRef = selectElement;
}
