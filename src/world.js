import * as THREE from 'three';
import { Entity, ENTITY_TYPES } from './entity.js';
import { refreshEntitySelect } from './controls/interface.js';
import { refreshCameraTargets } from './controls/camera.js';

class World {
  constructor() {
    this.physicalEntities = new Set();
    this.entitiesByName = new Map();
    // this.isPaused = false;
    // this.timeScale = 1.0;
  }

  addEntity(entity) {
    if (!(entity instanceof Entity)) {
      throw new Error(`Unable to add entity, expected Entity, got ${typeof entity}`);
    }

    if (this.entitiesByName.has(entity.name)) {
      throw new Error(`Entity name conflict: ${entity.name} already exists`);
    }

    this.entitiesByName.set(entity.name, entity);
    this.physicalEntities.add(entity);

    refreshEntitySelect();
    refreshCameraTargets();

    return true;
  }

  getEntityByName(name) {
    return this.entitiesByName.get(name);
  }

  getPhysicalEntities() {
    return this.physicalEntities;
  }

  getEntitiesByType(type) {
    const result = [];
    for (const entity of this.entitiesByName.values()) {
      if (entity.type === type) result.push(entity);
    }
    return result;
  }

  resetAllPhysicalEntities() {
    for (const entity of this.physicalEntities) {
      entity.reset();
    }
  }

  // init() {
  //   // Moon
  //   const moonMesh = createMoonMesh(); 
  //   const moon = new Entity(
  //     ENTITY_TYPES.MOON,
  //     'Moon',
  //     moonMesh,
  //     {
  //       mass: 7.342e22,
  //       description: 'Lune naturelle',
  //       initialPosition: new THREE.Vector3(384_400_000, 0, 0),
  //       initialVelocity: new THREE.Vector3(0, 0, 1022),
  //       isFreeFalling: true
  //     }
  //   );
  //   this.addEntity(moon);
  //   return this;
  // }
  //
  // pause() { this.isPaused = true; }
  // resume() { this.isPaused = false; }
  // setTimeScale(scale) { this.timeScale = Math.max(0.1, scale); }
}

const world = new World();
export default world;

