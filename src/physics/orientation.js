import * as THREE from 'three';
import { ENTITY_TYPES } from '../entity.js';

// Note that this function is more magic than real physics, but it allows for a somewhat realistic appearance than if it didn't exist.
export function updateEntityOrientation(obj, deltaTime) {

    // For satellites, their orientation remains identical to the direction of their acceleration 
    // vector (i.e., towards the center of the Earth or possibly the Moon).
    if (obj.type === ENTITY_TYPES.SATELLITE) {
        const accel = obj.accelerations.total;
        if (accel.lengthSq() > 0) {
            const targetPos = obj.body.position.clone().add(accel.clone().normalize());
            obj.body.lookAt(targetPos);
        }
    }

    // For spaceships, it's primarily the user who directly chooses the orientation (in order to direct 
    // the thrust of the engines), but we still drift its orientation in the same direction as its velocity vector.
    else if (obj.type === ENTITY_TYPES.SPACESHIP) {
        // Disable for now
        return;
        const velocity = obj.velocity;
        if (velocity.lengthSq() > 0) {
            const currentForward = new THREE.Vector3(0, 0, 1).applyQuaternion(obj.body.quaternion);
            const targetDir = velocity.clone().normalize();
            const cross = currentForward.clone().cross(targetDir);
            const errorAngle = currentForward.angleTo(targetDir);
            if (errorAngle > 0.0005) {  // avoids unnecessary oscillations when almost aligned
                const axis = cross.normalize();
                const maxTurnRate = 0.5;
                const deltaAngle = Math.min(errorAngle, maxTurnRate * deltaTime);
                const deltaQuat = new THREE.Quaternion().setFromAxisAngle(axis, deltaAngle);
                // Applique la petite rotation (premultiply pour tourner dans le bon sens habituel)
                obj.body.quaternion.premultiply(deltaQuat);
                obj.body.quaternion.normalize();  // sécurité
            }
        }
    }

    // Do nothing for now with other entity types
    else {
    }
}