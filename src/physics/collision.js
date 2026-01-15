import * as THREE from 'three';

import { EARTH_RADIUS, GLOBAL_SCALE } from '../constants.js';

import { scene } from '../scene/scene.js';
import { earth } from '../scene/earth.js';

export const COLLISION_THRESHOLD_SCALED = 1 / GLOBAL_SCALE; // km scaled

export function checkCollisionAndHandle(obj) {
  const worldPos = new THREE.Vector3();
  obj.body.getWorldPosition(worldPos);

  const distanceToCenter = worldPos.length();

  if (distanceToCenter <= EARTH_RADIUS + COLLISION_THRESHOLD_SCALED) {

    obj.isFreeFalling = false;
    obj.velocity.set(0, 0, 0);
    obj.accelerations.friction.set(0, 0, 0);

    // World position
    const surfaceWorldPos = new THREE.Vector3()
      .copy(obj.body.getWorldPosition(new THREE.Vector3()))
      .normalize()
      .multiplyScalar(EARTH_RADIUS + COLLISION_THRESHOLD_SCALED);

    // Changing parent after world position fetching
    if (obj.body.parent !== earth) {
      scene.remove(obj);
      earth.add(obj.body);
    }

    // Explicit conversion from world to earth
    earth.worldToLocal(surfaceWorldPos);

    obj.body.position.copy(surfaceWorldPos);

    // Change body color
    if (obj.body instanceof THREE.Group) {
      obj.body.children.forEach(child => {
        if (child.material) {
          child.material.color.set(0x1a1a1a);
          child.material.emissive.set(0x000000);
        }
      })
    } else {
      obj.body.material.color.set(0x1a1a1a);
      obj.body.material.emissive.set(0x000000);
    }

    console.log(obj.name + " has impacted !");

    return true;
  }

  return false;
}