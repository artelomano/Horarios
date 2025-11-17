/**
 * Date utility functions
 */

/**
 * Get the first day of a month
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1);
}

/**
 * Get the last day of a month
 */
export function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0);
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date as YYYY-MM for month key
 */
export function formatMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get all dates in a month
 */
export function getDatesInMonth(year, month) {
  const dates = [];
  const firstDay = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }
  
  return dates;
}

/**
 * Get weekday name from date
 */
export function getWeekdayName(date) {
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return weekdays[date.getDay()];
}

/**
 * Get month name in Spanish
 */
export function getMonthName(monthIndex) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex];
}

/**
 * Check if date is weekend
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

