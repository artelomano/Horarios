// Vista pública - Solo lectura
// Estado de la aplicación
let currentDate = new Date();
let employees = [];
let schedules = {};
let vacations = {};

// Horarios fijos
const SHIFT_TIMES = {
    morning: { start: '09:30', end: '14:00', duration: 4.5 },
    afternoon: { start: '16:00', end: '20:30', duration: 4.5 }
};

// Días de la semana
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Cargar datos desde API pública
async function loadEmployees() {
    console.log('Cargando empleados (público)...');
    try {
        const response = await fetch('/api/public/employees');
        if (response.ok) {
            employees = await response.json();
            console.log(`Cargados ${employees.length} empleados`);
        }
    } catch (error) {
        console.error('Error al cargar empleados:', error);
    }
}

async function loadSchedules() {
    console.log('Cargando horarios (público)...');
    try {
        const response = await fetch('/api/public/schedules');
        if (response.ok) {
            schedules = await response.json();
            console.log('Horarios cargados');
        }
    } catch (error) {
        console.error('Error al cargar horarios:', error);
    }
}

async function loadVacations() {
    console.log('Cargando vacaciones (público)...');
    try {
        const response = await fetch('/api/public/vacations');
        if (response.ok) {
            vacations = await response.json();
            console.log('Vacaciones cargadas');
        }
    } catch (error) {
        console.error('Error al cargar vacaciones:', error);
    }
}

// Verificar si un día es vacación
function isVacationDay(dateStr, employeeId, year) {
    if (!vacations[year] || !vacations[year][employeeId]) {
        return false;
    }
    const empVacations = vacations[year][employeeId];
    const allDates = [
        ...(empVacations.feria || []),
        ...(empVacations.agosto || []),
        ...(empVacations.navidad || []),
        ...(empVacations.libre || [])
    ];
    return allDates.includes(dateStr);
}

// Obtener tipo de vacación
function getVacationType(dateStr, employeeId, year) {
    if (!vacations[year] || !vacations[year][employeeId]) {
        return null;
    }
    const empVacations = vacations[year][employeeId];
    if (empVacations.feria && empVacations.feria.includes(dateStr)) return 'Feria';
    if (empVacations.agosto && empVacations.agosto.includes(dateStr)) return 'Agosto';
    if (empVacations.navidad && empVacations.navidad.includes(dateStr)) return 'Navidad';
    if (empVacations.libre && empVacations.libre.includes(dateStr)) return 'Libre';
    return null;
}

// Ajustar brillo de color para el borde
function adjustColorBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Agrupar shifts por slot
function groupShiftsBySlot(shifts) {
    const grouped = {
        reception: [],
        slots: {}
    };
    
    shifts.forEach((shift, index) => {
        if (shift.slotIndex === 0 || shift.slotIndex === '0') {
            grouped.reception.push({ shift, index });
        } else {
            const slotNum = shift.slotIndex || 'other';
            if (!grouped.slots[slotNum]) {
                grouped.slots[slotNum] = [];
            }
            grouped.slots[slotNum].push({ shift, index });
        }
    });
    
    return grouped;
}

