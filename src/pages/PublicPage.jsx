/**
 * Public Page Component
 * Read-only view of schedules
 */
import React, { useState, useEffect } from 'react';
import { publicAPI } from '../services/api.js';
import CalendarView from '../components/CalendarView.jsx';
import './PublicPage.css';

function PublicPage() {
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [vacations, setVacations] = useState({});
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      console.log('Loading public data...');
      const [employeesData, schedulesData, vacationsData, templatesData] = await Promise.all([
        publicAPI.getEmployees(),
        publicAPI.getSchedules(),
        publicAPI.getVacations(),
        publicAPI.getTemplates(),
      ]);

      setEmployees(employeesData);
      setSchedules(schedulesData);
      setVacations(vacationsData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading public data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="public-container">
      <header className="public-header">
        <h1>Horarios de la Clínica</h1>
        <p>Vista pública - Solo lectura</p>
      </header>
      <div className="public-note">
        Esta es una vista pública de solo lectura. Para editar horarios,{' '}
        <a href="/login.html">inicia sesión</a>.
      </div>
      <CalendarView
        employees={employees}
        schedules={schedules}
        vacations={vacations}
        templates={templates}
        readOnly={true}
      />
    </div>
  );
}

export default PublicPage;

