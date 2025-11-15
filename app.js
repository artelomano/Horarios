// Estado de la aplicación
let currentDate = new Date();
let employees = [];
let schedules = {};
let vacations = {}; // Structure: { year: { employeeId: { feria: [], agosto: [], navidad: [], libre: [] } } }
// Structure: Each shift has slots
// Slot 0: RECEPCIÓN (reception) - only 1 position (usually internal)
// Slot 1+: 2 positions each (internal and external)
let templates = [
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
];
let currentTemplateId = 'template1'; // Template actualmente seleccionado para editar

// Helper function to get template by ID
function getTemplateById(templateId) {
    return templates.find(t => t.id === templateId);
}

// Helper function to get current template data
function getCurrentTemplate() {
    return getTemplateById(currentTemplateId);
}

// Initialize template structure if needed
function initializeTemplateStructure(templateId = 'template1') {
    console.log(`Initializing template structure for ${templateId}...`);
    const templateObj = getTemplateById(templateId);
    if (!templateObj) {
        console.error(`Template ${templateId} not found`);
        return;
    }
    
    const template = templateObj.data;
    
    WEEKDAYS.forEach(day => {
        ['morning', 'afternoon'].forEach(shiftType => {
            if (!template[day][shiftType] || template[day][shiftType].length === 0) {
                // Initialize with empty structure: reception + 1 slot
                template[day][shiftType] = [
                    { reception: [] },  // Slot 0: RECEPCIÓN
                    { internal: [], external: [] }  // Slot 1
                ];
            } else {
                // Migrate old structure to new structure
                const oldData = template[day][shiftType];
                if (Array.isArray(oldData) && oldData.length > 0 && typeof oldData[0] === 'number') {
                    // Old structure: array of employee IDs
                    console.log(`Migrating old template structure for ${day} ${shiftType}`);
                    const employeeIds = oldData;
                    const internals = [];
                    const externals = [];
                    
                    employeeIds.forEach(empId => {
                        const emp = employees.find(e => e.id === empId);
                        if (emp) {
                            if (emp.type === 'internal') {
                                internals.push(empId);
                            } else {
                                externals.push(empId);
                            }
                        }
                    });
                    
                    // Create new structure
                    template[day][shiftType] = [
                        { reception: internals.length > 0 ? [internals[0]] : [] },  // First internal goes to reception
                        { internal: internals.slice(1), external: externals.slice(0, 1) },  // Rest distributed
                        { internal: [], external: externals.slice(1) }
                    ];
                } else if (Array.isArray(oldData) && oldData.length > 0 && typeof oldData[0] === 'object') {
                    // Already new structure, but ensure it has the right format
                    if (!oldData[0].reception && !oldData[0].internal) {
                        // Needs migration
                        console.log(`Fixing template structure for ${day} ${shiftType}`);
                        template[day][shiftType] = [
                            { reception: [] },
                            { internal: [], external: [] }
                        ];
                    }
                }
            }
        });
    });
    saveTemplate();
}

// Horarios fijos
const SHIFT_TIMES = {
    morning: { start: '09:30', end: '14:00', duration: 4.5 },
    afternoon: { start: '16:00', end: '20:30', duration: 4.5 }
};

// Días de la semana
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando aplicación...');
    loadEmployees();
    loadTemplate();
    loadSchedules();
    loadVacations();
    setupEventListeners();
    renderMonthlySchedule();
    console.log('Aplicación inicializada correctamente');
});

// Cargar empleados desde la base de datos
function loadEmployees() {
    console.log('Cargando empleados desde la base de datos...');
    try {
        const stored = localStorage.getItem('employees');
        if (stored) {
            employees = JSON.parse(stored);
            // Asegurar que todos los empleados tengan color
            employees.forEach(emp => {
                if (!emp.color) {
                    if (emp.type === 'internal') {
                        // Colores por defecto para internos
                        const defaultColors = {
                            'Patricia': '#B3D9FF',
                            'Desi': '#FFF4B3',
                            'Lanny': '#B3E5B3',
                            'Maite': '#FFD9B3'
                        };
                        emp.color = defaultColors[emp.name] || '#B3D9FF';
                    } else {
                        // Color aleatorio para externos
                        emp.color = generateRandomPastelColor();
                    }
                }
            });
            saveEmployees(); // Guardar colores si se añadieron
            console.log(`Cargados ${employees.length} empleados desde la base de datos`);
        } else {
            // Inicializar con empleados por defecto
            initializeDefaultEmployees();
            console.log('Inicializados con empleados por defecto');
        }
    } catch (error) {
        console.error('Error al cargar empleados:', error);
        initializeDefaultEmployees();
    }
}

// Generar color aleatorio pastel (en formato HEX)
function generateRandomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 30 + Math.floor(Math.random() * 40); // 30-70%
    const lightness = 75 + Math.floor(Math.random() * 20); // 75-95%
    return hslToHex(hue, saturation, lightness);
}

// Convertir HSL a HEX
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// Inicializar empleados por defecto
function initializeDefaultEmployees() {
    console.log('Inicializando empleados por defecto...');
    employees = [
        // Empleados internos (con colores pastel)
        { id: 1, name: 'Patricia', type: 'internal', role: 'Administradora', hoursPerWeek: 40, hoursStatus: 0, comments: '', color: '#B3D9FF' }, // Azul pastel
        { id: 2, name: 'Desi', type: 'internal', role: 'Recepcionista', hoursPerWeek: 36, hoursStatus: 0, comments: 'Hace SIEMPRE 36 horas a la semana. Si debe hacer un turno de 4.5h, le quedan 0.5h de crédito que recupera en turnos posteriores. Controlar el estado de horas.', color: '#FFF4B3' }, // Amarillo pastel
        { id: 3, name: 'Lanny', type: 'internal', role: 'Higienista Dental', hoursPerWeek: 40, hoursStatus: 0, comments: '', color: '#B3E5B3' }, // Verde pastel
        { id: 4, name: 'Maite', type: 'internal', role: 'Higienista', hoursPerWeek: 40, hoursStatus: 0, comments: '', color: '#FFD9B3' }, // Naranja pastel
        // Empleados externos (con colores aleatorios pastel)
        { id: 5, name: 'Sergio', type: 'external', role: 'Cirujano', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(200, 50, 80) },
        { id: 6, name: 'Reme', type: 'external', role: 'General y Endodoncias', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(120, 50, 80) },
        { id: 7, name: 'Gloria', type: 'external', role: 'General', hoursPerWeek: 0, hoursStatus: 0, comments: 'Actualmente de baja', color: hslToHex(30, 50, 80) },
        { id: 8, name: 'Carmen', type: 'external', role: 'General', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(280, 50, 80) },
        { id: 9, name: 'Elena', type: 'external', role: 'Ortodoncia', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(340, 50, 80) },
        { id: 10, name: 'Bea', type: 'external', role: 'Prótesis y Periodoncia', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(60, 50, 80) },
        { id: 11, name: 'Armando', type: 'external', role: 'Endodoncia', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(160, 50, 80) },
        { id: 12, name: 'Natalia', type: 'external', role: 'General', hoursPerWeek: 0, hoursStatus: 0, comments: '', color: hslToHex(10, 50, 80) }
    ];
    saveEmployees();
}

// Guardar empleados en la base de datos
function saveEmployees() {
    console.log('Guardando empleados en la base de datos...');
    try {
        localStorage.setItem('employees', JSON.stringify(employees));
        console.log(`Guardados ${employees.length} empleados en la base de datos`);
    } catch (error) {
        console.error('Error al guardar empleados:', error);
    }
}

// Cargar templates semanales
function loadTemplate() {
    console.log('Cargando templates semanales...');
    try {
        const stored = localStorage.getItem('weeklyTemplates');
        if (stored) {
            const parsed = JSON.parse(stored);
            
            // Migrar de estructura antigua a nueva
            if (parsed.monday && !parsed.template1 && !Array.isArray(parsed)) {
                // Estructura muy antigua: solo un template
                console.log('Migrando estructura muy antigua de template...');
                templates = [
                    { id: 'template1', name: 'Template 1', data: parsed },
                    { id: 'template2', name: 'Template 2', data: {
                        monday: { morning: [], afternoon: [] },
                        tuesday: { morning: [], afternoon: [] },
                        wednesday: { morning: [], afternoon: [] },
                        thursday: { morning: [], afternoon: [] },
                        friday: { morning: [], afternoon: [] }
                    }}
                ];
            } else if (parsed.template1 && !Array.isArray(parsed)) {
                // Estructura intermedia: objeto con template1 y template2
                console.log('Migrando estructura intermedia de templates...');
                templates = [
                    { id: 'template1', name: 'Template 1', data: parsed.template1 },
                    { id: 'template2', name: 'Template 2', data: parsed.template2 || {
                        monday: { morning: [], afternoon: [] },
                        tuesday: { morning: [], afternoon: [] },
                        wednesday: { morning: [], afternoon: [] },
                        thursday: { morning: [], afternoon: [] },
                        friday: { morning: [], afternoon: [] }
                    }}
                ];
            } else if (Array.isArray(parsed)) {
                // Nueva estructura: array de templates
                templates = parsed;
        } else {
                // Fallback: crear templates por defecto
                console.log('Estructura desconocida, creando templates por defecto');
            }
            
            console.log('Templates semanales cargados');
            // Initialize structure if needed
            templates.forEach(t => initializeTemplateStructure(t.id));
        } else {
            console.log('No hay templates guardados, usando templates por defecto');
            templates.forEach(t => initializeTemplateStructure(t.id));
        }
    } catch (error) {
        console.error('Error al cargar templates:', error);
        templates.forEach(t => initializeTemplateStructure(t.id));
    }
}

// Guardar templates semanales
function saveTemplate() {
    console.log('Guardando templates semanales...');
    try {
        localStorage.setItem('weeklyTemplates', JSON.stringify(templates));
        console.log('Templates semanales guardados');
    } catch (error) {
        console.error('Error al guardar templates:', error);
    }
}

// Cargar horarios mensuales
function loadSchedules() {
    console.log('Cargando horarios mensuales...');
    try {
        const stored = localStorage.getItem('monthlySchedules');
        if (stored) {
            schedules = JSON.parse(stored);
            console.log('Horarios mensuales cargados');
        }
    } catch (error) {
        console.error('Error al cargar horarios:', error);
    }
}

// Guardar horarios mensuales
function saveSchedules() {
    console.log('Guardando horarios mensuales...');
    try {
        localStorage.setItem('monthlySchedules', JSON.stringify(schedules));
        console.log('Horarios mensuales guardados');
    } catch (error) {
        console.error('Error al guardar horarios:', error);
    }
}

// Cargar vacaciones desde localStorage
function loadVacations() {
    console.log('Cargando vacaciones...');
    try {
        const stored = localStorage.getItem('vacations');
        if (stored) {
            vacations = JSON.parse(stored);
            console.log('Vacaciones cargadas correctamente');
        } else {
            vacations = {};
            console.log('No hay vacaciones guardadas, inicializando estructura vacía');
        }
    } catch (error) {
        console.error('Error al cargar vacaciones:', error);
        vacations = {};
    }
}

