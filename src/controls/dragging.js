import * as THREE from 'three';
import { camera, renderer } from '../scene/scene.js';
import { cannonGroup, cannonParams, updateCannonWithParams } from '../scene/cannon.js';
import { earth } from '../scene/earth.js';
import { cameraCurrentControls } from './camera.js';
import { updateCannonWidgets } from './interface.js';

let isDraggingCannon = false;
let dragButton = -1; // 0 = left, 2 = right
let previousMouse = new THREE.Vector2();

export function initDraggings() {
    initCannonDragging();
}

function initCannonDragging() {
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

    cameraCurrentControls.enabled = false;

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
    const altSensitivity = 800;   // km per full screen
    const elevSensitivity = 130;   // deg per full screen

    if (dragButton === 0) { // Left button
        const ctrl = event.ctrlKey;
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
            const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), currentR);

            if (raycaster.ray.intersectSphere(sphere, intersection)) {
                const localPos = earth.worldToLocal(intersection.clone());

                const phi = Math.acos(localPos.y / currentR);
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
    updateCannonWidgets();
}

function onCannonPointerUp() {
    if (!isDraggingCannon) return;

    isDraggingCannon = false;
    dragButton = -1;
    cameraCurrentControls.enabled = true;
    renderer.domElement.style.cursor = 'auto';
}