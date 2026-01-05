import * as THREE from 'three';
import { EARTH_RADIUS, scaleFromKm } from '../constants.js';
import { SUN_DISTANCE, createSun } from './sun.js';
import { createEarth } from './earth.js';
import { createAtmosphere } from './atmosphere.js';
import { createMoon } from './moon.js';
import { createCannon } from './cannon.js';
import { createNewCannonballTrail } from './trails.js';

export let scene, camera, renderer, axesGroup;

export function createScene(container) {
  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0x404040, 0.4));
  createRenderer(container);
  createCamera();
  createAxis();
  createMilkyWay();
  createEarth();
  createAtmosphere();
  createMoon();
  createSun();
  createCannon();
  createNewCannonballTrail();
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
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  //renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  logRendererInfos();
}

function createAxis() {
  const AXIS_LENGTH = EARTH_RADIUS * 2;
  const origin = new THREE.Vector3(0, 0, 0);
  const headLength = AXIS_LENGTH * 0.1;
  const headWidth = headLength * 0.5;
  axesGroup = new THREE.Group();
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, AXIS_LENGTH, 0xff0000, headLength, headWidth));
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, AXIS_LENGTH, 0x00ff00, headLength, headWidth));
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, AXIS_LENGTH, 0x0000ff, headLength, headWidth));
  // Not display it by default
  //scene.add(axesGroup);
}

function createMilkyWay() {
  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);
  try {
    const envMap = textureLoader.load('assets/milkyway/solarsystemscope-8k.jpg');
    envMap.mapping = THREE.EquirectangularReflectionMapping;
    envMap.colorSpace = THREE.SRGBColorSpace;
    envMap.wrapS = THREE.RepeatWrapping;
    envMap.wrapT = THREE.RepeatWrapping;
    envMap.repeat.set(1, 1);
    scene.background = envMap;
    scene.environment = envMap;
  } catch (err) {
    console.error("Error loading Milwy Way :", err);
    scene.background = new THREE.Color(0x050514);
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