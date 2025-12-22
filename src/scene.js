import * as THREE from 'three';

export let scene, camera, renderer, earth, cannonGroup, axesGroup;

export const EARTH_RADIUS = 6371; // the unit is the kilometer

export let cannonParams = {
  lat: 43.53,
  lon: 6.89,
  altitude: 100,     // km
  azimuth: 0,
  elevation: 45,
  speed: 7.9         // km/s
};

export function createScene(container) {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, EARTH_RADIUS * 30);
  camera.position.set(EARTH_RADIUS * 1, EARTH_RADIUS * 1, EARTH_RADIUS * 1);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.logarithmicDepthBuffer = true; // always usefull even the unit is km ?
  container.appendChild(renderer.domElement);
  logRendererInfos();

  createAxis();
  createLighting();
  createEarth();
  createCannon();

  earth.add(cannonGroup);

  scene.add(axesGroup);

  updateCannonWithParams();
}

function logRendererInfos() {
  console.log("Renderer informations:")
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension('RENDERER');
  if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      console.log('\tGPU Vendor:', vendor);
      console.log('\tGPU Renderer (driver):', gpuRenderer);
  } else {
      console.log('\tGPU Vendor (masked):', gl.getParameter(gl.VENDOR));
      console.log('\tGPU Renderer (masked):', gl.getParameter(gl.RENDERER));
  }
  console.log('\tWebGL Version:', gl.getParameter(gl.VERSION));
  console.log('\tShading Language Version:', gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
  console.log('\tMax Anisotropy:', renderer.capabilities.getMaxAnisotropy());
  console.log('\tPrecision (highp float support in fragment shaders):', renderer.capabilities.precision);
  console.log('\tMax Vertex Uniform Vectors:', gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
  console.log('\tMax Fragment Uniform Vectors:', gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
  console.log('\tMax Varying Vectors:', gl.getParameter(gl.MAX_VARYING_VECTORS));
  // console.log('\tRenderer capabilities:', renderer.capabilities);
  // That info is very relevant because of the big size of the Earth texture
  console.log('\tMax texture size:', renderer.capabilities.maxTextureSize);  
}

function createAxis() {
  const AXIS_LENGTH = 10000;
  const origin = new THREE.Vector3(0, 0, 0);
  const headLength = AXIS_LENGTH * 0.1;
  const headWidth = headLength * 0.5;

  axesGroup = new THREE.Group();

  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, AXIS_LENGTH, 0xff0000, headLength, headWidth));
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, AXIS_LENGTH, 0x00ff00, headLength, headWidth));
  axesGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, AXIS_LENGTH, 0x0000ff, headLength, headWidth));
}

function createLighting() {
  scene.add(new THREE.AmbientLight(0x404040, 0.6));

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
  sunLight.position.set(EARTH_RADIUS * 50, EARTH_RADIUS * 20, EARTH_RADIUS * 30);
  scene.add(sunLight);
}

function createEarth() {
  const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);

  const textureLoader = new THREE.TextureLoader();
  const bumpTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png')  
  const specularTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png');

  const material = new THREE.MeshStandardMaterial({
    //map: earthTexture,
    // bumpMap: bumpTexture,
    // bumpScale: 0.05,
    // specularMap: specularTexture,
    // specular: new THREE.Color(0x333333),
    // shininess: 5,
    // Pour gérer le z-fighting (soucis de z-buffer)
    side: THREE.FrontSide,
    depthWrite: true,
    depthTest: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,   // Valeur négative = recule la Terre en profondeur
    // polygonOffsetUnits: -1     // Ajuste selon besoin (souvent -1 ou -2 suffit)
  });

  earth = new THREE.Mesh(geometry, material);

  setEarthTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  
  scene.add(earth);
}

export function setEarthTexture(url) {
  const loader = new THREE.TextureLoader();
  loader.load(url, (newTexture) => {
    newTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    newTexture.minFilter = THREE.LinearMipMapLinearFilter;
    earth.material.map = newTexture;
    earth.material.needsUpdate = true;
  });
}

