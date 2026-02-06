import * as THREE from 'three';
import { EARTH_RADIUS, scaleFromKm } from '../constants.js';
import { camera, scene } from './scene.js';  // plus besoin de camera ici

export const ATMOSPHERE_REGULAR_HEIGHT_KM = 200;
export const ATMOSPHERE_REGULAR_DENSITY_SURFACE = 1.225;
export let atmosphereHeightKm = ATMOSPHERE_REGULAR_HEIGHT_KM;
export let atmosphereDensitySurface = ATMOSPHERE_REGULAR_DENSITY_SURFACE;
export let atmosphereOpacity, atmosphereParam1, atmosphereParam2;

export let atmosphereMesh = null;

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 eyeVector;

  #include <common>
  #include <logdepthbuf_pars_vertex>

  void main() {
      // modelMatrix transforms the coordinates local to the model into world space
      vec4 mvPos = modelViewMatrix * vec4( position, 1.0 );

      // normalMatrix is a matrix that is used to transform normals from object space to view space.
      vNormal = normalize( normalMatrix * normal );

      // vector pointing from camera to vertex in view space
      eyeVector = normalize(mvPos.xyz);

      gl_Position = projectionMatrix * mvPos;

      #include <logdepthbuf_vertex>
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 eyeVector;
  uniform float atmOpacity;
  uniform float atmPowFactor;
  uniform float atmMultiplier;

  #include <common>
  #include <logdepthbuf_pars_fragment>

  void main() {
      // Starting from the rim to the center at the back, dotP would increase from 0 to 1
      float dotP = dot( vNormal, eyeVector );
      // This factor is to create the effect of a realistic thickening of the atmosphere coloring
      float factor = pow(dotP, atmPowFactor) * atmMultiplier;
      // Adding in a bit of dotP to the color to make it whiter while the color intensifies
      vec3 atmColor = vec3(0.05 + dotP/4.5, 0.35 + dotP/2.5, 1.0);
      // use atmOpacity to control the overall intensity of the atmospheric color
      gl_FragColor = vec4(atmColor, atmOpacity) * factor;

      #include <logdepthbuf_fragment>
  }
`;

export function createAtmosphere() {
  if (atmosphereMesh) {
    atmosphereMesh.geometry?.dispose();
    atmosphereMesh.material?.dispose();
    atmosphereMesh = null;
  }

  const radius = EARTH_RADIUS + scaleFromKm(atmosphereHeightKm);

  const geometry = new THREE.SphereGeometry(radius, 128, 128);

  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      atmOpacity: { value: 0.5 },
      atmPowFactor: { value: 1.2 },
      atmMultiplier: { value: computeMultiplierFromDensity(atmosphereDensitySurface) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true
  });

  atmosphereMesh = new THREE.Mesh(geometry, material);
  atmosphereMesh.name = 'atmosphere';
  atmosphereMesh.frustumCulled = false;
  atmosphereMesh.visible = true;

  scene.add(atmosphereMesh);

  return atmosphereMesh;
}

export function setAtmosphereHeight(newHeightKm) {
  if (Math.abs(newHeightKm - atmosphereHeightKm) < 0.1) return;
  atmosphereHeightKm = newHeightKm;
  const parent = atmosphereMesh?.parent;
  if (parent) parent.remove(atmosphereMesh);
  createAtmosphere();
  if (parent) parent.add(atmosphereMesh);
}

export function setAtmosphereDensity(newDensity) {
  atmosphereDensitySurface = newDensity;
  if (atmosphereMesh?.material) {
    atmosphereMesh.material.uniforms.atmMultiplier.value = computeMultiplierFromDensity(newDensity);
    atmosphereMesh.material.needsUpdate = true;
  }
}

// With low "near" values for camera (eg. 100 meters) there are some bugs when the the distance with the Earth is big, no better solution than to shade it smoothly
export function updateAtmosphereVisibility() {
  if (!atmosphereMesh || !camera) return;
  const camDist = camera.position.distanceTo(new THREE.Vector3());
  const fadeStartDist = EARTH_RADIUS + scaleFromKm(70000);
  const fadeEndDist = EARTH_RADIUS + scaleFromKm(80000);
  let opacity = 0.5;
  if (camDist > fadeEndDist) {
    atmosphereMesh.visible = false;
  } else {
    atmosphereMesh.visible = true;
    if (camDist > fadeStartDist) {
      const fadeFactor = (fadeEndDist - camDist) / (fadeEndDist - fadeStartDist);
      opacity *= fadeFactor;
    }
  }
  atmosphereMesh.material.uniforms.atmOpacity.value = opacity;
  atmosphereMesh.material.needsUpdate = true;
}

// To tests values from GUI 

// export function setAtmosphereOpacity(value) {
//   atmosphereOpacity = value;
//   atmosphereMesh.material.uniforms.atmOpacity.value = value;
//   atmosphereMesh.material.needsUpdate = true;  
// }

// export function setAtmosphereParam1(value) {
//   atmosphereParam1 = value;
//   atmosphereMesh.material.uniforms.atmPowFactor.value = value;
//   atmosphereMesh.material.needsUpdate = true;
// }

// export function setAtmosphereParam2(value) {
//   atmosphereParam2 = value;
//   atmosphereMesh.material.uniforms.atmMultiplier.value = value;
//   atmosphereMesh.material.needsUpdate = true;
// }

function computeMultiplierFromDensity(density) {
  return atmosphereDensitySurface * 4;
}