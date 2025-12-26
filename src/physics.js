import * as THREE from 'three';
import { EARTH_RADIUS_SCALED, GLOBAL_SCALE } from './constants.js';
import { scene } from './scene/scene.js';
import { updateTrail } from './scene/trails.js';
import { earth } from './scene/earth.js';

export const G_SURFACE = 9.81e-3 / GLOBAL_SCALE; // km/s² scaled
export const COLLISION_THRESHOLD = 1 / GLOBAL_SCALE; // km scaled

const animables = new Set();

export function registerAnimable(obj) {
  animables.add(obj);
  obj.userData.velocity = new THREE.Vector3();
  obj.userData.isInFlight = false;
}

export function animatePhysics(delta) {
  animables.forEach(obj => {
    if (obj?.userData?.isInFlight) {

      const accel = getGravitationalAcceleration(obj.position);

      // v += a * dt
      obj.userData.velocity.addScaledVector(accel, delta);

      // pos += v * dt
      obj.position.addScaledVector(obj.userData.velocity, delta);

      if (obj.userData.trails) {
        updateTrail(obj);
      }

      checkCollisionAndHandle(obj);
    }
  });
}

function getGravitationalAcceleration(position) {
  const r = position.length();
  if (r < 0.1) return new THREE.Vector3();

  // 1/r² law
  const accelMagnitude = G_SURFACE * (EARTH_RADIUS_SCALED * EARTH_RADIUS_SCALED) / (r * r);

  const direction = position.clone().normalize().negate();

  return direction.multiplyScalar(accelMagnitude);
}

function checkCollisionAndHandle(obj) {
  if (!obj?.userData?.isInFlight) return false;

  const worldPos = new THREE.Vector3();
  obj.getWorldPosition(worldPos);

  const distanceToCenter = worldPos.length();

  if (distanceToCenter <= EARTH_RADIUS_SCALED + COLLISION_THRESHOLD) {

    obj.userData.isInFlight = false;
    obj.userData.velocity.set(0, 0, 0);

    // World position
    const surfaceWorldPos = new THREE.Vector3()
      .copy(obj.getWorldPosition(new THREE.Vector3()))
      .normalize()
      .multiplyScalar(EARTH_RADIUS_SCALED + COLLISION_THRESHOLD);

    // Changing parent after world position fetching
    if (obj.parent !== earth) {
      scene.remove(obj);
      earth.add(obj);
    }

    // Explicit conversion from world to earth
    earth.worldToLocal(surfaceWorldPos);

    obj.position.copy(surfaceWorldPos);

    obj.material.color.set(0x1a1a1a);
    obj.material.emissive.set(0x000000);

    console.log("Impact !");

    return true;
  }

  return false;
}