function createCannon() {
  cannonGroup = new THREE.Group();
  const scaleFactor = 10;

  // Base
  const baseGeometry = new THREE.BoxGeometry(20 * scaleFactor, 2 * scaleFactor, 20 * scaleFactor);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.7,
    roughness: 0.3,
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = 1 * scaleFactor;
  cannonGroup.add(base);

  // Tube
  const tubeLength = 30 * scaleFactor;
  const tubeGeometry = new THREE.CylinderGeometry(2 * scaleFactor, 2.5 * scaleFactor, tubeLength, 32);
  const tubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x777777,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x002255,
    emissiveIntensity: 0.15
  });
  const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
  tube.rotation.x = Math.PI / 2; // Pointe le long de +Z (au lieu de Y)
  tube.position.set(0, 0, tubeLength / 2); // Centré sur le pivot, arrière à 0, avant à tubeLength

  // Group for the elevation
  const elevationGroup = new THREE.Group();
  elevationGroup.add(tube);
  elevationGroup.position.set(0, 4 * scaleFactor, 0); // Hauteur au-dessus de la base
  cannonGroup.add(elevationGroup);

  // Light on the tube
  const muzzleLight = new THREE.PointLight(0x00aaff, 3, 40 * scaleFactor);
  muzzleLight.position.set(0, 0, tubeLength); // À l'extrémité avant
  elevationGroup.add(muzzleLight);

  // References
  cannonGroup.userData.elevationGroup = elevationGroup;
  cannonGroup.userData.tube = tube;

  scene.add(cannonGroup);
}

export function updateCannonWithParams() {
  const lat = cannonParams.lat;
  const lon = cannonParams.lon;
  const altitude = cannonParams.altitude || 0; // in kilometers
  const azimuth = cannonParams.azimuth;        // in degrees, 0 = nord local
  const elevation = cannonParams.elevation;    // in degrees, 0 = horizontal, 90 = zenith

  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const azimuthRad = azimuth * Math.PI / 180;
  const elevationRad = elevation * Math.PI / 180;

  const r = EARTH_RADIUS + altitude;

  // Compute and set the new position of the cannon group
  const phi = Math.PI / 2 - latRad; 
  const theta = -lonRad; // negative to match with the Earth texture
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  cannonGroup.position.set(x, y, z);

  // Compute and set the new orientation of the cannon group
  const up = new THREE.Vector3(x, y, z).normalize();
  const north = new THREE.Vector3(
    -Math.cos(phi) * Math.cos(theta),
    Math.sin(phi),
    -Math.cos(phi) * Math.sin(theta)
  );
  if (north.lengthSq() < 0.001) {
    north.set(0, 1, 0);
  } else {
    north.normalize();
  }
  const east = new THREE.Vector3().crossVectors(up, north).normalize();
  const horizontalDir = new THREE.Vector3()
    .addScaledVector(north, Math.cos(azimuthRad))
    .addScaledVector(east, -Math.sin(azimuthRad)) // negative sinus to have clockwise direction from the north
    .normalize();
  const right = new THREE.Vector3().crossVectors(up, horizontalDir).normalize();
  const matrix = new THREE.Matrix4().makeBasis(right, up, horizontalDir);
  cannonGroup.quaternion.setFromRotationMatrix(matrix);

  // Set the new orientation of the sub group (for the tube elevation)
  const elevationGroup = cannonGroup.userData.elevationGroup;
  elevationGroup.rotation.set(0, 0, 0);
  elevationGroup.rotateX(-elevationRad);

  // Logs the new values
  console.log('Cannon has been updated with: lat=' + lat.toFixed(2) + '° lon=' + lon.toFixed(2) + '° altitude=' + altitude.toFixed(0) + 'km azimuth=' + azimuth + '° elevation=' + elevation + '°');
  console.log("\tCannonGroup position: x=" + cannonGroup.position.x.toFixed(0) + " y=" + cannonGroup.position.y.toFixed(0) + " z=" + cannonGroup.position.z.toFixed(0));
  console.log("\tCannonGroup orientation: up=<" + cannonGroup.up.x.toFixed(3) + " " + cannonGroup.up.y.toFixed(3) + " " + cannonGroup.up.z.toFixed(3) + "> horizon=<" + horizontalDir.x.toFixed(3) + " " + horizontalDir.y.toFixed(3) + " " + horizontalDir.z.toFixed(3) + ">");
}