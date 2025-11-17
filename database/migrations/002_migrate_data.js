/**
 * Data Migration Script
 * Migrates data from database.json to PostgreSQL
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, query, transaction } from '../postgres.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_JSON_FILE = path.join(__dirname, '..', 'database.json');

async function migrateData() {
  console.log('Starting data migration from JSON to PostgreSQL...');
  
  try {
    // Initialize database connection
    initDatabase();
    
    // Read JSON database
    console.log('Reading database.json...');
    const jsonData = JSON.parse(await fs.readFile(DB_JSON_FILE, 'utf8'));
    
    // Migrate users
    if (jsonData.users && jsonData.users.length > 0) {
      console.log(`Migrating ${jsonData.users.length} users...`);
      for (const user of jsonData.users) {
        await query(
          'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
          [user.username, user.password, user.role || 'admin']
        );
      }
      console.log('Users migrated successfully');
    }
    
    // Migrate employees
    if (jsonData.employees && jsonData.employees.length > 0) {
      console.log(`Migrating ${jsonData.employees.length} employees...`);
      for (const emp of jsonData.employees) {
        await query(
          `INSERT INTO employees (id, name, type, role, hours_per_week, hours_status, comments, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           role = EXCLUDED.role,
           hours_per_week = EXCLUDED.hours_per_week,
           hours_status = EXCLUDED.hours_status,
           comments = EXCLUDED.comments,
           color = EXCLUDED.color`,
          [
            emp.id,
            emp.name,
            emp.type,
            emp.role || null,
            emp.hoursPerWeek || 0,
            emp.hoursStatus || 0,
            emp.comments || null,
            emp.color || '#B3D9FF'
          ]
        );
      }
      console.log('Employees migrated successfully');
    }
    
    // Migrate templates
    if (jsonData.templates && jsonData.templates.length > 0) {
      console.log(`Migrating ${jsonData.templates.length} templates...`);
      for (const template of jsonData.templates) {
        await query(
          'INSERT INTO templates (id, name, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data',
          [template.id, template.name, JSON.stringify(template.data)]
        );
      }
      console.log('Templates migrated successfully');
    }
    
    // Migrate schedules
    if (jsonData.schedules && Object.keys(jsonData.schedules).length > 0) {
      console.log('Migrating schedules...');
      let scheduleCount = 0;
      
      for (const [monthKey, monthData] of Object.entries(jsonData.schedules)) {
        for (const [dateKey, schedule] of Object.entries(monthData)) {
          await query(
            `INSERT INTO schedules (month_key, date_key, morning, afternoon)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (month_key, date_key) DO UPDATE SET
             morning = EXCLUDED.morning,
             afternoon = EXCLUDED.afternoon`,
            [
              monthKey,
              dateKey,
              JSON.stringify(schedule.morning || []),
              JSON.stringify(schedule.afternoon || [])
            ]
          );
          scheduleCount++;
        }
      }
      console.log(`Migrated ${scheduleCount} schedule entries`);
    }
    
    // Migrate vacations
    if (jsonData.vacations && Object.keys(jsonData.vacations).length > 0) {
      console.log('Migrating vacations...');
      let vacationCount = 0;
      
      for (const [year, yearData] of Object.entries(jsonData.vacations)) {
        for (const [employeeId, vacationData] of Object.entries(yearData)) {
          for (const [vacationType, dates] of Object.entries(vacationData)) {
            if (Array.isArray(dates) && dates.length > 0) {
              await query(
                'INSERT INTO vacations (year, employee_id, vacation_type, dates) VALUES ($1, $2, $3, $4)',
                [parseInt(year), parseInt(employeeId), vacationType, JSON.stringify(dates)]
              );
              vacationCount++;
            }
          }
        }
      }
      console.log(`Migrated ${vacationCount} vacation entries`);
    }
    
    console.log('✅ Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default migrateData;

