import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scaleFromMeter } from '../constants.js';
import { computeCorrectScale } from '../utils.js';

export async function loadLowPolySpaceshipMesh() {
  const group = new THREE.Group();

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('assets/spaceships/LowPoly/scene.gltf');
  const object = gltf.scene;

  // const objLoader = new OBJLoader();
  // const mtlLoader = new MTLLoader();
  //const materials = await mtlLoader.loadAsync('assets/spaceships/VeryLowPoly/SpaceShip.mtl');  
  //const materials = await mtlLoader.loadAsync('assets/spaceships/StarSparrow/SpaceShip.mtl');  
  //objLoader.setMaterials(materials);
  //const object = await objLoader.loadAsync('assets/spaceships/VeryLowPoly/SpaceShip.obj');
  // const object = await objLoader.loadAsync('assets/spaceships/StarSparrow/StarSparrow01.obj');

  console.log("Spaceship mesh has been loaded");

  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      // child.material.metalness = 0.7;
      // child.material.roughness = 0.4;
      // child.material.color.set(0xeeeeee);
    }
  });

  // Rescale
  object.scale.setScalar(computeCorrectScale(object, 15));

  // Recenter
  // const box = new THREE.Box3().setFromObject(object);
  // const center = box.getCenter(new THREE.Vector3());
  // object.position.sub(center); 

  // Reorient 
  object.rotation.y = - Math.PI;

  group.add(object);

  group.scale.setScalar(10000);

  return group;
}