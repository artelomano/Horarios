/**
 * Database Operations Module
 * Provides high-level functions for database operations
 */
import { query, transaction } from './postgres.js';

// ========== USERS ==========

export async function getUserByUsername(username) {
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username.toLowerCase()]);
    return result.rows[0] || null;
  } catch (error) {
    // Re-throw with more context
    if (error.message.includes('Database connection not available')) {
      throw new Error('Database connection not available. Please set DATABASE_URL in Railway environment variables.');
    }
    throw error;
  }
}

export async function createUser(username, password, role = 'admin') {
  const result = await query(
    'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *',
    [username.toLowerCase(), password, role]
  );
  return result.rows[0];
}

// ========== EMPLOYEES ==========

export async function getAllEmployees() {
  const result = await query('SELECT * FROM employees ORDER BY id');
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    role: row.role,
    hoursPerWeek: parseFloat(row.hours_per_week) || 0,
    hoursStatus: parseFloat(row.hours_status) || 0,
    comments: row.comments || '',
    color: row.color || '#B3D9FF'
  }));
}

export async function saveEmployees(employees) {
  return await transaction(async (client) => {
    // Delete all existing employees
    await client.query('DELETE FROM employees');
    
    // Insert new employees
    for (const emp of employees) {
      await client.query(
        `INSERT INTO employees (id, name, type, role, hours_per_week, hours_status, comments, color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          emp.id,
          emp.name,
          emp.type,
          emp.role || null,
          emp.hoursPerWeek || 0,
          emp.hoursStatus || 0,
          emp.comments || '',
          emp.color || '#B3D9FF'
        ]
      );
    }
    
    return { success: true };
  });
}

// ========== TEMPLATES ==========

export async function getAllTemplates() {
  const result = await query('SELECT * FROM templates ORDER BY id');
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    data: row.data
  }));
}

export async function saveTemplates(templates) {
  return await transaction(async (client) => {
    // Delete all existing templates
    await client.query('DELETE FROM templates');
    
    // Insert new templates
    for (const template of templates) {
      await client.query(
        'INSERT INTO templates (id, name, data) VALUES ($1, $2, $3)',
        [template.id, template.name, JSON.stringify(template.data)]
      );
    }
    
    return { success: true };
  });
}

// ========== SCHEDULES ==========

export async function getAllSchedules() {
  const result = await query('SELECT * FROM schedules ORDER BY month_key, date_key');
  const schedules = {};
  
  for (const row of result.rows) {
    if (!schedules[row.month_key]) {
      schedules[row.month_key] = {};
    }
    schedules[row.month_key][row.date_key] = {
      morning: row.morning || [],
      afternoon: row.afternoon || []
    };
  }
  
  return schedules;
}

export async function saveSchedules(schedules) {
  return await transaction(async (client) => {
    // Delete all existing schedules
    await client.query('DELETE FROM schedules');
    
    // Insert new schedules
    for (const [monthKey, monthData] of Object.entries(schedules)) {
      for (const [dateKey, schedule] of Object.entries(monthData)) {
        await client.query(
          'INSERT INTO schedules (month_key, date_key, morning, afternoon) VALUES ($1, $2, $3, $4)',
          [
            monthKey,
            dateKey,
            JSON.stringify(schedule.morning || []),
            JSON.stringify(schedule.afternoon || [])
          ]
        );
      }
    }
    
    return { success: true };
  });
}

// ========== VACATIONS ==========

export async function getAllVacations() {
  const result = await query('SELECT * FROM vacations ORDER BY year, employee_id');
  const vacations = {};
  
  for (const row of result.rows) {
    if (!vacations[row.year]) {
      vacations[row.year] = {};
    }
    if (!vacations[row.year][row.employee_id]) {
      vacations[row.year][row.employee_id] = {};
    }
    vacations[row.year][row.employee_id][row.vacation_type] = row.dates || [];
  }
  
  return vacations;
}

export async function saveVacations(vacations) {
  return await transaction(async (client) => {
    // Delete all existing vacations
    await client.query('DELETE FROM vacations');
    
    // Insert new vacations
    for (const [year, yearData] of Object.entries(vacations)) {
      for (const [employeeId, vacationData] of Object.entries(yearData)) {
        for (const [vacationType, dates] of Object.entries(vacationData)) {
          if (Array.isArray(dates) && dates.length > 0) {
            await client.query(
              'INSERT INTO vacations (year, employee_id, vacation_type, dates) VALUES ($1, $2, $3, $4)',
              [parseInt(year), parseInt(employeeId), vacationType, JSON.stringify(dates)]
            );
          }
        }
      }
    }
    
    return { success: true };
  });
}

