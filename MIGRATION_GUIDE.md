# PostgreSQL Migration Guide

This guide explains how to migrate from JSON database to PostgreSQL.

## Prerequisites

1. PostgreSQL database created in Railway
2. `DATABASE_URL` environment variable set in Railway

## Migration Steps

### Step 1: Set Environment Variable in Railway

1. Go to your Railway project
2. Select your application service
3. Go to "Variables" tab
4. Add or verify `DATABASE_URL` is set to:
   ```
   postgresql://postgres:xTPpTkIjyzhuichXDJmWYbqIGdqWBRRM@postgres.railway.internal:5432/railway
   ```

### Step 2: Run Database Setup

This will create the schema and default user:

```bash
npm run setup-postgres
```

Or manually:
```bash
node scripts/setupPostgres.js
```

### Step 3: Migrate Data from JSON

This will copy all data from `database.json` to PostgreSQL:

```bash
npm run migrate-data
```

Or manually:
```bash
node database/migrations/002_migrate_data.js
```

### Step 4: Verify Migration

1. Start the server: `npm start`
2. Check that the application works correctly
3. Verify data appears in the UI

## Manual Schema Execution (Alternative)

If you prefer to run SQL manually:

```bash
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
```

## Troubleshooting

### Connection Errors

- Verify `DATABASE_URL` is set correctly
- Check that PostgreSQL service is running in Railway
- Ensure SSL is enabled (Railway requires it)

### Migration Errors

- Make sure schema is created first (`npm run setup-postgres`)
- Check that `database.json` exists and has data
- Review error messages in console

### Data Not Appearing

- Check PostgreSQL logs in Railway
- Verify data was inserted: `SELECT COUNT(*) FROM employees;`
- Check for constraint violations

## Rollback

If you need to rollback to JSON:

1. Remove `DATABASE_URL` from environment variables
2. Restore old `server.js` (if you have a backup)
3. The application will fall back to JSON if `DATABASE_URL` is not set

## Notes

- The migration script is idempotent (safe to run multiple times)
- Existing data in PostgreSQL will be preserved
- The JSON file is kept as backup but no longer used

