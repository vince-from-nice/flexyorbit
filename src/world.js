import * as THREE from 'three';
import { EARTH_RADIUS, EARTH_RADIUS_KM, GM_EARTH, GM_MOON, scaleFromKm } from './constants.js';
import { Entity, ENTITY_TYPES } from './entity.js';
import { scene } from './scene/scene.js';
import { Trail } from './scene/trails.js';
import { createMoonMesh, MOON_RADIUS, MOON_RADIUS_KM, MOON_DISTANCE_KM } from './scene/moon.js';
import { loadISSMesh, createSatelliteMesh, loadSimpleSatelliteMesh } from './scene/satellite.js';
import { createAsteroidMesh } from './scene/asteroid.js';
import { loadLowPolySpaceshipMesh } from './scene/spaceship.js';
import { refreshEntitySelect } from './controls/ui_entity.js';
import { refreshCameraTargets, selectCameraTarget } from './controls/camera.js'
import { refreshSpaceshipSelect } from './controls/ui_spaceship.js';

class World {
  constructor() {
    this.physicalEntities = new Set();
    this.entitiesByName = new Map();
    // this.isPaused = false;
    // this.timeScale = 1.0;
  }

  async init() {
    // Add the Moon
    this.createAndAddEntity(ENTITY_TYPES.MOON, 'Moon', null, 'Earth', MOON_DISTANCE_KM, 0, 0, 90, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#74a9b2', 120));

    // Add satellites
    this.createAndAddEntity(ENTITY_TYPES.SATELLITE, 'Satellite-ISS', await loadISSMesh(), 'Earth', 420, 0, 0, +90, new Trail(true, 'TRAIL_STYLE_WITH_SINGLE_LINES', '#62c1f0', 40));
    this.createAndAddEntity(ENTITY_TYPES.SATELLITE, 'Satellite-LEO#1', await loadSimpleSatelliteMesh(), 'Earth', 550, 0, 0, +45, new Trail(true, 'TRAIL_STYLE_WITH_SINGLE_LINES', '#f062e9', 40));
    this.createAndAddEntity(ENTITY_TYPES.SATELLITE, 'Satellite-LEO#2', await loadSimpleSatelliteMesh(), 'Earth', 550, 0, 0, -45, new Trail(true, 'TRAIL_STYLE_WITH_SINGLE_LINES', '#f062e9', 40));
    this.createAndAddEntity(ENTITY_TYPES.SATELLITE, 'Satellite-GeoStat#1', await loadSimpleSatelliteMesh(), 'Earth', 35786, 0, 0, +90, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#39ac49', 100));
    this.createAndAddEntity(ENTITY_TYPES.SATELLITE, 'Satellite-GeoStat#2', null, 'Earth', 35786, 0, 0, -90, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#39ac49', 100));

    // Add asteroids
    this.createAndAddEntity(ENTITY_TYPES.ASTEROID, 'Asteroid-InLoveWithMoon', null, 'Moon', 4000, 0, 0, 30, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#5c5aad', 120));
    //this.createAndAddEntity(ENTITY_TYPES.ASTEROID, 'Asteroid-InLoveWithEarth', 'Earth', 6000, 0, 0, 30, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#5c5aad', 120));
    this.createAndAddEntity(ENTITY_TYPES.ASTEROID, 'Asteroid-LagrangeL4', null, 'Earth', MOON_DISTANCE_KM, 0, 60, 90, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#f517a0', 120));
    this.createAndAddEntity(ENTITY_TYPES.ASTEROID, 'Asteroid-Moon+30', null, 'Earth', MOON_DISTANCE_KM, 0, 30, 90, new Trail(true, 'TRAIL_STYLE_WITH_SINGLE_LINES', '#ea8644', 120));
    this.createAndAddEntity(ENTITY_TYPES.ASTEROID, 'Asteroid-LagrangeL5', null, 'Earth', MOON_DISTANCE_KM, 0, -60, 90, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#91f445', 120));
    this.createAndAddEntity(ENTITY_TYPES.ASTEROID, 'Asteroid-Moon-30', null, 'Earth', MOON_DISTANCE_KM, 0, -30, 90, new Trail(true, 'TRAIL_STYLE_WITH_SINGLE_LINES', '#39bee3', 120));

    // Add spaceships
    await this.createAndAddEntity(ENTITY_TYPES.SPACESHIP, 'Spaceship-Delta1', null, 'Earth', 5000, 0, 50, 70, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#173bbc', 120));
    await this.createAndAddEntity(ENTITY_TYPES.SPACESHIP, 'Spaceship-Delta2', null, 'Moon', 2000, 0, 0, 50, new Trail(true, 'TRAIL_STYLE_WITH_THICK_LINES', '#173bbc', 120));
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
    refreshSpaceshipSelect();

    return true;
  }

  removeEntity(entity) {
    if (!this.physicalEntities.has(entity)) return false;

    this.physicalEntities.delete(entity);
    this.entitiesByName.delete(entity.name);

    if (entity.trail) {
      entity.trail.enable(false);
      entity.trail = null;
    }

    if (entity.vectors) {
      entity.vectors.remove();
      entity.vectors = null;
    }

    if (entity.body) {
      entity.body.removeFromParent();
      entity.body.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
          else obj.material.dispose?.();
        }
      });
    }

    refreshEntitySelect();
    refreshCameraTargets();
    refreshSpaceshipSelect();

    return true;
  }

  getAllEntities() {
    return this.physicalEntities;
  }

  getEntityByName(name) {
    return this.entitiesByName.get(name);
  }

  getEntitiesByType(type) {
    const result = [];
    for (const entity of this.entitiesByName.values()) {
      if (entity.type === type) result.push(entity);
    }
    return result;
  }

  resetAllEntities() {
    for (const entity of this.physicalEntities) {
      entity.reset();
    }
  }

  async createAndAddEntity(type, name, mesh, referenceBody = 'Earth',
    altitudeKm = 550, latitudeDeg = 0, longitudeDeg = 0, azimuthDeg = 90,
    trail = null, options = {}) {

    // If not provided, create mesh according to type
    if (!mesh) {
      switch (type) {
        case ENTITY_TYPES.MOON:
          mesh = createMoonMesh();
          break;
        case ENTITY_TYPES.SATELLITE:
          mesh = createSatelliteMesh();
          break;
        case ENTITY_TYPES.ASTEROID:
          mesh = createAsteroidMesh();
          break;
        case ENTITY_TYPES.SPACESHIP:
          mesh = await loadLowPolySpaceshipMesh();
          break;
        default:
          throw new Error(`Unsupported entity type: ${type}`);
      }
    }

    // Compute initial position (ECEF style)
    const isMoon = referenceBody === 'Moon';
    const refEntity = isMoon ? this.getEntityByName('Moon') : null;
    const center = refEntity ? refEntity.body.position.clone() : new THREE.Vector3();
    const bodyRadiusKm = isMoon ? MOON_RADIUS_KM : EARTH_RADIUS_KM;
    const gm = isMoon ? GM_MOON : GM_EARTH;
    const radius = (isMoon ? MOON_RADIUS : EARTH_RADIUS) + scaleFromKm(altitudeKm);
    const latRad = THREE.MathUtils.degToRad(latitudeDeg);
    const lonRad = - THREE.MathUtils.degToRad(longitudeDeg);
    const aziRad = THREE.MathUtils.degToRad(azimuthDeg);
    const pos = new THREE.Vector3(
      radius * Math.cos(latRad) * Math.cos(lonRad),
      radius * Math.sin(latRad),
      radius * Math.cos(latRad) * Math.sin(lonRad)
    ).add(center);

    mesh.position.copy(pos);

    // Compute initial velocity
    const radiusKm = bodyRadiusKm + altitudeKm;
    const orbitalSpeed = scaleFromKm(Math.sqrt(gm / radiusKm));
    // Local tangent frame: North + East
    const northDir = new THREE.Vector3(-Math.sin(latRad) * Math.cos(lonRad),
      Math.cos(latRad), -Math.sin(latRad) * Math.sin(lonRad)).normalize();
    const eastDir = new THREE.Vector3(-Math.sin(lonRad), 0, Math.cos(lonRad)).normalize();
    // Velocity direction according to azimuth
    const velDir = northDir.clone().multiplyScalar(Math.cos(aziRad))
      .add(eastDir.clone().multiplyScalar(Math.sin(aziRad))).normalize();
    const velocity = velDir.multiplyScalar(orbitalSpeed);
    // Add reference body velocity if not Earth
    if (isMoon && refEntity) {
      velocity.add(refEntity.velocity.clone());
    }

    // Compute initial orientation (body faces velocity direction)
    if (velocity.lengthSq() > 0.0001) {
      const targetQuat = new THREE.Quaternion();
      targetQuat.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        velocity.clone().normalize()
      );
      mesh.quaternion.copy(targetQuat);
    }

    // Create the entity
    const entity = new Entity(type, name, mesh, {
      mass: options.mass ?? 1000,
      dragCoefficient: isMoon ? 0 : 0.0002,
      isFreeFalling: true,
      velocity,
      trail,
      ...options
    });

    if (type === ENTITY_TYPES.SPACESHIP) {
      entity.vectors.showVelocity = true;
    }

    scene.add(mesh);
    this.addEntity(entity);

    return entity;
  }

  // pause() { this.isPaused = true; }
  // resume() { this.isPaused = false; }
  // setTimeScale(scale) { this.timeScale = Math.max(0.1, scale); }
}

const world = new World();
export default world;

