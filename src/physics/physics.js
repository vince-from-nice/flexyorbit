import world from '../world.js';
import { scaleToKm } from '../constants.js';
import { printPosInKm } from '../utils.js';
import { getGravitationalAcceleration } from './gravitation.js';
import { getDragAcceleration } from './friction.js';
import { checkCollisionAndHandle } from './collision.js';
import { updateEntityOrientation } from './orientation.js';
import { getEngineAcceleration } from './engine.js';

export function animatePhysicalEntities(deltaTime) {
  for (const obj of world.getPhysicalEntities()) {
    if (obj?.isFreeFalling) {

      obj.accelerations.gravity = getGravitationalAcceleration(obj);

      obj.accelerations.friction = getDragAcceleration(obj);

      obj.accelerations.engine = getEngineAcceleration(obj);
      
      obj.accelerations.total = obj.accelerations.gravity.clone()
        .add(obj.accelerations.friction)
        .add(obj.accelerations.engine);

      // v += a * dt
      obj.velocity.addScaledVector(obj.accelerations.total, deltaTime);

      // pos += v * dt
      obj.body.position.addScaledVector(obj.velocity, deltaTime);

      checkCollisionAndHandle(obj);

      updateEntityOrientation(obj, deltaTime);

      //console.log("Animate " + obj.name + " with velocity = " + scaleToKm(obj.velocity.length()).toFixed(3) + " km/s and position = " + printPos(obj.body.position));
    }

    if (obj.vectors) {
      obj.vectors.update(obj);
    }

    if (obj.trail) {
      obj.trail.update(obj);
    }
  };
}
