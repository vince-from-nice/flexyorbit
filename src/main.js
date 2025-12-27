import * as THREE from 'three';
import { createScene, camera, renderer, scene } from './scene/scene.js';
import { earth } from './scene/earth.js';
import { updateAtmosphere } from './scene/atmosphere.js';
import { updateThickLineResolution } from './scene/trails.js';
import { initControls, timePaused, timeAcceleration } from './controls/interface.js';
import { updateCameraControls } from './controls/camera.js';
import { animatePhysics } from './physics.js';

const EARTH_ANGULAR_VELOCITY = 2 * Math.PI / 86164;  // rad/s (période sidérale ~23h56m4s)

document.addEventListener('DOMContentLoaded', () => {

  createScene(document.body);

  initControls();

  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    if (!timePaused) {
      earth.rotation.y += EARTH_ANGULAR_VELOCITY * delta * timeAcceleration;
      animatePhysics(delta * timeAcceleration);
    }
    updateAtmosphere();
    updateCameraControls(delta);
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateThickLineResolution();
  });
});

