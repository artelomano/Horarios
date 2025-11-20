/**
 * Create Tables Script
 * Creates all database tables directly using the SQL schema
 */
import { initDatabase, query } from '../database/postgres.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createTables() {
  console.log('🗄️  Creating database tables...\n');
  
  try {
    // Initialize database connection
    console.log('📡 Connecting to database...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ ERROR: DATABASE_URL environment variable is not set');
      console.error('   Please set DATABASE_URL or Railway environment variables');
      console.error('   Example: DATABASE_URL="postgresql://user:pass@host:port/db"');
      process.exit(1);
    }
    
    try {
      initDatabase();
      // Test connection with a simple query
      await query('SELECT NOW()');
      console.log('✅ Connected successfully\n');
    } catch (connError) {
      console.error('❌ Connection failed:', connError.message);
      console.error('   Check your DATABASE_URL or Railway credentials');
      throw connError;
    }
    
    // Read schema SQL file
    const schemaPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    console.log('📄 Reading schema file...');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Split into individual statements
    // Remove comments and empty lines, then split by semicolons
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .map(s => s.replace(/--.*$/gm, '').trim()) // Remove inline comments
      .filter(s => s.length > 0);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.length < 10) continue;
      
      try {
        // Extract statement type for logging
        let statementType = 'Statement';
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
          statementType = match ? `Table: ${match[1]}` : 'CREATE TABLE';
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          const match = statement.match(/CREATE INDEX.*?ON (\w+)/i);
          statementType = match ? `Index on ${match[1]}` : 'CREATE INDEX';
        } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
          const match = statement.match(/CREATE TRIGGER (\w+)/i);
          statementType = match ? `Trigger: ${match[1]}` : 'CREATE TRIGGER';
        } else if (statement.toUpperCase().includes('CREATE FUNCTION')) {
          statementType = 'Function';
        }
        
        console.log(`[${i + 1}/${statements.length}] Creating ${statementType}...`);
        await query(statement);
        console.log(`✅ ${statementType} created successfully\n`);
        successCount++;
        
      } catch (error) {
        // Ignore "already exists" errors (idempotent)
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.code === '42P07' || // duplicate_table
            error.code === '42710') { // duplicate_object
          console.log(`ℹ️  ${statementType} already exists (skipping)\n`);
          successCount++;
        } else {
          console.error(`❌ Error creating ${statementType}:`, error.message);
          console.error(`   Statement: ${statement.substring(0, 100)}...\n`);
          errorCount++;
        }
      }
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`✅ Successful: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount}`);
    }
    console.log('='.repeat(60));
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n✅ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    // Verify indexes
    console.log('\n🔍 Verifying indexes...');
    const indexesResult = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY indexname;
    `);
    
    console.log(`\n✅ Found ${indexesResult.rows.length} indexes`);
    
    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error creating tables:', error);
    console.error('Details:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

export default createTables;

