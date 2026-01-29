import * as THREE from 'three';
import { GLOBAL_SCALE, EARTH_RADIUS, scaleToKm, scaleToMeter, scaleFromMeter } from './constants.js';

export function printPosInKm(pos) {
    return "(" + scaleToKm(pos?.x).toFixed(0) + " " + scaleToKm(pos?.y).toFixed(0) + " " + scaleToKm(pos?.z).toFixed(0) + ")";
}

export function printPosInMeter(pos) {
    return "(" + scaleToMeter(pos?.x).toFixed(0) + " " + scaleToMeter(pos?.y).toFixed(0) + " " + scaleToMeter(pos?.z).toFixed(0) + ")";
}

export function showTemporaryMessage(text) {
    let message = document.getElementById('temporary-message');
    if (message) {
        message.remove();
    }
    message = document.createElement('div');
    message.id = 'temporary-message';
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => {
        message.classList.add('hidden');
        setTimeout(() => message.remove(), 500);
    }, 2000);
}

export function cartesianToPolar(pos) {
    const r = pos.length();
    const alt_km = (r - EARTH_RADIUS) * GLOBAL_SCALE;
    const lat_rad = Math.asin(pos.y / r);
    const lat_deg = lat_rad * 180 / Math.PI;
    const lon_rad = Math.atan2(pos.z, pos.x);
    let lon_deg = lon_rad * 180 / Math.PI;
    lon_deg = -lon_deg;
    lon_deg = normalizeLongitude(lon_deg);
    return { lat: lat_deg, lon: lon_deg, alt: alt_km };
}

export function polarToCartesian(lat_deg, lon_deg, alt_km) {
    const r = EARTH_RADIUS + alt_km / GLOBAL_SCALE;
    const lat_rad = lat_deg * Math.PI / 180;
    const lon_rad = lon_deg * Math.PI / 180;
    const theta = -lon_rad;
    const x = r * Math.cos(lat_rad) * Math.cos(theta);
    const y = r * Math.sin(lat_rad);
    const z = r * Math.cos(lat_rad) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
}

export function normalizeLongitude(lon) {
    lon = lon % 360;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    return lon;
}

export function computeCorrectScale(mesh, correctSizeInMeters) {
      const currentSize = new THREE.Vector3();
      new THREE.Box3().setFromObject(mesh).getSize(currentSize);
      const currentMax = Math.max(currentSize.x, currentSize.y, currentSize.z);
      const desiredSize = scaleFromMeter(correctSizeInMeters);
      const scale = desiredSize / currentMax;
      return scale;
}