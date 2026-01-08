import * as THREE from 'three';
import { GLOBAL_SCALE, EARTH_RADIUS } from './constants.js';

export function printPos(pos) {
    return "(" + pos?.x.toFixed(0) + " " + pos?.y.toFixed(0) + " " + pos?.z.toFixed(0) + ")";
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
  const lon_deg = lon_rad * 180 / Math.PI;
  return { lat: lat_deg, lon: lon_deg, alt: alt_km };
}

export function polarToCartesian(lat_deg, lon_deg, alt_km) {
  const r = EARTH_RADIUS + alt_km / GLOBAL_SCALE;
  const lat_rad = lat_deg * Math.PI / 180;
  const lon_rad = lon_deg * Math.PI / 180;
  const x = r * Math.cos(lat_rad) * Math.cos(lon_rad);
  const y = r * Math.sin(lat_rad);
  const z = r * Math.cos(lat_rad) * Math.sin(lon_rad);
  return new THREE.Vector3(x, y, z);
}