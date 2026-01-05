import * as THREE from 'three';

import { GLOBAL_SCALE, EARTH_RADIUS} from '../constants.js';

export const G_SURFACE = 9.81 / 1000 / GLOBAL_SCALE // Nedd to scale the value of 9.81 m/s²

export function getGravitationalAcceleration(position) {
  const r = position.length()
  if (r < 0.01) return new THREE.Vector3();

  // Newton said a = G × M / r² but a = g₀ × (R / r)² is more easy
  const magnitude = G_SURFACE * (EARTH_RADIUS * EARTH_RADIUS) / (r * r);

  const direction = position.clone().normalize().negate();

  return direction.multiplyScalar(magnitude);
}
