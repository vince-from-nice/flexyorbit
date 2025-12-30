import * as THREE from 'three';

import { getGravitationalAcceleration } from './gravitation.js';
import { getDragAcceleration } from './friction.js';
import { checkCollisionAndHandle } from './collision.js';
import { updateTrail } from '../scene/trails.js';

const animables = new Set();

export function registerAnimable(obj) {
  animables.add(obj);
  obj.userData.velocity = new THREE.Vector3();
  obj.userData.isFreeFalling = false;
}

export function animatePhysics(delta) {
  animables.forEach(obj => {
    if (obj?.userData?.isFreeFalling) {

      //console.log("Animate object with position=" + obj.position.length().toFixed(2) + " and velocity=" + obj.userData.velocity.length().toFixed(3));

      const acceleration = getGravitationalAcceleration(obj.position);

      const dragAcceleration = getDragAcceleration(obj.position, obj.userData.velocity);
      acceleration.add(dragAcceleration);

      // v += a * dt
      obj.userData.velocity.addScaledVector(acceleration, delta);

      // pos += v * dt
      obj.position.addScaledVector(obj.userData.velocity, delta);

      if (obj.userData.trails) {
        updateTrail(obj);
      }

      checkCollisionAndHandle(obj);
    }
  });
}

