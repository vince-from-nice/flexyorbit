import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

import { scene } from './scene.js';
import { cannonball } from '../scene/cannon.js';

export const trailStyles = [
    { code: 'TRAIL_STYLE_WITH_SINGLE_LINES', label: 'Single thin lines' },
    { code: 'TRAIL_STYLE_WITH_THICK_LINES', label: 'Thick screen-space lines' },
    { code: 'TRAIL_STYLE_WITH_TUBES', label: '3D tubes (TODO)' },
    { code: 'TRAIL_STYLE_WITH_VERTICAL_BARS', label: 'Vertical bars (TODO)' },
];

export let currentTrailStyle = 'TRAIL_STYLE_WITH_THICK_LINES';

const MAX_POINTS = 2000;
const LIFETIME = 60; // seconds
const MAX_PAST_TRAILS = 10;

// Initialise trails data on cannonball
function initTrailsData() {
    if (!cannonball.userData.trails) {
        cannonball.userData.trails = {
            current: null,
            past: []
        };
    }
}

// Create new trail for a new shot
export function createNewCannonballTrail() {
    initTrailsData();

    const trails = cannonball.userData.trails;

    // Move current to past if meaningful
    if (trails.current) {
        if (trails.current.userData.history?.length > 1) {
            trails.past.push(trails.current);
            if (trails.past.length > MAX_PAST_TRAILS) {
                const old = trails.past.shift();
                scene.remove(old);
                old.geometry?.dispose();
                old.material?.dispose();
            }
        } else {
            scene.remove(trails.current);
            trails.current.geometry?.dispose();
            trails.current.material?.dispose();
        }
    }

    trails.current = null;

    if (currentTrailStyle === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
        const material = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.75 });
        trails.current = new THREE.Line(geometry, material);
    }
    else if (currentTrailStyle === 'TRAIL_STYLE_WITH_THICK_LINES') {
        const geometry = new LineGeometry();
        const material = new LineMaterial({
            color: 0xff4444,
            linewidth: 4.0,
            transparent: true,
            opacity: 0.8,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
        });
        trails.current = new Line2(geometry, material);
        trails.current.geometry.instanceCount = 0;
    }

    if (trails.current) {
        scene.add(trails.current);
        trails.current.userData.history = [];
        trails.current.userData.style = currentTrailStyle;
    }
}

// Update trail geometry from history (reused for current and past)
function updateTrailGeometry(trail) {
    const style = trail.userData.style;
    const history = trail.userData.history;
    const count = history.length;

    if (count < 2) return;

    const flat = new Float32Array(count * 3);
    history.forEach((entry, i) => {
        flat[i * 3] = entry.position.x;
        flat[i * 3 + 1] = entry.position.y;
        flat[i * 3 + 2] = entry.position.z;
    });

    if (style === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
        trail.geometry.attributes.position.array.set(flat);
        trail.geometry.setDrawRange(0, count);
        trail.geometry.attributes.position.needsUpdate = true;
    }
    else if (style === 'TRAIL_STYLE_WITH_THICK_LINES') {
        trail.geometry.setPositions(flat);
        trail.geometry._maxInstanceCount = undefined;
        trail.geometry.instanceCount = count - 1;
        trail.computeLineDistances();
        trail.geometry.attributes.position.needsUpdate = true;
        ['instanceStart', 'instanceEnd', 'instanceDistanceStart', 'instanceDistanceEnd'].forEach(attr => {
            if (trail.geometry.attributes[attr]) {
                trail.geometry.attributes[attr].needsUpdate = true;
            }
        });
    }

    //console.log("TrailGeometry has been updated with " + count + " points and style is " + style);
}

// Update trails every frame
export function updateTrail(obj) {
    if (!obj.userData.trails) return;

    const trails = obj.userData.trails;
    const now = Date.now() / 1000;

    // Update current trail
    if (obj.userData.isInFlight && trails.current && trails.current.userData.history) {
        trails.current.userData.history.push({
            position: obj.position.clone(),
            time: now
        });

        while (trails.current.userData.history.length > 0 && now - trails.current.userData.history[0].time > LIFETIME) {
            trails.current.userData.history.shift();
        }

        if (trails.current.userData.history.length > MAX_POINTS) {
            trails.current.userData.history.splice(0, trails.current.userData.history.length - MAX_POINTS);
        }

        updateTrailGeometry(trails.current);
    }

    // Update past trails (fade only)
    trails.past = trails.past.filter(trail => {
        if (trail.userData.history) {
            while (trail.userData.history.length > 0 && now - trail.userData.history[0].time > LIFETIME) {
                trail.userData.history.shift();
            }

            const count = trail.userData.history.length;
            if (count < 2) {
                scene.remove(trail);
                trail.geometry?.dispose();
                trail.material?.dispose();
                return false;
            }

            updateTrailGeometry(trail);
            return true;
        }
        return false;
    });
}

// Update resolution on resize
export function updateThickLineResolution() {
    if (!cannonball.userData.trails) return;

    const trails = cannonball.userData.trails;

    if (trails.current && trails.current.userData.style === 'TRAIL_STYLE_WITH_THICK_LINES' && trails.current.material) {
        trails.current.material.resolution.set(window.innerWidth, window.innerHeight);
    }

    trails.past.forEach(trail => {
        if (trail.userData.style === 'TRAIL_STYLE_WITH_THICK_LINES' && trail.material) {
            trail.material.resolution.set(window.innerWidth, window.innerHeight);
        }
    });
}

// Change current style and create new trail
export function updateTrailStyle(newStyle) {
    currentTrailStyle = newStyle;
    initTrailsData();
    createNewCannonballTrail();
}