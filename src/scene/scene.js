import * as THREE from 'three';
import { EARTH_RADIUS, scaleFromKm } from '../constants.js';
import { SUN_DISTANCE, createSun } from './sun.js';
import { createEarth, earth, earthRotationDisabled, EARTH_ANGULAR_VELOCITY } from './earth.js';
import { createAtmosphere } from './atmosphere.js';
import { createMoon, moonMesh, moonRotationDisabled, MOON_ANGULAR_VELOCITY } from './moon.js';
import { createCannon } from './cannon.js';

export let scene, camera, renderer, axesGroup, gridMesh;

const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);

export const MILKYWAY_TEXTURES = [
  { value: 'none', label: 'Nothing (black sky)' },
  { value: 'assets/milkyway/solarsystemscope-2k.jpg', label: 'SolarSystemScope (2K)' },
  { value: 'assets/milkyway/solarsystemscope-4k.jpg', label: 'SolarSystemScope (4K)' },
  { value: 'assets/milkyway/solarsystemscope-8k.jpg', label: 'SolarSystemScope (8K)' },
];

export function createScene(container) {
  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0x404040, 0.1));
  createRenderer(container);
  createCamera();
  createAxis();
  createMilkyWay();
  createSun();
  createEarth();
  createAtmosphere();
  createMoon();
  createCannon();
  //reateNewCannonballTrail();
}

function createCamera() {
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, scaleFromKm(10), SUN_DISTANCE * 2);
  camera.position.set(EARTH_RADIUS * 2, EARTH_RADIUS * 0, EARTH_RADIUS * 0);
}

function createRenderer(container) {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.logarithmicDepthBuffer = true; // always usefull even the unit is km ?
  renderer.shadowMap.enabled = true;
  //renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  //renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  logRendererInfos();
}

function createMilkyWay() {
  scene.background = new THREE.Color(0x050514);
  // Milky way texture is now loaded by interface init
}

export function updateMilkyWayTexture(value) {
  const oldTexture = scene.background;
  if (value === 'none') {
    scene.background = null;
    scene.environment = null;
  } else {
    textureLoader.load(value, (newTexture) => {
      newTexture.mapping = THREE.EquirectangularReflectionMapping;
      newTexture.colorSpace = THREE.SRGBColorSpace;
      newTexture.wrapS = THREE.RepeatWrapping;
      newTexture.wrapT = THREE.RepeatWrapping;
      newTexture.repeat.set(1, 1);
      scene.background = newTexture;
      scene.environment = newTexture;
      console.log('MilkyWay texture (' + value + ') loaded and applied');
    });
  }
  scene.needsUpdate = true;
  if (oldTexture && !oldTexture instanceof THREE.Color) oldTexture.dispose();
}

function createAxis() {
  const AXIS_LENGTH = EARTH_RADIUS * 3;
  const origin = new THREE.Vector3(0, 0, 0);
  const headLength = AXIS_LENGTH * 0.1;
  const headWidth = headLength * 0.5;
  axesGroup = new THREE.Group();
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, AXIS_LENGTH, 0xff0000, headLength, headWidth));
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, AXIS_LENGTH, 0x00ff00, headLength, headWidth));
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, AXIS_LENGTH, 0x0000ff, headLength, headWidth));
  //scene.add(axesGroup); // Not display it by default
}

function createGrid(size_km = 1000000, res_km = 10000, color = '#333333') {
  const size = scaleFromKm(size_km);
  const step = scaleFromKm(res_km);
  const halfSize = size / 2;
  const vertices = [];
  // Lines parallel to X-axis
  for (let y = -halfSize; y <= halfSize; y += step) {
    for (let z = -halfSize; z <= halfSize; z += step) {
      vertices.push(-halfSize, y, z);
      vertices.push(halfSize, y, z);
    }
  }
  // Lines parallel to Y-axis
  for (let x = -halfSize; x <= halfSize; x += step) {
    for (let z = -halfSize; z <= halfSize; z += step) {
      vertices.push(x, -halfSize, z);
      vertices.push(x, halfSize, z);
    }
  }
  // Lines parallel to Z-axis
  for (let x = -halfSize; x <= halfSize; x += step) {
    for (let y = -halfSize; y <= halfSize; y += step) {
      vertices.push(x, y, -halfSize);
      vertices.push(x, y, halfSize);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.LineBasicMaterial({ color: color });
  const grid = new THREE.LineSegments(geometry, material);
  grid.name = 'spaceGrid';
  return grid;
}

export function updateGrid(show, size_km, res_km) {
  if (gridMesh) {
    scene.remove(gridMesh);
    gridMesh.geometry.dispose();
    gridMesh.material.dispose();
    gridMesh = null;
  }
  if (show) {
    gridMesh = createGrid(size_km, res_km);
    scene.add(gridMesh);
  }
}

function logRendererInfos() {
  console.log('Viewport informations:');
  console.log('  window.innerWidth  :', window.innerWidth);
  console.log('  window.innerHeight :', window.innerHeight);
  console.log('  screen.width     :', screen.width);
  console.log('  screen.height     :', screen.height);
  console.log('  devicePixelRatio  :', window.devicePixelRatio);
  console.log("Renderer informations:")
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension('RENDERER');
  if (debugInfo) {
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    console.log('  GPU Vendor:', vendor);
    console.log('  GPU Renderer (driver):', gpuRenderer);
  } else {
    console.log('  GPU Vendor (masked):', gl.getParameter(gl.VENDOR));
    console.log('  GPU Renderer (masked):', gl.getParameter(gl.RENDERER));
  }
  console.log('  WebGL Version:', gl.getParameter(gl.VERSION));
  console.log('  Shading Language Version:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
  console.log('  Max Anisotropy:', renderer.capabilities.getMaxAnisotropy());
  console.log('  Precision (highp float support in fragment shaders):', renderer.capabilities.precision);
  console.log('  Max Vertex Uniform Vectors:', gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
  console.log('  Max Fragment Uniform Vectors:', gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
  console.log('  Max Varying Vectors:', gl.getParameter(gl.MAX_VARYING_VECTORS));
  // console.log('  Renderer capabilities:', renderer.capabilities);
  // That info is very relevant because of the big size of the Earth texture
  console.log('  Max texture size:', renderer.capabilities.maxTextureSize);
}

export function displayAxis(display) {
  if (display) {
    scene.add(axesGroup);
  } else {
    scene.remove(axesGroup);
  }
}

export function animateEarthAndMonth(deltaTime) {
  if (!earthRotationDisabled) {
    earth.rotation.y += EARTH_ANGULAR_VELOCITY * deltaTime;
  }
  if (!moonRotationDisabled) {
    moonMesh.rotation.y += MOON_ANGULAR_VELOCITY * deltaTime;
  }
}