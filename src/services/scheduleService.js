/**
 * Schedule Service
 * Business logic for schedule management
 */

import { formatDate, formatMonth, getWeekdayName } from '../utils/dateUtils.js';
import { WEEKDAYS } from '../utils/constants.js';

/**
 * Get schedule for a specific date
 */
export function getScheduleForDate(schedules, date) {
  const monthKey = formatMonth(date);
  const dateKey = formatDate(date);
  
  if (!schedules[monthKey] || !schedules[monthKey][dateKey]) {
    return null;
  }
  
  return schedules[monthKey][dateKey];
}

/**
 * Get or create schedule for a date
 */
export function getOrCreateScheduleForDate(schedules, date) {
  const monthKey = formatMonth(date);
  const dateKey = formatDate(date);
  
  if (!schedules[monthKey]) {
    schedules[monthKey] = {};
  }
  
  if (!schedules[monthKey][dateKey]) {
    schedules[monthKey][dateKey] = {
      morning: [],
      afternoon: [],
    };
  }
  
  return schedules[monthKey][dateKey];
}

/**
 * Save schedule for a date
 */
export function saveScheduleForDate(schedules, date, scheduleData) {
  const monthKey = formatMonth(date);
  const dateKey = formatDate(date);
  
  if (!schedules[monthKey]) {
    schedules[monthKey] = {};
  }
  
  schedules[monthKey][dateKey] = scheduleData;
  return schedules;
}

/**
 * Apply template to a date
 */
export function applyTemplateToDate(template, date, schedules) {
  const weekday = getWeekdayName(date);
  const weekdayKey = WEEKDAYS.find(day => day === weekday);
  
  if (!weekdayKey || !template.data[weekdayKey]) {
    return schedules;
  }
  
  const templateData = template.data[weekdayKey];
  const dateSchedule = getOrCreateScheduleForDate(schedules, date);
  
  // Apply morning template
  if (templateData.morning) {
    dateSchedule.morning = JSON.parse(JSON.stringify(templateData.morning));
  }
  
  // Apply afternoon template
  if (templateData.afternoon) {
    dateSchedule.afternoon = JSON.parse(JSON.stringify(templateData.afternoon));
  }
  
  return schedules;
}

/**
 * Get all dates in a month that match a weekday
 */
export function getDatesForWeekdayInMonth(year, month, weekday) {
  const dates = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const weekdayIndex = WEEKDAYS.indexOf(weekday);
  if (weekdayIndex === -1) return dates;
  
  // Find first occurrence of weekday
  let currentDate = new Date(firstDay);
  const firstDayOfWeek = firstDay.getDay();
  const daysToAdd = (weekdayIndex - firstDayOfWeek + 7) % 7;
  currentDate.setDate(firstDay.getDate() + daysToAdd);
  
  // Add all occurrences
  while (currentDate <= lastDay) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return dates;
}

