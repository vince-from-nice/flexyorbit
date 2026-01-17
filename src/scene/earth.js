import * as THREE from 'three';
import { EARTH_RADIUS } from '../constants.js';
import { scene, renderer } from './scene.js';

export let earth;

export const earthSettings = {
    segments: { width: 128, height: 64 },
    heightScale: 1.0,
    useDisplacement: false,
};

export let earthRotationDisabled = false;

export const EARTH_ANGULAR_VELOCITY = 2 * Math.PI / 86164;  // Earth rotation in rad/s (real period is ~23h56m4s)

export const EARTH_MAIN_TEXTURES = [
    { value: 'none', label: 'No texture' },
    { value: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', label: 'NASA Blue Marble (4K)' },
    { value: 'assets/earth/bluemarble-5k.jpg', label: 'NASA Blue Marble (5K)' },
    { value: 'assets/earth/bluemarble-16k.jpg', label: 'NASA Blue Marble (16K)' },
    { value: 'assets/earth/solarsystemscope-8k.jpg', label: 'Solar System Scope (8K)' },
];

export const EARTH_BUMP_TEXTURES = [
    { value: 'none', label: 'Nothing (no relief)' },
    { value: 'assets/earth/bump-4k.jpg', label: 'Earth bump map (4K)' },
    { value: 'assets/earth/bump-10k.jpg', label: 'Earth bump map (10K)' },
];

export const EARTH_ROUGHNESS_TEXTURES = [
    { value: 'none', label: 'Nothing (no specular light)' },
    { value: 'assets/earth/ocean-4k.png', label: 'Earth ocean map (4K)' },
];

const textureLoader = new THREE.TextureLoader();

export function createEarth() {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS, earthSettings.segments.width, earthSettings.segments.height);

    // MeshStandardMaterial costs few fps in comparison with MeshPhongMaterial
    const material = new THREE.MeshPhongMaterial({
        roughness: 0.85,
        metalness: 0.05,
        // To avoid z-buffer issues
        side: THREE.FrontSide,
        depthWrite: true,
        depthTest: true,
    });

    earth = new THREE.Mesh(geometry, material);

    earth.receiveShadow = true;

    scene.add(earth);
}

export function updateEarthSegments(width, height) {
    if (width === earthSettings.segments.width && height === earthSettings.segments.height) return;
    const oldGeometry = earth.geometry;
    earth.geometry = new THREE.SphereGeometry(
        EARTH_RADIUS,
        Math.max(32, width),
        Math.max(16, height || width / 2)
    );
    if (earth.material.displacementMap) {
        earth.material.displacementMap.needsUpdate = true;
    }
    if (earth.material.normalMap) {
        earth.material.normalMap.needsUpdate = true;
    }
    oldGeometry.dispose();
    earthSettings.segments = { width, height };
}

export function updateEarthMainTexture(value) {
    const oldTexture = earth.material.map;
    earth.material.map = null;
    earth.material.needsUpdate = true;
    if (value !== 'none') {
        textureLoader.load(value, (newTexture) => {
            newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            newTexture.minFilter = THREE.LinearMipMapLinearFilter;
            newTexture.needsUpdate = true;
            earth.material.map = newTexture;
            earth.material.needsUpdate = true;
            console.log('Earth main texture (' + value + ') loaded and applied');
        });
    }
    if (oldTexture && oldTexture !== earth.material.map) oldTexture.dispose();
}

export function updateEarthHeightTexture(value) {
    const oldTexture = earth.material.bumpMap || earth.material.displacementMap;
    earth.material.bumpMap = null;
    earth.material.displacementMap = null;
    earth.material.needsUpdate = true;
    if (value !== 'none') {
        textureLoader.load(value, newTexture => {
            newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            if (earthSettings.useDisplacement) {
                earth.material.displacementMap = newTexture;
                earth.material.displacementScale = earthSettings.heightScale;
            } else {
                earth.material.bumpMap = newTexture;
                earth.material.bumpScale = 20;
            }
            earth.material.needsUpdate = true;
        });
    }
    if (oldTexture && oldTexture !== earth.material.bumpMap && oldTexture !== earth.material.displacementMap) {
        oldTexture.dispose();
    }
}

export function updateEarthRoughnessTexture(value) {
    const oldTexture = earth.material.roughnessMap;
    earth.material.roughnessMap = null;
    earth.material.needsUpdate = true;
    if (value !== 'none') {
        textureLoader.load(value, (newTexture) => {
            newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            newTexture.encoding = THREE.sRGBEncoding;
            // earth.material.roughnessMap = newTexture;
            earth.material.specularMap = newTexture;
            earth.material.specular = new THREE.Color(0x555555);
            // Insert custom roughness calculation : Thanks to https://franky-arkon-digital.medium.com/make-your-own-earth-in-three-js-8b875e281b1e
            // if the ocean map is white for the ocean, then we have to reverse the b&w values for roughness
            // We want the land to have 1.0 roughness, and the ocean to have a minimum of 0.5 roughness
            earth.material.onBeforeCompile = function (shader) {
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
            earth.material.needsUpdate = true;
            console.log('Earth roughness map (' + value + ') loaded and applied');
        });
    }
    if (oldTexture && oldTexture !== earth.material.roughnessMap) {
        oldTexture.dispose();
    }
}

export function disableEarthRotation(value) {
    earthRotationDisabled = value;
}

