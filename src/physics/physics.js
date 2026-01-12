import world from '../world.js';
import { scaleToKm } from '../constants.js';
import { printPos } from '../utils.js';
import { getGravitationalAcceleration } from './gravitation.js';
import { getDragAcceleration } from './friction.js';
import { checkCollisionAndHandle } from './collision.js';

export function animatePhysicalEntities(delta) {
  for (const obj of world.getPhysicalEntities()) {
    if (obj?.isFreeFalling) {

      obj.accelerations.gravity = getGravitationalAcceleration(obj.body.position);

      obj.accelerations.friction = getDragAcceleration(obj);

      obj.accelerations.total = obj.accelerations.gravity.clone().add(obj.accelerations.friction);

      // v += a * dt
      obj.velocity.addScaledVector(obj.accelerations.total, delta);

      // pos += v * dt
      obj.body.position.addScaledVector(obj.velocity, delta);

      checkCollisionAndHandle(obj);

      // Update orientation 
      if (obj.name != 'moon') obj.body.lookAt(0, 0, 0); // cheat code, not torque computation !

      //console.log("Animate " + obj.name + " with velocity = " + scaleToKm(obj.velocity.length()).toFixed(3) + " km/s and position = " + printPos(obj.body.position));
    }

    if (obj.trail) {
      obj.trail.update(obj);
    }
  };
}

