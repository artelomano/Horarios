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

// Color palette - Clínica Dental Jerez
export const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  primary: '#000000',
  secondary: '#09141E',
  text: '#5D5D5D',
  accent: '#B9B9B9',
  lightBg: '#F8F9F8',
  accentGreen: '#C5FA2D',
  darkBlue: '#012D3A',
  turquoise: '#007E8E',
  lightBlue: '#E2F8FF',
  blue: '#0B71D9',
  teal: '#5F8489',
  mint: '#84BBA4',
  // Legacy support
  lightGrey: '#B9B9B9',
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

