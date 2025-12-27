import * as THREE from 'three';
import { EARTH_RADIUS_SCALED, scaleFromKm } from '../constants.js';
import { camera } from './scene.js';

export const ATMOSPHERE_REGULAR_HEIGHT_KM = 0;
export let atmosphereHeightKm = ATMOSPHERE_REGULAR_HEIGHT_KM;
export let atmosphereDensityFactor = 1.0;

export let atmosphereMesh = null;

export function createAtmosphere() {
  if (atmosphereMesh) {
    atmosphereMesh.geometry?.dispose();
    atmosphereMesh.material?.dispose();
    atmosphereMesh = null;
  }

  const radius = EARTH_RADIUS_SCALED + scaleFromKm(atmosphereHeightKm);

  const geometry = new THREE.SphereGeometry(radius, 64, 48);

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x88ddff), 
    transparent: true,
    opacity: Math.min(0.8, Math.max(0.05, atmosphereDensityFactor * 0.4)),
    side: THREE.BackSide,           
    depthWrite: false,
    blending: THREE.NormalBlending
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
  atmosphereDensityFactor = Math.max(0.05, Math.min(2.0, newDensity));

  if (atmosphereMesh?.material) {
    atmosphereMesh.material.opacity = Math.min(0.8, Math.max(0.05, atmosphereDensityFactor * 0.4));
    atmosphereMesh.material.needsUpdate = true;
  }
}

export function updateAtmosphere() {
  // nothing for now
}