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
    { value: 'map', label: 'Map controls (orbit style)' },
    { value: 'fly', label: 'Fly controls (FPS style)' },
    { value: 'fps', label: 'First Person Shooter' },
    { value: 'pointerLock', label: 'Pointer Lock (not clear)' }
];
let cameraCurrentMode = 'orbit';
export let cameraCurrentControls = null;
let cameraCurrentModeIndex = 0;
let cameraModeSelectRef = null;

export let CAMERA_TARGETS = [
    { value: 'universe', label: 'Universe', object: null }
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
    updateCameraTargetFollow();
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
        positionCameraInFrontOf(position, value);    
    }    

    cameraCurrentControls.update();

    console.log("Camera target has switched to " + value + " with position (" + cameraCurrentControls.target.x.toFixed(0) + " " + cameraCurrentControls.target.y.toFixed(0) + " " + cameraCurrentControls.target.z.toFixed(0) + ")");
}

// Repositions camera so that Earth center → target → camera are collinear
function repositionCameraAlignedWithEarth(targetPos) {
    const earthCenter = new THREE.Vector3(0, 0, 0);

    // Vector from Earth center to target (normalized)
    const earthToTarget = targetPos.clone().sub(earthCenter).normalize();

    // Current camera distance from Earth center (before repositioning)
    const originalAlt = camera.position.distanceTo(earthCenter);

    // Target altitude from Earth center
    const targetAlt = targetPos.distanceTo(earthCenter);

    let desiredCameraDistance;

    if (targetAlt < originalAlt * 0.85) {  // objet relativement proche du centre
        // Garder ~ la même altitude que la caméra avait avant
        desiredCameraDistance = originalAlt;
    } else {
        // Objet loin → on place la caméra un peu plus loin que l'objet
        desiredCameraDistance = targetAlt + scaleFromKm(800); // 800 km au-dessus par défaut
    }

    // Final camera position = along the same line, at desired distance
    const newPosition = earthToTarget.multiplyScalar(desiredCameraDistance);

    camera.position.copy(newPosition);

    // Critical: look at the CENTER of the Earth
    // → the target will always lie exactly on the line of sight
    camera.lookAt(earthCenter);

    console.log(
        `Aligned camera → Earth center → ${cameraCurrentTarget} | ` +
        `cam dist=${scaleToKm(desiredCameraDistance).toFixed(0)} km | ` +
        `target alt=${scaleToKm(targetAlt).toFixed(0)} km`
    );
}

function positionCameraInFrontOf(targetPos, targetType) {
    const baseOffset = ['cannon', 'cannonball'].includes(targetType)
        ? scaleFromKm(1.5)      // assez proche pour bien voir le cannon/boulet
        : scaleFromKm(800);     // vue plus large pour gros objets

    let direction = camera.position.clone().sub(targetPos);

    // Évite la division par zéro si caméra déjà exactement sur la cible
    if (direction.lengthSq() < 0.0001) {
        direction.set(0, 0, 1); // direction arbitraire
    }

    direction.normalize().multiplyScalar(baseOffset);

    camera.position.copy(targetPos).add(direction);
    camera.lookAt(targetPos);

    // Quelques ajustements selon le type de contrôle
    if (cameraCurrentControls) {
        if (cameraCurrentControls instanceof FirstPersonControls) {
            cameraCurrentControls.lookAt(targetPos.x, targetPos.y, targetPos.z);
        } else if (cameraCurrentControls instanceof PointerLockControls ||
            cameraCurrentControls instanceof FlyControls) {
            const dir = targetPos.clone().sub(camera.position).normalize();
            const euler = new THREE.Euler().setFromVector3(dir, 'YXZ');
            camera.quaternion.setFromEuler(euler);
        }
    }

    cameraCurrentControls?.update?.(0);
}

function getCurrentCameraTargetPosition() {
    if (!cameraCurrentTargetObject) return new THREE.Vector3(0, 0, 0);
    //return cameraCurrentTargetObject.position;
    const worldPos = new THREE.Vector3();
    cameraCurrentTargetObject.getWorldPosition(worldPos);
    return worldPos;
}

export function updateCameraTargetFollow() {
    if (!cameraCurrentControls) return;

    const targetPos = getCurrentCameraTargetPosition();

    const isLargeTarget = ['universe', 'earth'].includes(cameraCurrentTarget);
    const isOrbital = ['orbit', 'map'].includes(cameraCurrentMode);

    if (isOrbital) {
        // 1. Toujours suivre la cible (smooth)
        cameraCurrentControls.target.lerp(targetPos, 0.12);

        if (!isLargeTarget) {
            // Pour petits objets (boulet, futur satellite...) → on essaie de garder la Terre dans le champ
            // Calcul vecteur Terre → target
            const earthToTarget = targetPos.clone(); // puisque earth est à (0,0,0)
            earthToTarget.normalize();

            // Vecteur caméra → target
            const camToTarget = targetPos.clone().sub(camera.position).normalize();

            // Produit scalaire → si < 0.85 → la Terre commence à sortir du champ
            const alignment = camToTarget.dot(earthToTarget);

            if (alignment < 0.85) {
                // Petit ajustement : on pousse légèrement la caméra pour mieux voir la Terre
                const correctionDir = earthToTarget.clone().multiplyScalar(0.3);
                const correctedPos = camera.position.clone().add(correctionDir.multiplyScalar(0.05 * scaleFromKm(1000)));
                camera.position.lerp(correctedPos, 0.04); // très progressif
            }
        }
    } else {
        // Modes non-orbitaux : chase cam classique
        const desiredDistance = isLargeTarget ? scaleFromKm(800) : scaleFromKm(1.5);
        const currentDir = camera.position.clone().sub(targetPos).normalize();
        const desiredPos = targetPos.clone().add(currentDir.multiplyScalar(desiredDistance));

        camera.position.lerp(desiredPos, 0.10);
        camera.lookAt(targetPos);
    }

    // Follow target rotation
    if (cameraCurrentTargetObject) {
        // Copy the target's world quaternion to the camera
        //console.log("Camera quaternion before: " + camera.quaternion.x + " " + camera.quaternion.y + " " + camera.quaternion.z + " " + camera.quaternion.w);
        camera.quaternion.copy(cameraCurrentTargetObject.quaternion);
        //console.log("Camera quaternion after: " + camera.quaternion.x + " " + camera.quaternion.y + " " + camera.quaternion.z + " " + camera.quaternion.w);

        // Optional: tiny offset to avoid perfect lock-step feeling (surtout pour la Terre)
        // camera.rotation.y += 0.0005 * delta; // exemple de micro-dérive
    }

    cameraCurrentControls?.update?.(0);
}

export function addCameraTarget(value, label, object) {
    if (CAMERA_TARGETS.some(o => o.value === value)) return;
    CAMERA_TARGETS.push({ value, label, object });
    if (cameraTargetSelectRef) cameraTargetSelectRef.updateOptions(CAMERA_TARGETS);
}

export function registerCameraTargetSelect(selectElement) {
    cameraTargetSelectRef = selectElement;
}

