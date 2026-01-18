import * as THREE from 'three';
import { EARTH_RADIUS, scaleFromKm } from '../constants.js';
import { scene } from '../scene/scene.js';
import { earth } from '../scene/earth.js';
import { moonMesh, MOON_RADIUS } from '../scene/moon.js';

export const COLLISION_THRESHOLD_SCALED = scaleFromKm(1);

export function checkCollisionAndHandle(obj) {
  // Skip self-collision for the Moon entity
  if (obj.name === 'Moon') return false;
  
  const worldPosition = new THREE.Vector3();
  obj.body.getWorldPosition(worldPosition);

  // Distance to Earth center (origin)
  const distEarth = worldPosition.length();
  const hitEarth = distEarth <= EARTH_RADIUS + COLLISION_THRESHOLD_SCALED;

  // Distance to Moon center
  const moonCenter = moonMesh.position; 
  const vecToMoon = moonCenter.clone().sub(worldPosition);
  const distMoon = vecToMoon.length();
  const hitMoon = distMoon <= MOON_RADIUS + COLLISION_THRESHOLD_SCALED;

  if (!hitEarth && !hitMoon) return false;

  // First hit
  const hitMoonFirst = hitMoon && (!hitEarth || distMoon < distEarth);
  const target = hitMoonFirst ? moonMesh : earth;
  const targetRadius = hitMoonFirst ? MOON_RADIUS : EARTH_RADIUS;
  const targetCenter = hitMoonFirst ? moonCenter : new THREE.Vector3();

  // Calculate the surface position of the impact (more accurate than just using the current position)
  const direction = worldPosition.clone().sub(targetCenter).normalize();
  const surfaceWorldPos = targetCenter.clone().add(
    direction.multiplyScalar(targetRadius + COLLISION_THRESHOLD_SCALED)
  );

  // Stop mouvement
  obj.isFreeFalling = false;
  obj.velocity.set(0, 0, 0);
  obj.accelerations.friction.set(0, 0, 0);

  // Reparenting
  if (obj.body.parent !== target) {
    scene.remove(obj.body);
    target.add(obj.body);
  }

  // Passage en coordonnées locales du corps cible
  target.worldToLocal(surfaceWorldPos);
  obj.body.position.copy(surfaceWorldPos);

  // Darken
  const darken = (m) => {
    if (m.material) {
      m.material.color.set(0x1a1a1a);
      if (m.material.emissive) m.material.emissive.set(0x000000);
    }
  };

  if (obj.body instanceof THREE.Group) {
    obj.body.traverse(c => c.isMesh && darken(c));
  } else if (obj.body.isMesh) {
    darken(obj.body);
  }

  console.log(`${obj.name} impacted ${hitMoonFirst ? 'Moon' : 'Earth'}!`);

  return true;
}