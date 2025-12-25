// trails.js
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

import { scene } from './scene.js';
import { cannonball } from '../scene/cannon.js';

export const trailStyles = [
    { code: 'TRAIL_STYLE_WITH_SINGLE_LINES', label: 'Single thin lines' },
    { code: 'TRAIL_STYLE_WITH_THICK_LINES', label: 'Advanced thick lines' },
    { code: 'TRAIL_STYLE_WITH_TUBES', label: '3D tubes (TODO)' },
    { code: 'TRAIL_STYLE_WITH_TUBES', label: 'Vertical bars (TODO)' },
];

export const trailConfig = {
    currentStyle: 'TRAIL_STYLE_WITH_SINGLE_LINES'
};

const MAX_POINTS = 1200;
const LIFETIME = 30; // seconds

let currentTrail = null;

export function createOrResetCannonballTrail() {
    if (currentTrail) {
        scene.remove(currentTrail);
        currentTrail.geometry?.dispose();
        currentTrail.material?.dispose();
    }

    currentTrail = null;
    cannonball.userData.trail = null;

    if (trailConfig.currentStyle === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));

        const material = new THREE.LineBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.75
        });

        currentTrail = new THREE.Line(geometry, material);
    }
    else if (trailConfig.currentStyle === 'TRAIL_STYLE_WITH_THICK_LINES') {
        const geometry = new LineGeometry();
        const material = new LineMaterial({
            color: 0xff4444,
            linewidth: 4.0,
            transparent: true,
            opacity: 0.8,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
        });

        currentTrail = new Line2(geometry, material);
    }

    if (currentTrail) {
        scene.add(currentTrail);
        cannonball.userData.trail = currentTrail;
        currentTrail.userData.history = []; // { position: Vector3, time: number }[]
    }
}

// Update trail every frame (called from physics for cannonball)
export function updateTrail(obj) {
    const trail = obj.userData.trail;
    if (!trail || !trail.userData.history) return;

    const now = Date.now() / 1000;

    // Add new point
    trail.userData.history.push({
        position: obj.position.clone(),
        time: now
    });

    // Remove old points
    while (trail.userData.history.length > 0 && now - trail.userData.history[0].time > LIFETIME) {
        trail.userData.history.shift();
    }

    // Safety limit
    if (trail.userData.history.length > MAX_POINTS) {
        trail.userData.history.splice(0, trail.userData.history.length - MAX_POINTS);
    }

    const points = trail.userData.history;
    const count = points.length;

    if (count < 2) return;

    // Same coordinates array for both styles
    const flat = new Float32Array(count * 3);
    points.forEach((entry, i) => {
        flat[i * 3] = entry.position.x;
        flat[i * 3 + 1] = entry.position.y;
        flat[i * 3 + 2] = entry.position.z;
    });

    if (trailConfig.currentStyle === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
        trail.geometry.attributes.position.array.set(flat);
        trail.geometry.setDrawRange(0, count);
        trail.geometry.attributes.position.needsUpdate = true;
    }
    else if (trailConfig.currentStyle === 'TRAIL_STYLE_WITH_THICK_LINES') {
        trail.geometry.setPositions(flat);
        trail.computeLineDistances();

        // Force reset de la limite interne (clé pour les updates dynamiques)
        trail.geometry._maxInstanceCount = undefined;
        trail.geometry.instanceCount = count - 1;  // segments = points - 1

        // Toujours utile : mise à jour explicite des attributs
        trail.geometry.attributes.position.needsUpdate = true;
        if (trail.geometry.attributes.instanceStart) trail.geometry.attributes.instanceStart.needsUpdate = true;
        if (trail.geometry.attributes.instanceEnd) trail.geometry.attributes.instanceEnd.needsUpdate = true;
        if (trail.geometry.attributes.instanceDistanceStart) trail.geometry.attributes.instanceDistanceStart.needsUpdate = true;
        if (trail.geometry.attributes.instanceDistanceEnd) trail.geometry.attributes.instanceDistanceEnd.needsUpdate = true;
    }

    console.log(`Trail has been updated with ${count} points and current style is ${trailConfig.currentStyle}`);
}

// Update resolution on resize (for thick lines)
export function updateThickLineResolution() {
    if (currentTrailStyle === 'TRAIL_STYLE_WITH_THICK_LINES' && cannonball?.userData?.trail?.material) {
        cannonball.userData.trail.material.resolution.set(window.innerWidth, window.innerHeight);
    }
}