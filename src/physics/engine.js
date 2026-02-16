import * as THREE from 'three';
import { ENTITY_TYPES } from "../entity.js";

export function getEngineAcceleration(obj) {
  if (obj.thrustDirection !== 0 && obj.thrustPower > 0) {
    let forward;
    // For spaceship the thrust base direction is defined by the object orientation
    if (obj.type === ENTITY_TYPES.SPACESHIP) {
      forward = new THREE.Vector3(0, 0, 1).applyQuaternion(obj.body.quaternion);
    } 
    // For non spaceship the thrust base direction is defined by the current velocity (ie. tangential thrust)
    else {
      forward = obj.velocity.clone().normalize();
    }
    return forward.multiplyScalar(obj.thrustPower * 0.0001 * obj.thrustDirection);
  }
  return new THREE.Vector3(0, 0, 0);
}
