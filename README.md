# Gestor de Horarios - React Application

A modern React-based web application for managing employee schedules in a dental clinic. This application provides a comprehensive scheduling system with employee management, weekly templates, and calendar views.

## 🚀 Features

- **Calendar View**: Monthly calendar display with morning and afternoon shifts
- **Employee Management**: 
  - Add, edit, and delete employees
  - Separate tracking for internal and external employees
  - Hours control for internal employees only
  - Hours status monitoring (alerts when below -2 hours)
  - Comments field for exceptions and special notes
- **Weekly Templates**: Define base weekly schedules that can be applied to months
- **Public View**: Read-only public view of schedules
- **Authentication**: Secure login system with session management

## 📋 Employee Types

### Internal Employees (Hours Controlled)
- **Patricia** - Administradora (40h/week)
- **Desi** - Recepcionista (36h/week) - *Special case: Always 36 hours, credit system for shifts*
- **Lanny** - Higienista Dental (40h/week)
- **Maite** - Higienista (40h/week)

### External Employees (Autonomous)
- **Sergio** - Cirujano
- **Reme** - General y Endodoncias
- **Gloria** - General (Currently on leave)
- **Carmen** - General
- **Elena** - Ortodoncia
- **Bea** - Prótesis y Periodoncia
- **Armando** - Endodoncia
- **Natalia** - General

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with Vite
- **Backend**: Express.js
- **Database**: JSON file (database.json)
- **Authentication**: Express Sessions with bcrypt
- **Styling**: CSS with Montserrat font

### Project Structure

```
horarios-patri/
├── src/
│   ├── components/          # React components
│   │   ├── CalendarView.jsx
│   │   ├── WeekView.jsx
│   │   ├── DayView.jsx
│   │   ├── ShiftView.jsx
│   │   ├── EmployeeBadge.jsx
│   │   ├── EmployeeManagement.jsx
│   │   ├── EmployeeCard.jsx
│   │   ├── EmployeeModal.jsx
│   │   └── TemplateEditor.jsx
│   ├── pages/               # Page components
│   │   ├── LoginPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── PublicPage.jsx
│   ├── services/           # Business logic and API
│   │   ├── api.js          # API client
│   │   ├── scheduleService.js
│   │   └── employeeService.js
│   ├── utils/              # Utility functions
│   │   ├── constants.js
│   │   └── dateUtils.js
│   ├── styles/             # CSS files
│   │   └── index.css
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── scripts/
│   └── initDatabase.js    # Database initialization script
├── server.js              # Express server
├── database.json          # JSON database file
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Initialize database with default employees:**
```bash
node scripts/initDatabase.js
```

3. **Build React application (for production):**
```bash
npm run build
```

4. **Start the server:**
```bash
npm start
```

For development with hot reload:
```bash
npm run dev:client  # In one terminal (Vite dev server)
npm run dev         # In another terminal (Express server)
```

## 📊 Database Structure

The application uses a JSON file (`database.json`) as the database. The structure is:

```json
{
  "users": [
    {
      "username": "patricia",
      "password": "<hashed_password>",
      "role": "admin"
    }
  ],
  "employees": [
    {
      "id": 1,
      "name": "Patricia",
      "type": "internal",
      "role": "Administradora",
      "hoursPerWeek": 40,
      "hoursStatus": 0,
      "comments": "",
      "color": "#B3D9FF"
    }
  ],
  "templates": [
    {
      "id": "template1",
      "name": "Template 1",
      "data": {
        "monday": {
          "morning": [
            { "reception": [] },
            { "internal": [], "external": [] }
          ],
          "afternoon": [
            { "reception": [] },
            { "internal": [], "external": [] }
          ]
        }
      }
    }
  ],
  "schedules": {
    "2025-01": {
      "2025-01-17": {
        "morning": [],
        "afternoon": []
      }
    }
  },
  "vacations": {}
}
```

## 🔐 Authentication

- **Default Username**: `patricia`
- **Default Password**: `123456`

**⚠️ IMPORTANT**: Change the default password in production!

## 🎨 Design System

### Colors
- **White**: #fff (background)
- **Black**: #000 (text)
- **Primary**: #005B52 (dark green)
- **Secondary**: #1E1E1E (dark gray)
- **Light Green**: #04BF8A
- **Dark Yellow**: #C1D711
- **Light Yellow**: #DBF226
- **Light Grey**: #B3B3B3

### Typography
- **Font Family**: Montserrat
- **Weights**: 300, 400, 500, 600, 700

### Shift Times
- **Morning**: 09:30 - 14:00 (4.5 hours)
- **Afternoon**: 16:00 - 20:30 (4.5 hours)

## 📝 Special Cases & Exceptions

### Desi (Recepcionista)
**IMPORTANT**: Desi always works **36 hours per week** (not 40 like other internal employees).

**Credit System:**
- If she must work a 4.5h shift, she gets 0.5h credit
- These credit hours are recovered in later shifts
- **It's fundamental to control the hours status** to keep accurate track of these credits and recoveries

**Example:**
- Week 1: 36h contracted, 4.5h shift → Credit: +0.5h
- Week 2: 36h contracted, 4h shift → Credit: -0.5h (recovers previous credit)
- The hours status must reflect these adjustments to maintain correct balance

### Gloria (General - External)
Currently on leave. This status can be registered in the comments field.

### General Notes on Exceptions
- **Always register in comments** any exception or special case for an employee
- Shifts that don't exactly match contracted hours must be documented
- The comments field is visible on each employee's card for quick reference
- Update comments when conditions or exceptions change

## 🚢 Deployment (Railway)

### Environment Variables
Set the following in Railway:
- `NODE_ENV=production`
- `PORT` (automatically set by Railway)
- `SESSION_SECRET` (optional, for production security)

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm start
```

