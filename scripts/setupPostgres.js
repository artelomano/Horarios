/**
 * PostgreSQL Setup Script
 * Creates schema and initial user
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, query } from '../database/postgres.js';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupPostgres() {
  console.log('Setting up PostgreSQL database...');
  
  try {
    // Initialize database connection
    initDatabase();
    
    // Read and execute schema SQL
    console.log('Creating database schema...');
    const schemaPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Execute schema (split by semicolons for multiple statements)
    const statements = schemaSQL.split(';').filter(s => s.trim().length > 0);
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn('Schema statement warning:', error.message);
          }
        }
      }
    }
    
    console.log('Schema created successfully');
    
    // Check if default user exists
    const existingUser = await query('SELECT * FROM users WHERE username = $1', ['patricia']);
    
    if (existingUser.rows.length === 0) {
      console.log('Creating default user...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('123456', saltRounds);
      
      await query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['patricia', hashedPassword, 'admin']
      );
      console.log('Default user created: patricia / 123456');
    } else {
      console.log('Default user already exists');
    }
    
    console.log('✅ PostgreSQL setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up PostgreSQL:', error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupPostgres()
    .then(() => {
      console.log('Setup finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export default setupPostgres;

