import * as THREE from 'three';
import { EARTH_RADIUS_SCALED, scaleFromKm } from '../constants.js';

export const ATMOSPHERE_REGULAR_HEIGHT_KM = 400; // 100 km is a realistic value
export const ATMOSPHERE_REGULAR_DENSITY_SURFACE = 1.225; // 1.225 kg/m³ is the real density at sea level
export let atmosphereHeightKm = ATMOSPHERE_REGULAR_HEIGHT_KM;
export let atmosphereDensitySurface = ATMOSPHERE_REGULAR_DENSITY_SURFACE;  

export let atmosphereMesh = null;

const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  uniform vec3 uColor;
  uniform float uIntensityMultiplier;
  uniform float uPower;

  void main() {
    // View direction in view space is (0,0,1) since we're looking along -Z
    float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), uPower);
    intensity *= uIntensityMultiplier;
    
    gl_FragColor = vec4(uColor, intensity);
  }
`;

export function createAtmosphere() {
  if (atmosphereMesh) {
    atmosphereMesh.geometry?.dispose();
    atmosphereMesh.material?.dispose();
    atmosphereMesh = null;
  }

  const radius = EARTH_RADIUS_SCALED + scaleFromKm(atmosphereHeightKm) + 0.04;

  const geometry = new THREE.SphereGeometry(radius, 128, 128);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor:               { value: new THREE.Color(0.5, 0.8, 1.0) },
      uIntensityMultiplier: { value: 1.6 },
      uPower:               { value: 2.4 }
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true
  });

  atmosphereMesh = new THREE.Mesh(geometry, material);
  atmosphereMesh.name = 'atmosphere';
  atmosphereMesh.frustumCulled = false;
  atmosphereMesh.visible = true;

  return atmosphereMesh;
}

export function setAtmosphereHeight(newHeightKm) {
  if (Math.abs(newHeightKm - atmosphereHeightKm) < 0.1) return;

  atmosphereHeightKm = newHeightKm;

  const parent = atmosphereMesh?.parent;
  if (parent) parent.remove(atmosphereMesh);

  createAtmosphere();

  if (parent) parent.add(atmosphereMesh);
}

export function setAtmosphereDensity(newDensity) {
  atmosphereDensitySurface = Math.max(0.1, Math.min(3.0, newDensity));

  if (atmosphereMesh?.material) {
    atmosphereMesh.material.uniforms.uIntensityMultiplier.value = 1.2 + atmosphereDensitySurface * 1.1;
    atmosphereMesh.material.uniforms.uPower.value = 1.8 + atmosphereDensitySurface * 1.2;
    atmosphereMesh.material.needsUpdate = true;
  }
}

export function updateAtmosphere() {
  // Can be used later for animation / time-based effects
  // For now we just keep the structure
}