// Guardar vacaciones en localStorage
function saveVacations() {
    console.log('Guardando vacaciones...');
    try {
        localStorage.setItem('vacations', JSON.stringify(vacations));
        console.log('Vacaciones guardadas correctamente');
    } catch (error) {
        console.error('Error al guardar vacaciones:', error);
    }
}

// Verificar si un día es vacaciones para un empleado
function isVacationDay(dateStr, employeeId, year) {
    if (!vacations[year] || !vacations[year][employeeId]) {
        return null; // No hay vacaciones registradas
    }
    
    const empVacations = vacations[year][employeeId];
    const allVacationDays = [
        ...(empVacations.feria || []),
        ...(empVacations.agosto || []),
        ...(empVacations.navidad || []),
        ...(empVacations.libre || [])
    ];
    
    return allVacationDays.includes(dateStr);
}

// Obtener el tipo de vacación para un día
function getVacationType(dateStr, employeeId, year) {
    if (!vacations[year] || !vacations[year][employeeId]) {
        return null;
    }
    
    const empVacations = vacations[year][employeeId];
    if (empVacations.feria && empVacations.feria.includes(dateStr)) return 'feria';
    if (empVacations.agosto && empVacations.agosto.includes(dateStr)) return 'agosto';
    if (empVacations.navidad && empVacations.navidad.includes(dateStr)) return 'navidad';
    if (empVacations.libre && empVacations.libre.includes(dateStr)) return 'libre';
    return null;
}

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Navegación de vistas
    document.getElementById('manageEmployeesBtn').addEventListener('click', () => {
        showView('employeeView');
    });
    
    document.getElementById('editTemplateBtn').addEventListener('click', () => {
        showView('templateView');
        renderTemplateEditor();
    });
    
    document.getElementById('viewCalendarBtn').addEventListener('click', () => {
        showView('calendarView');
        renderMonthlySchedule();
    });
    
    // Navegación del calendario
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderMonthlySchedule();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderMonthlySchedule();
    });
    
    // Template editor
    document.getElementById('saveTemplateBtn').addEventListener('click', () => {
        saveTemplate();
        alert('Template guardado correctamente');
    });
    
    // Gestión de empleados
    document.getElementById('addEmployeeBtn').addEventListener('click', () => {
        openEmployeeModal();
    });
    
    // Modales
    document.querySelector('.close').addEventListener('click', closeEmployeeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeEmployeeModal);
    document.getElementById('employeeForm').addEventListener('submit', handleEmployeeSubmit);
    
    // Modal de turnos ahora se crea dinámicamente en openShiftModal
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (event) => {
        const employeeModal = document.getElementById('employeeModal');
        const shiftModal = document.getElementById('shiftModalDynamic');
        if (event.target === employeeModal) {
            closeEmployeeModal();
        }
        if (event.target === shiftModal) {
            closeShiftModal();
        }
    });
    
    // Manejador de cambio de tipo de empleado
    document.getElementById('employeeType').addEventListener('change', (e) => {
        const employeeType = e.target.value;
        const isInternal = employeeType === 'internal' || employeeType === 'service'; // Service es interno también
        const hoursPerWeekInput = document.getElementById('hoursPerWeek');
        const hoursStatusInput = document.getElementById('hoursStatus');
        const colorInput = document.getElementById('employeeColor');
        const colorTextInput = document.getElementById('employeeColorText');
        const colorContainer = document.getElementById('colorFieldContainer');
        const colorLabel = colorContainer ? colorContainer.querySelector('label') : null;
        
        if (isInternal) {
            hoursPerWeekInput.disabled = false;
            hoursStatusInput.disabled = false;
            colorInput.disabled = false;
            colorTextInput.disabled = false;
            if (colorContainer) colorContainer.style.display = 'block';
            if (colorLabel) colorLabel.textContent = 'Color:';
        } else {
            hoursPerWeekInput.disabled = true;
            hoursStatusInput.disabled = true;
            colorInput.disabled = false; // Los externos también pueden tener color
            colorTextInput.disabled = false;
            hoursPerWeekInput.value = 0;
            hoursStatusInput.value = 0;
            // Generar color aleatorio si no tiene
            if (!colorInput.value || colorInput.value === '#B3D9FF') {
                const randomColor = generateRandomPastelColor();
                colorInput.value = randomColor;
                colorTextInput.value = randomColor;
            }
            if (colorContainer) colorContainer.style.display = 'block';
            if (colorLabel) colorLabel.textContent = 'Color (Opcional):';
        }
    });
    
    // Sincronizar color picker con texto
    document.getElementById('employeeColor').addEventListener('input', (e) => {
        document.getElementById('employeeColorText').value = e.target.value.toUpperCase();
    });
    
    document.getElementById('employeeColorText').addEventListener('input', (e) => {
        const colorValue = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(colorValue)) {
            document.getElementById('employeeColor').value = colorValue;
        }
    });
    
    console.log('Event listeners configurados correctamente');
}

// Mostrar vista específica
function showView(viewId) {
    console.log(`Cambiando a vista: ${viewId}`);
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    
    if (viewId === 'employeeView') {
        renderEmployees();
    } else if (viewId === 'calendarView') {
        loadSchedules();
        renderMonthlySchedule();
    } else if (viewId === 'templateView') {
        renderTemplateEditor();
    }
}

// Renderizar editor de template semanal (formato igual al calendario mensual)
function renderTemplateEditor() {
    console.log('Renderizando editor de template...');
    const editor = document.getElementById('templateEditor');
    editor.innerHTML = '';
    
    // Añadir gestión de templates
    const templateSelector = document.createElement('div');
    templateSelector.className = 'template-selector';
    
    // Crear lista de templates con opciones
    let templatesHTML = templates.map(t => 
        `<option value="${t.id}" ${currentTemplateId === t.id ? 'selected' : ''}>${t.name}</option>`
    ).join('');
    
    templateSelector.innerHTML = `
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
                <label for="templateSelect">Seleccionar Template:</label>
                <select id="templateSelect" class="template-select-dropdown">
                    ${templatesHTML}
                </select>
            </div>
            <div style="display: flex; gap: 5px;">
                <button type="button" class="btn-secondary btn-small" id="renameTemplateBtn" title="Renombrar template">✏️</button>
                <button type="button" class="btn-secondary btn-small" id="createTemplateBtn" title="Crear nuevo template">+</button>
                ${templates.length > 1 ? `<button type="button" class="btn-delete btn-small" id="deleteTemplateBtn" title="Eliminar template">🗑️</button>` : ''}
            </div>
        </div>
    `;
    editor.appendChild(templateSelector);
    
    // Event listener para cambiar de template
    const selectElement = templateSelector.querySelector('#templateSelect');
    selectElement.addEventListener('change', (e) => {
        currentTemplateId = e.target.value;
        renderTemplateEditor();
    });
    
    // Event listener para renombrar template
    document.getElementById('renameTemplateBtn').addEventListener('click', () => {
        const template = getCurrentTemplate();
        if (!template) return;
        
        const newName = prompt(`Renombrar template:\n\nNombre actual: ${template.name}\n\nNuevo nombre:`, template.name);
        if (newName && newName.trim() && newName !== template.name) {
            template.name = newName.trim();
            saveTemplate();
            renderTemplateEditor();
        }
    });
    
    // Event listener para crear nuevo template
    document.getElementById('createTemplateBtn').addEventListener('click', () => {
        const newName = prompt('Nombre del nuevo template:');
        if (newName && newName.trim()) {
            const newId = 'template' + Date.now();
            templates.push({
                id: newId,
                name: newName.trim(),
                data: {
                    monday: { morning: [], afternoon: [] },
                    tuesday: { morning: [], afternoon: [] },
                    wednesday: { morning: [], afternoon: [] },
                    thursday: { morning: [], afternoon: [] },
                    friday: { morning: [], afternoon: [] }
                }
            });
            initializeTemplateStructure(newId);
            currentTemplateId = newId;
            saveTemplate();
            renderTemplateEditor();
        }
    });
    
    // Event listener para eliminar template
    if (templates.length > 1) {
        document.getElementById('deleteTemplateBtn').addEventListener('click', () => {
            const template = getCurrentTemplate();
            if (!template) return;
            
            if (confirm(`¿Estás seguro de que quieres eliminar el template "${template.name}"?`)) {
                templates = templates.filter(t => t.id !== template.id);
                if (currentTemplateId === template.id) {
                    currentTemplateId = templates[0].id;
                }
                saveTemplate();
                renderTemplateEditor();
            }
        });
    }
    
    // Crear contenedor de semana (igual que en calendario mensual)
    const weekBox = document.createElement('div');
    weekBox.className = 'week-box template-week-box';
    
    const table = document.createElement('table');
    table.className = 'schedule-table week-table';
    
    // Encabezado con días de la semana (más compacto)
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>H</th><th>L</th><th>M</th><th>X</th><th>J</th><th>V</th>';
    table.appendChild(headerRow);
    
    // Fila de mañana
    const morningRow = document.createElement('tr');
    const morningLabel = document.createElement('td');
    morningLabel.textContent = 'M';
    morningLabel.className = 'time-label';
    morningLabel.title = 'Mañana (9:30-14:00)';
    morningRow.appendChild(morningLabel);
    
    WEEKDAYS.forEach((day, index) => {
        const cell = document.createElement('td');
        cell.className = 'shift-cell morning template-shift-cell';
        cell.innerHTML = renderTemplateShiftCell(day, 'morning');
        morningRow.appendChild(cell);
    });
    table.appendChild(morningRow);
    
    // Fila de descanso
    const breakRow = document.createElement('tr');
    const breakLabel = document.createElement('td');
    breakLabel.textContent = 'D';
    breakLabel.className = 'time-label';
    breakLabel.title = 'Descanso (14:00-16:00)';
    breakRow.appendChild(breakLabel);
    
    WEEKDAYS.forEach(() => {
        const cell = document.createElement('td');
        cell.className = 'break-cell';
        breakRow.appendChild(cell);
    });
    table.appendChild(breakRow);
    
    // Fila de tarde
    const afternoonRow = document.createElement('tr');
    const afternoonLabel = document.createElement('td');
    afternoonLabel.textContent = 'T';
    afternoonLabel.className = 'time-label';
    afternoonLabel.title = 'Tarde (16:00-20:30)';
    afternoonRow.appendChild(afternoonLabel);
    
    WEEKDAYS.forEach((day, index) => {
        const cell = document.createElement('td');
        cell.className = 'shift-cell afternoon template-shift-cell';
        cell.innerHTML = renderTemplateShiftCell(day, 'afternoon');
        afternoonRow.appendChild(cell);
    });
    table.appendChild(afternoonRow);
    
    weekBox.appendChild(table);
    editor.appendChild(weekBox);
    
    // Añadir resumen de horas
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'templateHoursSummary';
    summaryDiv.className = 'template-hours-summary';
    editor.appendChild(summaryDiv);
    
    // Calcular horas iniciales
    updateTemplateHoursSummary();
}


