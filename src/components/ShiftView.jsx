/**
 * Shift View Component
 * Displays employees assigned to a shift (morning or afternoon)
 */
import React from 'react';
import { getEmployeeById } from '../services/employeeService.js';
import EmployeeBadge from './EmployeeBadge.jsx';
import './ShiftView.css';

function ShiftView({
  shifts,
  employees,
  dateKey,
  shiftType,
  onSaveSchedules,
  readOnly = false,
}) {
  // Process shifts - handle both old and new structure
  const processShifts = () => {
    if (!shifts || shifts.length === 0) {
      return [];
    }

    const processed = [];
    
    shifts.forEach((shift, index) => {
      // New structure: { reception: [], internal: [], external: [] }
      if (shift.reception !== undefined || shift.internal !== undefined) {
        if (shift.reception && shift.reception.length > 0) {
          shift.reception.forEach(empId => {
            const employee = getEmployeeById(employees, empId);
            if (employee) {
              processed.push({ employee, slot: 'reception', index });
            }
          });
        }
        if (shift.internal && shift.internal.length > 0) {
          shift.internal.forEach(empId => {
            const employee = getEmployeeById(employees, empId);
            if (employee) {
              processed.push({ employee, slot: 'internal', index });
            }
          });
        }
        if (shift.external && shift.external.length > 0) {
          shift.external.forEach(empId => {
            const employee = getEmployeeById(employees, empId);
            if (employee) {
              processed.push({ employee, slot: 'external', index });
            }
          });
        }
      } else if (shift.employeeId) {
        // Old structure: { employeeId, startTime, cancelled, notes }
        const employee = getEmployeeById(employees, shift.employeeId);
        if (employee && !shift.cancelled) {
          processed.push({ employee, slot: shift.notes || 'regular', index });
        }
      }
    });

    return processed;
  };

  const assignedEmployees = processShifts();

  return (
    <div className="shift-view">
      {assignedEmployees.length > 0 ? (
        assignedEmployees.map((item, idx) => (
          <EmployeeBadge
            key={`${item.employee.id}-${idx}`}
            employee={item.employee}
            slot={item.slot}
          />
        ))
      ) : (
        <div className="empty-slot">+</div>
      )}
    </div>
  );
}

export default ShiftView;

