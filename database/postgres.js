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
 * Railway automatically injects DATABASE_URL when PostgreSQL service is connected
 * Returns null if connection info is not available (allows app to start without DB)
 */
function buildConnectionString() {
  // Priority 1: DATABASE_URL (Railway automatically provides this)
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DATABASE_URL from environment');
    return process.env.DATABASE_URL;
  }
  
  // Priority 2: Build from individual Railway variables
  // Railway also provides these when PostgreSQL service is connected
  const pgUser = process.env.PGUSER || process.env.POSTGRES_USER || 'postgres';
  const pgPassword = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const pgHost = process.env.RAILWAY_PRIVATE_DOMAIN || process.env.PGHOST;
  const pgPort = process.env.PGPORT || '5432';
  const pgDatabase = process.env.PGDATABASE || process.env.POSTGRES_DB || 'railway';
  
  // If we don't have required fields, return null (don't throw error)
  if (!pgPassword || !pgHost) {
    console.warn('⚠️  PostgreSQL connection info not available');
    console.warn('   Railway should automatically provide DATABASE_URL when PostgreSQL service is connected');
    console.warn('   App will start but database operations will fail until DATABASE_URL is set');
    return null;
  }
  
  const connectionString = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
  console.log('✅ Built connection string from individual variables');
  return connectionString;
}

/**
 * Initialize database connection pool
 * Handles Railway PostgreSQL connection with proper SSL configuration
 * Returns null if connection info is not available (allows app to start)
 */
export function initDatabase() {
  if (pool) {
    return pool;
  }

  const connectionString = buildConnectionString();
  
  // If no connection string available, return null (don't crash)
  if (!connectionString) {
    console.warn('⚠️  Database connection not available - app will start but DB operations will fail');
    return null;
  }

  try {
    console.log('🗄️  Initializing PostgreSQL connection pool...');
    
    // Determine SSL requirements
    // Railway requires SSL for:
    // 1. Internal connections (railway.internal)
    // 2. External connections (metro.proxy.rlwy.net, etc.) in production
    const isRailway = connectionString.includes('railway.internal') || 
                      connectionString.includes('railway.app') ||
                      connectionString.includes('rlwy.net');
    const needsSSL = isRailway || process.env.NODE_ENV === 'production';
    
    if (needsSSL) {
      console.log('🔒 SSL enabled for Railway connection');
    }
    
    pool = new Pool({
      connectionString,
      ssl: needsSSL ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout for Railway
      // Retry configuration
      allowExitOnIdle: true,
    });

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err.message);
      // Don't exit immediately, let the app try to recover
      console.error('   Attempting to reconnect...');
    });

    // Test connection on initialization (async, don't block)
    pool.query('SELECT NOW()')
      .then(() => {
        console.log('✅ PostgreSQL connection established successfully');
      })
      .catch((err) => {
        console.error('❌ PostgreSQL connection test failed:', err.message);
        console.error('   App will continue but database operations may fail');
        console.error('   Make sure DATABASE_URL is set in Railway variables');
      });

    return pool;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('   App will continue but database operations will fail');
    return null; // Don't throw, allow app to start
  }
}

/**
 * Get database pool (initialize if needed)
 * Returns null if database is not available
 */
export function getPool() {
  if (!pool) {
    pool = initDatabase();
  }
  return pool;
}

/**
 * Execute a query with retry logic for connection issues
 * Throws error if database is not available
 */
export async function query(text, params) {
  const pool = getPool();
  
  if (!pool) {
    throw new Error('Database connection not available. Please set DATABASE_URL in Railway environment variables.');
  }
  
  const start = Date.now();
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Only log slow queries or errors
      if (duration > 1000) {
        console.log(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return res;
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection error that might be retryable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('connection')) {
        if (attempt < maxRetries) {
          console.warn(`⚠️  Connection error, retrying (${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
      }
      
      // Non-retryable error or max retries reached
      console.error('❌ Database query error:', error.message);
      console.error('   Query:', text.substring(0, 200));
      throw error;
    }
  }
  
  throw lastError;
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

