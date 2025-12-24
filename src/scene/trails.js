import * as THREE from 'three';
import { scene } from './scene.js';
import { cannonball } from '../scene/cannon.js';

const trailMaxPoints = 1000;
const trailLifetime = 30;

export function createCannonballTrail() {
        const trailGeometry = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(trailMaxPoints * 3);
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        const trailMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        trail.userData.points = []; // Array of {pos: Vector3, time: number}
        trail.userData.currentIndex = 0;
        scene.add(trail);
        cannonball.userData.trail = trail;
}

export function updateTrail(obj) {
  const trail = obj.userData.trail;
  const now = Date.now() / 1000; // Real time for fading

  // Add new point
  trail.userData.points.push({ pos: obj.position.clone(), time: now });
  if (trail.userData.points.length > trailMaxPoints) {
    trail.userData.points.shift(); // Remove oldest if full
  }

  // Remove old points
  while (trail.userData.points.length > 0 && now - trail.userData.points[0].time > trailLifetime) {
    trail.userData.points.shift();
  }

  // Update geometry
  const positions = trail.geometry.attributes.position.array;
  trail.userData.points.forEach((p, i) => {
    positions[i * 3] = p.pos.x;
    positions[i * 3 + 1] = p.pos.y;
    positions[i * 3 + 2] = p.pos.z;
  });
  trail.geometry.setDrawRange(0, trail.userData.points.length);
  trail.geometry.attributes.position.needsUpdate = true;
}