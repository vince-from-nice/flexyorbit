import * as THREE from 'three';
import { createScene, camera, renderer, scene, earth } from './scene.js';
import { initControls, orbitControls, timePaused, timeAcceleration } from './controls.js';
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
    orbitControls.update();
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});