// Renderizar contenido de celda de turno (solo lectura)
function renderShiftCellContent(shifts, dateStr, shiftType) {
    if (shifts.length === 0) {
        return '<div class="empty-shift">-</div>';
    }
    
    // Group shifts by slot
    const grouped = groupShiftsBySlot(shifts);
    let html = '';
    
    // Render reception first
    if (grouped.reception.length > 0) {
        html += `<div class="shift-slot-group" data-slot-type="reception">`;
        grouped.reception.forEach(({ shift }) => {
            const employee = employees.find(e => e.id === shift.employeeId);
            if (!employee) return;
            
            const isCancelled = shift.cancelled;
            const startTime = shift.startTime || SHIFT_TIMES[shiftType].start;
            const isLate = employee.type === 'external' && startTime !== SHIFT_TIMES[shiftType].start;
            
            let title = employee.name;
            if (isLate) title += ` (${startTime})`;
            if (isCancelled) title += ' - Cancelado';
            if (shift.notes) title += ` - ${shift.notes}`;
            
            const backgroundColor = employee.color || (employee.type === 'internal' || employee.type === 'service' ? '#e8f5e9' : '#fff3e0');
            const borderColor = employee.color ? adjustColorBrightness(employee.color, -20) : (employee.type === 'internal' || employee.type === 'service' ? '#005B52' : '#04BF8A');
            
            // Verificar si el empleado está de vacaciones este día
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const vacationType = getVacationType(dateStr, employee.id, year);
            const vacationIcon = vacationType ? ' 🏖️' : '';
            const vacationTitle = vacationType ? ` (Vacaciones: ${vacationType})` : '';
            
            html += `<div class="shift-item-wrapper">
                <div class="shift-item ${employee.type} ${isCancelled ? 'cancelled' : ''} ${vacationType ? 'on-vacation' : ''}" 
                    title="${title}${vacationTitle}"
                    style="background-color: ${backgroundColor}; border-color: ${borderColor};">
                    ${employee.name}${isCancelled ? ' ❌' : ''}${vacationIcon}
                </div>
            </div>`;
        });
        html += `</div>`;
    }
    
    // Render slots in order
    const slotNumbers = Object.keys(grouped.slots).filter(k => k !== 'other').sort((a, b) => parseInt(a) - parseInt(b));
    if (grouped.slots['other']) {
        slotNumbers.push('other');
    }
    
    slotNumbers.forEach(slotNumber => {
        const slotShifts = grouped.slots[slotNumber];
        if (slotShifts && slotShifts.length > 0) {
            html += `<div class="shift-slot-group" data-slot-number="${slotNumber}">`;
            
            slotShifts.forEach(({ shift }) => {
                const employee = employees.find(e => e.id === shift.employeeId);
                if (!employee) return;
                
                const isCancelled = shift.cancelled;
                const startTime = shift.startTime || SHIFT_TIMES[shiftType].start;
                const isLate = employee.type === 'external' && startTime !== SHIFT_TIMES[shiftType].start;
                
                let title = employee.name;
                if (isLate) title += ` (${startTime})`;
                if (isCancelled) title += ' - Cancelado';
                if (shift.notes) title += ` - ${shift.notes}`;
                
                const backgroundColor = employee.color || (employee.type === 'internal' || employee.type === 'service' ? '#e8f5e9' : '#fff3e0');
                const borderColor = employee.color ? adjustColorBrightness(employee.color, -20) : (employee.type === 'internal' || employee.type === 'service' ? '#005B52' : '#04BF8A');
                
                // Verificar si el empleado está de vacaciones este día
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const vacationType = getVacationType(dateStr, employee.id, year);
                const vacationIcon = vacationType ? ' 🏖️' : '';
                const vacationTitle = vacationType ? ` (Vacaciones: ${vacationType})` : '';
                
                html += `<div class="shift-item-wrapper">
                    <div class="shift-item ${employee.type} ${isCancelled ? 'cancelled' : ''} ${vacationType ? 'on-vacation' : ''}" 
                        title="${title}${vacationTitle}"
                        style="background-color: ${backgroundColor}; border-color: ${borderColor};">
                        ${employee.name}${isCancelled ? ' ❌' : ''}${vacationIcon}
                    </div>
                </div>`;
            });
            
            html += `</div>`;
        }
    });
    
    return html || '<div class="empty-shift">-</div>';
}

// Calculate week number of the year
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNumber;
}

// Calcular semanas del mes
function calculateWeeksForMonth(firstDay, lastDay, firstDayOfWeek, lastDayOfWeek) {
    const weeks = [];
    let currentDate = new Date(firstDay);
    
    // Ajustar al lunes (0 = domingo, 1 = lunes)
    const dayOfWeek = currentDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentDate.setDate(currentDate.getDate() - daysToMonday);
    
    while (currentDate <= lastDay) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 4); // Viernes
        
        // Si la semana termina después del último día del mes, ajustar
        if (weekEnd > lastDay) {
            weekEnd.setTime(lastDay.getTime());
        }
        
        // Verificar si la semana tiene al menos 4 días del mes actual
        const daysInMonth = Math.ceil((weekEnd - weekStart) / (1000 * 60 * 60 * 24)) + 1;
        
        // Excepción: si el último día del mes es miércoles o antes (día 0-3), siempre incluir esa semana
        const lastDayOfMonth = lastDay.getDay();
        const shouldInclude = daysInMonth >= 4 || (lastDayOfMonth >= 0 && lastDayOfMonth <= 3 && weekEnd.getTime() === lastDay.getTime());
        
        if (shouldInclude) {
            weeks.push({
                startDate: new Date(weekStart),
                endDate: new Date(weekEnd)
            });
        }
        
        // Avanzar al siguiente lunes
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
}

// Crear celda de turno (solo lectura, sin checkboxes ni botones)
function createShiftCell(date, shiftType, firstDay, lastDay, monthKey) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isOtherMonth = date < firstDay || date > lastDay;
    
    if (isOtherMonth) {
        return '<td class="other-month-cell"></td>';
    }
    
    const dayShifts = schedules[monthKey]?.[dateStr]?.[shiftType] || [];
    const content = renderShiftCellContent(dayShifts, dateStr, shiftType);
    
    return `<td class="shift-cell">
        <div class="day-number">${date.getDate()}</div>
        <div class="shifts-container">${content}</div>
    </td>`;
}

