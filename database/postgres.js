/**
 * PostgreSQL Database Client
 * Handles all database connections and queries
 */
import pg from 'pg';
const { Pool } = pg;

// Create connection pool
let pool = null;

/**
 * Build database connection string from Railway environment variables
 */
function buildConnectionString() {
  // If DATABASE_URL is directly provided, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Otherwise, build from Railway environment variables
  const pgUser = process.env.PGUSER || process.env.POSTGRES_USER || 'postgres';
  const pgPassword = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const pgHost = process.env.RAILWAY_PRIVATE_DOMAIN || process.env.PGHOST || 'localhost';
  const pgPort = process.env.PGPORT || '5432';
  const pgDatabase = process.env.PGDATABASE || process.env.POSTGRES_DB || 'railway';
  
  if (!pgPassword) {
    throw new Error('PostgreSQL password not found. Set DATABASE_URL or POSTGRES_PASSWORD');
  }
  
  return `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
}

/**
 * Initialize database connection pool
 */
export function initDatabase() {
  if (pool) {
    return pool;
  }

  const connectionString = buildConnectionString();
  
  console.log('Database connection string built from environment variables');

  console.log('Initializing PostgreSQL connection pool...');
  
  // Railway requires SSL for internal connections
  const needsSSL = connectionString.includes('railway.internal') || process.env.NODE_ENV === 'production';
  
  pool = new Pool({
    connectionString,
    ssl: needsSSL ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  return pool;
}

/**
 * Get database pool (initialize if needed)
 */
export function getPool() {
  if (!pool) {
    return initDatabase();
  }
  return pool;
}

/**
 * Execute a query
 */
export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

