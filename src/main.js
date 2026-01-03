import * as THREE from 'three';
import { createScene, camera, renderer, scene } from './scene/scene.js';
import { earth, earthRotationDisabled } from './scene/earth.js';
import { moon, moonRotationDisabled } from './scene/moon.js';
import { updateThickLineResolution } from './scene/trails.js';
import { initControls, timePaused, timeAcceleration } from './controls/interface.js';
import { updateCamera } from './controls/camera.js';
import { animatePhysics } from './physics/physics.js';

const EARTH_ANGULAR_VELOCITY = 2 * Math.PI / 86164;  // Day rotation in rad/s (real period is ~23h56m4s)
const MOON_ANGULAR_VELOCITY = 2 * Math.PI / 2360592; // Moon rotation which is sync with its orbital period (27.32 days) so it's very low (2,66 × 10⁻⁶)

document.addEventListener('DOMContentLoaded', () => {

  createScene(document.body);

  initControls();

  const clock = new THREE.Clock();

  function animate() {
    const delta = clock.getDelta();
    if (!timePaused) {
      if (!earthRotationDisabled) {
        earth.rotation.y += EARTH_ANGULAR_VELOCITY * delta * timeAcceleration;
      }
      if (!moonRotationDisabled) {
        moon.rotation.y += MOON_ANGULAR_VELOCITY * delta * timeAcceleration;
      }
      animatePhysics(delta * timeAcceleration);
    }
    updateCamera(delta * timeAcceleration);
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

