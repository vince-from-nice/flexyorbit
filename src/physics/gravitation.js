import * as THREE from 'three';

import { GLOBAL_SCALE, EARTH_RADIUS } from '../constants.js';

export const G_SURFACE = 9.81e-3  // km/s²

export function getGravitationalAcceleration(position) {
  const r = position.length() * GLOBAL_SCALE;
  if (r < 0.1) return new THREE.Vector3();

  // a = G × M / r² but a = g₀ × (R / r)² is more easy
  const magnitude = G_SURFACE * (EARTH_RADIUS * EARTH_RADIUS) / (r * r);

  const direction = position.clone().normalize().negate();

  return direction.multiplyScalar(magnitude / GLOBAL_SCALE);
}
