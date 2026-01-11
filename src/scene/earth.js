import * as THREE from 'three';
import { EARTH_RADIUS } from '../constants.js';
import { scene, renderer } from './scene.js';

export let earth;

export let earthRotationDisabled = false;

const textureLoader = new THREE.TextureLoader();

export const EARTH_ANGULAR_VELOCITY = 2 * Math.PI / 86164;  // Earth rotation in rad/s (real period is ~23h56m4s)

export const EARTH_TEXTURES = [
    { value: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', label: 'NASA Blue Marble (4K)' },
    { value: 'assets/earth/bluemarble-5k.jpg', label: 'NASA Blue Marble (5K)' },
    { value: 'assets/earth/bluemarble-16k.jpg', label: 'NASA Blue Marble (16K)' },
    { value: 'assets/earth/solarsystemscope-8k.jpg', label: 'Solar System Scope (8K)' },
];

export const EARTH_BUMP_TEXTURES = [
    { value: 'assets/earth/bump-4k.jpg', label: 'Earth bump texture (4K)' },
    { value: 'assets/earth/bump-10k.jpg', label: 'Earth bump texture (10K)' },
];

export function createEarth() {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128);

    const material = new THREE.MeshStandardMaterial({
        roughness: 0.85,
        metalness: 0.05,
        // To avoid z-buffer issues
        side: THREE.FrontSide,
        depthWrite: true,
        depthTest: true,
    });

    earth = new THREE.Mesh(geometry, material);

    earth.receiveShadow = true;

    //updateEarthTexture('assets/earth/bluemarble-5k.jpg');

    updateEarthBumpTexture('assets/earth/bump-4k.jpg');

    // Strangely, the normal map in 8k is much less beautiful than bump map in 10K !!
    // textureLoader.load(
    //     'assets/earth/topology-normal-8k.png',
    //     (normalTexture) => {
    //         normalTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    //         material.normalMap = normalTexture;
    //         material.normalScale = new THREE.Vector2(6, 6);
    //         material.needsUpdate = true;
    //         console.log('Earth normal map loaded and applied');
    //     },
    //     undefined,
    //     (err) => console.warn('Cannot load Earth normal map', err)
    // );

    textureLoader.load(
        'assets/earth/ocean-4k.png',
        (oceanTexture) => {
            oceanTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            oceanTexture.encoding = THREE.sRGBEncoding;
            material.roughnessMap = oceanTexture;
            material.needsUpdate = true;
            // Insert custom roughness calculation : Thanks to https://franky-arkon-digital.medium.com/make-your-own-earth-in-three-js-8b875e281b1e
            // if the ocean map is white for the ocean, then we have to reverse the b&w values for roughness
            // We want the land to have 1.0 roughness, and the ocean to have a minimum of 0.5 roughness
            material.onBeforeCompile = function (shader) {
                shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
                    float roughnessFactor = roughness;
                    #ifdef USE_ROUGHNESSMAP
                    vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
                    // reversing the black and white values because we provide the ocean map
                    texelRoughness = vec4(1.0) - texelRoughness;
                    // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
                    roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);
                    #endif
                `);
            }
            console.log('Earth roughness map (4k) loaded and applied');
        }
    );

    scene.add(earth);
}

export function updateEarthTexture(url) {
    textureLoader.load(url, (newTexture) => {
        newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        newTexture.minFilter = THREE.LinearMipMapLinearFilter;
        earth.material.map = newTexture;
        earth.material.needsUpdate = true;
        console.log('Earth texture (' + url + ') loaded and applied');
    });
}

export function updateEarthBumpTexture(url) {
    textureLoader.load(url, (bumpTexture) => {
        bumpTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        earth.material.bumpMap = bumpTexture;
        earth.material.bumpScale = 20;
        earth.material.needsUpdate = true;
        console.log('Earth bump map (' + url + ') loaded and applied');
    });
}

export function disableEarthRotation(value) {
    earthRotationDisabled = value;
}