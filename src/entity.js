import * as THREE from 'three';


export const ENTITY_TYPES = {
  CANNONBALL: 'cannonball',
  SATELLITE: 'satellite',
  SPACESHIP: 'spaceshipt',
  ASTEROID: 'asteroid',
  MOON: 'Moon'
};

export class Entity {

  constructor(type, name, body, options) {
    this.type = type;

    this.name = name;

    this.description = options?.description || '';

    this.body = body;

    this.mass = options?.mass || 1;

    this.dragCoefficient = options?.dragCoefficient || 0.5;

    this.isFreeFalling = options?.isFreeFalling || false;

    this.velocity = options?.velocity || new THREE.Vector3();

    // this.initialPosition = options?.initialPosition || this.body.position.clone();
    // this.initialVelocity = options?.initialVelocity || this.velocity.clone();

    this.trail = options?.trail || null;

    this.accelerations = {
      total: new THREE.Vector3(),
      gravity: new THREE.Vector3(),
      friction: new THREE.Vector3(),
      engine: new THREE.Vector3()
    };
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