/**
 * Employee Card Component
 * Displays employee information in a card
 */
import React from 'react';
import { EMPLOYEE_TYPES } from '../utils/constants.js';
import './EmployeeCard.css';

function EmployeeCard({ employee, onEdit, onDelete }) {
  const isInternal = employee.type === EMPLOYEE_TYPES.INTERNAL;
  const hoursWarning = isInternal && employee.hoursStatus < -2;

  return (
    <div className={`employee-card ${employee.type}`}>
      <div className="employee-card-header">
        <div
          className="employee-color-indicator"
          style={{ backgroundColor: employee.color || '#B3D9FF' }}
        ></div>
        <h3>{employee.name}</h3>
        <div className="employee-card-actions">
          <button className="btn-icon" onClick={onEdit} title="Editar">
            ✏️
          </button>
          <button className="btn-icon" onClick={onDelete} title="Eliminar">
            🗑️
          </button>
        </div>
      </div>
      <div className="employee-card-body">
        <p className="employee-role">{employee.role || 'Sin rol'}</p>
        <p className="employee-type">
          {employee.type === EMPLOYEE_TYPES.INTERNAL && 'Interno'}
          {employee.type === EMPLOYEE_TYPES.EXTERNAL && 'Externo'}
          {employee.type === EMPLOYEE_TYPES.SERVICE && 'Servicio'}
        </p>
        {isInternal && (
          <div className="employee-hours">
            <p>Horas/semana: {employee.hoursPerWeek || 0}h</p>
            <p className={hoursWarning ? 'hours-warning' : ''}>
              Estado: {employee.hoursStatus || 0}h
            </p>
          </div>
        )}
        {employee.comments && (
          <div className="employee-comments">
            <strong>Comentarios:</strong>
            <p>{employee.comments}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeCard;

