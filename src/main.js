import * as THREE from 'three';
import world from './world.js';
import { createScene, camera, renderer, scene, animateEarthAndMonth } from './scene/scene.js';
import { Trail } from './scene/trails.js';
import { initControls, timePaused, timeAcceleration, updateInterface } from './controls/interface.js';
import { animatePhysicalEntities } from './physics/physics.js';

const clock = new THREE.Clock();
const fpsElement = document.getElementById('fps');
let frameCount = 0;
let lastTime = 0;

document.addEventListener('DOMContentLoaded', () => {

  createScene(document.body);

  world.init();

  initControls();

  function animate() {
    // FPS counter
    frameCount++;
    if (clock.elapsedTime - lastTime >= 0.8) {
      const fps = Math.round(frameCount / (clock.elapsedTime - lastTime));
      fpsElement.textContent = fps + ' fps';
      frameCount = 0;
      lastTime = clock.elapsedTime;
    }

    // Protect huge delta when browser is inactive
    const deltaTime = Math.min(clock.getDelta(), 1 / 30);

    if (!timePaused) {
      animateEarthAndMonth(deltaTime * timeAcceleration);
      animatePhysicalEntities(deltaTime * timeAcceleration);
    }

    updateInterface(deltaTime * timeAcceleration);

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

