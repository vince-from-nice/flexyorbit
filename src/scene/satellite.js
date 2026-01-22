import * as THREE from 'three';
import { ENTITY_TYPES, Entity } from '../entity.js';
import { EARTH_RADIUS, EARTH_RADIUS_KM, GLOBAL_SCALE, GM_EARTH, scaleFromKm, scaleFromMeter } from '../constants.js';
import { scene } from './scene.js';

export function createSatelliteMesh() {
  const group = new THREE.Group();
  group.scale.setScalar(10000); // Need to be seen from the space

  // Central cylindrical body
  const bodyGeometry = new THREE.CylinderGeometry(scaleFromMeter(1), scaleFromMeter(1), scaleFromMeter(6), 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.7,
    roughness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  group.add(body);

  // Solar panels
  const panelGeometry = new THREE.BoxGeometry(scaleFromMeter(10), scaleFromMeter(5), scaleFromMeter(0.1));
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x112244,
    metalness: 1.0,
    roughness: 0.05,
    emissive: 0x224488,
    emissiveIntensity: 0.5,
  });
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.set(scaleFromMeter(-8), 0, 0);
  leftPanel.castShadow = true;
  group.add(leftPanel);
  const rightPanel = leftPanel.clone();
  rightPanel.position.set(scaleFromMeter(8), 0, 0);
  group.add(rightPanel);

  // Grid on both sides of each panel
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
  function addGridToPanel(panel) {
    const gFront = new THREE.Group();
    const gBack = new THREE.Group();
    const cs = 1.0;  
    const halfW = 5; 
    const halfH = 2.5;
    for (let y = -halfH + cs / 2; y <= halfH - cs / 2; y += cs) {
      for (let x = -halfW + cs / 2; x <= halfW - cs / 2; x += cs) {
        const p = [
          new THREE.Vector3(x - cs / 2, y - cs / 2, 0.06),
          new THREE.Vector3(x + cs / 2, y - cs / 2, 0.06),
          new THREE.Vector3(x + cs / 2, y + cs / 2, 0.06),
          new THREE.Vector3(x - cs / 2, y + cs / 2, 0.06),
          new THREE.Vector3(x - cs / 2, y - cs / 2, 0.06)
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(p);
        const lf = new THREE.Line(geo, gridMaterial);
        const lb = lf.clone();
        lb.position.z = -0.12;
        gFront.add(lf);
        gBack.add(lb);
      }
    }
    gFront.scale.setScalar(scaleFromMeter(1));
    gBack.scale.setScalar(scaleFromMeter(1));
    panel.add(gFront);
    panel.add(gBack);
  }
  addGridToPanel(leftPanel);
  addGridToPanel(rightPanel);

  // Arms material
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.8,
    roughness: 0.3,
  });
  function createArm(p1, p2) {
    const dir = p2.clone().sub(p1);
    const length = dir.length();
    const armGeo = new THREE.CylinderGeometry(scaleFromMeter(0.1), scaleFromMeter(0.1), length, 8);
    const arm = new THREE.Mesh(armGeo, armMaterial);
    arm.position.copy(p1.clone().add(dir.multiplyScalar(0.5)));
    arm.lookAt(p2);
    arm.rotateX(Math.PI / 2); // Better cylinder alignment
    return arm;
  }

  // Left panel: single attachment on body → spreads to inner top/bottom corners of panel
  const leftAttach = new THREE.Vector3(scaleFromMeter(-1), 0, 0);
  const leftInnerTop = new THREE.Vector3(scaleFromMeter(-3), scaleFromMeter(2.4), 0);
  const leftInnerBottom = new THREE.Vector3(scaleFromMeter(-3), scaleFromMeter(-2.4), 0);
  group.add(createArm(leftAttach, leftInnerTop));
  group.add(createArm(leftAttach, leftInnerBottom));

  // Right panel
  const rightAttach = new THREE.Vector3(scaleFromMeter(1), 0, 0);
  const rightInnerTop = new THREE.Vector3(scaleFromMeter(3), scaleFromMeter(2.4), 0);
  const rightInnerBottom = new THREE.Vector3(scaleFromMeter(3), scaleFromMeter(-2.4), 0);
  group.add(createArm(rightAttach, rightInnerTop));
  group.add(createArm(rightAttach, rightInnerBottom));

  // Lights
  const centralLight = new THREE.PointLight(0xffffff, 0.02, 0);
  centralLight.position.set(0, 0, 0);
  group.add(centralLight);
  const frontLight = new THREE.PointLight(0xffffff, 0.03, 0);
  frontLight.position.set(0, 0, scaleFromMeter(3.5));
  group.add(frontLight);
  const backLight = new THREE.PointLight(0xffffff, 0.03, 0);
  backLight.position.set(0, 0, scaleFromMeter(-3.5));
  group.add(backLight);
  const sideLightLeft = new THREE.PointLight(0xffffff, 0.02, 0);
  sideLightLeft.position.set(scaleFromMeter(-8), 0, 0);
  group.add(sideLightLeft);
  const sideLightRight = sideLightLeft.clone();
  sideLightRight.position.set(scaleFromMeter(8), 0, 0);
  group.add(sideLightRight);

  return group;
}
