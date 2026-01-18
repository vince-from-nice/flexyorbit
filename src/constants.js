/* Use a global scale factor (to kilometer) to avoid z-buffer issues (z-fighting) */
export const GLOBAL_SCALE = 10; // 10 means that internal unit is 10 km

export const EARTH_RADIUS_KM = 6371; // km
export const EARTH_RADIUS = EARTH_RADIUS_KM / GLOBAL_SCALE;

export const GM_EARTH = 398600.4418; // Standard gravitational parameter in km³/s² (= G x M)
export const GM_MOON = 4902.8;

export function scaleFromKm(value) {
  return value / GLOBAL_SCALE;
}

export function scaleFromMeter(value) {
  return scaleFromKm(value) / 1000;
}

export function scaleToKm(value) {
  return value * GLOBAL_SCALE;
}

export function scaleToMeter(value) {
  return scaleToKm(value) * 1000;
}