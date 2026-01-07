import * as THREE from 'three';
import world from './world.js';
import { createScene, camera, renderer, scene, animateEarthAndMonth } from './scene/scene.js';
import { Trail } from './scene/trails.js';
import { initControls, timePaused, timeAcceleration } from './controls/interface.js';
import { updateCamera } from './controls/camera.js';
import { animatePhysicalEntities } from './physics/physics.js';

document.addEventListener('DOMContentLoaded', () => {

  createScene(document.body);

  initControls();

  const clock = new THREE.Clock();

  function animate() {

    const deltaTime = clock.getDelta();

    if (!timePaused) {
      animateEarthAndMonth(deltaTime * timeAcceleration);
      animatePhysicalEntities(deltaTime * timeAcceleration);
    }

    updateCamera(deltaTime * timeAcceleration);

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    Trail.updateAllThickLineResolutions(world.getPhysicalEntities());
  });
});

