/**
 * Express Server
 * Serves the React application and provides API endpoints
 */
import express from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { initDatabase, closePool } from './database/postgres.js';
import * as db from './database/db.js';
import autoSetup from './scripts/autoSetup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize database connection and run auto-setup (non-blocking)
// App will start even if database is not available
try {
  const dbPool = initDatabase();
  if (dbPool) {
    autoSetup().catch(err => {
      console.error('Auto-setup error:', err);
    });
  } else {
    console.warn('⚠️  Database not available - app will start but DB operations will fail');
    console.warn('   Set DATABASE_URL in Railway environment variables');
  }
} catch (err) {
  console.error('Database initialization error:', err.message);
  console.error('App will continue but database operations will fail');
}

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

// Database operations now use PostgreSQL via db.js module

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
        
        try {
            const user = await db.getUserByUsername(username);
            
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
        } catch (dbError) {
            // Database connection error
            if (dbError.message.includes('Database connection not available') || 
                dbError.message.includes('not available')) {
                console.error('❌ Database not available for login:', dbError.message);
                return res.status(503).json({ 
                    error: 'Base de datos no disponible. Por favor, verifica la configuración de DATABASE_URL en Railway.' 
                });
            }
            throw dbError; // Re-throw other database errors
        }
    } catch (error) {
        console.error('Error en login:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ error: 'Error al procesar el login: ' + error.message });
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
        const schedules = await db.getAllSchedules();
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get public templates
app.get('/api/public/templates', async (req, res) => {
    try {
        const templates = await db.getAllTemplates();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get public employees
app.get('/api/public/employees', async (req, res) => {
    try {
        const employees = await db.getAllEmployees();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get public vacations
app.get('/api/public/vacations', async (req, res) => {
    try {
        const vacations = await db.getAllVacations();
        res.json(vacations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== PROTECTED ROUTES (REQUIRE AUTHENTICATION) ==========

// GET: Get all data (protected)
app.get('/api/data', requireAuth, async (req, res) => {
    try {
        const [employees, templates, schedules, vacations] = await Promise.all([
            db.getAllEmployees(),
            db.getAllTemplates(),
            db.getAllSchedules(),
            db.getAllVacations()
        ]);
        res.json({ employees, templates, schedules, vacations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get employees (protected)
app.get('/api/employees', requireAuth, async (req, res) => {
    try {
        const employees = await db.getAllEmployees();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save employees (protected)
app.post('/api/employees', requireAuth, async (req, res) => {
    try {
        await db.saveEmployees(req.body);
        res.json({ success: true, message: 'Empleados guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get templates (protected)
app.get('/api/templates', requireAuth, async (req, res) => {
    try {
        const templates = await db.getAllTemplates();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save templates (protected)
app.post('/api/templates', requireAuth, async (req, res) => {
    try {
        await db.saveTemplates(req.body);
        res.json({ success: true, message: 'Templates guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get schedules (protected)
app.get('/api/schedules', requireAuth, async (req, res) => {
    try {
        const schedules = await db.getAllSchedules();
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save schedules (protected)
app.post('/api/schedules', requireAuth, async (req, res) => {
    try {
        await db.saveSchedules(req.body);
        res.json({ success: true, message: 'Horarios guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get vacations (protected)
app.get('/api/vacations', requireAuth, async (req, res) => {
    try {
        const vacations = await db.getAllVacations();
        res.json(vacations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Save vacations (protected)
app.post('/api/vacations', requireAuth, async (req, res) => {
    try {
        await db.saveVacations(req.body);
        res.json({ success: true, message: 'Vacaciones guardadas correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve test-app directory for subdirectory testing
app.use('/test-app', express.static(path.join(__dirname, 'test-app')));

// Serve static files from React build in production
if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // Serve React app for all non-API routes (except test-app)
    app.get('*', (req, res) => {
        // Don't serve React app for API routes or test-app
        if (req.path.startsWith('/api') || req.path.startsWith('/test-app')) {
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

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await closePool();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await closePool();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🗄️  Database: PostgreSQL`);
    console.log(`🔐 Login: http://localhost:${PORT}/login.html`);
    console.log(`👁️  Public view: http://localhost:${PORT}/public.html`);
    if (isProduction) {
        console.log(`📦 Serving React build from: ${path.join(__dirname, 'dist')}`);
    }
});
