/* Use a global scale factor (to kilometer) to avoid z-buffer issues (z-fighting) */
export const GLOBAL_SCALE = 10; 
export const EARTH_RADIUS_REAL = 6371;  // real value in km
export const EARTH_RADIUS_SCALED = EARTH_RADIUS_REAL / GLOBAL_SCALE;

// Helper to scale km real values
export function scaleFromKm(value) {
  return value / GLOBAL_SCALE;
}

export function scaleToKm(value) {
  return value * GLOBAL_SCALE;
}