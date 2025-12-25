import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EARTH_RADIUS } from '../constants.js';
import { camera, renderer } from '../scene/scene.js';
import { earth } from '../scene/earth.js';


export let orbitControls;

const baseRotateSpeed = 1.0;
const basePanSpeed = 1.0;

export function initCameraControls() {
    initOrbitControls();
}

function initOrbitControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.rotateSpeed = baseRotateSpeed;
    orbitControls.panSpeed = basePanSpeed;
    orbitControls.minDistance = EARTH_RADIUS + 300;
    orbitControls.maxDistance = EARTH_RADIUS * 20;
    orbitControls.enablePan = true;

    orbitControls.addEventListener('change', adjustOrbitControlsSpeed);
    initSpecialKeyForOrbitControls();
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