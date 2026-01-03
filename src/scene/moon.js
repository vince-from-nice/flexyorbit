import * as THREE from 'three';
import { GLOBAL_SCALE, scaleFromKm } from '../constants.js';
import { renderer } from './scene.js';
import { registerAnimable } from '../physics/physics.js';

const MOON_RADIUS_KM = 1737
const MOON_DISTANCE_KM = 384400
const MOON_ORBITAL_SPEED_AVG_KMS = 1.022 // Moon orbital speed average is 1022 km/s

export const MOON_RADIUS = MOON_RADIUS_KM / GLOBAL_SCALE
export const MOON_DISTANCE = MOON_DISTANCE_KM / GLOBAL_SCALE

export let moon

let moonRotationDisabled = false

const textureLoader = new THREE.TextureLoader();

export function createMoon() {
    const geometry = new THREE.SphereGeometry(MOON_RADIUS, 128, 128);

    const material = new THREE.MeshStandardMaterial({
        roughness: 0.92,
        metalness: 0.01,
    });

    moon = new THREE.Mesh(geometry, material);

    moon.receiveShadow = true;

    textureLoader.load(
        'assets/moon/nasa-4k.jpg',
        (texture) => {
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            moon.material.map = texture;
            moon.material.needsUpdate = true;
            console.log('Moon texture loaded and applied');
        });

    textureLoader.load(
        'assets/moon/bump-5k.jpg',
        (bumpTexture) => {
            bumpTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            material.bumpMap = bumpTexture;
            material.bumpScale = 10;
            material.needsUpdate = true;
            console.log('Moon bump map loaded and applied');
        });

    moon.position.set(MOON_DISTANCE, 0, 0);
    //moon.position.set(1000, 1000, -2000);

    registerAnimable(moon);
    moon.userData.isFreeFalling = true;
    const initialDirection = new THREE.Vector3(0, 1, 0);
    const initialSpeed = scaleFromKm(MOON_ORBITAL_SPEED_AVG_KMS)
    //const initialSpeed = scaleFromKm(0);
    moon.userData.velocity.copy(initialDirection).multiplyScalar(initialSpeed);

    return moon;
}

export function disableMoonRotation(value) {
    moonRotationDisabled = value;
}