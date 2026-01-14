import * as THREE from 'three';
import { Entity, ENTITY_TYPES } from './entity.js';
import { createSatellite } from './scene/satellite.js';
import { Trail } from './scene/trails.js';
import { refreshEntitySelect } from './controls/interface.js';
import { refreshCameraTargets } from './controls/camera.js'

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

  init() {
    // Add the Moon
    // const moonMesh = createMoonMesh(); 
    // const moon = new Entity(
    //   ENTITY_TYPES.MOON,
    //   'Moon',
    //   moonMesh,
    //   {
    //     mass: 7.342e22,
    //     description: 'Lune naturelle',
    //     initialPosition: new THREE.Vector3(384_400_000, 0, 0),
    //     initialVelocity: new THREE.Vector3(0, 0, 1022),
    //     isFreeFalling: true
    //   }
    // );
    // this.addEntity(moon);
    // return this;

    // Add satellites
    this.addEntity(createSatellite('Satellite-1', 550, 0, 0,  45, new Trail(true, 'TRAIL_STYLE_WITH_SINGLE_LINES', '#f062e9', 20)));
    this.addEntity(createSatellite('Satellite-2', 550, 0, 0, -45, new Trail(true, 'TRAIL_STYLE_WITH_SINGLE_LINES', '#f062e9', 20)));

    // Add geostationary satellites
    this.addEntity(createSatellite('GeostationarySat-1', 35786, 0, 0,  90, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#39ac49', 50)));
    this.addEntity(createSatellite('GeostationarySat-2', 35786, 0, 0,   0, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#39ac49', 50)));
  }

  // pause() { this.isPaused = true; }
  // resume() { this.isPaused = false; }
  // setTimeScale(scale) { this.timeScale = Math.max(0.1, scale); }
}

const world = new World();
export default world;