// Renderizar celda de turno en template (idéntico a renderShiftCellContent)
function renderTemplateShiftCell(day, shiftType) {
    const templateObj = getCurrentTemplate();
    if (!templateObj) return '';
    const template = templateObj.data;
    const slots = template[day][shiftType] || [
        { reception: [] },
        { internal: [], external: [] }
    ];
    
    // Convert slots to shifts format for consistent rendering
    const shifts = [];
    slots.forEach((slot, slotIndex) => {
        if (slotIndex === 0 && slot.reception) {
            slot.reception.forEach(empId => {
                shifts.push({
                    employeeId: empId,
                    notes: 'RECEPCIÓN'
                });
            });
        } else {
            const slotNumber = slotIndex; // Slot number matches index (slot 1 = index 1)
            if (slot.internal) {
                slot.internal.forEach(empId => {
                    shifts.push({
                        employeeId: empId,
                        notes: `Slot ${slotNumber} - Interno`
                    });
                });
            }
            if (slot.external) {
                slot.external.forEach(empId => {
                    shifts.push({
                        employeeId: empId,
                        notes: `Slot ${slotNumber} - Externo`
                    });
                });
            }
        }
    });
    
    // Use same rendering logic as calendar
    if (shifts.length === 0) {
        return `<button class="add-shift-btn" onclick="openTemplateShiftModal('${day}', '${shiftType}')" title="Añadir turno">+</button>`;
    }
    
    // Group shifts by slot (same as calendar)
    const grouped = groupShiftsBySlot(shifts);
    let html = '';
    
    // Render reception first
    if (grouped.reception.length > 0) {
        html += `<div class="shift-slot-group" data-slot-type="reception">`;
        grouped.reception.forEach(({ shift }) => {
            const employee = employees.find(e => e.id === shift.employeeId);
        if (!employee) return;
        
            const backgroundColor = employee.color || (employee.type === 'internal' || employee.type === 'service' ? '#e8f5e9' : '#fff3e0');
            const borderColor = employee.color ? adjustColorBrightness(employee.color, -20) : (employee.type === 'internal' || employee.type === 'service' ? '#005B52' : '#04BF8A');
            
            html += `<div class="shift-item-wrapper">
                <div class="shift-item ${employee.type}" 
                    onclick="openTemplateShiftModal('${day}', '${shiftType}')" 
                    title="${employee.name} (RECEPCIÓN)"
                    style="background-color: ${backgroundColor}; border-color: ${borderColor};">
                    ${employee.name} <span class="slot-label">[REC]</span>
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
                
                const backgroundColor = employee.color || (employee.type === 'internal' || employee.type === 'service' ? '#e8f5e9' : '#fff3e0');
                const borderColor = employee.color ? adjustColorBrightness(employee.color, -20) : (employee.type === 'internal' || employee.type === 'service' ? '#005B52' : '#04BF8A');
                
                // Determine slot label from notes
                let slotLabel = '';
                if (shift.notes) {
                    if (shift.notes.includes('Interno')) slotLabel = `[S${slotNumber}-I]`;
                    else if (shift.notes.includes('Externo')) slotLabel = `[S${slotNumber}-E]`;
                }
                
                html += `<div class="shift-item-wrapper">
                    <div class="shift-item ${employee.type}" 
            onclick="openTemplateShiftModal('${day}', '${shiftType}')" 
                        title="${employee.name} (${shift.notes || ''})"
            style="background-color: ${backgroundColor}; border-color: ${borderColor};">
                        ${employee.name}${slotLabel ? ` <span class="slot-label">${slotLabel}</span>` : ''}
                    </div>
        </div>`;
    });
            
            html += `</div>`;
        }
    });
    
    html += `<button class="add-shift-btn" onclick="openTemplateShiftModal('${day}', '${shiftType}')" title="Añadir turno">+</button>`;
    return html;
}

// Render slot HTML for template modal
function renderSlotHTML(slotIndex, slot, internalEmployees, externalEmployees, serviceEmployees, isReception = false) {
    if (isReception) {
        const receptionSelected = slot?.reception || [];
        const selectedId = receptionSelected.length > 0 ? receptionSelected[0] : '';
        const allEmployees = [...internalEmployees, ...externalEmployees, ...serviceEmployees];
        
        return `
            <div class="template-slot" data-slot-index="0">
                <h3>RECEPCIÓN (1 hueco)</h3>
                <select class="template-select" data-slot="0" data-type="reception" style="width: 100%;">
                    <option value="">-- Ninguno --</option>
                    ${allEmployees.map(emp => 
                        `<option value="${emp.id}" ${selectedId === emp.id ? 'selected' : ''}>${emp.name}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    } else {
        const slotInternal = slot?.internal || [];
        const slotExternal = slot?.external || [];
        const slotDisplayNumber = slotIndex; // slotIndex is 1, 2, 3... (0 is reception)
        const selectedInternal = slotInternal.length > 0 ? slotInternal[0] : '';
        const selectedExternal = slotExternal.length > 0 ? slotExternal[0] : '';
        
        return `
            <div class="template-slot" data-slot-index="${slotIndex}">
                <div class="template-slot-header">
                    <h3>Slot ${slotDisplayNumber} (Interno + Externo)</h3>
                    ${slotIndex > 0 ? `<button type="button" class="btn-delete-slot" onclick="removeSlotFromModal(${slotIndex})" title="Eliminar slot">×</button>` : ''}
                </div>
                <div class="template-slot-positions">
                    <div class="template-position">
                        <strong>Interno:</strong>
                        <select class="template-select" data-slot="${slotIndex}" data-type="internal" style="width: 100%;">
                            <option value="">-- Ninguno --</option>
                            ${internalEmployees.map(emp => 
                                `<option value="${emp.id}" ${selectedInternal === emp.id ? 'selected' : ''}>${emp.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="template-position">
                        <strong>Externo:</strong>
                        <select class="template-select" data-slot="${slotIndex}" data-type="external" style="width: 100%;">
                            <option value="">-- Ninguno --</option>
                            ${externalEmployees.map(emp => 
                                `<option value="${emp.id}" ${selectedExternal === emp.id ? 'selected' : ''}>${emp.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }
}

// Remove slot from modal (client-side only)
function removeSlotFromModal(slotIndex) {
    const slotElement = document.querySelector(`.template-slot[data-slot-index="${slotIndex}"]`);
    if (slotElement && slotIndex > 0) {
        slotElement.remove();
    }
}

// Add new slot to modal
function addSlotToModal(container, slotIndex, internalEmployees, externalEmployees, serviceEmployees) {
    const newSlot = {
        internal: [],
        external: []
    };
    const slotHTML = renderSlotHTML(slotIndex, newSlot, internalEmployees, externalEmployees, serviceEmployees, false);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = slotHTML;
    container.appendChild(tempDiv.firstElementChild);
}

// Abrir modal para editar turno del template
function openTemplateShiftModal(day, shiftType) {
    console.log(`Abriendo modal de template para ${day} - ${shiftType}`);
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'templateShiftModal';
    
    // Get current template data
    const templateObj = getCurrentTemplate();
    if (!templateObj) return;
    const template = templateObj.data;
    let slots = template[day][shiftType] || [
        { reception: [] },
        { internal: [], external: [] }
    ];
    
    // Ensure minimum structure
    if (!slots[0] || !slots[0].reception) {
        slots = [{ reception: [] }, ...(slots.slice(1) || [{ internal: [], external: [] }])];
    }
    
    // Separate employees by type
    const internalEmployees = employees.filter(emp => emp.type === 'internal');
    const externalEmployees = employees.filter(emp => emp.type === 'external');
    const serviceEmployees = employees.filter(emp => emp.type === 'service');
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '700px';
    
    // Build slots HTML
    let slotsHTML = '';
    slotsHTML += renderSlotHTML(0, slots[0], internalEmployees, externalEmployees, serviceEmployees, true);
    
    // Render additional slots (starting from index 1)
    for (let i = 1; i < slots.length; i++) {
        slotsHTML += renderSlotHTML(i, slots[i], internalEmployees, externalEmployees, serviceEmployees, false);
    }
    
    modalContent.innerHTML = `
        <span class="close-template">&times;</span>
        <h2>Editar ${WEEKDAY_NAMES[WEEKDAYS.indexOf(day)]} - ${shiftType === 'morning' ? 'Mañana' : 'Tarde'}</h2>
        
        <div class="template-slots-container" id="templateSlotsContainer">
            ${slotsHTML}
        </div>
        
        <div class="template-slot-actions">
            <button type="button" class="btn-secondary btn-small" id="addSlotBtn">+ Añadir Slot</button>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn-primary" id="saveTemplateShiftBtn">Guardar</button>
            <button type="button" class="btn-secondary" id="cancelTemplateShiftBtn">Cancelar</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Store employees for add slot function
    window.currentTemplateModal = {
        day,
        shiftType,
        internalEmployees,
        externalEmployees,
        serviceEmployees,
        container: modalContent.querySelector('#templateSlotsContainer')
    };
    
    // Event listeners
    document.querySelector('.close-template').addEventListener('click', () => {
        document.body.removeChild(modal);
        delete window.currentTemplateModal;
    });
    
    document.getElementById('cancelTemplateShiftBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        delete window.currentTemplateModal;
    });
    
    document.getElementById('addSlotBtn').addEventListener('click', () => {
        const container = document.getElementById('templateSlotsContainer');
        const currentSlots = container.querySelectorAll('.template-slot[data-slot-index]');
        const nextIndex = currentSlots.length; // Next slot index (0 is reception, so this will be 1, 2, 3...)
        addSlotToModal(container, nextIndex, internalEmployees, externalEmployees, serviceEmployees);
    });
    
    document.getElementById('saveTemplateShiftBtn').addEventListener('click', () => {
        // Collect selected employees for each slot from selects
        const slotElements = modalContent.querySelectorAll('.template-slot[data-slot-index]');
        
        const newSlots = [];
        
        slotElements.forEach(slotElement => {
            const slotIndex = parseInt(slotElement.dataset.slotIndex);
            
            if (slotIndex === 0) {
                // Reception - single select
                const receptionSelect = slotElement.querySelector('.template-select[data-type="reception"]');
                const reception = [];
                if (receptionSelect && receptionSelect.value) {
                    reception.push(parseInt(receptionSelect.value));
                }
                newSlots[0] = { reception };
            } else {
                // Regular slot - two selects (internal, external)
                const slot = {
                    internal: [],
                    external: []
                };
                
                const internalSelect = slotElement.querySelector('.template-select[data-type="internal"]');
                const externalSelect = slotElement.querySelector('.template-select[data-type="external"]');
                
                if (internalSelect && internalSelect.value) {
                    slot.internal.push(parseInt(internalSelect.value));
                }
                if (externalSelect && externalSelect.value) {
                    slot.external.push(parseInt(externalSelect.value));
                }
                
                // Store slot at correct index (slotIndex is already the correct array index)
                newSlots[slotIndex] = slot;
            }
        });
        
        template[day][shiftType] = newSlots;
        saveTemplate();
        renderTemplateEditor();
        updateTemplateHoursSummary();
        document.body.removeChild(modal);
        delete window.currentTemplateModal;
        console.log('Template shift saved with new structure');
    });
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            delete window.currentTemplateModal;
        }
    });
}


// Helper function to calculate hours from slots
function calculateHoursFromSlots(slots, shiftType) {
    const hours = {};
    const duration = SHIFT_TIMES[shiftType].duration;
    
    slots.forEach(slot => {
        // Reception
        if (slot.reception) {
            slot.reception.forEach(empId => {
                const emp = employees.find(e => e.id === empId);
                if (emp && (emp.type === 'internal' || emp.type === 'service')) {
                    hours[empId] = (hours[empId] || 0) + duration;
                }
            });
        }
        // Internal positions
        if (slot.internal) {
            slot.internal.forEach(empId => {
                const emp = employees.find(e => e.id === empId);
                if (emp && (emp.type === 'internal' || emp.type === 'service')) {
                    hours[empId] = (hours[empId] || 0) + duration;
                }
            });
        }
    });
    
    return hours;
}

// Calcular y mostrar resumen de horas en el template
function updateTemplateHoursSummary() {
    const summaryDiv = document.getElementById('templateHoursSummary');
    if (!summaryDiv) return;
    
    const hoursByEmployee = {};
    
    // Inicializar horas para empleados internos y servicios
    employees.forEach(emp => {
        if (emp.type === 'internal' || emp.type === 'service') {
            hoursByEmployee[emp.id] = { name: emp.name, hours: 0 };
        }
    });
    
    // Calcular horas del template (nueva estructura con slots)
    const templateObj = getCurrentTemplate();
    if (!templateObj) return;
    const template = templateObj.data;
    WEEKDAYS.forEach(day => {
        const morningSlots = template[day].morning || [
            { reception: [] },
            { internal: [], external: [] }
        ];
        const afternoonSlots = template[day].afternoon || [
            { reception: [] },
            { internal: [], external: [] }
        ];
        
        // Calculate hours from morning and afternoon shifts
        const morningHours = calculateHoursFromSlots(morningSlots, 'morning');
        const afternoonHours = calculateHoursFromSlots(afternoonSlots, 'afternoon');
        
        // Sum hours
        Object.keys(morningHours).forEach(empId => {
            if (hoursByEmployee[empId]) {
                hoursByEmployee[empId].hours += morningHours[empId];
            }
        });
        Object.keys(afternoonHours).forEach(empId => {
            if (hoursByEmployee[empId]) {
                hoursByEmployee[empId].hours += afternoonHours[empId];
            }
        });
    });
    
    // Renderizar resumen
    let html = '<h3>Resumen de Horas Semanales (Internos)</h3><ul>';
    Object.values(hoursByEmployee).forEach(emp => {
        html += `<li><strong>${emp.name}:</strong> ${emp.hours}h</li>`;
    });
    html += '</ul>';
    summaryDiv.innerHTML = html;
}

// Renderizar calendario mensual con horarios
function renderMonthlySchedule() {
    console.log('Renderizando calendario mensual...');
    loadSchedules();
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
    // El año 2026 empieza el lunes 5 de enero
    if (currentDate.getFullYear() === 2025 && currentDate.getMonth() === 11) {
        // Diciembre 2025: extender hasta el 2 de enero de 2026
        lastDay = new Date(2026, 0, 2); // 2 de enero de 2026
    } else if (currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0) {
        // Enero 2026: empezar el lunes 5 de enero
        firstDay = new Date(2026, 0, 5); // 5 de enero de 2026 (lunes)
    }
    
    const firstDayOfWeek = firstDay.getDay();
    const lastDayOfWeek = lastDay.getDay();
    
    // Calcular semanas a mostrar
    const weeks = calculateWeeksForMonth(firstDay, lastDay, firstDayOfWeek, lastDayOfWeek);
    
    // Renderizar semanas en grupos de 2 (lado a lado)
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
    
    // Añadir resumen de horas mensuales
    const hoursSummary = calculateMonthlyHoursSummary(monthKey, firstDay, lastDay);
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'monthlyHoursSummary';
    summaryDiv.className = 'monthly-hours-summary';
    summaryDiv.innerHTML = hoursSummary;
    scheduleContainer.appendChild(summaryDiv);
    
    // Añadir área de comentarios del mes
    const commentsDiv = document.createElement('div');
    commentsDiv.id = 'monthlyComments';
    commentsDiv.className = 'monthly-comments';
    
    // Obtener comentarios del mes (si existen)
    const monthComments = schedules[monthKey]?._comments || '';
    
    commentsDiv.innerHTML = `
        <h3>Comentarios del Mes</h3>
        <textarea id="monthCommentsTextarea" rows="4" placeholder="Añade comentarios sobre este mes (notas, excepciones, cambios, etc.)...">${monthComments}</textarea>
        <button type="button" class="btn-primary" id="saveMonthCommentsBtn">Guardar Comentarios</button>
    `;
    
    scheduleContainer.appendChild(commentsDiv);
    
    // Event listener para guardar comentarios
    document.getElementById('saveMonthCommentsBtn').addEventListener('click', () => {
        const commentsText = document.getElementById('monthCommentsTextarea').value;
        if (!schedules[monthKey]) {
            schedules[monthKey] = {};
        }
        schedules[monthKey]._comments = commentsText;
        saveSchedules();
        console.log('Comentarios del mes guardados');
        alert('Comentarios guardados correctamente');
    });
    
    console.log('Calendario mensual renderizado');
}

// Calculate week number of the year
function getWeekNumber(date) {
    console.log('Calculating week number for date:', date);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    console.log(`Week number calculated: ${weekNumber}`);
    return weekNumber;
}

// Crear tabla de horario para una semana
function createWeekScheduleTable(week, firstDay, lastDay, monthKey) {
    const container = document.createElement('div');
    
    // Create header container with week number and apply template button
    const weekHeader = document.createElement('div');
    weekHeader.className = 'week-header';
    
    // Calculate week number
    const weekNumber = getWeekNumber(week.startDate);
    const weekTitle = document.createElement('h3');
    weekTitle.className = 'week-title';
    weekTitle.textContent = `Semana ${weekNumber}`;
    
    // Botón para aplicar template con selector
    const applyTemplateContainer = document.createElement('div');
    applyTemplateContainer.className = 'apply-template-container';
    
    const applyTemplateBtn = document.createElement('button');
    applyTemplateBtn.className = 'apply-template-btn-small';
    applyTemplateBtn.textContent = 'Aplicar Template';
    applyTemplateBtn.title = 'Aplicar el horario fijo a esta semana';
    applyTemplateBtn.onclick = () => {
        // Crear modal para seleccionar template
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'selectTemplateModal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '400px';
        
        modalContent.innerHTML = `
            <span class="close-template-select">&times;</span>
            <h2>Seleccionar Template</h2>
            <p>¿Qué template deseas aplicar a esta semana?</p>
            <div id="templatesButtonsContainer" style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;"></div>
            <div style="margin-top: 15px;">
                <button type="button" class="btn-secondary" id="cancelTemplateSelect">Cancelar</button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Event listeners
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        document.querySelector('.close-template-select').addEventListener('click', closeModal);
        document.getElementById('cancelTemplateSelect').addEventListener('click', closeModal);
        
        // Crear botones dinámicamente para cada template
        const templatesContainer = document.getElementById('templatesButtonsContainer');
        templates.forEach(template => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-primary';
            btn.style.flex = '1';
            btn.style.minWidth = '120px';
            btn.textContent = template.name;
            btn.addEventListener('click', () => {
                closeModal();
                applyTemplateToWeek(week, firstDay, lastDay, monthKey, template.id);
            });
            templatesContainer.appendChild(btn);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    };
    
    applyTemplateContainer.appendChild(applyTemplateBtn);
    
    // Add title and button to header
    weekHeader.appendChild(weekTitle);
    weekHeader.appendChild(applyTemplateContainer);
    container.appendChild(weekHeader);
    
    const table = document.createElement('table');
    table.className = 'schedule-table week-table';
    
    // Encabezado con días de la semana (más compacto)
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>H</th><th>L</th><th>M</th><th>X</th><th>J</th><th>V</th>';
    table.appendChild(headerRow);
    
    // Fila de mañana
    const morningRow = document.createElement('tr');
    const morningLabel = document.createElement('td');
    morningLabel.textContent = 'M';
    morningLabel.className = 'time-label';
    morningLabel.title = 'Mañana (9:30-14:00)';
    morningRow.appendChild(morningLabel);
    
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const dayDate = new Date(week.startDate);
        dayDate.setDate(week.startDate.getDate() + dayOffset);
        const cell = createShiftCell(dayDate, 'morning', firstDay, lastDay, monthKey);
        morningRow.appendChild(cell);
    }
    table.appendChild(morningRow);
    
    // Fila de descanso
    const breakRow = document.createElement('tr');
    const breakLabel = document.createElement('td');
    breakLabel.textContent = 'D';
    breakLabel.className = 'time-label';
    breakLabel.title = 'Descanso (14:00-16:00)';
    breakRow.appendChild(breakLabel);
    
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const dayDate = new Date(week.startDate);
        dayDate.setDate(week.startDate.getDate() + dayOffset);
        const cell = document.createElement('td');
        
        // REGLA ESPECIAL: Permitir días 1 y 2 de enero de 2026 en diciembre 2025
        let isValidDay = dayDate >= firstDay && dayDate <= lastDay;
        if (!isValidDay) {
            const isJan1Or2_2026 = dayDate.getFullYear() === 2026 && 
                                   dayDate.getMonth() === 0 && 
                                   (dayDate.getDate() === 1 || dayDate.getDate() === 2);
            const isDec2025 = firstDay.getFullYear() === 2025 && firstDay.getMonth() === 11;
            if (isJan1Or2_2026 && isDec2025) {
                isValidDay = true;
            }
        }
        
        if (isValidDay) {
            cell.className = 'break-cell';
        } else {
            cell.className = 'other-month-cell';
        }
        breakRow.appendChild(cell);
    }
    table.appendChild(breakRow);
    
    // Fila de tarde
    const afternoonRow = document.createElement('tr');
    const afternoonLabel = document.createElement('td');
    afternoonLabel.textContent = 'T';
    afternoonLabel.className = 'time-label';
    afternoonLabel.title = 'Tarde (16:00-20:30)';
    afternoonRow.appendChild(afternoonLabel);
    
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const dayDate = new Date(week.startDate);
        dayDate.setDate(week.startDate.getDate() + dayOffset);
        const cell = createShiftCell(dayDate, 'afternoon', firstDay, lastDay, monthKey);
        afternoonRow.appendChild(cell);
    }
    table.appendChild(afternoonRow);
    
    container.appendChild(table);
    return container;
}

// Calcular resumen de horas mensuales para empleados internos
function calculateMonthlyHoursSummary(monthKey, firstDay, lastDay) {
    const hoursByEmployee = {};
    
    // Inicializar horas para empleados internos y servicios
    employees.forEach(emp => {
        if (emp.type === 'internal' || emp.type === 'service') {
            hoursByEmployee[emp.id] = {
                name: emp.name,
                hoursPerWeek: emp.hoursPerWeek || 0,
                hoursWorked: 0,
                hoursStatus: emp.hoursStatus || 0
            };
        }
    });
    
    // Calcular horas trabajadas del mes
    if (schedules[monthKey]) {
        Object.keys(schedules[monthKey]).forEach(dateStr => {
            // Saltar comentarios (empiezan con _)
            if (dateStr.startsWith('_')) return;
            const date = new Date(dateStr);
            
            // REGLA ESPECIAL: Incluir días 1 y 2 de enero de 2026 en diciembre 2025
            let isValidDay = date >= firstDay && date <= lastDay;
            if (!isValidDay) {
                const isJan1Or2_2026 = date.getFullYear() === 2026 && 
                                       date.getMonth() === 0 && 
                                       (date.getDate() === 1 || date.getDate() === 2);
                const isDec2025 = firstDay.getFullYear() === 2025 && firstDay.getMonth() === 11;
                if (isJan1Or2_2026 && isDec2025) {
                    isValidDay = true;
                }
            }
            
            // Solo contar días que pertenecen al mes (o días especiales)
            if (isValidDay) {
                const daySchedules = schedules[monthKey][dateStr];
                
                // Morning shifts
                if (daySchedules.morning) {
                    daySchedules.morning.forEach(shift => {
                        if (!shift.cancelled) {
                            const employee = employees.find(e => e.id === shift.employeeId);
                            if (employee && (employee.type === 'internal' || employee.type === 'service')) {
                                if (hoursByEmployee[shift.employeeId]) {
                                    hoursByEmployee[shift.employeeId].hoursWorked += SHIFT_TIMES.morning.duration;
                                }
                            }
                        }
                    });
                }
                
                // Afternoon shifts
                if (daySchedules.afternoon) {
                    daySchedules.afternoon.forEach(shift => {
                        if (!shift.cancelled) {
                            const employee = employees.find(e => e.id === shift.employeeId);
                            if (employee && (employee.type === 'internal' || employee.type === 'service')) {
                                if (hoursByEmployee[shift.employeeId]) {
                                    hoursByEmployee[shift.employeeId].hoursWorked += SHIFT_TIMES.afternoon.duration;
                                }
                            }
                        }
                    });
                }
            }
        });
    }
    
    // Calcular semanas laborables reales del mes
    // Usar la misma lógica que calculateWeeksForMonth para obtener las semanas reales
    const firstDayOfWeek = firstDay.getDay();
    const lastDayOfWeek = lastDay.getDay();
    const weeks = calculateWeeksForMonth(firstDay, lastDay, firstDayOfWeek, lastDayOfWeek);
    
    // Contar semanas que tienen días laborables del mes
    let weeksWithWorkingDays = 0;
    weeks.forEach(week => {
        let hasWorkingDay = false;
        for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
            const dayDate = new Date(week.startDate);
            dayDate.setDate(week.startDate.getDate() + dayOffset);
            if (dayDate >= firstDay && dayDate <= lastDay) {
                hasWorkingDay = true;
                break;
            }
        }
        if (hasWorkingDay) {
            weeksWithWorkingDays++;
        }
    });
    
    const weeksInMonth = weeksWithWorkingDays;
    
    // Contar días festivos del mes
    let publicHolidaysCount = 0;
    if (schedules[monthKey]) {
        Object.keys(schedules[monthKey]).forEach(dateStr => {
            // Saltar comentarios (empiezan con _)
            if (dateStr.startsWith('_')) return;
            const date = new Date(dateStr);
            
            // REGLA ESPECIAL: Incluir días 1 y 2 de enero de 2026 en diciembre 2025
            let isValidDay = date >= firstDay && date <= lastDay;
            if (!isValidDay) {
                const isJan1Or2_2026 = date.getFullYear() === 2026 && 
                                       date.getMonth() === 0 && 
                                       (date.getDate() === 1 || date.getDate() === 2);
                const isDec2025 = firstDay.getFullYear() === 2025 && firstDay.getMonth() === 11;
                if (isJan1Or2_2026 && isDec2025) {
                    isValidDay = true;
                }
            }
            
            if (isValidDay && schedules[monthKey][dateStr]._publicHoliday) {
                publicHolidaysCount++;
            }
        });
    }
    
    // Aplicar reglas especiales por empleado
    // REGLA: Patricia hace 4.5h menos cada mes (dedicadas en casa para hacer los turnos)
    Object.values(hoursByEmployee).forEach(emp => {
        if (emp.name === 'Patricia') {
            emp.hoursWorked = Math.max(0, emp.hoursWorked - 4.5);
        }
    });
    
    // REGLA: Días festivos oficiales
    // Patricia: +6.30 horas por día festivo
    // Lanny y Maite: +4.5 horas por día festivo
    // Desi: no le afecta (contratada de otra forma)
    Object.values(hoursByEmployee).forEach(emp => {
        if (emp.name === 'Patricia') {
            emp.hoursWorked += publicHolidaysCount * 6.30;
        } else if (emp.name === 'Lanny' || emp.name === 'Maite') {
            emp.hoursWorked += publicHolidaysCount * 4.5;
        }
        // Desi no se afecta, no hacemos nada
    });
    
    // Renderizar resumen
    let html = '<h3>Resumen de Horas Mensuales (Empleados Internos)</h3>';
    html += '<div class="hours-summary-table">';
    html += '<table>';
    html += '<thead><tr><th>Empleado</th><th>Horas Contratadas/Mes</th><th>Horas Trabajadas</th><th>Diferencia</th><th>Estado</th></tr></thead>';
    html += '<tbody>';
    
    Object.values(hoursByEmployee).forEach(emp => {
        const hoursContracted = emp.hoursPerWeek * weeksInMonth;
        const difference = emp.hoursWorked - hoursContracted;
        const statusClass = difference < 0 ? 'negative' : (difference > 0 ? 'positive' : 'neutral');
        const statusText = difference < 0 
            ? `Debe ${Math.abs(difference).toFixed(1)}h` 
            : (difference > 0 ? `Tiene ${difference.toFixed(1)}h extra` : 'Completo');
        
        // Notas especiales
        let specialNotes = [];
        if (emp.name === 'Patricia') {
            specialNotes.push('<small style="color: #666;">(-4.5h en casa)</small>');
        }
        if (publicHolidaysCount > 0) {
            if (emp.name === 'Patricia') {
                specialNotes.push(`<small style="color: #666;">(+${(publicHolidaysCount * 6.30).toFixed(1)}h festivos)</small>`);
            } else if (emp.name === 'Lanny' || emp.name === 'Maite') {
                specialNotes.push(`<small style="color: #666;">(+${(publicHolidaysCount * 4.5).toFixed(1)}h festivos)</small>`);
            }
        }
        const specialNote = specialNotes.length > 0 ? ' ' + specialNotes.join(' ') : '';
        
        html += `<tr class="${statusClass}">`;
        html += `<td><strong>${emp.name}</strong>${specialNote}</td>`;
        html += `<td>${hoursContracted.toFixed(1)}h</td>`;
        html += `<td>${emp.hoursWorked.toFixed(1)}h</td>`;
        html += `<td>${difference >= 0 ? '+' : ''}${difference.toFixed(1)}h</td>`;
        html += `<td>${statusText}</td>`;
        html += `</tr>`;
    });
    
    html += '</tbody></table>';
    html += '</div>';
    
    return html;
}

// Helper function to convert template slots to shifts
function convertSlotsToShifts(slots, shiftType) {
    const shifts = [];
    const shiftTime = SHIFT_TIMES[shiftType];
    
    // Reception (slot 0)
    if (slots[0]?.reception) {
        slots[0].reception.forEach(empId => {
            shifts.push({
                employeeId: empId,
                startTime: shiftTime.start,
                cancelled: false,
                notes: 'RECEPCIÓN'
            });
        });
    }
    
    // Process all additional slots dynamically
    for (let i = 1; i < slots.length; i++) {
        const slot = slots[i];
        const slotNumber = i; // slot index is 1, 2, 3... (0 is reception)
        
        if (slot?.internal) {
            slot.internal.forEach(empId => {
                shifts.push({
                    employeeId: empId,
                    startTime: shiftTime.start,
                    cancelled: false,
                    notes: `Slot ${slotNumber} - Interno`
                });
            });
        }
        if (slot?.external) {
            slot.external.forEach(empId => {
                shifts.push({
                    employeeId: empId,
                    startTime: shiftTime.start,
                    cancelled: false,
                    notes: `Slot ${slotNumber} - Externo`
                });
            });
        }
    }
    
    return shifts;
}

// Aplicar template a una semana específica
function applyTemplateToWeek(week, firstDay, lastDay, monthKey, templateId = 'template1') {
    const templateObj = getTemplateById(templateId);
    if (!templateObj) {
        console.error(`Template ${templateId} not found`);
        return;
    }
    
    if (confirm(`¿Aplicar "${templateObj.name}" a esta semana? Esto sobrescribirá los turnos existentes.`)) {
        console.log(`Aplicando ${templateObj.name} a semana...`);
        
        const template = templateObj.data;
        
        for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
            const dayDate = new Date(week.startDate);
            dayDate.setDate(week.startDate.getDate() + dayOffset);
            
            // REGLA ESPECIAL: Permitir días 1 y 2 de enero de 2026 en diciembre 2025
            let isValidDay = dayDate >= firstDay && dayDate <= lastDay;
            if (!isValidDay) {
                const isJan1Or2_2026 = dayDate.getFullYear() === 2026 && 
                                       dayDate.getMonth() === 0 && 
                                       (dayDate.getDate() === 1 || dayDate.getDate() === 2);
                const isDec2025 = firstDay.getFullYear() === 2025 && firstDay.getMonth() === 11;
                if (isJan1Or2_2026 && isDec2025) {
                    isValidDay = true;
                }
            }
            
            // Solo aplicar si el día pertenece al mes (o días especiales)
            if (!isValidDay) continue;
            
            const dateStr = dayDate.toISOString().split('T')[0];
            const dayName = WEEKDAYS[dayDate.getDay() - 1];
            
            if (!schedules[monthKey]) {
                schedules[monthKey] = {};
            }
            if (!schedules[monthKey][dateStr]) {
                schedules[monthKey][dateStr] = { morning: [], afternoon: [] };
            }
            
            // Apply morning shifts
            const morningSlots = template[dayName].morning || [
                { reception: [] },
                { internal: [], external: [] }
            ];
            schedules[monthKey][dateStr].morning = convertSlotsToShifts(morningSlots, 'morning');
            
            // Apply afternoon shifts
            const afternoonSlots = template[dayName].afternoon || [
                { reception: [] },
                { internal: [], external: [] }
            ];
            schedules[monthKey][dateStr].afternoon = convertSlotsToShifts(afternoonSlots, 'afternoon');
        }
        
        saveSchedules();
        renderMonthlySchedule();
        console.log(`${templateName} aplicado correctamente`);
    }
}

// Crear celda de turno
function createShiftCell(date, shiftType, firstDay, lastDay, monthKey) {
    const cell = document.createElement('td');
    
    // REGLA ESPECIAL: Permitir días 1 y 2 de enero de 2026 en diciembre 2025
    // Verificar si el día está dentro del rango válido
    let isValidDay = date >= firstDay && date <= lastDay;
    
    // Si no está en el rango, verificar si es el 1 o 2 de enero de 2026 y estamos en diciembre 2025
    if (!isValidDay) {
        const isJan1Or2_2026 = date.getFullYear() === 2026 && 
                               date.getMonth() === 0 && 
                               (date.getDate() === 1 || date.getDate() === 2);
        const isDec2025 = firstDay.getFullYear() === 2025 && firstDay.getMonth() === 11;
        
        if (isJan1Or2_2026 && isDec2025) {
            isValidDay = true;
        }
    }
    
    // Si el día no pertenece al rango válido, mostrar celda vacía
    if (!isValidDay) {
        cell.className = 'other-month-cell';
        return cell;
    }
    
    const dateStr = date.toISOString().split('T')[0];
    const shifts = getShiftsForDay(dateStr, shiftType, monthKey);
    
    cell.className = `shift-cell ${shiftType}`;
    
    // Container para el header del día (checkbox y número)
    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';
    
    // Checkbox para días festivos (solo en la fila de mañana para evitar duplicados)
    if (shiftType === 'morning') {
        const holidayCheckbox = document.createElement('input');
        holidayCheckbox.type = 'checkbox';
        holidayCheckbox.className = 'public-holiday-checkbox';
        holidayCheckbox.title = 'Public Holiday';
        
        // Verificar si el día es festivo
        const isPublicHoliday = schedules[monthKey]?.[dateStr]?._publicHoliday || false;
        holidayCheckbox.checked = isPublicHoliday;
        
        // Event listener para guardar el estado
        holidayCheckbox.addEventListener('change', (e) => {
            if (!schedules[monthKey]) {
                schedules[monthKey] = {};
            }
            if (!schedules[monthKey][dateStr]) {
                schedules[monthKey][dateStr] = { morning: [], afternoon: [] };
            }
            schedules[monthKey][dateStr]._publicHoliday = e.target.checked;
            saveSchedules();
            // Recalcular resumen de horas
            renderMonthlySchedule();
            console.log(`Día festivo ${e.target.checked ? 'activado' : 'desactivado'} para ${dateStr}`);
        });
        
        dayHeader.appendChild(holidayCheckbox);
    }
    
    // Añadir número de día
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayHeader.appendChild(dayNumber);
    
    cell.appendChild(dayHeader);
    
    // Añadir contenido de turnos
    const shiftsContainer = document.createElement('div');
    shiftsContainer.className = 'shifts-container';
    shiftsContainer.innerHTML = renderShiftCellContent(shifts, dateStr, shiftType);
    cell.appendChild(shiftsContainer);
    
    return cell;
}

// Calcular semanas a mostrar para el mes
// REGLA: La primera y última semana del mes cuentan donde más días de ese mes tengan
function calculateWeeksForMonth(firstDay, lastDay, firstDayOfWeek, lastDayOfWeek) {
    const weeks = [];
    
    // Calcular el lunes de la primera semana
    // Si el día 1 es domingo (0), el lunes de esa semana es el día 2
    // Si el día 1 es lunes (1), el lunes de esa semana es el día 1
    // Si el día 1 es martes (2), el lunes de esa semana es el día anterior (mes anterior)
    let weekStart = new Date(firstDay);
    
    // Ajustar al lunes de la semana
    if (firstDayOfWeek === 0) {
        // Si es domingo, el lunes es el día 2
        weekStart.setDate(firstDay.getDate() + 1);
    } else if (firstDayOfWeek === 1) {
        // Si es lunes, ya estamos en el lunes
        weekStart = new Date(firstDay);
    } else {
        // Si es martes-viernes, retroceder al lunes anterior
        weekStart.setDate(firstDay.getDate() - (firstDayOfWeek - 1));
    }
    
    // Contar días del mes en la primera semana
    let daysInFirstWeek = 0;
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(weekStart);
        checkDate.setDate(weekStart.getDate() + i);
        if (checkDate >= firstDay && checkDate <= lastDay) {
            daysInFirstWeek++;
        }
    }
    
    // Si la primera semana tiene menos de 4 días del mes, usar la siguiente semana
    if (daysInFirstWeek < 4) {
        weekStart.setDate(weekStart.getDate() + 7);
    }
    
    // Calcular el lunes de la última semana
    let weekEnd = new Date(lastDay);
    // Ajustar al lunes de la semana que contiene el último día
    if (lastDayOfWeek === 0) {
        // Si el último día es domingo, retroceder al lunes anterior
        weekEnd.setDate(lastDay.getDate() - 6);
    } else if (lastDayOfWeek === 1) {
        // Si es lunes, ya estamos en el lunes
        weekEnd = new Date(lastDay);
    } else {
        // Si es martes-domingo, retroceder al lunes de esa semana
        weekEnd.setDate(lastDay.getDate() - (lastDayOfWeek - 1));
    }
    
    // Contar días del mes en la última semana
    let daysInLastWeek = 0;
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(weekEnd);
        checkDate.setDate(weekEnd.getDate() + i);
        if (checkDate >= firstDay && checkDate <= lastDay) {
            daysInLastWeek++;
        }
    }
    
    // Si la última semana tiene menos de 4 días del mes, usar la semana anterior
    // EXCEPCIÓN: Si el último día del mes es miércoles o antes (día 0-3), 
    // siempre incluir esa semana para meses como diciembre 2025
    if (daysInLastWeek < 4 && lastDayOfWeek > 3) {
        weekEnd.setDate(weekEnd.getDate() - 7);
    }
    
    // Generar todas las semanas desde weekStart hasta weekEnd
    let currentWeekStart = new Date(weekStart);
    while (currentWeekStart <= weekEnd) {
        weeks.push({
            startDate: new Date(currentWeekStart)
        });
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
}


// Group shifts by slot based on notes
function groupShiftsBySlot(shifts) {
    const groups = {
        reception: [],
        slots: {}
    };
    
    shifts.forEach((shift, index) => {
        const notes = shift.notes || '';
        
        if (notes.includes('RECEPCIÓN')) {
            groups.reception.push({ shift, index });
        } else {
            // Extract slot number from notes (e.g., "Slot 2 - Interno" -> slot 2)
            const slotMatch = notes.match(/Slot (\d+)/);
            if (slotMatch) {
                const slotNumber = slotMatch[1];
                if (!groups.slots[slotNumber]) {
                    groups.slots[slotNumber] = [];
                }
                groups.slots[slotNumber].push({ shift, index });
            } else {
                // Shifts without slot info go to a default group
                if (!groups.slots['other']) {
                    groups.slots['other'] = [];
                }
                groups.slots['other'].push({ shift, index });
            }
        }
    });
    
    return groups;
}

// Renderizar contenido de celda de turno (versión minimalista con colores, agrupado por slots)
function renderShiftCellContent(shifts, dateStr, shiftType) {
    if (shifts.length === 0) {
        return `<button class="add-shift-btn" onclick="openShiftModal('${dateStr}', '${shiftType}')" title="Añadir turno">+</button>`;
    }
    
    // Group shifts by slot
    const grouped = groupShiftsBySlot(shifts);
    let html = '';
    
    // Render reception first
    if (grouped.reception.length > 0) {
        html += `<div class="shift-slot-group" data-slot-type="reception">`;
        grouped.reception.forEach(({ shift, index }) => {
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
                    onclick="openShiftModal('${dateStr}', '${shiftType}')" 
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
            
            slotShifts.forEach(({ shift, index }) => {
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
                        onclick="openShiftModal('${dateStr}', '${shiftType}')" 
            title="${title}${vacationTitle}"
            style="background-color: ${backgroundColor}; border-color: ${borderColor};">
            ${employee.name}${isCancelled ? ' ❌' : ''}${vacationIcon}
                    </div>
        </div>`;
    });
            
            html += `</div>`;
        }
    });
    
    html += `<button class="add-shift-btn" onclick="openShiftModal('${dateStr}', '${shiftType}')" title="Añadir turno">+</button>`;
    return html;
}

// Ajustar brillo de color para el borde
function adjustColorBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Obtener turnos para un día
function getShiftsForDay(dateStr, shiftType, monthKey) {
    // REGLA ESPECIAL: Si la fecha es 1 o 2 de enero de 2026, también buscar en diciembre 2025
    const date = new Date(dateStr);
    const isJan1Or2_2026 = date.getFullYear() === 2026 && 
                          date.getMonth() === 0 && 
                          (date.getDate() === 1 || date.getDate() === 2);
    
    // Primero intentar con el monthKey actual
    if (schedules[monthKey] && schedules[monthKey][dateStr]) {
        return schedules[monthKey][dateStr][shiftType] || [];
    }
    
    // Si es 1 o 2 de enero de 2026, buscar también en diciembre 2025
    if (isJan1Or2_2026) {
        const dec2025Key = '2025-12';
        if (schedules[dec2025Key] && schedules[dec2025Key][dateStr]) {
            return schedules[dec2025Key][dateStr][shiftType] || [];
        }
    }
    
    return [];
}


// Renderizar lista de empleados
function renderEmployees() {
    console.log('Renderizando lista de empleados...');
    const employeesList = document.getElementById('employeesList');
    employeesList.innerHTML = '';
    
    if (employees.length === 0) {
        employeesList.innerHTML = '<p>No se encontraron empleados. ¡Añade tu primer empleado!</p>';
        return;
    }
    
    employees.forEach(employee => {
        const card = document.createElement('div');
        card.className = `employee-card ${employee.type}`;
        
        const hoursStatusClass = employee.hoursStatus < -2 ? 'negative' : 'positive';
        const typeLabel = employee.type === 'internal' ? 'INTERNO' : (employee.type === 'service' ? 'SERVICIO' : 'EXTERNO');
        const isInternalType = employee.type === 'internal' || employee.type === 'service';
        const hoursStatusText = isInternalType 
            ? `Estado de Horas: ${employee.hoursStatus}h ${employee.hoursStatus < -2 ? '(⚠️ Por debajo de -2h)' : ''}`
            : 'Horas no controladas';
        
        const commentsDisplay = employee.comments ? `
            <div class="employee-info employee-comments">
                <strong>Comentarios:</strong> ${employee.comments}
            </div>
        ` : '';
        
        // Show employee color
        const colorDisplay = employee.color ? `
            <div class="employee-color-display" style="background-color: ${employee.color}; border: 1px solid ${adjustColorBrightness(employee.color, -20)};"></div>
        ` : '';
        
        card.innerHTML = `
            <h3>${colorDisplay}${employee.name}</h3>
            <span class="employee-type ${employee.type}">${typeLabel}</span>
            <div class="employee-info">
                <strong>Rol:</strong> ${employee.role || 'N/A'}
            </div>
            ${isInternalType ? `
                <div class="employee-info">
                    <strong>H/Sem:</strong> ${employee.hoursPerWeek}h
                </div>
                <div class="employee-info hours-status ${hoursStatusClass}">
                    ${hoursStatusText}
                </div>
            ` : ''}
            ${commentsDisplay}
            <div class="employee-actions">
                <button class="btn-secondary btn-edit" onclick="editEmployee(${employee.id})" style="padding: 4px 8px; font-size: 0.7rem;">Editar</button>
                ${isInternalType ? `<button class="btn-secondary" onclick="openVacationsModal(${employee.id})" style="padding: 4px 8px; font-size: 0.7rem;">Vacaciones</button>` : ''}
                <button class="btn-delete" onclick="deleteEmployee(${employee.id})">Eliminar</button>
            </div>
        `;
        
        employeesList.appendChild(card);
    });
    
    console.log(`Renderizados ${employees.length} empleados`);
}

// Abrir modal de empleado
function openEmployeeModal(employeeId = null) {
    console.log(`Abriendo modal de empleado para ID: ${employeeId || 'nuevo'}`);
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('employeeId').value = '';
    
    if (employeeId) {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            title.textContent = 'Editar Empleado';
            document.getElementById('employeeId').value = employee.id;
            document.getElementById('employeeName').value = employee.name;
            document.getElementById('employeeType').value = employee.type;
            document.getElementById('employeeRole').value = employee.role || '';
            document.getElementById('hoursPerWeek').value = employee.hoursPerWeek || 0;
            document.getElementById('hoursStatus').value = employee.hoursStatus || 0;
            document.getElementById('employeeComments').value = employee.comments || '';
            document.getElementById('employeeColor').value = employee.color || '#B3D9FF';
            document.getElementById('employeeColorText').value = employee.color || '#B3D9FF';
            
            // Disparar evento change para actualizar estado deshabilitado
            document.getElementById('employeeType').dispatchEvent(new Event('change'));
        }
    } else {
        title.textContent = 'Añadir Empleado';
        // Disparar evento change para establecer estado inicial
        document.getElementById('employeeType').dispatchEvent(new Event('change'));
    }
    
    modal.classList.add('active');
}

// Cerrar modal de empleado
function closeEmployeeModal() {
    console.log('Cerrando modal de empleado');
    const modal = document.getElementById('employeeModal');
    modal.classList.remove('active');
}

// Manejar envío del formulario de empleado
function handleEmployeeSubmit(e) {
    e.preventDefault();
    console.log('Manejando envío del formulario de empleado...');
    
    const id = document.getElementById('employeeId').value;
    const name = document.getElementById('employeeName').value;
    const type = document.getElementById('employeeType').value;
    const role = document.getElementById('employeeRole').value;
    const isInternalType = type === 'internal' || type === 'service';
    const hoursPerWeek = isInternalType ? parseFloat(document.getElementById('hoursPerWeek').value) || 0 : 0;
    const hoursStatus = isInternalType ? parseFloat(document.getElementById('hoursStatus').value) || 0 : 0;
    const comments = document.getElementById('employeeComments').value || '';
    // Todos los empleados pueden tener color (internos y externos)
    const colorInput = document.getElementById('employeeColor');
    const color = colorInput && colorInput.value ? colorInput.value : (type === 'internal' ? '#B3D9FF' : generateRandomPastelColor());
    
    if (id) {
        // Actualizar empleado existente
        const index = employees.findIndex(e => e.id === parseInt(id));
        if (index !== -1) {
            employees[index] = {
                ...employees[index],
                name,
                type,
                role,
                hoursPerWeek,
                hoursStatus,
                comments,
                color
            };
            console.log(`Empleado actualizado: ${name}`);
        }
    } else {
        // Añadir nuevo empleado
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        employees.push({
            id: newId,
            name,
            type,
            role,
            hoursPerWeek,
            hoursStatus,
            comments,
            color
        });
        console.log(`Nuevo empleado añadido: ${name} (ID: ${newId})`);
    }
    
    saveEmployees();
    renderEmployees();
    closeEmployeeModal();
}

// Editar empleado
function editEmployee(id) {
    console.log(`Editando empleado con ID: ${id}`);
    openEmployeeModal(id);
}

// Eliminar empleado
function deleteEmployee(id) {
    console.log(`Eliminando empleado con ID: ${id}`);
    const employee = employees.find(e => e.id === id);
    if (employee && confirm(`¿Estás seguro de que quieres eliminar a ${employee.name}?`)) {
        employees = employees.filter(e => e.id !== id);
        saveEmployees();
        renderEmployees();
        console.log(`Empleado eliminado: ${employee.name}`);
    }
}

// Abrir modal de turno (unificado con template - siempre muestra el turno completo)
function openShiftModal(dateStr, shiftType, shiftIndex = null) {
    console.log(`Abriendo modal de turno completo: ${dateStr}, ${shiftType}`);
    
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const shifts = schedules[monthKey]?.[dateStr]?.[shiftType] || [];
    
    // Convert ALL existing shifts to slots structure (always show complete shift)
    let slots = [
        { reception: [] },
        { internal: [], external: [] }
    ];
    
    // Convert all existing shifts to slots structure
    shifts.forEach(shift => {
            const employee = employees.find(e => e.id === shift.employeeId);
        if (!employee) return;
        
        const notes = shift.notes || '';
        if (notes.includes('RECEPCIÓN')) {
            if (slots[0].reception.length === 0) {
                slots[0].reception = [shift.employeeId];
            }
            } else {
            const slotMatch = notes.match(/Slot (\d+)/);
            if (slotMatch) {
                const slotNumber = parseInt(slotMatch[1]);
                while (slots.length <= slotNumber) {
                    slots.push({ internal: [], external: [] });
                }
                if (notes.includes('Interno')) {
                    if (slots[slotNumber].internal.length === 0) {
                        slots[slotNumber].internal = [shift.employeeId];
                    }
                } else if (notes.includes('Externo')) {
                    if (slots[slotNumber].external.length === 0) {
                        slots[slotNumber].external = [shift.employeeId];
            }
        }
    } else {
                // Legacy shift - distribute to first available slot
                if (employee.type === 'internal' || employee.type === 'service') {
                    if (slots[1].internal.length === 0) {
                        slots[1].internal = [shift.employeeId];
                    }
            } else {
                    if (slots[1].external.length === 0) {
                        slots[1].external = [shift.employeeId];
                    }
                }
            }
        }
    });
    
    // Separate employees by type
    const internalEmployees = employees.filter(emp => emp.type === 'internal');
    const externalEmployees = employees.filter(emp => emp.type === 'external');
    const serviceEmployees = employees.filter(emp => emp.type === 'service');
    
    // Create modal dynamically (same as template modal)
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'shiftModalDynamic';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '700px';
    
    // Build slots HTML
    let slotsHTML = '';
    slotsHTML += renderSlotHTML(0, slots[0], internalEmployees, externalEmployees, serviceEmployees, true);
    
    // Render additional slots (starting from index 1)
    for (let i = 1; i < slots.length; i++) {
        slotsHTML += renderSlotHTML(i, slots[i], internalEmployees, externalEmployees, serviceEmployees, false);
    }
    
    const dateObj = new Date(dateStr);
    const dayName = WEEKDAY_NAMES[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
    const hasExistingShifts = shifts.length > 0;
    
    modalContent.innerHTML = `
        <span class="close-shift-dynamic">&times;</span>
        <h2>${hasExistingShifts ? 'Editar' : 'Añadir'} Turno Completo - ${dayName} ${dateObj.getDate()}/${dateObj.getMonth() + 1} - ${shiftType === 'morning' ? 'Mañana' : 'Tarde'}</h2>
        
        <div class="template-slots-container" id="shiftSlotsContainer">
            ${slotsHTML}
        </div>
        
        <div class="template-slot-actions">
            <button type="button" class="btn-secondary btn-small" id="addShiftSlotBtn">+ Añadir Slot</button>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn-primary" id="saveShiftBtn">Guardar</button>
            <button type="button" class="btn-secondary" id="cancelShiftBtn">Cancelar</button>
            ${shifts.length > 0 ? `<button type="button" class="btn-delete" id="deleteShiftBtn">Eliminar Todos los Turnos</button>` : ''}
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Store context
    window.currentShiftModal = {
        dateStr,
        shiftType,
        monthKey,
        internalEmployees,
        externalEmployees,
        serviceEmployees,
        container: modalContent.querySelector('#shiftSlotsContainer')
    };
    
    // Event listeners
    document.querySelector('.close-shift-dynamic').addEventListener('click', () => {
        document.body.removeChild(modal);
        delete window.currentShiftModal;
    });
    
    document.getElementById('cancelShiftBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        delete window.currentShiftModal;
    });
    
    // Botón para eliminar todos los turnos del turno completo
    if (shifts.length > 0) {
        document.getElementById('deleteShiftBtn').addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres eliminar todos los turnos de este horario?')) {
                if (schedules[monthKey]?.[dateStr]?.[shiftType]) {
                    schedules[monthKey][dateStr][shiftType] = [];
                    saveSchedules();
                    renderMonthlySchedule();
                    document.body.removeChild(modal);
                    delete window.currentShiftModal;
                    console.log('Todos los turnos eliminados');
                }
            }
        });
    }
    
    document.getElementById('addShiftSlotBtn').addEventListener('click', () => {
        const container = document.getElementById('shiftSlotsContainer');
        const currentSlots = container.querySelectorAll('.template-slot[data-slot-index]');
        const nextIndex = currentSlots.length;
        addSlotToModal(container, nextIndex, internalEmployees, externalEmployees, serviceEmployees);
    });
    
    document.getElementById('saveShiftBtn').addEventListener('click', () => {
        // Collect selected employees for each slot from selects
        const slotElements = modalContent.querySelectorAll('.template-slot[data-slot-index]');
        
        const newShifts = [];
        
        slotElements.forEach(slotElement => {
            const slotIndex = parseInt(slotElement.dataset.slotIndex);
            
            if (slotIndex === 0) {
                // Reception - single select
                const receptionSelect = slotElement.querySelector('.template-select[data-type="reception"]');
                if (receptionSelect && receptionSelect.value) {
                    const empId = parseInt(receptionSelect.value);
                    const employee = employees.find(e => e.id === empId);
                    if (employee) {
                        const isInternalType = employee.type === 'internal' || employee.type === 'service';
                        newShifts.push({
                            employeeId: empId,
                            startTime: isInternalType ? SHIFT_TIMES[shiftType].start : SHIFT_TIMES[shiftType].start,
                            cancelled: false,
                            notes: 'RECEPCIÓN'
                        });
                    }
                }
            } else {
                // Regular slot - two selects (internal, external)
                const internalSelect = slotElement.querySelector('.template-select[data-type="internal"]');
                const externalSelect = slotElement.querySelector('.template-select[data-type="external"]');
                
                if (internalSelect && internalSelect.value) {
                    const empId = parseInt(internalSelect.value);
                    const employee = employees.find(e => e.id === empId);
                    if (employee) {
                        const isInternalType = employee.type === 'internal' || employee.type === 'service';
                        const slotNumber = slotIndex; // slotIndex is 1, 2, 3... (0 is reception)
                        newShifts.push({
                            employeeId: empId,
                            startTime: isInternalType ? SHIFT_TIMES[shiftType].start : SHIFT_TIMES[shiftType].start,
                            cancelled: false,
                            notes: `Slot ${slotNumber} - Interno`
                        });
                    }
                }
                if (externalSelect && externalSelect.value) {
                    const empId = parseInt(externalSelect.value);
                    const employee = employees.find(e => e.id === empId);
                    if (employee) {
                        const slotNumber = slotIndex; // slotIndex is already the slot number (1, 2, 3...)
                        newShifts.push({
                            employeeId: empId,
                            startTime: SHIFT_TIMES[shiftType].start,
                            cancelled: false,
                            notes: `Slot ${slotNumber} - Externo`
                        });
                    }
                }
            }
        });
        
    if (!schedules[monthKey]) {
        schedules[monthKey] = {};
    }
    if (!schedules[monthKey][dateStr]) {
        schedules[monthKey][dateStr] = { morning: [], afternoon: [] };
    }
    
        // Replace all shifts for this day/shiftType
        schedules[monthKey][dateStr][shiftType] = newShifts;
    
    saveSchedules();
    renderMonthlySchedule();
        document.body.removeChild(modal);
        delete window.currentShiftModal;
    console.log('Turno guardado correctamente');
    });
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            delete window.currentShiftModal;
        }
    });
}

