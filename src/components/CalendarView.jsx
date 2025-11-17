/**
 * Calendar View Component
 * Main calendar component that displays monthly schedule
 */
import React, { useState, useEffect } from 'react';
import { getDatesInMonth, formatMonth, getMonthName } from '../utils/dateUtils.js';
import WeekView from './WeekView.jsx';
import './CalendarView.css';

function CalendarView({
  employees,
  schedules,
  vacations,
  templates,
  onSaveSchedules,
  onSaveVacations,
  readOnly = false,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = formatMonth(currentDate);
  const monthName = getMonthName(month);

  // Get all weeks in the month
  const getWeeksInMonth = () => {
    const dates = getDatesInMonth(year, month);
    const weeks = [];
    let currentWeek = [];

    dates.forEach((date) => {
      const dayOfWeek = date.getDay();
      
      // Start new week on Monday (1) or if it's the first day
      if (dayOfWeek === 1 || currentWeek.length === 0) {
        if (currentWeek.length > 0) {
          weeks.push(currentWeek);
        }
        currentWeek = [];
      }

      // Add padding for days before Monday
      if (currentWeek.length === 0 && dayOfWeek !== 1) {
        for (let i = 1; i < dayOfWeek; i++) {
          currentWeek.push(null);
        }
      }

      currentWeek.push(date);

      // End week on Sunday or last day of month
      if (dayOfWeek === 0 || date.getDate() === dates[dates.length - 1].getDate()) {
        // Add padding for days after Friday
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  };

  const weeks = getWeeksInMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="calendar-view">
      <div className="calendar-controls">
        <button className="btn-secondary" onClick={handlePrevMonth}>
          ← Anterior
        </button>
        <h2>{monthName} {year}</h2>
        <button className="btn-secondary" onClick={handleNextMonth}>
          Siguiente →
        </button>
      </div>

      <div className="calendar-grid">
        {weeks.map((week, weekIndex) => (
          <WeekView
            key={weekIndex}
            week={week}
            employees={employees}
            schedules={schedules}
            vacations={vacations}
            monthKey={monthKey}
            onSaveSchedules={onSaveSchedules}
            onSaveVacations={onSaveVacations}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

export default CalendarView;

