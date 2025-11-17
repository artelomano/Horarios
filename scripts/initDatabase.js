/**
 * Database Initialization Script
 * Initializes database with default employees and schedules
 */
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', 'database.json');

// Helper function to generate HSL color
function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

async function initializeDatabase() {
    console.log('Initializing database with default data...');

    try {
        // Check if database already exists
        let data;
        try {
            const existingData = await fs.readFile(DB_FILE, 'utf8');
            data = JSON.parse(existingData);
            console.log('Database exists, updating with default employees...');
        } catch (error) {
            console.log('Creating new database...');
            // Encrypt default password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash('123456', saltRounds);
            
            data = {
                users: [
                    {
                        username: 'patricia',
                        password: hashedPassword,
                        role: 'admin'
                    }
                ],
                employees: [],
                templates: [
                    { 
                        id: 'template1', 
                        name: 'Template 1',
                        data: {
                            monday: { morning: [], afternoon: [] },
                            tuesday: { morning: [], afternoon: [] },
                            wednesday: { morning: [], afternoon: [] },
                            thursday: { morning: [], afternoon: [] },
                            friday: { morning: [], afternoon: [] }
                        }
                    },
                    { 
                        id: 'template2', 
                        name: 'Template 2',
                        data: {
                            monday: { morning: [], afternoon: [] },
                            tuesday: { morning: [], afternoon: [] },
                            wednesday: { morning: [], afternoon: [] },
                            thursday: { morning: [], afternoon: [] },
                            friday: { morning: [], afternoon: [] }
                        }
                    }
                ],
                schedules: {},
                vacations: {}
            };
        }

        // Initialize default employees if not already present
        if (!data.employees || data.employees.length === 0) {
            console.log('Adding default employees...');
            data.employees = [
                // Internal employees
                { id: 1, name: 'Patricia', type: 'internal', role: 'Administradora', hoursPerWeek: 40, hoursStatus: 0, comments: '', color: '#B3D9FF' },
                { id: 2, name: 'Desi', type: 'internal', role: 'Recepcionista', hoursPerWeek: 36, hoursStatus: 0, comments: 'Hace SIEMPRE 36 horas a la semana. Si debe hacer un turno de 4.5h, le quedan 0.5h de crédito que recupera en turnos posteriores. Controlar el estado de horas.', color: '#FFF4B3' },
                { id: 3, name: 'Lanny', type: 'internal', role: 'Higienista Dental', hoursPerWeek: 40, hoursStatus: 0, comments: '', color: '#B3E5B3' },
                { id: 4, name: 'Maite', type: 'internal', role: 'Higienista', hoursPerWeek: 40, hoursStatus: 0, comments: '', color: '#FFD9B3' },
                // External employees
                { id: 5, name: 'Sergio', type: 'external', role: 'Cirujano', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(200, 50, 80) },
                { id: 6, name: 'Reme', type: 'external', role: 'General y Endodoncias', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(120, 50, 80) },
                { id: 7, name: 'Gloria', type: 'external', role: 'General', hoursPerWeek: 0, hoursStatus: 0, comments: 'Actualmente de baja', color: hslToHex(30, 50, 80) },
                { id: 8, name: 'Carmen', type: 'external', role: 'General', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(280, 50, 80) },
                { id: 9, name: 'Elena', type: 'external', role: 'Ortodoncia', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(340, 50, 80) },
                { id: 10, name: 'Bea', type: 'external', role: 'Prótesis y Periodoncia', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(60, 50, 80) },
                { id: 11, name: 'Armando', type: 'external', role: 'Endodoncia', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(160, 50, 80) },
                { id: 12, name: 'Natalia', type: 'external', role: 'General', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(10, 50, 80) }
            ];
            console.log(`Added ${data.employees.length} default employees`);
        } else {
            console.log(`Database already has ${data.employees.length} employees, skipping...`);
        }

        // Save database
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
        console.log('✅ Database initialized successfully!');
        console.log(`📁 Database file: ${DB_FILE}`);
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

// Run initialization
initializeDatabase();