// Cerrar modal de turno (ahora es dinámico, se maneja dentro de openShiftModal)
function closeShiftModal() {
    console.log('Cerrando modal de turno');
    const modal = document.getElementById('shiftModalDynamic');
    if (modal) {
        document.body.removeChild(modal);
        delete window.currentShiftModal;
    }
}

// Abrir modal de vacaciones
function openVacationsModal(employeeId) {
    console.log(`Abriendo modal de vacaciones para empleado ${employeeId}`);
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) {
        console.error('Empleado no encontrado');
        return;
    }
    
    const modal = document.getElementById('vacationsModal');
    const content = document.getElementById('vacationsContent');
    const title = document.getElementById('vacationsModalTitle');
    
    title.textContent = `Vacaciones - ${employee.name}`;
    
    // Obtener año actual
    const currentYear = currentDate.getFullYear();
    
    // Inicializar estructura si no existe
    if (!vacations[currentYear]) {
        vacations[currentYear] = {};
    }
    if (!vacations[currentYear][employeeId]) {
        vacations[currentYear][employeeId] = {
            feria: [],
            agosto: [],
            navidad: [],
            libre: []
        };
    }
    
    const empVacations = vacations[currentYear][employeeId];
    
    // Crear interfaz de gestión de vacaciones
    let html = `
        <div class="vacations-manager">
            <div class="vacations-year-selector">
                <label for="vacationYear">Año:</label>
                <select id="vacationYear">
                    <option value="${currentYear - 1}">${currentYear - 1}</option>
                    <option value="${currentYear}" selected>${currentYear}</option>
                    <option value="${currentYear + 1}">${currentYear + 1}</option>
                </select>
            </div>
            
            <div class="vacations-section">
                <h3>Feria (2 días)</h3>
                <div class="vacation-dates-input">
                    <input type="date" id="feriaDate1" class="vacation-date-input">
                    <input type="date" id="feriaDate2" class="vacation-date-input">
                </div>
                <div class="vacation-dates-display" id="feriaDatesDisplay"></div>
            </div>
            
            <div class="vacations-section">
                <h3>Agosto (10 días - normalmente primera o segunda quincena)</h3>
                <div class="vacation-dates-input">
                    <input type="date" id="agostoStart" class="vacation-date-input" placeholder="Fecha inicio">
                    <input type="date" id="agostoEnd" class="vacation-date-input" placeholder="Fecha fin">
                    <button type="button" class="btn-secondary" id="addAgostoRange">Añadir Rango</button>
                </div>
                <div class="vacation-dates-display" id="agostoDatesDisplay"></div>
            </div>
            
            <div class="vacations-section">
                <h3>Navidad (5 días)</h3>
                <div class="vacation-dates-input">
                    <input type="date" id="navidadDate1" class="vacation-date-input">
                    <input type="date" id="navidadDate2" class="vacation-date-input">
                    <input type="date" id="navidadDate3" class="vacation-date-input">
                    <input type="date" id="navidadDate4" class="vacation-date-input">
                    <input type="date" id="navidadDate5" class="vacation-date-input">
                </div>
                <div class="vacation-dates-display" id="navidadDatesDisplay"></div>
            </div>
            
            <div class="vacations-section">
                <h3>Libre (5 días a elegir)</h3>
                <div class="vacation-dates-input">
                    <input type="date" id="libreDate1" class="vacation-date-input">
                    <input type="date" id="libreDate2" class="vacation-date-input">
                    <input type="date" id="libreDate3" class="vacation-date-input">
                    <input type="date" id="libreDate4" class="vacation-date-input">
                    <input type="date" id="libreDate5" class="vacation-date-input">
                </div>
                <div class="vacation-dates-display" id="libreDatesDisplay"></div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-primary" id="saveVacationsBtn">Guardar Vacaciones</button>
                <button type="button" class="btn-secondary" id="cancelVacationsBtn">Cancelar</button>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    
    // Cargar fechas existentes
    function loadVacationDates() {
        const year = parseInt(document.getElementById('vacationYear').value);
        if (!vacations[year]) {
            vacations[year] = {};
        }
        if (!vacations[year][employeeId]) {
            vacations[year][employeeId] = { feria: [], agosto: [], navidad: [], libre: [] };
        }
        
        const vac = vacations[year][employeeId];
        
        // Feria
        if (vac.feria && vac.feria.length > 0) {
            document.getElementById('feriaDate1').value = vac.feria[0] || '';
            document.getElementById('feriaDate2').value = vac.feria[1] || '';
        }
        updateDatesDisplay('feria', vac.feria || []);
        
        // Agosto
        updateDatesDisplay('agosto', vac.agosto || []);
        
        // Navidad
        if (vac.navidad && vac.navidad.length > 0) {
            for (let i = 0; i < 5; i++) {
                const input = document.getElementById(`navidadDate${i + 1}`);
                if (input) input.value = vac.navidad[i] || '';
            }
        }
        updateDatesDisplay('navidad', vac.navidad || []);
        
        // Libre
        if (vac.libre && vac.libre.length > 0) {
            for (let i = 0; i < 5; i++) {
                const input = document.getElementById(`libreDate${i + 1}`);
                if (input) input.value = vac.libre[i] || '';
            }
        }
        updateDatesDisplay('libre', vac.libre || []);
    }
    
    function updateDatesDisplay(type, dates) {
        const display = document.getElementById(`${type}DatesDisplay`);
        if (!display) return;
        
        if (dates.length === 0) {
            display.innerHTML = '<small style="color: #666;">No hay fechas seleccionadas</small>';
            return;
        }
        
        display.innerHTML = dates.map(date => {
            const dateObj = new Date(date);
            return `<span class="vacation-date-tag">${dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} <button type="button" class="remove-date-btn" data-type="${type}" data-date="${date}">×</button></span>`;
        }).join(' ');
        
        // Event listeners para eliminar fechas
        display.querySelectorAll('.remove-date-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const dateToRemove = btn.dataset.date;
                const year = parseInt(document.getElementById('vacationYear').value);
                const index = vacations[year][employeeId][type].indexOf(dateToRemove);
                if (index > -1) {
                    vacations[year][employeeId][type].splice(index, 1);
                    saveVacations();
                    loadVacationDates();
                    renderMonthlySchedule(); // Actualizar calendario
                }
            });
        });
    }
    
    // Event listeners
    document.getElementById('vacationYear').addEventListener('change', loadVacationDates);
    
    // Feria - actualizar al cambiar fechas
    ['feriaDate1', 'feriaDate2'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            const year = parseInt(document.getElementById('vacationYear').value);
            if (!vacations[year][employeeId]) {
                vacations[year][employeeId] = { feria: [], agosto: [], navidad: [], libre: [] };
            }
            const dates = [
                document.getElementById('feriaDate1').value,
                document.getElementById('feriaDate2').value
            ].filter(d => d);
            vacations[year][employeeId].feria = dates;
            updateDatesDisplay('feria', dates);
        });
    });
    
    // Agosto - añadir rango
    document.getElementById('addAgostoRange').addEventListener('click', () => {
        const start = document.getElementById('agostoStart').value;
        const end = document.getElementById('agostoEnd').value;
        if (!start || !end) {
            alert('Por favor, selecciona fecha de inicio y fin');
            return;
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (startDate > endDate) {
            alert('La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }
        
        const year = parseInt(document.getElementById('vacationYear').value);
        if (!vacations[year][employeeId]) {
            vacations[year][employeeId] = { feria: [], agosto: [], navidad: [], libre: [] };
        }
        
        const dates = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            // Solo días laborables (lunes a viernes)
            const dayOfWeek = current.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                dates.push(current.toISOString().split('T')[0]);
            }
            current.setDate(current.getDate() + 1);
        }
        
        // Limitar a 10 días
        if (dates.length > 10) {
            alert(`El rango seleccionado tiene ${dates.length} días laborables. Se tomarán los primeros 10 días.`);
            dates.splice(10);
        }
        
        vacations[year][employeeId].agosto = [...new Set([...vacations[year][employeeId].agosto, ...dates])].sort();
        document.getElementById('agostoStart').value = '';
        document.getElementById('agostoEnd').value = '';
        updateDatesDisplay('agosto', vacations[year][employeeId].agosto);
    });
    
    // Navidad y Libre - actualizar al cambiar fechas
    ['navidad', 'libre'].forEach(type => {
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`${type}Date${i}`).addEventListener('change', () => {
                const year = parseInt(document.getElementById('vacationYear').value);
                if (!vacations[year][employeeId]) {
                    vacations[year][employeeId] = { feria: [], agosto: [], navidad: [], libre: [] };
                }
                const dates = [];
                for (let j = 1; j <= 5; j++) {
                    const val = document.getElementById(`${type}Date${j}`).value;
                    if (val) dates.push(val);
                }
                vacations[year][employeeId][type] = dates;
                updateDatesDisplay(type, dates);
            });
        }
    });
    
    // Guardar
    document.getElementById('saveVacationsBtn').addEventListener('click', () => {
        saveVacations();
        renderMonthlySchedule();
        modal.classList.remove('active');
        alert('Vacaciones guardadas correctamente');
    });
    
    // Cancelar
    document.getElementById('cancelVacationsBtn').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    document.querySelector('.close-vacations').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Cargar fechas iniciales
    loadVacationDates();
    
    modal.classList.add('active');
    console.log('Modal de vacaciones abierto');
}