### Database Persistence
The `database.json` file will be persisted in Railway's filesystem. For production, consider:
- Using Railway's persistent volume
- Or migrating to a proper database (PostgreSQL, MongoDB, etc.)

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/check` - Check session
- `POST /api/auth/logout` - Logout

### Public (Read-only)
- `GET /api/public/employees` - Get employees
- `GET /api/public/schedules` - Get schedules
- `GET /api/public/templates` - Get templates
- `GET /api/public/vacations` - Get vacations

### Protected (Requires Authentication)
- `GET /api/employees` - Get employees
- `POST /api/employees` - Save employees
- `GET /api/templates` - Get templates
- `POST /api/templates` - Save templates
- `GET /api/schedules` - Get schedules
- `POST /api/schedules` - Save schedules
- `GET /api/vacations` - Get vacations
- `POST /api/vacations` - Save vacations

## 🧩 Component Architecture

### Calendar Components
- **CalendarView**: Main calendar container, manages month navigation
- **WeekView**: Displays a week row in the calendar
- **DayView**: Displays a single day with morning/afternoon shifts
- **ShiftView**: Displays employees assigned to a shift
- **EmployeeBadge**: Individual employee badge in a shift

### Employee Management
- **EmployeeManagement**: Main employee management interface
- **EmployeeCard**: Card displaying employee information
- **EmployeeModal**: Form for adding/editing employees

### Services Layer
- **api.js**: API client for all backend communication
- **scheduleService.js**: Business logic for schedule management
- **employeeService.js**: Business logic for employee management

### Utilities
- **constants.js**: Application constants (colors, shift times, etc.)
- **dateUtils.js**: Date manipulation utilities

## 🔍 Data Flow

1. **User Action** → React Component
2. **Component** → Service Layer (api.js)
3. **API Client** → Express Server
4. **Server** → Database (database.json)
5. **Response** flows back through the chain
6. **Component** updates state and re-renders

## 🛠️ Development

### Adding a New Component
1. Create component file in `src/components/`
2. Create corresponding CSS file
3. Import and use in parent component

### Adding a New API Endpoint
1. Add route in `server.js`
2. Add method in `src/services/api.js`
3. Use in components via service layer

### Modifying Database Schema
1. Update `scripts/initDatabase.js` for default data
2. Update server read/write functions if needed
3. Update TypeScript types/interfaces if using TypeScript

## 📚 Code Style Guidelines

- **Language**: All code, comments, and documentation in English
- **Comments**: Each function should have a comment at the top
- **Simplicity**: Keep code simple; create new files if it gets too complicated
- **Console Logs**: Add console logs for debugging (especially for AI assistance)
- **Folder Structure**: Maintain good folder structure with well-documented README files

## 🐛 Troubleshooting

### Database not initializing
Run: `node scripts/initDatabase.js`

### React build not working
1. Check Node.js version: `node --version` (should be >= 18)
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install` again
4. Run `npm run build`

### Authentication issues
- Check session secret in `server.js`
- Clear browser cookies
- Check server logs for errors

## 📄 License

ISC

## 👥 Author

Developed for dental clinic schedule management.

---

**Note**: This application is designed for deployment on Railway. The database is stored as a JSON file, which works well for small to medium-sized deployments. For larger scale, consider migrating to a proper database system.
