import * as THREE from 'three';
import { ENTITY_TYPES, Entity } from '../entity.js';
import { EARTH_RADIUS, EARTH_RADIUS_KM, GLOBAL_SCALE, GM, scaleFromKm } from '../constants.js';
import { scene } from './scene.js';

export function createSatelliteMesh() {
  const group = new THREE.Group();
  group.scale.setScalar(10 / GLOBAL_SCALE);

  // Central cylindrical body
  const bodyGeometry = new THREE.CylinderGeometry(1, 1, 6, 32);
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
  const panelGeometry = new THREE.BoxGeometry(10, 5, 0.1);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x112244,
    metalness: 1.0,
    roughness: 0.05,
    emissive: 0x224488,
    emissiveIntensity: 0.5,
  });
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.set(-8, 0, 0);
  leftPanel.castShadow = true;
  group.add(leftPanel);

  const rightPanel = leftPanel.clone();
  rightPanel.position.set(8, 0, 0);
  group.add(rightPanel);

  // Grid on both sides of each panel
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
  function addGridToPanel(panel) {
    const gridGroupFront = new THREE.Group();
    const gridGroupBack = new THREE.Group();
    const cellSize = 0.5;
    for (let y = -2.5 + cellSize / 2; y < 2.5; y += cellSize) {
      for (let x = -5 + cellSize / 2; x < 5; x += cellSize) {
        const points = [
          new THREE.Vector3(x - cellSize / 2, y - cellSize / 2, 0.06),
          new THREE.Vector3(x + cellSize / 2, y - cellSize / 2, 0.06),
          new THREE.Vector3(x + cellSize / 2, y + cellSize / 2, 0.06),
          new THREE.Vector3(x - cellSize / 2, y + cellSize / 2, 0.06),
          new THREE.Vector3(x - cellSize / 2, y - cellSize / 2, 0.06)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const linesFront = new THREE.Line(geometry, gridMaterial);
        const linesBack = linesFront.clone();
        linesBack.position.z = -0.12;
        gridGroupFront.add(linesFront);
        gridGroupBack.add(linesBack);
      }
    }
    panel.add(gridGroupFront);
    panel.add(gridGroupBack);
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
    const armGeo = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
    const arm = new THREE.Mesh(armGeo, armMaterial);
    arm.position.copy(p1.clone().add(dir.multiplyScalar(0.5)));
    arm.lookAt(p2);
    arm.rotateX(Math.PI / 2); // Better cylinder alignment
    return arm;
  }

  // Left panel: single attachment on body → spreads to inner top/bottom corners of panel
  const leftAttach = new THREE.Vector3(-1, 0, 0);
  const leftInnerTop = new THREE.Vector3(-3, 2.4, 0);
  const leftInnerBottom = new THREE.Vector3(-3, -2.4, 0);
  group.add(createArm(leftAttach, leftInnerTop));
  group.add(createArm(leftAttach, leftInnerBottom));

  // Right panel
  const rightAttach = new THREE.Vector3(1, 0, 0);
  const rightInnerTop = new THREE.Vector3(3, 2.4, 0);
  const rightInnerBottom = new THREE.Vector3(3, -2.4, 0);
  group.add(createArm(rightAttach, rightInnerTop));
  group.add(createArm(rightAttach, rightInnerBottom));

  // Lights
  const centralLight = new THREE.PointLight(0xffffff, 1.2, 0);
  centralLight.position.set(0, 0, 0);
  group.add(centralLight);

  const frontLight = new THREE.PointLight(0xffffff, 1.5, 0);
  frontLight.position.set(0, 0, 3.5);
  group.add(frontLight);

  const backLight = new THREE.PointLight(0xffffff, 1.5, 0);
  backLight.position.set(0, 0, -3.5);
  group.add(backLight);

  const sideLightLeft = new THREE.PointLight(0xffffff, 1.0, 0);
  sideLightLeft.position.set(-8, 0, 0);
  group.add(sideLightLeft);

  const sideLightRight = sideLightLeft.clone();
  sideLightRight.position.set(8, 0, 0);
  group.add(sideLightRight);

  return group;
}

export function createSatellite(name, altitudeKm = 550, latitudeDeg = 0, longitudeDeg = 0, azimuthDeg = 90, trail = null) {
  const mesh = createSatelliteMesh();

  const radius = EARTH_RADIUS + scaleFromKm(altitudeKm);
  const latRad = THREE.MathUtils.degToRad(latitudeDeg);
  const lonRad = THREE.MathUtils.degToRad(longitudeDeg);
  const aziRad = THREE.MathUtils.degToRad(azimuthDeg);

  const pos = new THREE.Vector3(
    radius * Math.cos(latRad) * Math.cos(lonRad),
    radius * Math.sin(latRad),
    radius * Math.cos(latRad) * Math.sin(lonRad)
  );

  const radiusKm = EARTH_RADIUS_KM + altitudeKm;
  const orbitalSpeedKmS = Math.sqrt(GM / radiusKm);
  const orbitalSpeed = scaleFromKm(orbitalSpeedKmS); 

  // Direction de la vitesse: basée sur azimuth dans le référentiel local tangentiel
  // Vecteurs locaux: "nord" (méridien), "est" (parallèle)
  const posNorm = pos.clone().normalize(); // Rayon normalisé
  const northDir = new THREE.Vector3(-Math.sin(latRad) * Math.cos(lonRad), Math.cos(latRad), -Math.sin(latRad) * Math.sin(lonRad)).normalize();
  const eastDir = new THREE.Vector3(-Math.sin(lonRad), 0, Math.cos(lonRad)).normalize();

  // Direction tangentielle: combinaison de nord et est basée sur azimuth (0°=nord, 90°=est)
  const velDir = northDir.clone().multiplyScalar(Math.cos(aziRad)).add(eastDir.clone().multiplyScalar(Math.sin(aziRad))).normalize();
  const velocity = velDir.multiplyScalar(orbitalSpeed);

  const entity = new Entity(
    ENTITY_TYPES.SATELLITE,
    name,
    mesh,
    {
      mass: 500,
      dragCoefficient: 0.0002,
      isFreeFalling: true,
      velocity: velocity,
      trail: trail
    }
  );

  mesh.position.copy(pos);
  scene.add(mesh);

  return entity;
}