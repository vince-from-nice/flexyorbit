import * as THREE from 'three';
import { GLOBAL_SCALE, scaleFromKm } from '../constants.js';
import world from '../world.js';
import { ENTITY_TYPES, Entity } from '../entity.js';
import { scene, renderer } from './scene.js';
import { Trail } from './trails.js';

const MOON_RADIUS_KM = 1737
const MOON_DISTANCE_KM = 384400

export const MOON_RADIUS = MOON_RADIUS_KM / GLOBAL_SCALE
export const MOON_DISTANCE = MOON_DISTANCE_KM / GLOBAL_SCALE

const MOON_ORBITAL_SPEED_AVG_KMS = 1.022 // Moon orbital speed average is 1022 km/s

export const MOON_ANGULAR_VELOCITY = 2 * Math.PI / 2360592; // Moon rotation which is sync with its orbital period (27.32 days) so it's very low (2,66 × 10⁻⁶)

export let moonMesh

export let moonRotationDisabled = false

export const MOON_MAIN_TEXTURES = [
    { value: 'none', label: 'No texture' },
    { value: 'assets/moon/nasa-2k.jpg', label: 'NASA texture (2K)' },
    { value: 'assets/moon/nasa-4k.jpg', label: 'NASA texture (4K)' },    
];

export const MOON_BUMP_TEXTURES = [
    { value: 'none', label: 'Nothing (no relief)' },
    { value: 'assets/moon/bump-2k.jpg', label: 'NASA bump map (2K)' },
    { value: 'assets/moon/bump-5k.jpg', label: 'NASA bump map (5K)' },    
];

const textureLoader = new THREE.TextureLoader();

export function createMoon() {
    const geometry = new THREE.SphereGeometry(MOON_RADIUS, 128, 128);

    const material = new THREE.MeshStandardMaterial({
        roughness: 0.92,
        metalness: 0.01,
    });

    moonMesh = new THREE.Mesh(geometry, material);

    moonMesh.receiveShadow = true;

    // textureLoader.load(
    //     'assets/moon/nasa-4k.jpg',
    //     (texture) => {
    //         texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    //         texture.minFilter = THREE.LinearMipMapLinearFilter;
    //         moonMesh.material.map = texture;
    //         moonMesh.material.needsUpdate = true;
    //         console.log('Moon texture (4k) loaded and applied');
    //     });

    // textureLoader.load(
    //     'assets/moon/bump-5k.jpg',
    //     (bumpTexture) => {
    //         bumpTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    //         material.bumpMap = bumpTexture;
    //         material.bumpScale = 10;
    //         material.needsUpdate = true;
    //         console.log('Moon bump map (5k) loaded and applied');
    //     });

    const moonEntity = new Entity(ENTITY_TYPES.MOON, "Moon", moonMesh,  { trail: new Trail(true, "TRAIL_STYLE_WITH_SINGLE_LINES", '#74a9b2') });
    world.addEntity(moonEntity);
    scene.add(moonMesh);

    moonMesh.position.set(0, 0, -MOON_DISTANCE);
    //moon.position.set(1000, 1000, -2000);

    moonEntity.isFreeFalling = true;
    const initialDirection = new THREE.Vector3(-1, 0, 0);
    const initialSpeed = scaleFromKm(MOON_ORBITAL_SPEED_AVG_KMS)
    //const initialSpeed = scaleFromKm(0);
    moonEntity.velocity = initialDirection.multiplyScalar(initialSpeed)

    return moonMesh;
}

export function updateMoonMainTexture(value) {
    const oldTexture = moonMesh.material.map;
    moonMesh.material.map = null;
    moonMesh.material.needsUpdate = true;
    if (value !== 'none') {
        textureLoader.load(value, (newTexture) => {
            newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            newTexture.minFilter = THREE.LinearMipMapLinearFilter;
            newTexture.needsUpdate = true;
            moonMesh.material.map = newTexture;
            moonMesh.material.needsUpdate = true;
            console.log('Moon main texture (' + value + ') loaded and applied');
        });
    }
    if (oldTexture && oldTexture !== moonMesh.material.map) oldTexture.dispose();
}

export function updateMoonBumpTexture(value) {
    const oldTexture = moonMesh.material.bumpMap;
    moonMesh.material.bumpMap = null;
    moonMesh.material.needsUpdate = true;
    if (value !== 'none') {
        textureLoader.load(value, (newTexture) => {
            newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            moonMesh.material.bumpMap = newTexture;
            moonMesh.material.bumpScale = 20;
            moonMesh.material.needsUpdate = true;
            console.log('Moon bump map (' + value + ') loaded and applied');
        });
    }
    if (oldTexture && oldTexture !== moonMesh.material.bumpMap) {
        oldTexture.dispose();
    }
}

export function disableMoonRotation(value) {
    moonRotationDisabled = value;
}