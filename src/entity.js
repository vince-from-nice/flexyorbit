import * as THREE from 'three';
import { Vectors } from './scene/vectors.js';
import { Trail } from './scene/trails.js';

export const ENTITY_TYPES = {
  CANNONBALL: 'Cannonball',
  SATELLITE: 'Satellite',
  SPACESHIP: 'Spaceshipt',
  ASTEROID: 'Asteroid',
  MOON: 'Moon'
};

export class Entity {

  constructor(type, name, body, options) {
    this.type = type;

    this.name = name;

    this.description = options?.description || '';

    this.body = body;

    this.mass = options?.mass || 1;

    this.dragCoefficient = options?.dragCoefficient || 0.0004;

    this.isFreeFalling = options?.isFreeFalling || false;

    this.thrusting = false;

    this.thrustPower = 0.5;

    this.velocity = options?.velocity || new THREE.Vector3();

    this.accelerations = {
      total: new THREE.Vector3(),
      gravity: new THREE.Vector3(),
      friction: new THREE.Vector3(),
      engine: new THREE.Vector3()
    };

    this.vectors = new Vectors();
    // this.showVelocity = options?.showVelocity || false;
    // this.showAcceleration = options?.showAcceleration || false;

    this.trail = options?.trail || new Trail();
  }

  getBoundingBox() {
    const box = new THREE.Box3();
    box.setFromObject(this.body);
    return box;
  }

  reset() {
    this.body.position.copy(this.initialPosition);
    this.velocity.copy(this.initialVelocity);
    this.isFreeFalling = false;
    if (this.trail) {
      // Logic to reset or remove trail
    }
  }
}