/**
 * Employee Management Component
 * Handles CRUD operations for employees
 */
import React, { useState } from 'react';
import EmployeeCard from './EmployeeCard.jsx';
import EmployeeModal from './EmployeeModal.jsx';
import { DEFAULT_EMPLOYEE_COLORS, generateRandomPastelColor } from '../utils/constants.js';
import './EmployeeManagement.css';

function EmployeeManagement({ employees, onSaveEmployees }) {
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleSaveEmployee = (employeeData) => {
    let updatedEmployees;
    
    if (editingEmployee) {
      // Update existing
      updatedEmployees = employees.map(emp =>
        emp.id === editingEmployee.id ? { ...employeeData, id: editingEmployee.id } : emp
      );
    } else {
      // Add new
      const newId = Math.max(...employees.map(e => e.id || 0), 0) + 1;
      updatedEmployees = [...employees, { ...employeeData, id: newId }];
    }

    onSaveEmployees(updatedEmployees);
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (employeeId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      onSaveEmployees(updatedEmployees);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  return (
    <div className="employee-management">
      <div className="employee-management-header">
        <h2>Gestión de Personal y Servicios</h2>
        <button className="btn-primary" onClick={handleAddEmployee}>
          Añadir Nuevo Empleado
        </button>
      </div>

      <div className="employees-list">
        {employees.map(employee => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={() => handleEditEmployee(employee)}
            onDelete={() => handleDeleteEmployee(employee.id)}
          />
        ))}
      </div>

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default EmployeeManagement;

