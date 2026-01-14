import * as THREE from 'three';
import { scene } from './scene.js';

const VELOCITY_SCALE = 100;
const ACCELERATION_SCALE = 50000;

export class Vectors {
    constructor() {
        this.showVelocity = false;
        this.showAcceleration = false;
        this.showAccelerationForGravity = false;
        this.showAccelerationForDrag = false;
        this.showAccelerationForEngine = false;
        this.velocityArrow = null;
        this.accelerationArrow = null;
        this.accelerationForGravityArrow = null;
        this.accelerationForDragArrow = null;
        this.accelerationForEngineArrow = null;
    }

    update(entity) {
        const worldPos = entity.body.getWorldPosition(new THREE.Vector3());

        if (this.showVelocity) {
            if (!this.velocityArrow) {
                this.velocityArrow = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 1, 0x00ff00);
                scene.add(this.velocityArrow);
            }
            this.velocityArrow.position.copy(worldPos);
            const velNorm = entity.velocity.clone().normalize();
            this.velocityArrow.setDirection(velNorm);
            this.velocityArrow.setLength(entity.velocity.length() * VELOCITY_SCALE);
        } else if (this.velocityArrow) {
            scene.remove(this.velocityArrow);
            this.velocityArrow = null;
        }

        if (this.showAcceleration) {
            if (!this.accelerationArrow) {
                this.accelerationArrow = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 1, 0xff0000);
                scene.add(this.accelerationArrow);
            }
            this.accelerationArrow.position.copy(worldPos);
            const accNorm = entity.accelerations.total.clone().normalize();
            this.accelerationArrow.setDirection(accNorm);
            this.accelerationArrow.setLength(entity.accelerations.total.length() * ACCELERATION_SCALE);
        } else if (this.accelerationArrow) {
            scene.remove(this.accelerationArrow);
            this.accelerationArrow = null;
        }

        if (this.showAccelerationForGravity) {
            if (!this.accelerationForGravityArrow) {
                this.accelerationForGravityArrow = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 1, 0xff4400);
                scene.add(this.accelerationForGravityArrow);
            }
            this.accelerationForGravityArrow.position.copy(worldPos);
            const accNorm = entity.accelerations.gravity.clone().normalize();
            this.accelerationForGravityArrow.setDirection(accNorm);
            this.accelerationForGravityArrow.setLength(entity.accelerations.gravity.length() * ACCELERATION_SCALE);
        } else if (this.accelerationForGravityArrow) {
            scene.remove(this.accelerationForGravityArrow);
            this.accelerationForGravityArrow = null;
        }

        if (this.showAccelerationForDrag) {
            if (!this.accelerationForDragArrow) {
                this.accelerationForDragArrow = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 1, 0xff0044);
                scene.add(this.accelerationForDragArrow);
            }
            this.accelerationForDragArrow.position.copy(worldPos);
            const accNorm = entity.accelerations.friction.clone().normalize();
            this.accelerationForDragArrow.setDirection(accNorm);
            this.accelerationForDragArrow.setLength(entity.accelerations.friction.length() * ACCELERATION_SCALE);
        } else if (this.accelerationForDragArrow) {
            scene.remove(this.accelerationForDragArrow);
            this.accelerationForDragArrow = null;
        }

        if (this.showAccelerationForEngine) {
            if (!this.accelerationForEngineArrow) {
                this.accelerationForEngineArrow = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(), 1, 0xff4444);
                scene.add(this.accelerationForEngineArrow);
            }
            this.accelerationForEngineArrow.position.copy(worldPos);
            const accNorm = entity.accelerations.engine.clone().normalize();
            this.accelerationForEngineArrow.setDirection(accNorm);
            this.accelerationForEngineArrow.setLength(entity.accelerations.engine.length() * ACCELERATION_SCALE);
        } else if (this.accelerationForEngineArrow) {
            scene.remove(this.accelerationForEngineArrow);
            this.accelerationForEngineArrow = null;
        }
        
    }
}