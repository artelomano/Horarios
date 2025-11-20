/**
 * Show Database Schema
 * Displays the SQL schema that will be created
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function showSchema() {
  console.log('📋 Database Schema for Horarios Patri\n');
  console.log('='.repeat(60));
  
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Extract table definitions
    const tables = [];
    const lines = schemaSQL.split('\n');
    let currentTable = null;
    let inTable = false;
    
    for (const line of lines) {
      // Find CREATE TABLE statements
      if (line.trim().startsWith('CREATE TABLE')) {
        const match = line.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        if (match) {
          currentTable = {
            name: match[1],
            columns: [],
            indexes: [],
            constraints: []
          };
          tables.push(currentTable);
          inTable = true;
        }
      }
      
      // Find column definitions (inside CREATE TABLE)
      if (inTable && currentTable && line.trim() && !line.trim().startsWith('--') && !line.trim().startsWith('CREATE')) {
        if (line.includes('PRIMARY KEY') || line.includes('FOREIGN KEY') || line.includes('UNIQUE') || line.includes('CHECK')) {
          currentTable.constraints.push(line.trim());
        } else if (line.trim().startsWith('id SERIAL PRIMARY KEY') || line.includes('VARCHAR') || line.includes('INTEGER') || line.includes('DECIMAL') || line.includes('TEXT') || line.includes('JSONB') || line.includes('TIMESTAMP')) {
          currentTable.columns.push(line.trim().replace(/,$/, ''));
        }
      }
      
      // End of table
      if (line.trim() === ');') {
        inTable = false;
      }
      
      // Find indexes
      if (line.trim().startsWith('CREATE INDEX')) {
        const match = line.match(/CREATE INDEX.*?ON (\w+)\(/i);
        if (match && currentTable) {
          currentTable.indexes.push(line.trim());
        }
      }
    }
    
    // Display tables
    console.log('\n📊 TABLES TO BE CREATED:\n');
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name.toUpperCase()}`);
      console.log('-'.repeat(60));
      
      if (table.columns.length > 0) {
        console.log('\n  Columns:');
        table.columns.forEach(col => {
          console.log(`    • ${col}`);
        });
      }
      
      if (table.constraints.length > 0) {
        console.log('\n  Constraints:');
        table.constraints.forEach(constraint => {
          console.log(`    • ${constraint.substring(0, 80)}${constraint.length > 80 ? '...' : ''}`);
        });
      }
      
      console.log('');
    });
    
    // Show indexes
    console.log('\n📑 INDEXES:\n');
    const indexLines = schemaSQL.match(/CREATE INDEX.*?;/g) || [];
    indexLines.forEach((idx, i) => {
      console.log(`${i + 1}. ${idx.trim()}`);
    });
    
    // Show triggers
    console.log('\n⚙️  TRIGGERS:\n');
    const triggerLines = schemaSQL.match(/CREATE TRIGGER \w+ BEFORE UPDATE ON \w+/g) || [];
    triggerLines.forEach((trg, i) => {
      const match = trg.match(/CREATE TRIGGER (\w+) BEFORE UPDATE ON (\w+)/);
      if (match) {
        console.log(`${i + 1}. ${match[1]} → Updates ${match[2]}.updated_at automatically`);
      }
    });
    
    // Show function
    console.log('\n🔧 FUNCTIONS:\n');
    if (schemaSQL.includes('update_updated_at_column')) {
      console.log('1. update_updated_at_column() - Auto-updates updated_at timestamp');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Total tables:', tables.length);
    console.log('✅ Total indexes:', indexLines.length);
    console.log('✅ Total triggers:', triggerLines.length);
    console.log('\n💡 To see the full SQL, check: database/migrations/001_initial_schema.sql\n');
    
  } catch (error) {
    console.error('❌ Error reading schema:', error.message);
    process.exit(1);
  }
}

showSchema();

