import * as THREE from 'three';

import { EARTH_RADIUS_SCALED, GLOBAL_SCALE } from '../constants.js';

import { scene } from '../scene/scene.js';
import { earth } from '../scene/earth.js';

export const COLLISION_THRESHOLD_SCALED = 1 / GLOBAL_SCALE; // km scaled

export function checkCollisionAndHandle(obj) {
  if (!obj?.userData?.isFreeFalling) return false;

  const worldPos = new THREE.Vector3();
  obj.getWorldPosition(worldPos);

  const distanceToCenter = worldPos.length();

  if (distanceToCenter <= EARTH_RADIUS_SCALED + COLLISION_THRESHOLD_SCALED) {

    obj.userData.isFreeFalling = false;
    obj.userData.velocity.set(0, 0, 0);

    // World position
    const surfaceWorldPos = new THREE.Vector3()
      .copy(obj.getWorldPosition(new THREE.Vector3()))
      .normalize()
      .multiplyScalar(EARTH_RADIUS_SCALED + COLLISION_THRESHOLD_SCALED);

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