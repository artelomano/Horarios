const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir archivos estáticos (HTML, CSS, JS)

// Leer base de datos
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si no existe, crear estructura inicial
        console.log('Creando database.json inicial...');
        const initialData = {
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
        await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

// Escribir base de datos
async function writeDatabase(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET: Obtener todos los datos
app.get('/api/data', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Obtener empleados
app.get('/api/employees', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.employees || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Guardar empleados
app.post('/api/employees', async (req, res) => {
    try {
        const data = await readDatabase();
        data.employees = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Empleados guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Obtener templates
app.get('/api/templates', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.templates || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Guardar templates
app.post('/api/templates', async (req, res) => {
    try {
        const data = await readDatabase();
        data.templates = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Templates guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Obtener schedules
app.get('/api/schedules', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.schedules || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Guardar schedules
app.post('/api/schedules', async (req, res) => {
    try {
        const data = await readDatabase();
        data.schedules = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Horarios guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Obtener vacations
app.get('/api/vacations', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.vacations || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Guardar vacations
app.post('/api/vacations', async (req, res) => {
    try {
        const data = await readDatabase();
        data.vacations = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Vacaciones guardadas correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Base de datos: ${DB_FILE}`);
});

