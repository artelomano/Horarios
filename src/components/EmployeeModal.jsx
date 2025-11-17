/**
 * Employee Modal Component
 * Form for adding/editing employees
 */
import React, { useState, useEffect } from 'react';
import { EMPLOYEE_TYPES, DEFAULT_EMPLOYEE_COLORS, generateRandomPastelColor } from '../utils/constants.js';
import './EmployeeModal.css';

function EmployeeModal({ employee, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: EMPLOYEE_TYPES.INTERNAL,
    role: '',
    hoursPerWeek: 40,
    hoursStatus: 0,
    comments: '',
    color: '#B3D9FF',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        type: employee.type || EMPLOYEE_TYPES.INTERNAL,
        role: employee.role || '',
        hoursPerWeek: employee.hoursPerWeek || 40,
        hoursStatus: employee.hoursStatus || 0,
        comments: employee.comments || '',
        color: employee.color || DEFAULT_EMPLOYEE_COLORS[employee.name] || generateRandomPastelColor(),
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="modal-close" onClick={onClose}>&times;</span>
        <h2>{employee ? 'Editar Empleado' : 'Añadir Empleado'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Tipo:</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value={EMPLOYEE_TYPES.INTERNAL}>Interno</option>
              <option value={EMPLOYEE_TYPES.EXTERNAL}>Externo</option>
              <option value={EMPLOYEE_TYPES.SERVICE}>Servicio</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol:</label>
            <input
              type="text"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="ej: Administradora, Recepcionista, Higienista"
            />
          </div>

          {formData.type === EMPLOYEE_TYPES.INTERNAL && (
            <>
              <div className="form-group">
                <label htmlFor="hoursPerWeek">Horas por Semana:</label>
                <input
                  type="number"
                  id="hoursPerWeek"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="hoursStatus">Estado de Horas:</label>
                <input
                  type="number"
                  id="hoursStatus"
                  name="hoursStatus"
                  value={formData.hoursStatus}
                  onChange={handleChange}
                  step="0.5"
                  placeholder="Saldo actual de horas"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="comments">Comentarios:</label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows="4"
              placeholder="Notas especiales, excepciones, turnos especiales, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Color:</label>
            <div className="color-picker-container">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                pattern="^#[0-9A-Fa-f]{6}$"
                placeholder="#B3D9FF"
              />
            </div>
            <small>Selecciona un color pastel para identificar al empleado en el calendario</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Guardar
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeModal;

