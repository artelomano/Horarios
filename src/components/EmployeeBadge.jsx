/**
 * Employee Badge Component
 * Displays an employee in a shift slot
 */
import React from 'react';
import './EmployeeBadge.css';

function EmployeeBadge({ employee, slot }) {
  if (!employee) return null;

  const badgeStyle = {
    backgroundColor: employee.color || '#B3D9FF',
    color: '#000',
  };

  return (
    <div className="employee-badge" style={badgeStyle} title={employee.role || employee.name}>
      {employee.name}
    </div>
  );
}

export default EmployeeBadge;

