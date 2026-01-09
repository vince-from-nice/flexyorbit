import * as THREE from 'three';

import { EARTH_RADIUS, GLOBAL_SCALE } from '../constants.js';
import { atmosphereHeightKm, atmosphereDensitySurface } from '../scene/atmosphere.js';

export const TROPOSPHERE_HEIGHT_RATIO = 0.07; // Height of the troposphere / total height of the atmosphere
export const DEFAULT_DRAG_COEFF = 0.0004; // Magic value for now (no real computation with Cd, surface..) but it should be in obj.userData

export function getDragAcceleration(obj) {
    const speedInMeterBySecond = obj.velocity.length() * GLOBAL_SCALE * 1000;
    if (speedInMeterBySecond < 0.001) return new THREE.Vector3();
    
    const density = getAirDensity(obj.body.position);
    if (density <= 0) return new THREE.Vector3();

    const dragCoefficient = obj.dragCoefficient || DEFAULT_DRAG_COEFF;

    let dragMagnitude = dragCoefficient * density * speedInMeterBySecond * speedInMeterBySecond;

    // Need ton convert from meter to the internal unit
    dragMagnitude = dragMagnitude / (1000 * GLOBAL_SCALE);

    console.log("Computing drag for " + obj.name  + " | " 
        + `Altitude: ${getAltitude(obj.body.position).toFixed(0)} km | `
        + `Air density: ${density.toFixed(3)} | `
        + `Speed: ${(speedInMeterBySecond).toFixed(0)} m/s | `
        + `Drag magnitude: ${dragMagnitude.toFixed(6)}`);

    const dragDirection = obj.velocity.clone().normalize().multiplyScalar(-1);

    return dragDirection.multiplyScalar(dragMagnitude);
}

function getAirDensity(position) {
    //console.log("Atmosphere height=" + atmosphereHeightKm + " density=" + atmosphereDensitySurface)
    const h = getAltitude(position)
    if (h <= 0) return atmosphereDensitySurface;
    if (h >= atmosphereHeightKm) return 0.0;

    // Decreasing exponential density (troposphere is a good scale limit, above the density is very very low)    
    return atmosphereDensitySurface * Math.exp(-h / (atmosphereHeightKm * TROPOSPHERE_HEIGHT_RATIO));
}

function getAltitude(position) {
    return (position.length() - EARTH_RADIUS) * GLOBAL_SCALE;
}