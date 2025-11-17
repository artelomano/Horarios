/**
 * Express Server
 * Serves the React application and provides API endpoints
 */
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'database.json');
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'horarios-patri-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Read database
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If doesn't exist, create initial structure
        console.log('Creating initial database.json...');
        
        // Encrypt default password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('123456', saltRounds);
        
        const initialData = {
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
        await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

// Write database
async function writeDatabase(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== AUTHENTICATION ROUTES ==========

// POST: Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }
        
        const data = await readDatabase();
        const users = data.users || [];
        const user = users.find(u => u.username === username.toLowerCase());
        
        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }
        
        // Create session
        req.session.authenticated = true;
        req.session.username = user.username;
        req.session.role = user.role;
        
        res.json({ 
            success: true, 
            message: 'Login exitoso',
            user: {
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al procesar el login' });
    }
});

// GET: Check session
app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.authenticated) {
        res.json({ 
            authenticated: true,
            username: req.session.username,
            role: req.session.role
        });
    } else {
        res.json({ authenticated: false });
    }
});

// POST: Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        res.json({ success: true, message: 'Sesión cerrada correctamente' });
    });
});

// ========== PUBLIC ROUTES (READ-ONLY) ==========

// GET: Get public schedules
app.get('/api/public/schedules', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.schedules || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get public templates
app.get('/api/public/templates', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.templates || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get public employees
app.get('/api/public/employees', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.employees || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get public vacations
app.get('/api/public/vacations', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.vacations || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PROTECTED ROUTES (REQUIRE AUTHENTICATION) ==========

// GET: Get all data (protected)
app.get('/api/data', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get employees (protected)
app.get('/api/employees', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.employees || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save employees (protected)
app.post('/api/employees', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        data.employees = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Empleados guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get templates (protected)
app.get('/api/templates', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.templates || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save templates (protected)
app.post('/api/templates', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        data.templates = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Templates guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get schedules (protected)
app.get('/api/schedules', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.schedules || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save schedules (protected)
app.post('/api/schedules', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        data.schedules = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Horarios guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get vacations (protected)
app.get('/api/vacations', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.vacations || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save vacations (protected)
app.post('/api/vacations', requireAuth, async (req, res) => {
    try {
        const data = await readDatabase();
        data.vacations = req.body;
        await writeDatabase(data);
        res.json({ success: true, message: 'Vacaciones guardadas correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from React build in production
if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
        // Don't serve React app for API routes
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    // In development, serve old HTML files for backward compatibility
    app.use(express.static(__dirname));
    
    // Redirect root to login
    app.get('/', (req, res) => {
        res.redirect('/login.html');
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Database: ${DB_FILE}`);
    console.log(`🔐 Login: http://localhost:${PORT}/login.html`);
    console.log(`👁️  Public view: http://localhost:${PORT}/public.html`);
    if (isProduction) {
        console.log(`📦 Serving React build from: ${path.join(__dirname, 'dist')}`);
    }
});
