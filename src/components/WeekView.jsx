/**
 * Week View Component
 * Displays a week row in the calendar
 */
import React from 'react';
import DayView from './DayView.jsx';
import { WEEKDAY_SHORT } from '../utils/constants.js';
import './WeekView.css';

function WeekView({
  week,
  employees,
  schedules,
  vacations,
  monthKey,
  onSaveSchedules,
  onSaveVacations,
  readOnly = false,
}) {
  return (
    <div className="week-view">
      {week.map((date, dayIndex) => {
        if (date === null) {
          return <div key={dayIndex} className="day-placeholder"></div>;
        }

        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const daySchedule = schedules[monthKey]?.[dateKey] || null;
        const dayOfWeek = date.getDay();
        const dayLabel = dayOfWeek >= 1 && dayOfWeek <= 5 ? WEEKDAY_SHORT[dayOfWeek - 1] : '';

        return (
          <DayView
            key={dateKey}
            date={date}
            dayLabel={dayLabel}
            employees={employees}
            schedule={daySchedule}
            vacations={vacations}
            onSaveSchedules={onSaveSchedules}
            onSaveVacations={onSaveVacations}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}

export default WeekView;

