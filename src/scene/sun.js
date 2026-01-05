import * as THREE from 'three';
import { GLOBAL_SCALE, EARTH_RADIUS } from '../constants.js';
import { printPos } from '../utils.js';
import { scene } from './scene.js';
import { earth } from './earth.js';

const SUN_RADIUS_KM = 696000
const SUN_DISTANCE_KM = 149600000

export const SUN_RADIUS = SUN_RADIUS_KM / GLOBAL_SCALE
export const SUN_DISTANCE = SUN_DISTANCE_KM / GLOBAL_SCALE

const EARTH_OBLIQUITY = 23.44 * Math.PI / 180; 

export let sun, sunLight

export function createSun() {
    // const spriteTexture = new THREE.TextureLoader().loadAsync('assets/sun/solarsystemscope-2k.jpg');
    // const spriteMaterial = new THREE.SpriteMaterial({ map: spriteTexture, color: 0xffffff });
    // sun = new THREE.Sprite(spriteMaterial);
    // sun.scale.set(150, 150, 1);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/sun/solarsystemscope-2k.jpg', (sunTexture) => {
        sunTexture.colorSpace = THREE.SRGBColorSpace;

        const sunGeometry = new THREE.SphereGeometry(SUN_RADIUS, 64, 64);

        const sunMaterial = new THREE.MeshStandardMaterial({
            map: sunTexture,
            emissive: new THREE.Color(0xffddaa),
            emissiveIntensity: 20.5,
            emissiveMap: sunTexture,
            metalness: 0.0,
            roughness: 1.0
        });

        sun = new THREE.Mesh(sunGeometry, sunMaterial);

        sun.position.set(SUN_DISTANCE * Math.cos(EARTH_OBLIQUITY), SUN_DISTANCE * Math.sin(EARTH_OBLIQUITY), 0);
        //sun.position.set(200000, 0, 0);

        scene.add(sun);

        createSunLight();
    });
}

function createSunLight() {
        sunLight = new THREE.DirectionalLight(0xffffe5, 2.8);
        sunLight.target = earth;
        sunLight.position.copy(sun.position);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.bias = -0.0001;
        sunLight.shadow.normalBias = 0.5;
        const shadowRadius = EARTH_RADIUS * 3;
        sunLight.shadow.camera.left = -shadowRadius;
        sunLight.shadow.camera.right = shadowRadius;
        sunLight.shadow.camera.top = shadowRadius;
        sunLight.shadow.camera.bottom = -shadowRadius;
        sunLight.shadow.camera.near = SUN_DISTANCE - shadowRadius;
        sunLight.shadow.camera.far = SUN_DISTANCE + shadowRadius;
        //const shadowCameraHelper = new THREE.CameraHelper(sunLight.shadow.camera);
        //scene.add(shadowCameraHelper);
        scene.add(sunLight);
}
