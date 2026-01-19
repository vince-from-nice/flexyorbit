import * as THREE from 'three';
import { scaleFromKm } from '../constants.js';

const textureLoader = new THREE.TextureLoader();

export function createAsteroidMesh(radiusKm = 100) {

    const geometry = new THREE.SphereGeometry(scaleFromKm(radiusKm), 16, 16);

    const material = new THREE.MeshStandardMaterial({
        roughness: 0.9,
        metalness: 0.0,

        map: textureLoader.load('assets/asteroid/ground_0010_color_2k.jpg'),

        bumpMap: textureLoader.load('assets/asteroid/ground_0010_height_2k.png'),
        bumpScale: 20,

        // displacementMap: textureLoader.load('assets/asteroid/ground_0010_height_2k.png'),
        // displacementScale: 10,
        // displacementBias: -0.02,

        // aoMap: textureLoader.load('assets/asteroid/ground_0010_ao_2k.jpg'),
        // aoMapIntensity: 2.2,

        // roughnessMap: textureLoader.load('assets/asteroid/ground_0010_roughness_2k.jpg')
    });

    const asteroidMesh = new THREE.Mesh(geometry, material);

    return asteroidMesh;
}