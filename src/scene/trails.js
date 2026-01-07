import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { EARTH_RADIUS, scaleFromKm } from '../constants.js';
import { scene } from './scene.js';
import { cannonballMesh } from '../scene/cannon.js';

export const TRAIL_STYLES = [
    { value: 'TRAIL_STYLE_WITH_NOTHING', label: 'Nothing' },
    { value: 'TRAIL_STYLE_WITH_SINGLE_LINES', label: 'Single thin lines' },
    { value: 'TRAIL_STYLE_WITH_THICK_LINES', label: 'Thick screen-space lines' },
    { value: 'TRAIL_STYLE_WITH_VERTICAL_BARS', label: '3D vertical bars' },
];

const MAX_PAST_TRAILS = 10;
const FRAMES_NBR_BETWEEN_UPDATES = 3;
const UPDATES_NBR_BETWEEN_BARS = 4;
const VERTICAL_BAR_THICKNESS = 50 // km
const VERTICAL_BAR_FIXED_HEIGHT = 300 // km (useless when projection on Earth surface is used)
const LINE_MAX_POINTS = 10000;
const LINE_POINTS_LIFETIME = 120; // seconds

export class Trail {
    constructor(style) {
        this.style = style;
        this.history = [];
        this.updateCounter = 0
        this.stanceCounter = 0
        this.#initModel();
    }

    #initModel() {
        if (this.style === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LINE_MAX_POINTS * 3), 3));
            const material = new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.75 });
            this.model = new THREE.Line(geometry, material);
            scene.add(this.model);
        } else if (this.style === 'TRAIL_STYLE_WITH_THICK_LINES') {
            const geometry = new LineGeometry();
            const material = new LineMaterial({
                color: 0xff4444,
                linewidth: 4.0,
                transparent: true,
                opacity: 0.8,
                resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
            });
            this.model = new Line2(geometry, material);
            this.model.geometry.instanceCount = 0;
            scene.add(this.model);
        } else if (this.style === 'TRAIL_STYLE_WITH_VERTICAL_BARS') {
            this.model = []
        } else {
            this.model = null;
        }
    }

    update(obj) {
        // No need to update trail on every frame
        if (this.updateCounter < FRAMES_NBR_BETWEEN_UPDATES) {
            this.updateCounter++;
            return
        } else {
            this.updateCounter = 0;
        }

        const now = Date.now() / 1000;

        if (obj.isFreeFalling && this.history) {
            this.history.push({
                position: obj.body.position.clone(),
                time: now
            });
            if (this.style === 'TRAIL_STYLE_WITH_SINGLE_LINES' || this.style === 'TRAIL_STYLE_WITH_THICK_LINES') {
                while (this.history.length > 0 && now - this.history[0].time > LINE_POINTS_LIFETIME) {
                    this.history.shift();
                }
                if (this.history.length > LINE_MAX_POINTS) {
                    this.history.splice(0, this.history.length - LINE_MAX_POINTS);
                }
                this.#updateTrailLineGeometry();
            } else if (this.style === 'TRAIL_STYLE_WITH_VERTICAL_BARS') {
                if (this.stanceCounter >= UPDATES_NBR_BETWEEN_BARS) {
                    if (this.history.length > 1) {
                        this.stanceCounter = 0;
                        const newBar = this.#createNewTrailBar(
                            this.history[this.history.length - 1].position,
                            this.history[this.history.length - 2].position,
                            scaleFromKm(VERTICAL_BAR_THICKNESS), scaleFromKm(VERTICAL_BAR_FIXED_HEIGHT), true);
                        scene.add(newBar);
                    }
                }
                this.stanceCounter++;
            }
            console.log("Trail has been updated with " + this.history.length + " points");
        }
    }

    #createNewTrailBar(top1, top2, thickness, height, useProjection = false) {
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
            b0 = t0.clone().normalize().multiplyScalar(EARTH_RADIUS);
            b1 = t1.clone().normalize().multiplyScalar(EARTH_RADIUS);
            b2 = t2.clone().normalize().multiplyScalar(EARTH_RADIUS);
            b3 = t3.clone().normalize().multiplyScalar(EARTH_RADIUS);
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
            opacity: 0.6,
            metalness: 0.2,
            roughness: 0.7,
            side: THREE.DoubleSide
        });

        return new THREE.Mesh(geometry, material);
    }

    #updateTrailLineGeometry() {
        const count = this.history.length;

        if (this.history.length < 2) return;

        const flat = new Float32Array(count * 3);
        this.history.forEach((entry, i) => {
            flat[i * 3] = entry.position.x;
            flat[i * 3 + 1] = entry.position.y;
            flat[i * 3 + 2] = entry.position.z;
        });
        let geometry = this.model.geometry;
        if (this.style === 'TRAIL_STYLE_WITH_SINGLE_LINES') {
            geometry.attributes.position.array.set(flat);
            geometry.setDrawRange(0, this.history.length);
            geometry.attributes.position.needsUpdate = true;
        } else if (this.style === 'TRAIL_STYLE_WITH_THICK_LINES') {
            geometry.setPositions(flat);
            geometry._maxInstanceCount = undefined;
            geometry.instanceCount = this.history.length - 1;
            this.model.computeLineDistances();
            geometry.attributes.position.needsUpdate = true;
            ['instanceStart', 'instanceEnd', 'instanceDistanceStart', 'instanceDistanceEnd'].forEach(attr => {
                if (geometry.attributes[attr]) {
                    geometry.attributes[attr].needsUpdate = true;
                }
            });
        }
    }

    static updateAllThickLineResolutions(entities) {
        for (const entity of entities) {
            if (entity.trail && entity.trail.style === 'TRAIL_STYLE_WITH_THICK_LINES') {
                entity.trail.model.material.resolution.set(window.innerWidth, window.innerHeight);
            }
        }
    }

    updateTrailStyle(newStyle) {
        this.style = newStyle;
        this.#initModel();
    }
}