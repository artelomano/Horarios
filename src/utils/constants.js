/**
 * Application Constants
 */

// Shift times configuration
export const SHIFT_TIMES = {
  morning: { start: '09:30', end: '14:00', duration: 4.5 },
  afternoon: { start: '16:00', end: '20:30', duration: 4.5 },
};

// Weekdays configuration
export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
export const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
export const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V'];

// Employee types
export const EMPLOYEE_TYPES = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
  SERVICE: 'service',
};

// Color palette
export const COLORS = {
  white: '#fff',
  black: '#000',
  primary: '#005B52',
  secondary: '#1E1E1E',
  darkGreen: '#005B52',
  lightGreen: '#04BF8A',
  darkYellow: '#C1D711',
  lightYellow: '#DBF226',
  lightGrey: '#B3B3B3',
};

// Default employee colors
export const DEFAULT_EMPLOYEE_COLORS = {
  Patricia: '#B3D9FF',
  Desi: '#FFF4B3',
  Lanny: '#B3E5B3',
  Maite: '#FFD9B3',
};

/**
 * Generate a random pastel color
 */
export function generateRandomPastelColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 50%, 80%)`;
}

/**
 * Convert HSL to Hex
 */
export function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

