import * as THREE from 'three';
import { ENTITY_TYPES } from "../entity.js";

export function getEngineAcceleration(obj) {
    if (obj.type === ENTITY_TYPES.SPACESHIP && obj.thrusting && obj.thrustPower > 0) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(obj.body.quaternion);
        return forward.multiplyScalar(obj.thrustPower * 0.0008);
    } else {
        return new THREE.Vector3(0, 0, 0);
    }
}
