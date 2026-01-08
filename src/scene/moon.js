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

const textureLoader = new THREE.TextureLoader();

export function createMoon() {
    const geometry = new THREE.SphereGeometry(MOON_RADIUS, 128, 128);

    const material = new THREE.MeshStandardMaterial({
        roughness: 0.92,
        metalness: 0.01,
    });

    moonMesh = new THREE.Mesh(geometry, material);

    moonMesh.receiveShadow = true;

    textureLoader.load(
        'assets/moon/nasa-4k.jpg',
        (texture) => {
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            moonMesh.material.map = texture;
            moonMesh.material.needsUpdate = true;
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

    const moonEntity = new Entity(ENTITY_TYPES.MOON, "Moon", moonMesh,  { trail: new Trail(true, "TRAIL_STYLE_WITH_SINGLE_LINES") });
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

export function disableMoonRotation(value) {
    moonRotationDisabled = value;
}