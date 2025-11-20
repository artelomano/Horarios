/**
 * Admin Page Component
 * Main admin interface with calendar, employee management, and templates
 */
import React, { useState, useEffect } from 'react';
import { employeesAPI, templatesAPI, schedulesAPI, vacationsAPI } from '../services/api.js';
import CalendarView from '../components/CalendarView.jsx';
import EmployeeManagement from '../components/EmployeeManagement.jsx';
import TemplateEditor from '../components/TemplateEditor.jsx';
import './AdminPage.css';

function AdminPage({ onLogout }) {
  const [currentView, setCurrentView] = useState('calendar');
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [vacations, setVacations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      console.log('Loading all data...');
      const [employeesData, templatesData, schedulesData, vacationsData] = await Promise.all([
        employeesAPI.getAll(),
        templatesAPI.getAll(),
        schedulesAPI.getAll(),
        vacationsAPI.getAll(),
      ]);

      setEmployees(employeesData);
      setTemplates(templatesData);
      setSchedules(schedulesData);
      setVacations(vacationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployees = async (updatedEmployees) => {
    try {
      await employeesAPI.save(updatedEmployees);
      setEmployees(updatedEmployees);
      console.log('Employees saved successfully');
    } catch (error) {
      console.error('Error saving employees:', error);
      throw error;
    }
  };

  const handleSaveTemplates = async (updatedTemplates) => {
    try {
      await templatesAPI.save(updatedTemplates);
      setTemplates(updatedTemplates);
      console.log('Templates saved successfully');
    } catch (error) {
      console.error('Error saving templates:', error);
      throw error;
    }
  };

  const handleSaveSchedules = async (updatedSchedules) => {
    try {
      await schedulesAPI.save(updatedSchedules);
      setSchedules(updatedSchedules);
      console.log('Schedules saved successfully');
    } catch (error) {
      console.error('Error saving schedules:', error);
      throw error;
    }
  };

  const handleSaveVacations = async (updatedVacations) => {
    try {
      await vacationsAPI.save(updatedVacations);
      setVacations(updatedVacations);
      console.log('Vacations saved successfully');
    } catch (error) {
      console.error('Error saving vacations:', error);
      throw error;
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <img src="/images/logo-clinica-dental-jerez.png" alt="Clínica Dental Jerez" className="admin-logo" onError={(e) => { e.target.style.display = 'none'; }} />
          <h1>Gestor de Horarios</h1>
        </div>
        <div className="header-actions">
          <button
            className={`btn-secondary ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
            Ver Calendario
          </button>
          <button
            className={`btn-secondary ${currentView === 'employees' ? 'active' : ''}`}
            onClick={() => setCurrentView('employees')}
          >
            Gestión de Personal
          </button>
          <button
            className={`btn-secondary ${currentView === 'template' ? 'active' : ''}`}
            onClick={() => setCurrentView('template')}
          >
            Editar Template Semanal
          </button>
          <button className="btn-secondary" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="admin-main">
        {currentView === 'calendar' && (
          <CalendarView
            employees={employees}
            schedules={schedules}
            vacations={vacations}
            templates={templates}
            onSaveSchedules={handleSaveSchedules}
            onSaveVacations={handleSaveVacations}
          />
        )}
        {currentView === 'employees' && (
          <EmployeeManagement
            employees={employees}
            onSaveEmployees={handleSaveEmployees}
          />
        )}
        {currentView === 'template' && (
          <TemplateEditor
            employees={employees}
            templates={templates}
            onSaveTemplates={handleSaveTemplates}
          />
        )}
      </main>
    </div>
  );
}

export default AdminPage;

