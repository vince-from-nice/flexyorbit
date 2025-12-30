import * as THREE from 'three';

import { EARTH_RADIUS_SCALED, GLOBAL_SCALE } from '../constants.js';
import { atmosphereHeightKm, atmosphereDensitySurface } from '../scene/atmosphere.js';

export const TROPOSPHERE_HEIGHT_RATIO = 0.075; // Height of the troposphere / total height of the atmosphere
export const DRAG_COEFF = 0.001; // Magic value for now

export function getDragAcceleration(position, velocity) {
    const speedInMeterBySecond = velocity.length() * GLOBAL_SCALE * 1000;
    if (speedInMeterBySecond < 0.001) return new THREE.Vector3();
    
    const density = getAirDensity(position);
    if (density <= 0) return new THREE.Vector3();

    let dragMagnitude = DRAG_COEFF * density * speedInMeterBySecond * speedInMeterBySecond;

    // Need ton convert from meter to the internal unit
    dragMagnitude = dragMagnitude / (1000 * GLOBAL_SCALE);

    console.log(`Altitude: ${getAltitude(position).toFixed(0)} km | `
        + `Density: ${density.toFixed(3)} | `
        + `Speed: ${(speedInMeterBySecond).toFixed(0)} m/s | `
        + `Drag magnitude: ${dragMagnitude.toFixed(6)}`);

    const dragDirection = velocity.clone().normalize().multiplyScalar(-1);

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
    return (position.length() - EARTH_RADIUS_SCALED) * GLOBAL_SCALE;
}