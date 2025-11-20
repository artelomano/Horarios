# Database Schema Summary

## Tables Overview

### 1. **users**
Authentication and user management.

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `username` - VARCHAR(255) UNIQUE NOT NULL
- `password` - VARCHAR(255) NOT NULL (bcrypt hashed)
- `role` - VARCHAR(50) NOT NULL DEFAULT 'admin'
- `created_at` - TIMESTAMP (auto)
- `updated_at` - TIMESTAMP (auto-updated by trigger)

**Purpose:** Store user credentials for login system.

---

### 2. **employees**
Employee information (internal, external, or service).

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `name` - VARCHAR(255) NOT NULL
- `type` - VARCHAR(50) NOT NULL CHECK (type IN ('internal', 'external', 'service'))
- `role` - VARCHAR(255) (e.g., "Administradora", "Recepcionista")
- `hours_per_week` - DECIMAL(5,2) DEFAULT 0 (only for internal employees)
- `hours_status` - DECIMAL(5,2) DEFAULT 0 (credit/debit hours for internal)
- `comments` - TEXT (special notes, exceptions)
- `color` - VARCHAR(7) DEFAULT '#B3D9FF' (hex color for calendar display)
- `created_at` - TIMESTAMP (auto)
- `updated_at` - TIMESTAMP (auto-updated by trigger)

**Purpose:** Store all employee data including hours tracking for internal employees.

---

### 3. **templates**
Weekly schedule templates that can be applied to months.

**Columns:**
- `id` - VARCHAR(50) PRIMARY KEY (e.g., 'template1', 'template2')
- `name` - VARCHAR(255) NOT NULL
- `data` - JSONB NOT NULL (contains weekly schedule structure)
- `created_at` - TIMESTAMP (auto)
- `updated_at` - TIMESTAMP (auto-updated by trigger)

**Purpose:** Store reusable weekly schedule templates.

**Data Structure (JSONB):**
```json
{
  "monday": {
    "morning": [{ "reception": [] }, { "internal": [], "external": [] }],
    "afternoon": [{ "reception": [] }, { "internal": [], "external": [] }]
  },
  "tuesday": { ... },
  ...
}
```

---

### 4. **schedules**
Monthly schedules for specific dates.

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `month_key` - VARCHAR(7) NOT NULL (format: 'YYYY-MM')
- `date_key` - VARCHAR(10) NOT NULL (format: 'YYYY-MM-DD')
- `morning` - JSONB (array of shift assignments)
- `afternoon` - JSONB (array of shift assignments)
- `created_at` - TIMESTAMP (auto)
- `updated_at` - TIMESTAMP (auto-updated by trigger)
- UNIQUE constraint on (month_key, date_key)

**Purpose:** Store actual schedule assignments for each day.

**Indexes:**
- `idx_schedules_month_key` - For fast month queries
- `idx_schedules_date_key` - For fast date queries

---

### 5. **vacations**
Employee vacation records.

**Columns:**
- `id` - SERIAL PRIMARY KEY
- `year` - INTEGER NOT NULL
- `employee_id` - INTEGER REFERENCES employees(id) ON DELETE CASCADE
- `vacation_type` - VARCHAR(50) (e.g., 'feria', 'agosto', 'navidad', 'libre')
- `dates` - JSONB (array of date strings)
- `created_at` - TIMESTAMP (auto)
- `updated_at` - TIMESTAMP (auto-updated by trigger)

**Purpose:** Track employee vacations by year and type.

**Indexes:**
- `idx_vacations_year` - For fast year queries
- `idx_vacations_employee_id` - For fast employee queries

---

## Indexes

1. `idx_schedules_month_key` - Optimizes queries by month
2. `idx_schedules_date_key` - Optimizes queries by date
3. `idx_vacations_year` - Optimizes vacation queries by year
4. `idx_vacations_employee_id` - Optimizes vacation queries by employee
5. `idx_employees_type` - Optimizes employee queries by type

## Triggers

All tables have an `update_updated_at` trigger that automatically updates the `updated_at` timestamp whenever a row is modified.

**Function:** `update_updated_at_column()`

**Applied to:**
- `users`
- `employees`
- `templates`
- `schedules`
- `vacations`

## Relationships

- `vacations.employee_id` → `employees.id` (Foreign Key with CASCADE DELETE)

## Data Types Used

- **SERIAL** - Auto-incrementing integer (for IDs)
- **VARCHAR(n)** - Variable-length string
- **INTEGER** - Whole numbers
- **DECIMAL(5,2)** - Decimal numbers (for hours)
- **TEXT** - Unlimited length text
- **JSONB** - Binary JSON (for structured data)
- **TIMESTAMP** - Date and time

## Notes

- All tables include `created_at` and `updated_at` for audit trails
- JSONB is used for flexible data structures (templates, schedules, vacations)
- Foreign keys use CASCADE DELETE to maintain referential integrity
- CHECK constraints ensure data validity (e.g., employee type must be one of the allowed values)