// Crear tabla de horario para una semana (solo lectura)
function createWeekScheduleTable(week, firstDay, lastDay, monthKey) {
    const table = document.createElement('table');
    table.className = 'schedule-table';
    
    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // Empty cell for time column
    
    WEEKDAYS.forEach(day => {
        const th = document.createElement('th');
        th.textContent = WEEKDAY_NAMES[WEEKDAYS.indexOf(day)];
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    
    // Morning shift
    const morningRow = document.createElement('tr');
    const morningTimeCell = document.createElement('td');
    morningTimeCell.className = 'time-label';
    morningTimeCell.textContent = 'M';
    morningRow.appendChild(morningTimeCell);
    
    WEEKDAYS.forEach(day => {
        const dayDate = new Date(week.startDate);
        dayDate.setDate(week.startDate.getDate() + WEEKDAYS.indexOf(day));
        morningRow.insertAdjacentHTML('beforeend', createShiftCell(dayDate, 'morning', firstDay, lastDay, monthKey));
    });
    
    tbody.appendChild(morningRow);
    
    // Break row
    const breakRow = document.createElement('tr');
    const breakCell = document.createElement('td');
    breakCell.className = 'break-cell';
    breakCell.colSpan = 6;
    breakRow.appendChild(breakCell);
    tbody.appendChild(breakRow);
    
    // Afternoon shift
    const afternoonRow = document.createElement('tr');
    const afternoonTimeCell = document.createElement('td');
    afternoonTimeCell.className = 'time-label';
    afternoonTimeCell.textContent = 'T';
    afternoonRow.appendChild(afternoonTimeCell);
    
    WEEKDAYS.forEach(day => {
        const dayDate = new Date(week.startDate);
        dayDate.setDate(week.startDate.getDate() + WEEKDAYS.indexOf(day));
        afternoonRow.insertAdjacentHTML('beforeend', createShiftCell(dayDate, 'afternoon', firstDay, lastDay, monthKey));
    });
    
    tbody.appendChild(afternoonRow);
    table.appendChild(tbody);
    
    return table;
}

// Renderizar calendario mensual (solo lectura)
function renderMonthlySchedule() {
    console.log('Renderizando calendario mensual (público)...');
    const scheduleContainer = document.getElementById('monthlySchedule');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    scheduleContainer.innerHTML = '';
    
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    if (!schedules[monthKey]) {
        schedules[monthKey] = {};
    }
    
    // Obtener días del mes
    let firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    let lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // REGLA ESPECIAL: Diciembre 2025 incluye el 1 y 2 de enero de 2026
    if (currentDate.getFullYear() === 2025 && currentDate.getMonth() === 11) {
        lastDay = new Date(2026, 0, 2);
    } else if (currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0) {
        firstDay = new Date(2026, 0, 5);
    }
    
    const firstDayOfWeek = firstDay.getDay();
    const lastDayOfWeek = lastDay.getDay();
    
    // Calcular semanas a mostrar
    const weeks = calculateWeeksForMonth(firstDay, lastDay, firstDayOfWeek, lastDayOfWeek);
    
    // Renderizar semanas en grupos de 2
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'weeks-container';
    
    for (let i = 0; i < weeks.length; i += 2) {
        const weekRow = document.createElement('div');
        weekRow.className = 'week-row';
        
        // Primera semana
        const week1Container = document.createElement('div');
        week1Container.className = 'week-box';
        const week1Table = createWeekScheduleTable(weeks[i], firstDay, lastDay, monthKey);
        week1Container.appendChild(week1Table);
        weekRow.appendChild(week1Container);
        
        // Segunda semana (si existe)
        if (i + 1 < weeks.length) {
            const week2Container = document.createElement('div');
            week2Container.className = 'week-box';
            const week2Table = createWeekScheduleTable(weeks[i + 1], firstDay, lastDay, monthKey);
            week2Container.appendChild(week2Table);
            weekRow.appendChild(week2Container);
        }
        
        weeksContainer.appendChild(weekRow);
    }
    
    scheduleContainer.appendChild(weeksContainer);
    console.log('Calendario mensual renderizado (público)');
}

// Event listeners
function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderMonthlySchedule();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderMonthlySchedule();
    });
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando vista pública...');
    await loadEmployees();
    await loadSchedules();
    await loadVacations();
    setupEventListeners();
    renderMonthlySchedule();
    console.log('Vista pública inicializada');
});

