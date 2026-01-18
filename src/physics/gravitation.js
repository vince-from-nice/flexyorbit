import * as THREE from 'three';

import { EARTH_RADIUS, scaleFromMeter } from '../constants.js';

import { MOON_RADIUS } from '../scene/moon.js';

import world from '../world.js';

export const G_EARTH_SURFACE = scaleFromMeter(9.81);

export const G_MOON_SURFACE = scaleFromMeter(1.625);


export function getGravitationalAcceleration(entity) {
  const accel = new THREE.Vector3();
  const position = entity.body.position;

  // Earth gravity 
  const rEarth = position.length();
  if (rEarth > 0.01) {
    // Newton said a = G × M / r² but a = g₀ × (R / r)² is more easy
    const magnitude = G_EARTH_SURFACE * (EARTH_RADIUS * EARTH_RADIUS) / (rEarth * rEarth);
    const direction = position.clone().normalize().negate();
    accel.add(direction.multiplyScalar(magnitude));
  }

  // Moon gravity
  const moon = world.getEntityByName('Moon');
  if (moon && moon !== entity) {
    const diff = moon.body.position.clone().sub(position);
    const rMoon = diff.length();
    if (rMoon > 0.01) {
      const magnitude = G_MOON_SURFACE * (MOON_RADIUS * MOON_RADIUS) / (rMoon * rMoon);
      const direction = diff.normalize();
      accel.add(direction.multiplyScalar(magnitude));
    }
  }

  return accel;
}