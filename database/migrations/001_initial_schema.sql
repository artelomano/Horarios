-- Initial Database Schema for Horarios Patri
-- Run this script to create all necessary tables

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: employees
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

-- Table: templates
CREATE TABLE IF NOT EXISTS templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: schedules
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    date_key VARCHAR(10) NOT NULL, -- 'YYYY-MM-DD'
    morning JSONB,
    afternoon JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month_key, date_key)
);

-- Table: vacations
CREATE TABLE IF NOT EXISTS vacations (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    vacation_type VARCHAR(50), -- 'feria', 'agosto', 'navidad', 'libre'
    dates JSONB, -- Array of date strings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_month_key ON schedules(month_key);
CREATE INDEX IF NOT EXISTS idx_schedules_date_key ON schedules(date_key);
CREATE INDEX IF NOT EXISTS idx_vacations_year ON vacations(year);
CREATE INDEX IF NOT EXISTS idx_vacations_employee_id ON vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacations_updated_at BEFORE UPDATE ON vacations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

