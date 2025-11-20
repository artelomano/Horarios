/**
 * Simple Create Tables Script
 * Creates all database tables in correct order
 */
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not set');
  process.exit(1);
}

console.log('🗄️  Creating PostgreSQL tables...\n');
console.log('📡 Connecting to:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected!\n');
    
    // Read schema
    const schemaPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Execute in correct order: tables first, then function, then indexes, then triggers
    console.log('📋 Step 1: Creating tables...\n');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table: users');
    
    // Create employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('internal', 'external', 'service')),
        role VARCHAR(255),
        hours_per_week DECIMAL(5,2) DEFAULT 0,
        hours_status DECIMAL(5,2) DEFAULT 0,
        comments TEXT,
        color VARCHAR(7) DEFAULT '#B3D9FF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table: employees');
    
    // Create templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table: templates');
    
    // Create schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        month_key VARCHAR(7) NOT NULL,
        date_key VARCHAR(10) NOT NULL,
        morning JSONB,
        afternoon JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(month_key, date_key)
      );
    `);
    console.log('✅ Table: schedules');
    
    // Create vacations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vacations (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        vacation_type VARCHAR(50),
        dates JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table: vacations');
    
    console.log('\n📋 Step 2: Creating function...\n');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Function: update_updated_at_column()');
    
    console.log('\n📋 Step 3: Creating indexes...\n');
    await client.query('CREATE INDEX IF NOT EXISTS idx_schedules_month_key ON schedules(month_key);');
    console.log('✅ Index: idx_schedules_month_key');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_schedules_date_key ON schedules(date_key);');
    console.log('✅ Index: idx_schedules_date_key');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_vacations_year ON vacations(year);');
    console.log('✅ Index: idx_vacations_year');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_vacations_employee_id ON vacations(employee_id);');
    console.log('✅ Index: idx_vacations_employee_id');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);');
    console.log('✅ Index: idx_employees_type');
    
    console.log('\n📋 Step 4: Creating triggers...\n');
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger: update_users_updated_at');
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
      CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger: update_employees_updated_at');
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
      CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger: update_templates_updated_at');
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
      CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger: update_schedules_updated_at');
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_vacations_updated_at ON vacations;
      CREATE TRIGGER update_vacations_updated_at BEFORE UPDATE ON vacations
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger: update_vacations_updated_at');
    
    // Verify tables
    console.log('\n🔍 Verifying tables...\n');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`✅ Found ${tables.rows.length} tables:`);
    tables.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    // Verify indexes
    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname;
    `);
    
    console.log(`\n✅ Found ${indexes.rows.length} indexes`);
    
    // Verify triggers
    const triggers = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `);
    
    console.log(`✅ Found ${triggers.rows.length} triggers`);
    
    if (tables.rows.length >= 5) {
      console.log('\n🎉 All tables created successfully!');
      console.log('✅ Database is ready to use!');
    } else {
      console.log('\n⚠️  Some tables may be missing.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
