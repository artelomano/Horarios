/**
 * Employee Service
 * Business logic for employee management
 */

import { EMPLOYEE_TYPES } from '../utils/constants.js';

/**
 * Get employee by ID
 */
export function getEmployeeById(employees, employeeId) {
  return employees.find(emp => emp.id === employeeId);
}

/**
 * Get employees by type
 */
export function getEmployeesByType(employees, type) {
  return employees.filter(emp => emp.type === type);
}

/**
 * Get internal employees
 */
export function getInternalEmployees(employees) {
  return getEmployeesByType(employees, EMPLOYEE_TYPES.INTERNAL);
}

/**
 * Get external employees
 */
export function getExternalEmployees(employees) {
  return getEmployeesByType(employees, EMPLOYEE_TYPES.EXTERNAL);
}

/**
 * Get service employees
 */
export function getServiceEmployees(employees) {
  return getEmployeesByType(employees, EMPLOYEE_TYPES.SERVICE);
}

/**
 * Calculate hours for an employee in a schedule
 */
export function calculateEmployeeHours(employeeId, schedule) {
  let totalHours = 0;
  
  if (!schedule) return totalHours;
  
  const shifts = [...(schedule.morning || []), ...(schedule.afternoon || [])];
  
  shifts.forEach(shift => {
    if (shift.employeeId === employeeId && !shift.cancelled) {
      // Check if it's reception (4.5h) or regular slot
      if (shift.notes && shift.notes.includes('RECEPCIÓN')) {
        totalHours += 4.5;
      } else {
        totalHours += 4.5; // Default shift duration
      }
    }
  });
  
  return totalHours;
}

/**
 * Update employee hours status
 */
export function updateEmployeeHoursStatus(employee, hoursWorked) {
  if (employee.type !== EMPLOYEE_TYPES.INTERNAL) {
    return employee;
  }
  
  const newStatus = (employee.hoursStatus || 0) + hoursWorked;
  return {
    ...employee,
    hoursStatus: newStatus,
  };
}

