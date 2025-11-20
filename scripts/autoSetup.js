/**
 * Auto Setup Script
 * Automatically sets up database schema and default user on first run
 * This runs silently and only creates what's missing
 */
import { initDatabase, query } from '../database/postgres.js';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let setupComplete = false;

async function autoSetup() {
  // Only run once
  if (setupComplete) return;
  
  try {
    console.log('🔧 Checking database setup...');
    
    // Initialize database connection with error handling
    try {
      initDatabase();
    } catch (connError) {
      console.error('⚠️  Database connection error:', connError.message);
      console.error('   This is normal if DATABASE_URL is not set yet');
      console.error('   The app will work once Railway provides DATABASE_URL');
      setupComplete = true;
      return; // Don't fail, let the app start
    }
    
    // Check if tables exist by trying to query users table
    try {
      await query('SELECT 1 FROM users LIMIT 1');
      console.log('✅ Database schema already exists');
      setupComplete = true;
      return;
    } catch (error) {
      // Table doesn't exist, need to create schema
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('📋 Creating database schema...');
        await createSchema();
        console.log('✅ Schema created successfully');
      } else if (error.message.includes('connection') || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        // Connection error - don't fail, just log
        console.warn('⚠️  Could not connect to database. Will retry on next request.');
        setupComplete = true;
        return;
      } else {
        // Other error - log but don't fail
        console.warn('⚠️  Database setup warning:', error.message);
        setupComplete = true;
        return;
      }
    }
    
    // Check if default user exists
    const userCheck = await query('SELECT * FROM users WHERE username = $1', ['patricia']);
    if (userCheck.rows.length === 0) {
      console.log('👤 Creating default user...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('123456', saltRounds);
      await query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['patricia', hashedPassword, 'admin']
      );
      console.log('✅ Default user created (patricia / 123456)');
    } else {
      console.log('✅ Default user already exists');
    }
    
    setupComplete = true;
    console.log('✅ Database setup complete');
    
  } catch (error) {
    // Don't throw error, just log it
    // This allows the server to start even if setup fails
    console.error('⚠️  Database setup warning:', error.message);
    console.log('ℹ️  Server will continue, but database operations may fail');
  }
}

async function createSchema() {
  const schemaPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
  const schemaSQL = await fs.readFile(schemaPath, 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (statement) {
      try {
        await query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate') &&
            !error.code?.startsWith('42')) {
          console.warn('Schema statement warning:', error.message);
        }
      }
    }
  }
}

export default autoSetup;

