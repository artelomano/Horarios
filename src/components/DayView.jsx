/**
 * Day View Component
 * Displays a single day with morning and afternoon shifts
 */
import React from 'react';
import { formatDate } from '../utils/dateUtils.js';
import ShiftView from './ShiftView.jsx';
import './DayView.css';

function DayView({
  date,
  dayLabel,
  employees,
  schedule,
  vacations,
  onSaveSchedules,
  onSaveVacations,
  readOnly = false,
}) {
  const dateKey = formatDate(date);
  const dayNumber = date.getDate();

  const morningShifts = schedule?.morning || [];
  const afternoonShifts = schedule?.afternoon || [];

  return (
    <div className="day-view">
      <div className="day-header">
        <span className="day-label">{dayLabel}</span>
        <span className="day-number">{dayNumber}</span>
      </div>
      <div className="day-shifts">
        <div className="shift-section">
          <div className="shift-label">M</div>
          <ShiftView
            shifts={morningShifts}
            employees={employees}
            dateKey={dateKey}
            shiftType="morning"
            onSaveSchedules={onSaveSchedules}
            readOnly={readOnly}
          />
        </div>
        <div className="shift-separator"></div>
        <div className="shift-section">
          <div className="shift-label">T</div>
          <ShiftView
            shifts={afternoonShifts}
            employees={employees}
            dateKey={dateKey}
            shiftType="afternoon"
            onSaveSchedules={onSaveSchedules}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

export default DayView;

