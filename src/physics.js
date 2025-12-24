import * as THREE from 'three';
import { EARTH_RADIUS } from './constants.js';
import { scene, earth } from './scene.js';

const G_SURFACE = 9.81e-3; // km/s²
const COLLISION_THRESHOLD = 1; // km

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

      checkCollisionAndHandle(obj);
    }
  });
}

export function getGravitationalAcceleration(position) {
  const r = position.length();
  if (r < 0.1) return new THREE.Vector3();

  // 1/r² law
  const accelMagnitude = G_SURFACE * (EARTH_RADIUS * EARTH_RADIUS) / (r * r);

  const direction = position.clone().normalize().negate();

  return direction.multiplyScalar(accelMagnitude);
}

export function checkCollisionAndHandle(obj) {
  if (!obj?.userData?.isInFlight) return false;

  const worldPos = new THREE.Vector3();
  obj.getWorldPosition(worldPos);

  const distanceToCenter = worldPos.length();

  if (distanceToCenter <= EARTH_RADIUS + COLLISION_THRESHOLD) {

    obj.userData.isInFlight = false;
    obj.userData.velocity.set(0, 0, 0);

    // World position
    const surfaceWorldPos = new THREE.Vector3()
      .copy(obj.getWorldPosition(new THREE.Vector3()))
      .normalize()
      .multiplyScalar(EARTH_RADIUS + COLLISION_THRESHOLD);

    // Changing parent after world position fetching
    if (obj.parent !== earth) {
      scene.remove(obj);
      earth.add(obj);
    }

    // Conversion explicite monde → local à earth
    earth.worldToLocal(surfaceWorldPos);

    obj.position.copy(surfaceWorldPos);

    console.log("Impact !");

    return true;
  }

  return false;
}