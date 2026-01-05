/* Use a global scale factor (to kilometer) to avoid z-buffer issues (z-fighting) */
export const GLOBAL_SCALE = 10; // 10 means that internal unit is 10 km

export const EARTH_RADIUS_KM = 6371;
export const EARTH_RADIUS = EARTH_RADIUS_KM / GLOBAL_SCALE;


export function scaleFromKm(value) {
  return value / GLOBAL_SCALE;
}

export function scaleToKm(value) {
  return value * GLOBAL_SCALE;
}