import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { EARTH_RADIUS_SCALED, scaleFromKm } from '../constants.js';
import { scene } from './scene.js';
import { cannonball } from '../scene/cannon.js';

export const TRAIL_STYLES = [
    { value: 'TRAIL_STYLE_WITH_SINGLE_LINES', label: 'Single thin lines' },
    { value: 'TRAIL_STYLE_WITH_THICK_LINES', label: 'Thick screen-space lines' },
    { value: 'TRAIL_STYLE_WITH_VERTICAL_BARS', label: '3D vertical bars' },
];

export let currentTrailStyle = 'TRAIL_STYLE_WITH_VERTICAL_BARS';

const MAX_POINTS = 10000;
const LIFETIME = 120; // seconds
const MAX_PAST_TRAILS = 10;
const FRAMES_NBR_BETWEEN_UPDATES = 3;
const UPDATES_NBR_BETWEEN_BARS = 4;
const VERTICAL_BAR_THICKNESS = 50 // km
const VERTICAL_BAR_FIXED_HEIGHT = 300 // km (useless when projection on Earth surface is used)

let updateCounter = 0
let stanceCounter = 0

function initTrailsData() {
    if (!cannonball.userData.trails) {
        cannonball.userData.trails = {
            current: null,
            past: []
        };
    }
}

export function createNewCannonballTrail() {
    initTrailsData();

    const trails = cannonball.userData.trails;

    // Move current to past if meaningful
    if (trails.current) {
        if (trails.current.history?.length > 1) {
            trails.past.push(trails.current);
            if (trails.past.length > MAX_PAST_TRAILS) {
                const old = trails.past.shift();
                scene.remove(old);
                old.geometry?.dispose();
                old.material?.dispose();
            }
        } else {
            scene.remove(trails.current.model);
            trails.current.geometry?.dispose();
            trails.current.material?.dispose();
        }
    }

    trails.current = {
        style: currentTrailStyle,
        history: [],
        model: null
    };

    if (currentTrailStyle === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_POINTS * 3), 3));
        const material = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.75 });
        trails.current.model = new THREE.Line(geometry, material);
        scene.add(trails.current.model);
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
        trails.current.model = new Line2(geometry, material);
        trails.current.model.geometry.instanceCount = 0;
        scene.add(trails.current.model);
    } else if (currentTrailStyle === 'TRAIL_STYLE_WITH_VERTICAL_BARS') {
        trails.current.model = []
    }
}

export function updateTrail(obj) {
    if (!obj.userData.trails) return;

    const trails = obj.userData.trails;

    // No need to update trailt on every frame
    if (updateCounter < FRAMES_NBR_BETWEEN_UPDATES) {
        updateCounter++;
        return
    } else {
        updateCounter = 0;
    }

    const now = Date.now() / 1000;

    // If object is free falling update only the current trail 
    let currentHistory = trails.current.history
    let currentStyle = trails.current.style
    if (obj.userData.isFreeFalling && trails.current && currentHistory) {
        currentHistory.push({
            position: obj.position.clone(),
            time: now
        });

        while (currentHistory.length > 0 && now - currentHistory[0].time > LIFETIME) {
            currentHistory.shift();
        }

        if (currentHistory.length > MAX_POINTS) {
            currentHistory.splice(0, currentHistory.length - MAX_POINTS);
        }

        if (currentStyle === 'TRAIL_STYLE_WITH_SINGLE_LINES' || currentStyle === 'TRAIL_STYLE_WITH_THICK_LINES') {
            updateTrailLineGeometry(trails.current);
        } else if (trails.current.style === 'TRAIL_STYLE_WITH_VERTICAL_BARS') {
            if (stanceCounter < UPDATES_NBR_BETWEEN_BARS) {
                stanceCounter++;
            } else {
                if (currentHistory.length > 1) {
                    stanceCounter = 0;
                    const newBar = createNewTrailBar(
                        currentHistory[currentHistory.length - 1].position,
                        currentHistory[currentHistory.length - 2].position,
                        scaleFromKm(VERTICAL_BAR_THICKNESS), scaleFromKm(VERTICAL_BAR_FIXED_HEIGHT), true);
                    scene.add(newBar);
                }
            }
            console.log("stace coutner: " + stanceCounter)
            stanceCounter++;
        }

        console.log("Trail has been updated with " + currentHistory.length + " points and style is " + currentStyle);
    }
}

function createNewTrailBar(top1, top2, thickness, height, useProjection = false) {
    const v = top2.clone().sub(top1);

    let perp = v.clone().cross(new THREE.Vector3(0, 1, 0));
    if (perp.lengthSq() < 0.0001) {
        perp = v.clone().cross(new THREE.Vector3(1, 0, 0));
    }
    perp.normalize().multiplyScalar(thickness);

    const t0 = top1.clone();                // front-left
    const t1 = top2.clone();                // front-right
    const t2 = top2.clone().add(perp);      // back-right
    const t3 = top1.clone().add(perp);      // back-left

    let b0, b1, b2, b3;

    if (useProjection) {
        b0 = t0.clone().normalize().multiplyScalar(EARTH_RADIUS_SCALED);
        b1 = t1.clone().normalize().multiplyScalar(EARTH_RADIUS_SCALED);
        b2 = t2.clone().normalize().multiplyScalar(EARTH_RADIUS_SCALED);
        b3 = t3.clone().normalize().multiplyScalar(EARTH_RADIUS_SCALED);
    } else {
        const down = new THREE.Vector3(0, -height, 0);
        b0 = t0.clone().add(down);
        b1 = t1.clone().add(down);
        b2 = t2.clone().add(down);
        b3 = t3.clone().add(down);
    }

    const vertices = [b0, b1, b2, b3, t0, t1, t2, t3];

    const positions = [];
    vertices.forEach(v => positions.push(v.x, v.y, v.z));

    const indices = [
        0, 1, 2, 0, 2, 3,     // bottom
        5, 6, 7, 5, 7, 4,     // top
        1, 5, 4, 1, 4, 0,     // front
        3, 7, 6, 3, 6, 2,     // back
        2, 6, 5, 2, 5, 1,     // right
        0, 4, 7, 0, 7, 3      // left
    ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.45,
        metalness: 0.2,
        roughness: 0.7,
        side: THREE.DoubleSide
    });

    return new THREE.Mesh(geometry, material);
}

function updateTrailLineGeometry(trail) {
    const style = trail.style;
    const history = trail.history;
    const count = history.length;

    if (count < 2) return;

    const flat = new Float32Array(count * 3);
    history.forEach((entry, i) => {
        flat[i * 3] = entry.position.x;
        flat[i * 3 + 1] = entry.position.y;
        flat[i * 3 + 2] = entry.position.z;
    });
    let geometry = trail.model.geometry;
    if (style === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
        geometry.attributes.position.array.set(flat);
        geometry.setDrawRange(0, count);
        geometry.attributes.position.needsUpdate = true;
    }
    else if (style === 'TRAIL_STYLE_WITH_THICK_LINES') {
        geometry.setPositions(flat);
        geometry._maxInstanceCount = undefined;
        geometry.instanceCount = count - 1;
        trail.model.computeLineDistances();
        geometry.attributes.position.needsUpdate = true;
        ['instanceStart', 'instanceEnd', 'instanceDistanceStart', 'instanceDistanceEnd'].forEach(attr => {
            if (geometry.attributes[attr]) {
                geometry.attributes[attr].needsUpdate = true;
            }
        });
    }
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