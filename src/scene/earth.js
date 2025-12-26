import * as THREE from 'three';
import { EARTH_RADIUS_SCALED } from '../constants.js';
import { scene, renderer } from './scene.js';

export let earth;

export const earthTextures = [
    { value: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', label: 'NASA Blue Marble (4K)' },
    { value: 'assets/earth/bluemarble-5k.jpg', label: 'NASA Blue Marble (5K)' },
    { value: 'assets/earth/bluemarble-16k.jpg', label: 'NASA Blue Marble (16K)' },
    { value: 'assets/earth/solarsystemscope-8k.jpg', label: 'Solar System Scope (8K)' },
];

export function createEarth() {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS_SCALED, 64, 64);
    //const geometry = new THREE.BoxGeometry(EARTH_RADIUS, EARTH_RADIUS, EARTH_RADIUS);

    // const textureLoader = new THREE.TextureLoader();
    // const bumpTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png')
    // const specularTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png');

    const material = new THREE.MeshStandardMaterial({
        //map: earthTexture,
        // bumpMap: bumpTexture,
        // bumpScale: 0.05,
        // specularMap: specularTexture,
        // specular: new THREE.Color(0x333333),
        // shininess: 5,
        // Pour gérer le z-fighting (soucis de z-buffer)
        side: THREE.FrontSide,
        depthWrite: true,
        depthTest: true,
        // polygonOffset: true,
        // polygonOffsetFactor: -1,   // Valeur négative = recule la Terre en profondeur
        // polygonOffsetUnits: -1     // Ajuste selon besoin (souvent -1 ou -2 suffit)
    });

    earth = new THREE.Mesh(geometry, material);

    earth.receiveShadow = true;

    setEarthTexture('assets/earth/bluemarble-5k.jpg');

    scene.add(earth);
}

export function setEarthTexture(url) {
    const loader = new THREE.TextureLoader();
    loader.load(url, (newTexture) => {
        newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        newTexture.minFilter = THREE.LinearMipMapLinearFilter;
        earth.material.map = newTexture;
        earth.material.needsUpdate = true;
    });
}