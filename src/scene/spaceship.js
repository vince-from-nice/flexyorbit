import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scaleFromMeter } from '../constants.js';

export async function createSpaceshipMesh() {
  const group = new THREE.Group();

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/assets/spaceships/LowPoly Spaceship/scene.gltf');
  const object = gltf.scene;

  // const objLoader = new OBJLoader();
  // const mtlLoader = new MTLLoader();
  //const materials = await mtlLoader.loadAsync('/assets/spaceships/LowPoly SpaceShip/SpaceShip.mtl');  
  //const materials = await mtlLoader.loadAsync('/assets/spaceships/Star Sparrow/SpaceShip.mtl');  
  //objLoader.setMaterials(materials);
  //const object = await objLoader.loadAsync('/assets/spaceships/LowPoly SpaceShip/SpaceShip.obj');
  // const object = await objLoader.loadAsync('/assets/spaceships/Star Sparrow/StarSparrow01.obj');

  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      // child.material.metalness = 0.7;
      // child.material.roughness = 0.4;
      // child.material.color.set(0xeeeeee);
    }
  });

  // Center
  // const box = new THREE.Box3().setFromObject(object);
  // const center = box.getCenter(new THREE.Vector3());
  // object.position.sub(center); 

  // Rotate 
  object.rotation.y = - Math.PI;

  object.scale.setScalar(3);

  group.add(object);

  return group;
}