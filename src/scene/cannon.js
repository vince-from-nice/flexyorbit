import * as THREE from 'three';
import { EARTH_RADIUS_SCALED, GLOBAL_SCALE, scaleFromKm } from '../constants.js';
import { earth } from './earth.js';
import { registerAnimable } from '../physics.js';

export let cannonGroup, cannonball;

export let cannonParams = {
    lat: 43.53,
    lon: 6.89,
    altitude: 100,
    azimuth: 0,
    elevation: 45,
    speed: 1.5
};

export function createCannon() {
    cannonGroup = new THREE.Group();
    const scaleFactor = 10 / GLOBAL_SCALE;

    // Base
    const baseGeometry = new THREE.BoxGeometry(20 * scaleFactor, 2 * scaleFactor, 20 * scaleFactor);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.7,
        roughness: 0.3,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.position.y = 1 * scaleFactor;
    cannonGroup.add(base);

    // Base corner lights
    const boxSize = 2.5 * scaleFactor; 
    const halfBase = 10 * scaleFactor;
    const baseThickness = 2 * scaleFactor;
    const emissiveColor = 0xffaa55;
    const emissiveIntensity = 2.2;
    const glowBoxes = [];
    const cornerOffsets = [
        new THREE.Vector3(halfBase, 0, halfBase),
        new THREE.Vector3(halfBase, 0, -halfBase),
        new THREE.Vector3(-halfBase, 0, halfBase),
        new THREE.Vector3(-halfBase, 0, -halfBase),
    ];
    cornerOffsets.forEach(offset => {
        const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
        const material = new THREE.MeshStandardMaterial({
            color: emissiveColor,
            emissive: emissiveColor,
            emissiveIntensity: emissiveIntensity,
            metalness: 0.95,
            roughness: 0.25,
            toneMapped: false
        });
        const box = new THREE.Mesh(geometry, material);
        box.position.copy(offset);
        box.position.y = baseThickness / 2 + boxSize / 2; 
        cannonGroup.add(box);
        glowBoxes.push(box);
    });

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
    tube.castShadow = true;
    tube.rotation.x = Math.PI / 2; // Point along +Z (instead of Y)
    tube.position.set(0, 0, tubeLength / 2); // Centered on the pivot, rear at 0, front at tubeLength

    // Group for the elevation
    const elevationGroup = new THREE.Group();
    elevationGroup.add(tube);
    elevationGroup.position.set(0, 4 * scaleFactor, 0);
    cannonGroup.add(elevationGroup);

    // Light on the tube
    // const muzzleLight = new THREE.PointLight(0x00aaff, 10, 40 * scaleFactor);
    // muzzleLight.position.set(0, 0, tubeLength);
    // elevationGroup.add(muzzleLight);

    // Cannonball
    const cannonballRadius = 3 * scaleFactor;
    const ballGeometry = new THREE.SphereGeometry(cannonballRadius, 32, 32); // Rayon un peu plus grand que le tube (radius ~2-2.5)
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
    });
    cannonball = new THREE.Mesh(ballGeometry, ballMaterial);
    cannonball.castShadow = true;
    // Set the initial position at the exact end of the tube and save it
    const initialPosition = new THREE.Vector3(0, 0, tubeLength + cannonballRadius);
    cannonball.userData.initialLocalPosition = initialPosition;
    cannonball.position.copy(initialPosition);
    registerAnimable(cannonball);
    elevationGroup.add(cannonball);

    // References
    cannonGroup.userData.elevationGroup = elevationGroup;
    cannonGroup.userData.tube = tube;

    // A first update with the initial parameters
    updateCannonWithParams();

    // Link it to the earth (and not the scene)
    earth.add(cannonGroup);
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

    const r = EARTH_RADIUS_SCALED + scaleFromKm(altitude);

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
    console.log('Cannon has been updated with: lat=' + lat.toFixed(2) + '° lon=' + lon.toFixed(2) + '° altitude=' + altitude.toFixed(0) + 'km azimuth=' + azimuth.toFixed(0) + '° elevation=' + elevation.toFixed(0) + '°');
    console.log("   CannonGroup position: x=" + cannonGroup.position.x.toFixed(0) + " y=" + cannonGroup.position.y.toFixed(0) + " z=" + cannonGroup.position.z.toFixed(0));
    console.log("   CannonGroup orientation: up=<" + cannonGroup.up.x.toFixed(3) + " " + cannonGroup.up.y.toFixed(3) + " " + cannonGroup.up.z.toFixed(3) + "> horizon=<" + horizontalDir.x.toFixed(3) + " " + horizontalDir.y.toFixed(3) + " " + horizontalDir.z.toFixed(3) + ">");
}

