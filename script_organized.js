// ===================================================================
// SISTEMA DE INFORMES MÉDICOS - ELECTROFISIOLOGÍA
// Archivo JavaScript reorganizado y estructurado
// ===================================================================

// ===================================================================
// 1. CONFIGURACIÓN Y DATOS INICIALES
// ===================================================================

let predefinedData = {};
let defaultMeasurements = [];
let defaultIndications = [];

async function loadPredefinedData() {
    // Si estamos en protocolo file://, saltar fetch para evitar error CORS en consola
    if (window.location.protocol === 'file:') {
        console.warn('Ejecución local detectada (file://). Usando datos de respaldo para evitar errores CORS.');
        predefinedData = fallbackData;
        defaultMeasurements = fallbackData.defaultMeasurements;
        appState.commonData.indications = fallbackData.commonData.indications || [];
        return fallbackData;
    }

    try {
        const response = await fetch('data.json');
        const data = await response.json();
        predefinedData = data;
        defaultMeasurements = data.defaultMeasurements;
        appState.commonData.indications = data.commonData?.indications || [];
        return data;
    } catch (error) {
        console.error('Error loading data.json:', error);
        // Fallback to hardcoded data
        predefinedData = fallbackData;
        defaultMeasurements = fallbackData.defaultMeasurements;
        appState.commonData.indications = fallbackData.commonData.indications || [];
        return fallbackData;
    }
}

const fallbackData = {
            defaultMeasurements: [
                {
                    id: 1,
                    name: "Ventrículo derecho",
                    parameters: [
                        { name: "Sensibilidad", value: "" },
                        { name: "Impedancia", value: "" },
                        { name: "Umbral", value: "" },
                        { name: "Impedancia de choque", value: "" },
                        { name: "Conector", value: "", options: ["DF1", "DF4"] },
                        { name: "Coil", value: "", options: ["Monocoil", "Bicoil"] },
                        { name: "Terapias FV", value: "", range: "150-300 lpm" },
                        { name: "Terapias TV", value: "", range: "100-200 lpm" }
                    ]
                },
                {
                    id: 2,
                    name: "Aurícula derecha",
                    parameters: [
                        { name: "Sensibilidad", value: "" },
                        { name: "Impedancia", value: "" },
                        { name: "Umbral", value: "" }
                    ]
                },
                {
                    id: 3,
                    name: "Ventrículo izquierdo",
                    parameters: [
                        { name: "Sensibilidad", value: "" },
                        { name: "Impedancia", value: "" },
                        { name: "Umbral", value: "" },
                        { name: "Polaridad de estimulación", value: "", options: [] },
                        { name: "Conector", value: "", options: ["IS1", "IS4"] },
                        { name: "Retraso V-V", value: "", range: "0-120 ms" }
                    ]
                },
                {
                    id: 4,
                    name: "Dispositivo implantado",
                    parameters: [
                        { name: "Tipo de dispositivo", value: "", options: [] },
                        { name: "Marca", value: "", options: [] },
                        { name: "Modelo", value: "", options: [] },
                        { name: "Número de serie", value: "" }
                    ]
                }
            ],
            commonData: {
                communes: ['Concepción', 'Talcahuano', 'Chiguayante', 'San Pedro de la Paz', 'Hualpén', 'Coronel', 'Lota', 'Tomé'],
                insurances: ['FONASA', 'ISAPRE', 'Particular', 'FF.AA.'],
                origins: ['Consulta Externa', 'Urgencia', 'Hospitalización', 'Derivación'],
                entryDiagnoses: ['Arritmia cardíaca', 'Bradiarritmia', 'Taquiarritmia', 'Fibrilación auricular', 'Bloqueo cardíaco'],
                exitDiagnoses: ['Procedimiento exitoso', 'Implante de marcapasos', 'Ablación exitosa', 'Estudio electrofisiológico completado'],
                deviceBrands: ['Medtronic', 'Boston Scientific', 'St. Jude Medical', 'Biotronik', 'Sorin', 'Vitatron'],
                deviceTypes: ['Marcapaso', 'Resincronizador', 'Desfibrilador'],
                stimulationPolarities: ['Bipolar', 'Unipolar', 'Extended Bipolar', 'LV Tip to RV Ring', 'LV Ring to RV Coil'],
                deviceModelsByTypeAndBrand: {
                    'Marcapaso': {
                        'Medtronic': ['Azure', 'Advisa', 'Versa', 'Micra'],
                        'Boston Scientific': ['Altrua', 'Ingenio', 'Accolade'],
                        'St. Jude Medical': ['Assurity', 'Endurity', 'Microny'],
                        'Biotronik': ['Edora', 'Elogia', 'Iperia'],
                        'Sorin': ['Reply', 'Esprit', 'Ovatio'],
                        'Vitatron': ['C-series', 'T-series', 'X-series']
                    },
                    'Resincronizador': {
                        'Medtronic': ['Claria', 'Viva', 'Crome'],
                        'Boston Scientific': ['Intua', 'Visionist', 'Altrua'],
                        'St. Jude Medical': ['Unify', 'Quadra', 'Fortify'],
                        'Biotronik': ['Estella', 'Ilesto', 'Etrinsa'],
                        'Sorin': ['Paradym', 'Platinum', 'Reply CRT'],
                        'Vitatron': ['C40', 'T65', 'X80']
                    },
                    'Desfibrilador': {
                        'Medtronic': ['Evera', 'Viva', 'Crome'],
                        'Boston Scientific': ['Emblem', 'Inogen', 'Vitalio'],
                        'St. Jude Medical': ['Ellipse', 'Fortify', 'Unify'],
                        'Biotronik': ['Ilesto', 'Iperia', 'Etrinsa'],
                        'Sorin': ['Platinum', 'Paradym', 'Ovatio'],
                        'Vitatron': ['C-series ICD', 'T-series ICD', 'X-series ICD']
                    }
                },
                indications: []
            }
        };

// ===================================================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN
// ===================================================================

let appState = {
    autoSaveInterval: null,
    formChanged: false,
    measurements: [],
    customMeasurementCount: 0,
    customParameters: [],
    procedures: [],
    editingProcedureId: null,
    templates: [],
    staff: [],
    additionalProceduresCount: 0,
    commonData: {
        indications: []
    }
};

// ===================================================================
// 3. ELEMENTOS DEL DOM
// ===================================================================

let elements = {};

function initializeElements() {
    elements = {
        // Elementos principales del formulario
        procedureNameSelect: document.getElementById('procedureName'),
        customProcedureInput: document.getElementById('customProcedure'),
        procedureCodeInput: document.getElementById('procedureCode'),
        procedureDate: document.getElementById('procedureDate'),
        startTime: document.getElementById('startTime'),
        endTime: document.getElementById('endTime'),
        
        // Secciones principales
        mainFormSection: document.getElementById('mainForm'),
        proceduresSection: document.getElementById('procedures-section'),
        commonDataSection: document.getElementById('common-data-section'),
        
        // Prestaciones adicionales
        procedureName2Select: document.getElementById('procedureName2'),
        customProcedure2Input: document.getElementById('customProcedure2'),
        procedureCode2Input: document.getElementById('procedureCode2'),
        procedureName3Select: document.getElementById('procedureName3'),
        customProcedure3Input: document.getElementById('customProcedure3'),
        procedureCode3Input: document.getElementById('procedureCode3'),
        addProcedureBtn: document.getElementById('addProcedureBtn'),
        procedure2Section: document.getElementById('procedure2-section'),
        procedure3Section: document.getElementById('procedure3-section'),
        
        // Botones principales
        previewReportBtn: document.getElementById('previewReportBtn'),
        generateReportBtn: document.getElementById('generateReportBtn'),
        clearFormBtn: document.getElementById('clearFormBtn'),
        newReportBtn: document.getElementById('newReportBtn'),
        proceduresBtn: document.getElementById('proceduresBtn'),
        printBtn: document.getElementById('printBtn'),
        
        // Reporte generado
        generatedReport: document.getElementById('generatedReport'),
        reportHeader: document.getElementById('reportHeader'),
        reportContent: document.getElementById('reportContent'),
        copyFormattedReportBtn: document.getElementById('copyFormattedReportBtn'),

        // Diagnósticos
        entryDiagnosisSelect: document.getElementById('entryDiagnosis'),
        customEntryDiagnosis: document.getElementById('customEntryDiagnosis'),
        exitDiagnosisSelect: document.getElementById('exitDiagnosis'),
        customExitDiagnosis: document.getElementById('customExitDiagnosis'),
        admissionReason: document.getElementById('admissionReason'),
        
        // Navegación y dropdown
        dropdown: document.querySelector('.dropdown'),
        dropdownBtn: document.querySelector('.dropdown-btn'),
        saveIndicator: document.getElementById('saveIndicator'),
        
        // Mediciones
        addMeasurementsCheckbox: document.getElementById('addMeasurements'),
        measurementsContainer: document.getElementById('measurementsContainer'),
        measurementsList: document.getElementById('measurementsList'),
        addCustomMeasurementBtn: document.getElementById('addCustomMeasurement'),
        
        // Gestión de procedimientos
        saveProcedureBtn: document.getElementById('saveProcedureBtn'),
        cancelEditProcedureBtn: document.getElementById('cancelEditProcedureBtn'),
        proceduresListContainer: document.getElementById('proceduresListContainer'),
        newProcedureName: document.getElementById('newProcedureName'),
        newProcedureCode: document.getElementById('newProcedureCode'),
        newProcedureDescription: document.getElementById('newProcedureDescription'),
        procedureFormTitle: document.getElementById('procedureFormTitle'),
        proceduresSection: document.getElementById('procedures-section'),
        mainFormSection: document.getElementById('mainForm'),
        backToMainBtn: document.getElementById('backToMainBtn'),
        
        // Pestañas
        tabButtons: document.querySelectorAll('.nav-tabs .tab-btn'),
        
        // Datos del paciente
        origin: document.getElementById('origin'),
        commune: document.getElementById('commune'),
        healthInsurance: document.getElementById('healthInsurance'),
        
        // Plantillas
        loadTemplate: document.getElementById('loadTemplate'),
        
        // Personal médico
        mainDoctorCheckboxes: document.getElementById('mainDoctorCheckboxes'),
        assistantNurseCheckboxes: document.getElementById('assistantNurseCheckboxes'),
        tensCheckboxes: document.getElementById('tensCheckboxes'),
        
        // Dispositivos
        devicesBtn: document.getElementById('devicesBtn')
    };
    
    // Verificar elementos críticos
    const criticalElements = [
        'procedureNameSelect', 'previewReportBtn', 'clearFormBtn', 
        'newReportBtn', 'proceduresBtn', 'saveProcedureBtn', 'devicesBtn'
    ];
    
    criticalElements.forEach(elementKey => {
        if (!elements[elementKey]) {
            console.warn(`Elemento crítico no encontrado: ${elementKey}`);
        }
    });
}

// ===================================================================
// 4. FUNCIONES DE UTILIDAD
// ===================================================================

// Escapa texto para inserción segura en HTML, tanto en contenido como en
// atributos (también escapa comillas, que textContent/innerHTML no escapa).
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&#38;')
        .replace(/</g, '&#60;')
        .replace(/>/g, '&#62;')
        .replace(/"/g, '&#34;')
        .replace(/'/g, '&#39;');
}

// Convierte una fecha a formato ISO yyyy-mm-dd (para input[type="date"])
function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Formatea una fecha ISO (yyyy-mm-dd) en formato largo chileno (es-CL).
// Devuelve la cadena original si no se puede interpretar.
function formatDateEsCL(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-').map(Number);
    if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) return String(dateStr);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
}

function createModal(title, content) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const modal = document.createElement('div');
    modal.className = 'modal bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-screen overflow-y-auto';
    
    modal.innerHTML = `
        <div class="p-4 border-b">
            <h3 class="text-xl font-semibold">${title}</h3>
        </div>
        <div class="p-4 modal-body">
            ${content}
        </div>
        <div class="p-4 border-t flex justify-end">
            <button type="button" class="btn bg-gray-300 text-gray-800 hover:bg-gray-400 close-modal">
                Cerrar
            </button>
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    
    return modal;
}

// ===================================================================
// 6.1. UTILIDADES "AGREGAR NUEVO" EN LISTAS DESPLEGABLES
// ===================================================================

// Muestra un input inline bajo el select para escribir un valor nuevo.
// onAdd(value) debe devolver false si el valor ya existe / es inválido (se mantiene abierto).
function showInlineAddNew(select, placeholder, onAdd) {
    const wrapper = document.createElement('div');
    wrapper.className = 'inline-add-new';
    wrapper.style.cssText = 'display:flex;gap:0.4rem;align-items:center;margin-top:0.4rem;';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input';
    input.placeholder = placeholder || 'Nuevo valor';
    input.style.cssText = 'flex:1;min-width:0;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.85rem;';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700';
    addBtn.textContent = 'Agregar';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn bg-gray-300 text-gray-700 px-3 py-1 text-sm hover:bg-gray-400';
    cancelBtn.textContent = 'Cancelar';

    wrapper.appendChild(input);
    wrapper.appendChild(addBtn);
    wrapper.appendChild(cancelBtn);
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    input.focus();

    const cleanup = () => wrapper.remove();
    const submit = () => {
        const val = input.value.trim();
        if (!val) { input.focus(); return; }
        const result = onAdd(val);
        if (result !== false) cleanup();
        else { input.value = ''; input.focus(); }
    };
    addBtn.addEventListener('click', submit);
    cancelBtn.addEventListener('click', cleanup);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
}

// Agrega la opción "➕ Agregar nuevo..." a un select y gestiona su selección.
// Para selects que se reconstruyen vía innerHTML, garantiza que la opción reaparezca.
// Si direct === true, al elegir la opción se llama onAdd() inmediatamente (sin input inline).
function attachAddNewOption(select, placeholder, onAdd, direct) {
    if (!select) return;

    const ensureOption = () => {
        if (!select.querySelector('option[value="__add_new__"]')) {
            const opt = document.createElement('option');
            opt.value = '__add_new__';
            opt.textContent = '➕ Agregar nuevo...';
            select.appendChild(opt);
        }
    };

    if (!select.dataset.addNewAttached) {
        select.dataset.addNewAttached = '1';
        select.addEventListener('change', function() {
            if (this.value === '__add_new__') {
                this.value = '';
                if (direct) {
                    onAdd('');
                } else {
                    showInlineAddNew(this, placeholder, onAdd);
                }
            }
        });
    }
    ensureOption();
}

// Agrega un valor a un arreglo de commonData evitando duplicados y persistiendo.
function addToCommonArray(arr, value, label) {
    if (!Array.isArray(arr)) return false;
    if (arr.includes(value)) {
        showNotification(`${label} ya existe.`, 'warning');
        return false;
    }
    arr.push(value);
    arr.sort((a, b) => String(a).localeCompare(String(b)));
    saveAllData();
    return true;
}

// Abre un modal para crear un procedimiento nuevo y ejecuta onSaved(newProcedure) al guardar.
function openAddProcedureModal(select, onSaved) {
    if (!select) return;
    const modal = createModal('Agregar Nuevo Procedimiento', `
        <div class="form-group">
            <label class="form-label">Nombre del Procedimiento <span class="text-red-500">*</span></label>
            <input id="modal-newProcName" type="text" class="form-input" placeholder="Nombre del procedimiento">
        </div>
        <div class="form-group">
            <label class="form-label">Código <span class="text-red-500">*</span></label>
            <input id="modal-newProcCode" type="text" class="form-input" placeholder="Código del procedimiento">
        </div>
        <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea id="modal-newProcDesc" class="form-input form-textarea" placeholder="Descripción del procedimiento"></textarea>
        </div>
        <button type="button" id="modal-saveProcBtn" class="btn btn-primary"><i class="fas fa-save mr-1"></i> Guardar</button>
    `);
    modal.querySelector('#modal-saveProcBtn').addEventListener('click', () => {
        const name = modal.querySelector('#modal-newProcName').value.trim();
        const code = modal.querySelector('#modal-newProcCode').value.trim();
        if (!name || !code) {
            showNotification('Por favor, complete los campos obligatorios (Nombre y Código)', 'error');
            return;
        }
        const desc = modal.querySelector('#modal-newProcDesc').value.trim();
        const newProc = {
            id: Date.now().toString(),
            name,
            code,
            description: desc || '',
            createdAt: new Date().toISOString()
        };
        appState.procedures.push(newProc);
        saveAllData();
        if (typeof onSaved === 'function') onSaved(newProc);
        modal.parentElement.remove();
    });
}

// Reconstruye las opciones de un select de procedimiento del asistente (sin perder el paso).
function repopulateWizardProcedureSelect(select, stateKey, newProc) {
    if (!select) return;
    select.innerHTML = '';
    appState.procedures.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
    select.value = newProc ? newProc.id : '';
    if (newProc && stateKey) {
        wizardState.data[stateKey] = newProc.id;
        const codeKey = stateKey === 'procedureName' ? 'procedureCode'
            : stateKey === 'procedureName2' ? 'procedureCode2' : 'procedureCode3';
        wizardState.data[codeKey] = newProc.code;
        const codeInput = document.getElementById('wiz-' + codeKey);
        if (codeInput) codeInput.value = newProc.code;
    }
    attachAddNewOption(select, 'Nuevo procedimiento', () => {
        openAddProcedureModal(select, (np) => {
            repopulateWizardProcedureSelect(select, stateKey, np);
        });
        return true;
    }, true);
}

// Agrega una nueva opción de medición (dispositivo/polaridad/parámetro) a la fuente correcta.
// Devuelve true si se agregó; false si duplicado/inválido.
// overrideValues (opcional): mapa nombre->valor con los valores actuales (p. ej. del asistente).
function addNewMeasurementOption(param, measurement, value, overrideValues) {
    if (param.name === 'Tipo de dispositivo') {
        if (!addToCommonArray(appState.commonData.deviceTypes, value, 'El tipo de dispositivo')) return false;
        if (!appState.commonData.deviceModelsByTypeAndBrand[value]) appState.commonData.deviceModelsByTypeAndBrand[value] = {};
        const brandParam = measurement.parameters.find(p => p.name === 'Marca');
        const modelParam = measurement.parameters.find(p => p.name === 'Modelo');
        if (brandParam) brandParam.value = '';
        if (modelParam) modelParam.value = '';
        param.value = value;
        return true;
    }
    if (param.name === 'Marca') {
        if (!addToCommonArray(appState.commonData.deviceBrands, value, 'La marca')) return false;
        const typeParam = measurement.parameters.find(p => p.name === 'Tipo de dispositivo');
        const deviceType = (overrideValues && overrideValues['Tipo de dispositivo'] !== undefined)
            ? overrideValues['Tipo de dispositivo']
            : (typeParam ? typeParam.value : '');
        if (deviceType) {
            if (!appState.commonData.deviceModelsByTypeAndBrand[deviceType]) appState.commonData.deviceModelsByTypeAndBrand[deviceType] = {};
            if (!appState.commonData.deviceModelsByTypeAndBrand[deviceType][value]) appState.commonData.deviceModelsByTypeAndBrand[deviceType][value] = [];
        }
        const modelParam = measurement.parameters.find(p => p.name === 'Modelo');
        if (modelParam) modelParam.value = '';
        param.value = value;
        return true;
    }
    if (param.name === 'Modelo') {
        const typeParam = measurement.parameters.find(p => p.name === 'Tipo de dispositivo');
        const brandParam = measurement.parameters.find(p => p.name === 'Marca');
        const deviceType = (overrideValues && overrideValues['Tipo de dispositivo'] !== undefined)
            ? overrideValues['Tipo de dispositivo']
            : (typeParam ? typeParam.value : '');
        const deviceBrand = (overrideValues && overrideValues['Marca'] !== undefined)
            ? overrideValues['Marca']
            : (brandParam ? brandParam.value : '');
        if (!deviceType || !deviceBrand) {
            showNotification('Primero seleccione tipo y marca.', 'warning');
            return false;
        }
        if (!appState.commonData.deviceModelsByTypeAndBrand[deviceType]) appState.commonData.deviceModelsByTypeAndBrand[deviceType] = {};
        if (!appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand]) appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand] = [];
        const models = appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand];
        if (models.includes(value)) {
            showNotification('El modelo ya existe para esta combinación.', 'warning');
            return false;
        }
        models.push(value);
        param.value = value;
        return true;
    }
    if (param.name === 'Polaridad de estimulación') {
        if (!addToCommonArray(appState.commonData.stimulationPolarities, value, 'La polaridad')) return false;
        param.value = value;
        return true;
    }
    // Parámetro genérico con options
    if (!Array.isArray(param.options)) param.options = [];
    if (param.options.includes(value)) {
        showNotification('La opción ya existe.', 'warning');
        return false;
    }
    param.options.push(value);
    param.value = value;
    if (!appState.commonData.measurementOptionDefaults) appState.commonData.measurementOptionDefaults = {};
    if (!appState.commonData.measurementOptionDefaults[param.name]) appState.commonData.measurementOptionDefaults[param.name] = [];
    if (!appState.commonData.measurementOptionDefaults[param.name].includes(value)) {
        appState.commonData.measurementOptionDefaults[param.name].push(value);
    }
    return true;
}

// Maneja la selección de "➕ Agregar nuevo..." en un select de mediciones del formulario principal.
function handleMeasurementAddNew(select) {
    const measurementId = parseInt(select.dataset.measurementId, 10);
    const paramIndex = parseInt(select.dataset.paramIndex, 10);
    const measurement = appState.measurements.find(m => m.id === measurementId);
    if (!measurement || !measurement.parameters[paramIndex]) return;
    const param = measurement.parameters[paramIndex];

    let placeholder = 'Nuevo valor';
    if (param.name === 'Tipo de dispositivo') placeholder = 'Nuevo tipo de dispositivo';
    else if (param.name === 'Marca') placeholder = 'Nueva marca';
    else if (param.name === 'Modelo') placeholder = 'Nuevo modelo';
    else if (param.name === 'Polaridad de estimulación') placeholder = 'Nueva polaridad';

    showInlineAddNew(select, placeholder, (value) => {
        if (!addNewMeasurementOption(param, measurement, value)) return false;
        saveAllData();
        renderMeasurements();
        return true;
    });
}

function showSaveIndicator() {
    if (elements.saveIndicator) {
        elements.saveIndicator.classList.remove('hidden');
        // Usar requestAnimationFrame para asegurar que el navegador renderice sin 'hidden' antes de animar
        requestAnimationFrame(() => {
            elements.saveIndicator.classList.add('show');
        });
        
        setTimeout(() => {
            elements.saveIndicator.classList.remove('show');
            setTimeout(() => {
                elements.saveIndicator.classList.add('hidden');
            }, 400); // Dar tiempo a la animación de salida
        }, 2500);
    }
}

function setDefaultTimes() {
    const now = new Date();

    // Fecha del procedimiento: hoy por defecto
    if (elements.procedureDate && !elements.procedureDate.value) {
        elements.procedureDate.value = toISODate(now);
    }

    if (elements.startTime && !elements.startTime.value) {
        elements.startTime.value = now.toTimeString().slice(0, 5);
    }
    
    if (elements.endTime && !elements.endTime.value) {
        const endDateTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
        // Evitar proponer una hora del día siguiente si se cruza la medianoche
        elements.endTime.value = endDateTime.getDate() !== now.getDate()
            ? '23:59'
            : endDateTime.toTimeString().slice(0, 5);
    }
}

function toggleCustomFields() {
    if (elements.customProcedureInput) {
        const showCustomProcedure = elements.procedureNameSelect?.value === 'other';
        elements.customProcedureInput.classList.toggle('hidden', !showCustomProcedure);
    }
    
    if (elements.customProcedure2Input) {
        const showCustomProcedure2 = elements.procedureName2Select?.value === 'other';
        elements.customProcedure2Input.classList.toggle('hidden', !showCustomProcedure2);
    }
    
    if (elements.customProcedure3Input) {
        const showCustomProcedure3 = elements.procedureName3Select?.value === 'other';
        elements.customProcedure3Input.classList.toggle('hidden', !showCustomProcedure3);
    }
    
    if (elements.customEntryDiagnosis) {
        const showCustomEntry = elements.entryDiagnosisSelect?.value === 'custom';
        elements.customEntryDiagnosis.classList.toggle('hidden', !showCustomEntry);
    }
    
    if (elements.customExitDiagnosis) {
        const showCustomExit = elements.exitDiagnosisSelect?.value === 'custom';
        elements.customExitDiagnosis.classList.toggle('hidden', !showCustomExit);
    }
}

// ===================================================================
// 5. GESTIÓN DE PESTAÑAS
// ===================================================================

function setupTabs() {
    if (!elements.tabButtons || elements.tabButtons.length === 0) return;

    elements.tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all buttons
            elements.tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show target tab content
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
}

// ===================================================================
// 6. GESTIÓN DE DATOS COMUNES (DROPDOWNS)
// ===================================================================

function updateCommonDataDropdowns() {
    if (elements.commune) {
        elements.commune.innerHTML = '<option value="">Seleccione una comuna</option>' +
            appState.commonData.communes.map(commune =>
                `<option value="${escapeHtml(commune)}">${escapeHtml(commune)}</option>`
            ).join('');
        attachAddNewOption(elements.commune, 'Nueva comuna', (value) => {
            if (!addToCommonArray(appState.commonData.communes, value, 'La comuna')) return false;
            updateCommonDataDropdowns();
            elements.commune.value = value;
            return true;
        });
    }

    if (elements.healthInsurance) {
        elements.healthInsurance.innerHTML = '<option value="">Seleccione previsión</option>' +
            appState.commonData.insurances.map(insurance =>
                `<option value="${escapeHtml(insurance)}">${escapeHtml(insurance)}</option>`
            ).join('');
        attachAddNewOption(elements.healthInsurance, 'Nueva previsión', (value) => {
            if (!addToCommonArray(appState.commonData.insurances, value, 'La previsión')) return false;
            updateCommonDataDropdowns();
            elements.healthInsurance.value = value;
            return true;
        });
    }

    if (elements.origin) {
        elements.origin.innerHTML = '<option value="">Seleccione procedencia</option>' +
            appState.commonData.origins.map(origin =>
                `<option value="${escapeHtml(origin)}">${escapeHtml(origin)}</option>`
            ).join('');
        attachAddNewOption(elements.origin, 'Nueva procedencia', (value) => {
            if (!addToCommonArray(appState.commonData.origins, value, 'La procedencia')) return false;
            updateCommonDataDropdowns();
            elements.origin.value = value;
            return true;
        });
    }

    if (elements.entryDiagnosisSelect) {
        elements.entryDiagnosisSelect.innerHTML = '<option value="">Seleccione diagnóstico</option>' +
            appState.commonData.entryDiagnoses.map(diagnosis =>
                `<option value="${escapeHtml(diagnosis)}">${escapeHtml(diagnosis)}</option>`
            ).join('') + '<option value="custom">Otro (especifique)</option>';
        attachAddNewOption(elements.entryDiagnosisSelect, 'Nuevo diagnóstico', (value) => {
            if (!addToCommonArray(appState.commonData.entryDiagnoses, value, 'El diagnóstico')) return false;
            updateCommonDataDropdowns();
            elements.entryDiagnosisSelect.value = value;
            return true;
        });
    }

    if (elements.exitDiagnosisSelect) {
        elements.exitDiagnosisSelect.innerHTML = '<option value="">Seleccione diagnóstico</option>' +
            appState.commonData.exitDiagnoses.map(diagnosis =>
                `<option value="${escapeHtml(diagnosis)}">${escapeHtml(diagnosis)}</option>`
            ).join('') + '<option value="custom">Otro (especifique)</option>';
        attachAddNewOption(elements.exitDiagnosisSelect, 'Nuevo diagnóstico', (value) => {
            if (!addToCommonArray(appState.commonData.exitDiagnoses, value, 'El diagnóstico')) return false;
            updateCommonDataDropdowns();
            elements.exitDiagnosisSelect.value = value;
            return true;
        });
    }

    // Update indications checkboxes
    updateIndicationsCheckboxes();
}

function updateIndicationsCheckboxes() {
    const container = document.getElementById('indicationsCheckboxes');
    if (!container) return;

    container.innerHTML = '';

    appState.commonData.indications.forEach((indication, index) => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `indication-${index}`;
        checkbox.className = 'rounded';

        const span = document.createElement('span');
        span.textContent = indication;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}

// ===================================================================
// 7. GESTIÓN DE PROCEDIMIENTOS
// ===================================================================

function updateProcedureDropdown() {
    const selects = [elements.procedureNameSelect, elements.procedureName2Select, elements.procedureName3Select];
    
    selects.forEach(select => {
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccione un procedimiento</option>';
        
        appState.procedures.forEach(procedure => {
            const option = document.createElement('option');
            option.value = procedure.id;
            option.textContent = procedure.name;
            select.appendChild(option);
        });
        
        select.innerHTML += '<option value="other">Otro (especifique)</option>';
        
        attachAddNewOption(select, 'Nuevo procedimiento', () => {
            openAddProcedureModal(select, (newProc) => {
                updateProcedureDropdown();
                select.value = newProc.id;
                select.dispatchEvent(new Event('change'));
            });
            return true;
        }, true);
        
        if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
            select.value = currentValue;
        }
    });
}

async function updateProcedureCode(selectElement, codeInput) {
    if (selectElement.value && selectElement.value !== 'other') {
        const selectedProcedure = appState.procedures.find(p => p.id === selectElement.value);
        if (selectedProcedure && codeInput) {
            codeInput.value = selectedProcedure.code;
        }
        // Prefill / reemplazo de descripción del procedimiento
        const descEl = document.getElementById('procedureDescription');
        if (selectedProcedure && descEl && selectedProcedure.description && selectedProcedure.description.trim().length > 0) {
            if (!descEl.value) {
                // Si está vacío, prellenar automáticamente
                descEl.value = selectedProcedure.description;
                descEl.dispatchEvent(new Event('change'));
            } else {
                // Si ya tiene texto, preguntar si reemplazar por la descripción predefinida
                const shouldReplace = await showConfirmDialog(
                    'Reemplazar descripción',
                    'Se ha seleccionado un procedimiento con descripción predefinida. ¿Desea reemplazar la descripción actual por la predefinida?',
                    { confirmText: 'Reemplazar', cancelText: 'Mantener actual', danger: false }
                );
                if (shouldReplace) {
                    descEl.value = selectedProcedure.description;
                    descEl.dispatchEvent(new Event('change'));
                }
            }
        }
    } else if (selectElement.value === 'other') {
        if (codeInput) codeInput.value = '';
    }
}

function toggleCustomProcedureField(selectElement, customInput) {
    if (selectElement.value === 'other') {
        if (customInput) customInput.classList.remove('hidden');
    } else {
        if (customInput) customInput.classList.add('hidden');
    }
}

// ===================================================================
// 8. GESTIÓN DE PRESTACIONES ADICIONALES
// ===================================================================

function setupAdditionalProcedures() {
    if (elements.addProcedureBtn) {
        elements.addProcedureBtn.addEventListener('click', addAdditionalProcedure);
    }
    
    // Event listeners para los selects de procedimientos adicionales
    if (elements.procedureName2Select) {
        elements.procedureName2Select.addEventListener('change', function() {
            updateProcedureCode(this, elements.procedureCode2Input);
            toggleCustomProcedureField(this, elements.customProcedure2Input);
        });
    }
    
    if (elements.procedureName3Select) {
        elements.procedureName3Select.addEventListener('change', function() {
            updateProcedureCode(this, elements.procedureCode3Input);
            toggleCustomProcedureField(this, elements.customProcedure3Input);
        });
    }
}

// ===================================================================
// 8.1. GESTIÓN DE PROCEDIMIENTOS (LISTADO CRUD Y NAVEGACIÓN)
// ===================================================================

function showProceduresSection() {
    if (elements.proceduresSection && elements.mainFormSection) {
        elements.mainFormSection.classList.add('hidden');
        elements.proceduresSection.classList.remove('hidden');
        renderProcedures();
    }
}

function showMainForm() {
    const sections = [
        elements.proceduresSection,
        elements.mainFormSection,
        document.getElementById('common-data-section')
    ];

    sections.forEach(section => {
        if (section) {
            section.classList.toggle('hidden', section !== elements.mainFormSection);
        }
    });
}

function updateCommonDataLists() {
    const sections = [
        { type: 'communes', listId: 'communesList', deleteClass: 'delete-commune' },
        { type: 'insurances', listId: 'insurancesList', deleteClass: 'delete-insurance' },
        { type: 'origins', listId: 'originsList', deleteClass: 'delete-origin' },
        { type: 'entryDiagnoses', listId: 'entryDiagnosesList', deleteClass: 'delete-entry-diagnosis' },
        { type: 'exitDiagnoses', listId: 'exitDiagnosesList', deleteClass: 'delete-exit-diagnosis' },
        { type: 'deviceBrands', listId: 'deviceBrandsList', deleteClass: 'delete-device-brand' },
        { type: 'deviceTypes', listId: 'deviceTypesList', deleteClass: 'delete-device-type' },
        { type: 'indications', listId: 'commonDataIndicationsList', deleteClass: 'delete-indication' }
    ];

    sections.forEach(section => {
        updateCommonDataList(section.type, section.listId, section.deleteClass);
    });
}

async function newReport() {
    const ok = await showConfirmDialog(
        'Nuevo informe',
        '¿Desea crear un nuevo informe? Se perderán los datos no guardados.',
        { confirmText: 'Crear nuevo' }
    );
    if (ok) {
        clearForm();
        showMainForm();
    }
}

function renderProcedures() {
    if (!elements.proceduresListContainer) return;

    if (appState.procedures.length === 0) {
        elements.proceduresListContainer.innerHTML = '<p class="text-gray-500 text-center py-6">No hay procedimientos registrados</p>';
        return;
    }

    elements.proceduresListContainer.innerHTML = appState.procedures.map(procedure => `
        <div class="procedure-item bg-white p-4 rounded-lg border border-gray-200 mb-3 shadow-sm">
            <div class="flex justify-between items-start">
                <div class="flex-grow">
                    <h4 class="font-semibold text-gray-800">${escapeHtml(procedure.name)}</h4>
                    <p class="text-sm text-gray-600">Código: ${escapeHtml(procedure.code)}</p>
                    ${procedure.description ? `<p class="text-sm text-gray-500 mt-1">${escapeHtml(procedure.description)}</p>` : ''}
                </div>
                <div class="flex gap-2 ml-4">
                    <button type="button" class="text-blue-500 hover:text-blue-700 edit-procedure" data-id="${procedure.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="text-red-500 hover:text-red-700 delete-procedure" data-id="${procedure.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    elements.proceduresListContainer.querySelectorAll('.edit-procedure').forEach(btn => {
        btn.addEventListener('click', () => editProcedure(btn.dataset.id));
    });
    elements.proceduresListContainer.querySelectorAll('.delete-procedure').forEach(btn => {
        btn.addEventListener('click', () => deleteProcedure(btn.dataset.id));
    });
}

function saveProcedure() {
    const name = elements.newProcedureName?.value?.trim();
    const code = elements.newProcedureCode?.value?.trim();
    const description = document.getElementById('newProcedureDescription')?.value?.trim();

    if (!name || !code) {
        showNotification('Por favor, complete los campos obligatorios (Nombre y Código)', 'error');
        return;
    }

    try {
        if (appState.editingProcedureId) {
            const procedure = appState.procedures.find(p => p.id === appState.editingProcedureId);
            if (procedure) {
                procedure.name = name;
                procedure.code = code;
                procedure.description = description || '';
            }
            appState.editingProcedureId = null;
        } else {
            const newProcedure = {
                id: Date.now().toString(),
                name,
                code,
                description: description || '',
                createdAt: new Date().toISOString()
            };
            appState.procedures.push(newProcedure);
        }

        saveAllData();
        renderProcedures();
        updateProcedureDropdown();
        clearProcedureForm();
        showNotification('Procedimiento guardado correctamente', 'success');
    } catch (error) {
        console.error('Error saving procedure:', error);
        showNotification('Error al guardar el procedimiento', 'error');
    }
}

function editProcedure(procedureId) {
    const procedure = appState.procedures.find(p => p.id === procedureId);
    if (!procedure) return;
    if (elements.newProcedureName) elements.newProcedureName.value = procedure.name;
    if (elements.newProcedureCode) elements.newProcedureCode.value = procedure.code;
    const descriptionField = document.getElementById('newProcedureDescription');
    if (descriptionField) descriptionField.value = procedure.description || '';
    appState.editingProcedureId = procedureId;
    if (elements.procedureFormTitle) elements.procedureFormTitle.textContent = 'Editar Procedimiento';
    if (elements.cancelEditProcedureBtn) elements.cancelEditProcedureBtn.classList.remove('hidden');
}

async function deleteProcedure(procedureId) {
    const ok = await showConfirmDialog(
        'Eliminar procedimiento',
        '¿Está seguro de que desea eliminar este procedimiento?',
        { confirmText: 'Eliminar' }
    );
    if (!ok) return;
    try {
        appState.procedures = appState.procedures.filter(p => p.id !== procedureId);
        saveAllData();
        renderProcedures();
        updateProcedureDropdown();
        showNotification('Procedimiento eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error deleting procedure:', error);
        showNotification('Error al eliminar el procedimiento', 'error');
    }
}

function cancelEditProcedure() {
    appState.editingProcedureId = null;
    clearProcedureForm();
    if (elements.procedureFormTitle) elements.procedureFormTitle.textContent = 'Agregar Nuevo Procedimiento';
    if (elements.cancelEditProcedureBtn) elements.cancelEditProcedureBtn.classList.add('hidden');
}

function clearProcedureForm() {
    if (elements.newProcedureName) elements.newProcedureName.value = '';
    if (elements.newProcedureCode) elements.newProcedureCode.value = '';
    const descriptionField = document.getElementById('newProcedureDescription');
    if (descriptionField) descriptionField.value = '';
}

function addAdditionalProcedure() {
    if (appState.additionalProceduresCount === 0) {
        // Mostrar segunda prestación
        if (elements.procedure2Section) {
            elements.procedure2Section.classList.remove('hidden');
            appState.additionalProceduresCount = 1;
        }
    } else if (appState.additionalProceduresCount === 1) {
        // Mostrar tercera prestación
        if (elements.procedure3Section) {
            elements.procedure3Section.classList.remove('hidden');
            elements.addProcedureBtn.classList.add('hidden');
            appState.additionalProceduresCount = 2;
        }
    }
}

// ===================================================================
// 9. GESTIÓN DE MEDICIONES Y DISPOSITIVOS
// ===================================================================

function updateDeviceParameters() {
    const deviceMeasurement = appState.measurements.find(m => m.name === "Dispositivo implantado");
    if (deviceMeasurement) {
        // Actualizar opciones de tipo de dispositivo
        const typeParam = deviceMeasurement.parameters.find(p => p.name === "Tipo de dispositivo");
        if (typeParam) {
            typeParam.options = [...appState.commonData.deviceTypes];
        }
        
        // Actualizar opciones de marca
        const brandParam = deviceMeasurement.parameters.find(p => p.name === "Marca");
        if (brandParam) {
            brandParam.options = [...appState.commonData.deviceBrands];
        }
        
        // Actualizar opciones de modelo
        const modelParam = deviceMeasurement.parameters.find(p => p.name === "Modelo");
        if (modelParam) {
            // Obtener el tipo y marca seleccionados para filtrar modelos
            const deviceTypeParam = deviceMeasurement.parameters.find(p => p.name === "Tipo de dispositivo");
            const deviceBrandParam = deviceMeasurement.parameters.find(p => p.name === "Marca");
            const deviceType = deviceTypeParam ? deviceTypeParam.value : '';
            const deviceBrand = deviceBrandParam ? deviceBrandParam.value : '';
            
            // Si hay tipo y marca seleccionados, filtrar modelos
            if (deviceType && deviceBrand && appState.commonData.deviceModelsByTypeAndBrand[deviceType] && appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand]) {
                modelParam.options = appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand];
            } else {
                modelParam.options = [];
            }
        }
    }
}

function renderMeasurements() {
    if (!elements.measurementsList) return;

    elements.measurementsList.innerHTML = '';

    // Render measurements normally
    appState.measurements.forEach(measurement => {
        const measurementItem = document.createElement('div');
        measurementItem.className = 'measurement-item bg-white rounded-lg border-2 border-blue-200 shadow-lg hover:border-blue-300 transition-all overflow-hidden flex flex-col';
        measurementItem.dataset.id = measurement.id;

        let paramsHTML = measurement.parameters.map((param, index) => {
            let inputField = '';

            // Casos específicos primero para asegurar clases especiales y filtrado correcto
            if (param.name === "Tipo de dispositivo") {
                inputField = `
                    <select class="form-input w-full p-3 border border-gray-200 rounded-lg param-value device-type-select focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors bg-white" 
                            data-param-index="${index}" data-measurement-id="${measurement.id}">
                        <option value="">Seleccionar</option>
                        ${appState.commonData.deviceTypes.map(type => `<option value="${escapeHtml(type)}" ${param.value === type ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}
                        <option value="__add_new__">➕ Agregar nuevo...</option>
                    </select>
                `;
            } else if (param.name === "Marca") {
                const deviceTypeParam = measurement.parameters.find(p => p.name === "Tipo de dispositivo");
                const deviceType = deviceTypeParam ? deviceTypeParam.value : '';

                let availableBrands = appState.commonData.deviceBrands;
                let placeholderText = "Seleccionar";
                let isDisabled = false;

                if (!deviceType) {
                    placeholderText = "Primero seleccione tipo";
                    isDisabled = true;
                } else if (appState.commonData.deviceModelsByTypeAndBrand[deviceType]) {
                    availableBrands = Object.keys(appState.commonData.deviceModelsByTypeAndBrand[deviceType]);
                }

                inputField = `
                    <select class="form-input w-full p-3 border border-gray-200 rounded-lg param-value device-brand-select focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors bg-white" 
                            data-param-index="${index}" data-measurement-id="${measurement.id}" ${isDisabled ? 'disabled' : ''}>
                        <option value="">${placeholderText}</option>
                        ${availableBrands.map(brand => `<option value="${escapeHtml(brand)}" ${param.value === brand ? 'selected' : ''}>${escapeHtml(brand)}</option>`).join('')}
                        ${isDisabled ? '' : '<option value="__add_new__">➕ Agregar nuevo...</option>'}
                    </select>
                `;
            } else if (param.name === "Modelo") {
                const deviceTypeParam = measurement.parameters.find(p => p.name === "Tipo de dispositivo");
                const deviceBrandParam = measurement.parameters.find(p => p.name === "Marca");
                const deviceType = deviceTypeParam ? deviceTypeParam.value : '';
                const deviceBrand = deviceBrandParam ? deviceBrandParam.value : '';

                let availableModels = [];
                let isDisabled = !deviceType || !deviceBrand;

                // Verificar si existe la estructura de datos y obtener modelos
                if (deviceType && deviceBrand) {
                    if (appState.commonData.deviceModelsByTypeAndBrand[deviceType] && 
                        appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand]) {
                        availableModels = appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand];
                    }
                }

                // Si no hay modelos disponibles pero hay tipo y marca, mostrar mensaje informativo
                let placeholderText = "Seleccionar modelo";
                if (deviceType && deviceBrand && availableModels.length === 0) {
                    placeholderText = "No hay modelos disponibles";
                } else if (!deviceType) {
                    placeholderText = "Primero seleccione tipo";
                } else if (!deviceBrand) {
                    placeholderText = "Primero seleccione marca";
                }

                inputField = `
                    <select class="form-input w-full p-3 border border-gray-200 rounded-lg param-value device-model-select focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors bg-white" 
                            data-param-index="${index}" data-measurement-id="${measurement.id}" ${isDisabled ? 'disabled' : ''}>
                        <option value="">${placeholderText}</option>
                        ${availableModels.map(model => `<option value="${escapeHtml(model)}" ${param.value === model ? 'selected' : ''}>${escapeHtml(model)}</option>`).join('')}
                        ${isDisabled ? '' : '<option value="__add_new__">➕ Agregar nuevo...</option>'}
                    </select>
                `;
            } else if (param.options && param.options.length > 0) {
                // Select genérico con opciones predefinidas
                const mergedOptions = Array.from(new Set([
                    ...(param.options || []),
                    ...((appState.commonData.measurementOptionDefaults && appState.commonData.measurementOptionDefaults[param.name]) || [])
                ]));
                inputField = `
                    <select class="form-input mt-1 w-full p-2 border border-gray-300 rounded param-value" 
                            data-param-index="${index}" data-measurement-id="${measurement.id}">
                        <option value="">Seleccionar</option>
                        ${mergedOptions.map(opt => `<option value="${escapeHtml(opt)}" ${param.value === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
                        <option value="__add_new__">➕ Agregar nuevo...</option>
                    </select>
                `;
            } else if (param.name === "Polaridad de estimulación") {
                inputField = `
                    <select class="form-input mt-1 w-full p-2 border border-gray-300 rounded param-value" 
                            data-param-index="${index}" data-measurement-id="${measurement.id}">
                        <option value="">Seleccionar</option>
                        ${appState.commonData.stimulationPolarities.map(polarity => `<option value="${escapeHtml(polarity)}" ${param.value === polarity ? 'selected' : ''}>${escapeHtml(polarity)}</option>`).join('')}
                        <option value="__add_new__">➕ Agregar nuevo...</option>
                    </select>
                `;
            } else if (param.range) {
                inputField = `
                    <input type="text" class="form-input mt-1 w-full p-2 border border-gray-300 rounded param-value" 
                           value="${escapeHtml(param.value)}" data-param-index="${index}" 
                           data-measurement-id="${measurement.id}" placeholder="${param.range}">
                `;
            } else {
                inputField = `
                    <input type="text" class="form-input mt-1 w-full p-2 border border-gray-300 rounded param-value" 
                           value="${escapeHtml(param.value)}" data-param-index="${index}" 
                           data-measurement-id="${measurement.id}" placeholder="Valor">
                `;
            }

            let parameterNameField = `
                <label class="block text-xs font-semibold text-gray-700 truncate" title="${escapeHtml(param.name)}">${escapeHtml(param.name)}</label>
            `;

            if (measurement.id >= 100) {
                parameterNameField = `
                    <input type="text" class="parameter-name-input text-xs font-semibold p-1 border rounded w-full" value="${escapeHtml(param.name)}" 
                           data-param-index="${index}" data-measurement-id="${measurement.id}" placeholder="Nombre del parámetro">
                `;
            }

            return `
                <div class="parameter-row p-2 bg-white rounded border border-gray-200 hover:border-blue-200 transition-all shadow-sm">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        ${parameterNameField}
                        <button type="button" class="remove-parameter-btn text-red-400 hover:text-red-600 text-xs p-1 flex-shrink-0" 
                                data-measurement-id="${measurement.id}" data-param-index="${index}" title="Eliminar parámetro">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    ${inputField}
                </div>
            `;
        }).join('');

        let measurementNameField = `<h4 class="font-semibold text-white text-sm truncate">${escapeHtml(measurement.name)}</h4>`;
        if (measurement.id >= 100) {
            measurementNameField = `
                <input type="text" class="measurement-name-input bg-blue-700 text-white text-sm font-semibold p-1 rounded w-full" value="${escapeHtml(measurement.name)}" 
                       data-id="${measurement.id}" placeholder="Nombre de la medición">
            `;
        }

        measurementItem.innerHTML = `
            <div class="measurement-card-header bg-blue-600 text-white px-3 py-2 flex justify-between items-center gap-2">
                ${measurementNameField}
                <button type="button" class="remove-measurement text-white/80 hover:text-white transition flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-700 text-xs flex-shrink-0" data-id="${measurement.id}" title="Eliminar medición">
                    <i class="fas fa-times"></i> Eliminar
                </button>
            </div>
            <div class="p-3 bg-gray-50 flex-1 space-y-2">
                ${paramsHTML}
            </div>
            <div class="p-2 border-t border-gray-200 bg-white flex justify-end">
                <button type="button" class="add-parameter-btn bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-sm" 
                        data-measurement-id="${measurement.id}">
                    <i class="fas fa-plus"></i> Agregar parámetro
                </button>
            </div>
        `;

        elements.measurementsList.appendChild(measurementItem);
    });

        // Render custom parameters in a separate section
    const customSection = document.createElement('div');
    customSection.className = 'custom-parameters-section bg-white p-6 rounded-lg border-2 border-green-300 col-span-full shadow-lg';

    const header = document.createElement('h4');
    header.className = 'font-semibold text-lg text-green-700 mb-4';
    header.textContent = 'Parámetros Personalizados';
    customSection.appendChild(header);

    if (appState.customParameters.length > 0) {
        appState.customParameters.forEach((param, index) => {
            const paramRow = document.createElement('div');
            paramRow.className = 'parameter-row grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 p-4 bg-white rounded-lg border border-green-200 shadow-sm';

            const nameDiv = document.createElement('div');
            nameDiv.innerHTML = `
                <input type="text" class="parameter-name-input border border-green-300 rounded p-2 w-full" 
                       value="${escapeHtml(param.name)}" data-custom-param-index="${index}" placeholder="Nombre del parámetro">
            `;
            paramRow.appendChild(nameDiv);

            const valueDiv = document.createElement('div');
            valueDiv.innerHTML = `
                <input type="text" class="form-input border border-green-300 rounded p-2 w-full param-value" 
                       value="${escapeHtml(param.value)}" data-custom-param-index="${index}" placeholder="Valor">
            `;
            paramRow.appendChild(valueDiv);

            const removeDiv = document.createElement('div');
            removeDiv.className = 'flex items-end justify-end';
            removeDiv.innerHTML = `
                <button type="button" class="remove-custom-parameter-btn bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 text-sm flex items-center gap-2 transition-all">
                    <i class="fas fa-times"></i> Eliminar
                </button>
            `;
            paramRow.appendChild(removeDiv);

            customSection.appendChild(paramRow);
        });
    } else {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-gray-500 text-center py-4';
        emptyMessage.textContent = 'No hay parámetros personalizados. Agrega uno usando el botón abajo.';
        customSection.appendChild(emptyMessage);
    }

    // Add button to add custom parameter
    const addButtonDiv = document.createElement('div');
    addButtonDiv.className = 'mt-4 flex justify-end';
    addButtonDiv.innerHTML = `
        <button type="button" class="add-custom-parameter-btn bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm shadow-sm flex items-center gap-2 transition-all">
            <i class="fas fa-plus"></i> Agregar parámetro personalizado
        </button>
    `;
    customSection.appendChild(addButtonDiv);

    elements.measurementsList.appendChild(customSection);

    attachMeasurementEventListeners();
}

function toggleMeasurements() {
    if (!elements.addMeasurementsCheckbox || !elements.measurementsContainer) return;

    if (elements.addMeasurementsCheckbox.checked) {
        elements.measurementsContainer.classList.remove('hidden');
        renderMeasurements();
    } else {
        elements.measurementsContainer.classList.add('hidden');
    }
}

// ===================================================================
// 10. PERSISTENCIA DE DATOS (LOCALSTORAGE)
// ===================================================================

function saveAllData() {
    try {
        const dataToSave = {
            procedures: appState.procedures,
            templates: appState.templates,
            staff: appState.staff,
            commonData: appState.commonData,
            formState: getFormState(),
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('medicalReportAppData', JSON.stringify(dataToSave));
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

function loadAllData() {
    try {
        const savedData = localStorage.getItem('medicalReportAppData');
        if (!savedData) return false;
        
        const data = JSON.parse(savedData);
        if (data.procedures) {
            appState.procedures = data.procedures;
            updateProcedureDropdown();
        }
        if (data.templates) {
            appState.templates = data.templates;
            updateTemplatesDropdown();
        }
        if (data.staff) {
            appState.staff = data.staff;
            renderStaffCheckboxes();
        }
        if (data.commonData) {
            appState.commonData = { ...appState.commonData, ...data.commonData };
            updateCommonDataDropdowns();
        }
        if (data.formState) {
            setFormState(data.formState);
        }
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

function getFormState() {
    if (!elements.procedureNameSelect) return {};
    
    try {
        const getCheckboxValues = (role) => {
            const checkboxes = document.querySelectorAll(`input[name="${role}"]:checked`);
            return Array.from(checkboxes).map(cb => cb.value);
        };
        
        const formState = {
            procedureName: elements.procedureNameSelect.value || '',
            customProcedure: elements.customProcedureInput?.value || '',
            procedureCode: elements.procedureCodeInput?.value || '',
            procedureDate: elements.procedureDate?.value || '',
            procedureName2: elements.procedureName2Select?.value || '',
            customProcedure2: elements.customProcedure2Input?.value || '',
            procedureCode2: elements.procedureCode2Input?.value || '',
            procedureName3: elements.procedureName3Select?.value || '',
            customProcedure3: elements.customProcedure3Input?.value || '',
            procedureCode3: elements.procedureCode3Input?.value || '',
            additionalProceduresCount: appState.additionalProceduresCount,
            startTime: elements.startTime?.value || '',
            endTime: elements.endTime?.value || '',
            commune: elements.commune?.value || '',
            healthInsurance: elements.healthInsurance?.value || '',
            origin: elements.origin?.value || '',
            entryDiagnosis: elements.entryDiagnosisSelect?.value || '',
            customEntryDiagnosis: elements.customEntryDiagnosis?.value || '',
            exitDiagnosis: elements.exitDiagnosisSelect?.value || '',
            customExitDiagnosis: elements.customExitDiagnosis?.value || '',
            admissionReason: elements.admissionReason?.value || '',
            procedureDescription: document.getElementById('procedureDescription')?.value || '',
            additionalIndications: document.getElementById('additionalIndications')?.value || '',
            indications: Array.from(document.querySelectorAll('#indicationsCheckboxes input:checked') || []).map(cb => cb.nextElementSibling.textContent.trim()),
            mainDoctor: getCheckboxValues('mainDoctor'),
            assistantNurse: getCheckboxValues('assistantNurse'),
            tens: getCheckboxValues('tens'),
            addMeasurements: elements.addMeasurementsCheckbox?.checked || false,
            measurements: appState.measurements,
            activeTab: document.querySelector('.tab-btn.active')?.dataset.tab || 'patient-data'
        };
        return formState;
    } catch (error) {
        console.error('Error getting form state:', error);
        return {};
    }
}

function setFormState(formState) {
    if (!formState || !elements.procedureNameSelect) return;
    
    try {
        elements.procedureNameSelect.value = formState.procedureName || '';
        if (elements.customProcedureInput) elements.customProcedureInput.value = formState.customProcedure || '';
        if (elements.procedureCodeInput) elements.procedureCodeInput.value = formState.procedureCode || '';
        
        // Restaurar prestaciones adicionales
        if (formState.additionalProceduresCount > 0) {
            if (elements.procedureName2Select) elements.procedureName2Select.value = formState.procedureName2 || '';
            if (elements.customProcedure2Input) elements.customProcedure2Input.value = formState.customProcedure2 || '';
            if (elements.procedureCode2Input) elements.procedureCode2Input.value = formState.procedureCode2 || '';
            
            if (elements.procedure2Section) {
                elements.procedure2Section.classList.remove('hidden');
                appState.additionalProceduresCount = 1;
            }
            
            if (formState.additionalProceduresCount > 1) {
                if (elements.procedureName3Select) elements.procedureName3Select.value = formState.procedureName3 || '';
                if (elements.customProcedure3Input) elements.customProcedure3Input.value = formState.customProcedure3 || '';
                if (elements.procedureCode3Input) elements.procedureCode3Input.value = formState.procedureCode3 || '';
                
                if (elements.procedure3Section) {
                    elements.procedure3Section.classList.remove('hidden');
                    if (elements.addProcedureBtn) elements.addProcedureBtn.classList.add('hidden');
                    appState.additionalProceduresCount = 2;
                }
            }
        }
        
        const optionalFields = [
            'startTime', 'endTime', 'procedureDate', 'commune', 'healthInsurance', 'origin',
            'procedureDescription', 'additionalIndications', 'admissionReason'
        ];
        
        optionalFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && formState[fieldId]) {
                element.value = formState[fieldId];
            }
        });
        
        if (elements.entryDiagnosisSelect) elements.entryDiagnosisSelect.value = formState.entryDiagnosis || '';
        if (elements.customEntryDiagnosis) elements.customEntryDiagnosis.value = formState.customEntryDiagnosis || '';
        if (elements.exitDiagnosisSelect) elements.exitDiagnosisSelect.value = formState.exitDiagnosis || '';
        if (elements.customExitDiagnosis) elements.customExitDiagnosis.value = formState.customExitDiagnosis || '';
        
        if (formState.mainDoctor) {
            setSelectedStaff('mainDoctor', formState.mainDoctor);
        }
        
        if (formState.assistantNurse) {
            setSelectedStaff('assistantNurse', formState.assistantNurse);
        }
        
        if (formState.tens) {
            setSelectedStaff('tens', formState.tens);
        }
        
        toggleCustomFields();
        
        if (formState.indications) {
            document.querySelectorAll('#indicationsCheckboxes input').forEach(cb => {
                const indicationText = cb.nextElementSibling.textContent.trim();
                cb.checked = formState.indications.includes(indicationText);
            });
        }
        
        if (formState.addMeasurements && elements.addMeasurementsCheckbox) {
            elements.addMeasurementsCheckbox.checked = true;
            if (elements.measurementsContainer) elements.measurementsContainer.classList.remove('hidden');
            if (formState.measurements) appState.measurements = formState.measurements;
            renderMeasurements();
        }
        
        const tabButton = document.querySelector(`.tab-btn[data-tab="${formState.activeTab}"]`);
        if (tabButton) {
            setTimeout(() => tabButton.click(), 100);
        }
    } catch (error) {
        console.error('Error setting form state:', error);
    }
}

function startAutoSave() {
    if (appState.autoSaveInterval) {
        clearInterval(appState.autoSaveInterval);
    }
    
    appState.autoSaveInterval = setInterval(() => {
        if (appState.formChanged) {
            saveAllData();
            showSaveIndicator();
            appState.formChanged = false;
        }
    }, 30000); // Auto-save every 30 seconds
}

// ===================================================================
// 10.1. IMPORTACIÓN / EXPORTACIÓN Y UTILIDADES UI
// ===================================================================

function exportData() {
    try {
        const dataToExport = {
            procedures: appState.procedures,
            templates: appState.templates,
            staff: appState.staff,
            commonData: appState.commonData,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `medical-report-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        localStorage.setItem('lastBackupDate', new Date().toISOString());
        showNotification('Datos exportados correctamente', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error al exportar los datos', 'error');
    }
}

// Respaldo de datos: guarda una copia JSON usando File System Access API
// (Chrome/Edge) con respaldo automático a descarga directa si no está disponible.
async function backupToFile() {
    const payload = {
        procedures: appState.procedures,
        templates: appState.templates,
        staff: appState.staff,
        commonData: appState.commonData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    const dataStr = JSON.stringify(payload, null, 2);
    const stamp = new Date().toISOString().split('T')[0];
    const filename = 'respaldo-informes-' + stamp + '.json';

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: 'Respaldo JSON', accept: { 'application/json': ['.json'] } }]
            });
            const writable = await handle.createWritable();
            await writable.write(new Blob([dataStr], { type: 'application/json' }));
            await writable.close();
            try { localStorage.setItem('lastBackupDate', new Date().toISOString()); } catch (e) { /* sin acceso a storage */ }
            showNotification('Respaldo guardado correctamente', 'success');
            return;
        } catch (err) {
            if (err && err.name === 'AbortError') return; // El usuario canceló el diálogo
            console.warn('File System Access no disponible, usando descarga directa:', err);
        }
    }

    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    try { localStorage.setItem('lastBackupDate', new Date().toISOString()); } catch (e) { /* sin acceso a storage */ }
    showNotification('Respaldo descargado correctamente', 'success');
}

// Muestra un recordatorio si han pasado más de 7 días sin respaldo.
function checkBackupReminder() {
    let last = null;
    try { last = localStorage.getItem('lastBackupDate'); } catch (e) { return; }
    if (!last) {
        // Primer uso: registrar hoy para no molestar de inmediato
        try { localStorage.setItem('lastBackupDate', new Date().toISOString()); } catch (e) { /* ignorar */ }
        return;
    }
    const lastTime = new Date(last).getTime();
    if (Number.isNaN(lastTime)) {
        try { localStorage.setItem('lastBackupDate', new Date().toISOString()); } catch (e) { /* ignorar */ }
        return;
    }
    const days = (Date.now() - lastTime) / 86400000;
    if (days < 7) return;

    showConfirmDialog(
        'Respaldo de datos',
        'Han pasado ' + Math.floor(days) + ' días desde el último respaldo. ¿Desea guardar una copia de seguridad ahora?',
        { confirmText: 'Descargar respaldo', cancelText: 'Recordar luego', danger: false }
    ).then(ok => {
        if (ok) {
            backupToFile();
        } else {
            try { localStorage.setItem('lastBackupDate', new Date().toISOString()); } catch (e) { /* ignorar */ }
        }
    });
}
window.backupToFile = backupToFile;

// Valida el esquema de un archivo de datos importado antes de aplicarlo.
// Devuelve un arreglo con los errores encontrados (vacío si es válido).
function validateImportedData(data) {
    const errors = [];
    const isString = (v) => typeof v === 'string' && v.trim().length > 0;
    const isStringArray = (v) => Array.isArray(v) && v.every(isString);
    const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

    if (!isObject(data)) {
        return ['el archivo debe contener un objeto JSON con los datos de la aplicación.'];
    }

    if (data.procedures !== undefined &&
        !(Array.isArray(data.procedures) && data.procedures.every(p =>
            isObject(p) && isString(p.id) && isString(p.name) && isString(p.code)))) {
        errors.push('"procedures" debe ser una lista de procedimientos con id, nombre y código.');
    }

    if (data.templates !== undefined &&
        !(Array.isArray(data.templates) && data.templates.every(t =>
            isObject(t) && isString(t.id) && isString(t.name)))) {
        errors.push('"templates" debe ser una lista de plantillas con id y nombre.');
    }

    if (data.staff !== undefined &&
        !(Array.isArray(data.staff) && data.staff.every(s =>
            isObject(s) && isString(s.id) && isString(s.name) && isString(s.role)))) {
        errors.push('"staff" debe ser una lista de personal con id, nombre y rol.');
    }

    if (data.commonData !== undefined) {
        if (!isObject(data.commonData)) {
            errors.push('"commonData" debe ser un objeto.');
        } else {
            ['communes', 'insurances', 'origins', 'entryDiagnoses', 'exitDiagnoses',
             'deviceBrands', 'deviceTypes', 'stimulationPolarities', 'indications'].forEach(key => {
                if (data.commonData[key] !== undefined && !isStringArray(data.commonData[key])) {
                    errors.push('"commonData.' + key + '" debe ser una lista de textos.');
                }
            });
            const models = data.commonData.deviceModelsByTypeAndBrand;
            if (models !== undefined) {
                const validModels = isObject(models) && Object.values(models).every(brands =>
                    isObject(brands) && Object.values(brands).every(isStringArray)
                );
                if (!validModels) {
                    errors.push('"commonData.deviceModelsByTypeAndBrand" tiene un formato inválido.');
                }
            }
        }
    }

    return errors;
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const validationErrors = validateImportedData(importedData);
            if (validationErrors.length > 0) {
                showNotification('Archivo inválido: ' + validationErrors[0], 'error');
                return;
            }
            const ok = await showConfirmDialog(
                'Importar datos',
                '¿Está seguro de que desea importar estos datos? Esto sobrescribirá los datos actuales.',
                { confirmText: 'Importar' }
            );
            if (ok) {
                if (importedData.procedures) appState.procedures = importedData.procedures;
                if (importedData.templates) appState.templates = importedData.templates;
                if (importedData.staff) appState.staff = importedData.staff;
                if (importedData.commonData) {
                    appState.commonData = { ...appState.commonData, ...importedData.commonData };
                }
                saveAllData();
                updateCommonDataDropdowns();
                updateProcedureDropdown();
                updateTemplatesDropdown();
                renderStaffCheckboxes();
                showNotification('Datos importados correctamente', 'success');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            showNotification('Error al importar los datos. Verifique que el archivo sea válido.', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ===================================================================
// COPIADO CON FORMATO (MEDICAP / EXCEL) CON ESTILOS INLINE
// ===================================================================

/**
 * Handler principal del botón "Copiar con Formato" (copyFormattedReportBtn).
 * Copia el reporte al portapapeles en dos formatos simultáneos:
 *   - text/html: HTML con TODOS los estilos inline (colores, tablas, negritas, etc.)
 *   - text/plain: texto plano como respaldo para editores básicos.
 */
async function copyFormattedReport() {
    const reportContent = elements.reportContent;
    if (!reportContent) {
        showNotification('No hay contenido en el informe para copiar.', 'error');
        return;
    }

    try {
        // 1. Clonar el contenedor del reporte para trabajar en memoria
        //    sin afectar el HTML que se muestra en pantalla.
        const clone = reportContent.cloneNode(true);
        clone.querySelectorAll('.no-print, [data-html2canvas-ignore="true"]').forEach(el => el.remove());

        // 2. Normalizar tablas a HTML estándar ANTES de eliminar las clases,
        //    porque normalizeTablesForRichText detecta la clase .layout-table.
        normalizeTablesForRichText(clone);

        // 3. Convertir los estilos computados reales (Tailwind + report-styles.css)
        //    a atributos style="..." inline y eliminar las clases.
        inlineAllStyles(reportContent, clone);

        // 4. Envolver en un contenedor con tipografía base para el destino
        //    y empaquetar como documento Office (Word/Excel) para que
        //    destinos como Medicap conserven los colores al pegar.
        forceReportCopyStyles(clone);
        const fragment = `
            <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;background-color:#ffffff;">
                ${clone.innerHTML}
            </div>
        `.trim();
        const styledHtml = buildOfficeHtml(fragment);

        const plainText = clone.innerText || clone.textContent || '';

        // 5. Método principal: Clipboard API moderna con ClipboardItem.
        //    Se ofrece tanto HTML como texto plano para maximizar compatibilidad
        //    con editores web y de texto enriquecido. Algunos destinos fallan con
        //    HTML puro si no hay respaldo de texto plano.
        if (navigator.clipboard && window.ClipboardItem) {
            try {
                const item = new ClipboardItem({
                    'text/html': new Blob([styledHtml], { type: 'text/html' }),
                    'text/plain': new Blob([plainText], { type: 'text/plain' })
                });
                await navigator.clipboard.write([item]);
                console.log('[Copiar Informe] Ruta: ClipboardItem (HTML + texto plano) | HTML bytes:', styledHtml.length);
                window.__lastCopiedHtml = styledHtml;
                showCopyFeedback('Copiado (HTML moderno)');
                return;
            } catch (clipboardErr) {
                console.warn('ClipboardItem no disponible o denegado, usando respaldo:', clipboardErr);
            }
        }

        // 6. Respaldo: document.execCommand('copy') con selección de un
        //    elemento temporal, que empaqueta el HTML enriquecido.
        fallbackCopyHtml(styledHtml);
        console.log('[Copiar Informe] Ruta: execCommand fallback | HTML bytes:', styledHtml.length);
        window.__lastCopiedHtml = styledHtml;
        showCopyFeedback('Copiado (respaldo execCommand)');

    } catch (error) {
        console.error('Error al copiar el informe:', error);
        showNotification('Ocurrió un error al copiar el informe. Intente seleccionar el texto manualmente.', 'error');
    }
}

/**
 * Convierte un color CSS en formato rgb()/rgba() a su equivalente HEX.
 * Los colores translúcidos se dejan intactos para no forzar opacidad.
 */
function rgbToHex(color) {
    if (!color || typeof color !== 'string') return color;
    const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (!m) return color;
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (a < 0.9) return color; // translúcido: no forzar
    const r = Math.min(255, parseInt(m[1], 10));
    const g = Math.min(255, parseInt(m[2], 10));
    const b = Math.min(255, parseInt(m[3], 10));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Envuelve el fragmento del informe en un documento HTML con formato
 * de Office (Word/Excel). Destinos como Medicap, que usan el motor de
 * Word/MSHTML, detectan estas señales y conservan los colores al pegar,
 * igual que cuando copias directamente desde Excel.
 */
function buildOfficeHtml(fragment) {
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="ProgId" content="Excel.Sheet">
    <meta name="Generator" content="Microsoft Excel 15">
    <!--[if gte mso 9]><xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>Informe</x:Name>
                    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
            </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        <w:WordDocument><w:View>Normal</w:View><w:Zoom>0</w:Zoom><w:TrackMoves>false</w:TrackMoves><w:TrackFormatting>false</w:TrackFormatting></w:WordDocument>
    </xml><![endif]-->
    <style>
        @page WordSection1 { size: letter portrait; margin: 0.75in; }
        div.WordSection1 { page: WordSection1; }
        table { border-collapse: collapse; }
        .WordSection1 p { margin-top: 0; margin-bottom: 6pt; }
        .WordSection1 ul, .WordSection1 ol { margin-top: 0; margin-bottom: 6pt; }
    </style>
</head>
<body lang="es-CL">
<div class="WordSection1">
    ${fragment}
</div>
</body>
</html>`.trim();
}

/**
 * Recorre el árbol DOM del elemento original y su clon de forma simétrica,
 * extrayendo los estilos CSS computados reales e inyectándolos como
 * style="..." inline. Finalmente elimina las clases CSS del clon.
 */
function inlineAllStyles(original, clone) {
    const origElements = [original, ...original.querySelectorAll('*')];
    const cloneElements = [clone, ...clone.querySelectorAll('*')];

    // Propiedades clave que interpretan correctamente Medicap, Word y Excel.
    const essentialStyles = [
        'font-family', 'font-size', 'font-weight', 'font-style', 'color',
        'background-color', 'text-align', 'text-transform', 'text-decoration',
        'line-height', 'letter-spacing', 'padding', 'padding-top', 'padding-right',
        'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right',
        'margin-bottom', 'margin-left', 'border', 'border-top', 'border-right',
        'border-bottom', 'border-left', 'border-color', 'border-style', 'border-width',
        'border-collapse', 'width', 'min-width', 'max-width', 'height',
        'vertical-align', 'white-space', 'box-sizing', 'border-radius', 'display'
    ];

    for (let i = 0; i < origElements.length; i++) {
        const orig = origElements[i];
        const cln = cloneElements[i];

        if (!orig || !cln || cln.nodeType !== Node.ELEMENT_NODE) continue;

        const computed = window.getComputedStyle(orig);
        let styleString = '';

        essentialStyles.forEach(prop => {
            let val = computed.getPropertyValue(prop);
            if (val && val !== 'initial' && val !== 'none' && val !== 'normal' && val !== 'rgba(0, 0, 0, 0)') {
                if (prop === 'color' || prop === 'background-color') {
                    val = rgbToHex(val);
                }
                styleString += `${prop}:${val};`;
            }
        });

        // Reemplazar gradientes CSS por colores sólidos (los editores
        // de texto enriquecido ignoran los gradientes).
        if (computed.backgroundImage && computed.backgroundImage !== 'none') {
            if (orig.classList.contains('report-box-title') || orig.tagName === 'TH') {
                styleString += 'background-color:#2563eb;color:#ffffff;';
            } else if (orig.tagName === 'HEADER' || orig.classList.contains('report-title') || orig.classList.contains('report-main-title')) {
                styleString += 'background-color:#1e3a5f;color:#ffffff;';
            }
        }

        // Unir estilos ya presentes (p.ej. los fijados por normalizeTablesForRichText
        // o los inline del generador) con los estilos computados.
        const existingStyle = cln.getAttribute('style') || '';

        // Si ya existe un ancho explícito (p.ej. el recuadro compacto de Personal
        // Médico con width:50%), preservarlo: el ancho computado en px fijo haría
        // que la caja se viera de ancho distinto al pegar en destinos como Medicap.
        if (/(?:^|;)\s*width\s*:/.test(existingStyle)) {
            styleString = styleString.replace(/width\s*:[^;]+(?:;|$)/g, '');
        }

        cln.setAttribute('style', `${existingStyle};${styleString}`);

        // Eliminar 'class' para que el destino no dependa de hojas externas.
        cln.removeAttribute('class');
    }
}

function forceReportCopyStyles(root) {
    if (!root) return;

    const setStyle = (el, styles) => {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
        const current = el.getAttribute('style') || '';
        const next = Object.entries(styles).map(([key, value]) => `${key}:${value};`).join('');
        el.setAttribute('style', `${current};${next}`);
    };

    root.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();

        if (tag === 'table') {
            setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
        }

        if (['th', 'td', 'p', 'li', 'div', 'span', 'strong', 'b', 'label'].includes(tag)) {
            const isTitle = el.classList.contains('report-box-title');
            const isSubTitle = el.classList.contains('report-subsection-title');
            const isMainTitle = el.classList.contains('report-main-title');

            if (isMainTitle) {
                setStyle(el, { 'font-size': '30px', 'line-height': '1.2', 'font-weight': '800' });
            } else if (isTitle) {
                setStyle(el, { 'font-size': '17px', 'line-height': '1.35', 'font-weight': '700' });
            } else if (isSubTitle) {
                setStyle(el, { 'font-size': '14px', 'line-height': '1.4', 'font-weight': '700' });
            } else if (tag === 'th') {
                setStyle(el, { 'font-size': '11px', 'line-height': '1.4' });
            } else if (tag === 'td') {
                setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
            } else if (tag === 'p' || tag === 'li') {
                setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
            } else if (tag === 'div') {
                setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
            }
        }
    });
}

/**
 * Garantiza que las tablas usen atributos HTML tradicionales (border,
 * cellpadding, cellspacing) y estilos compatibles con editores enriquecidos
 * (igual que las tablas que genera Microsoft Excel).
 */
function normalizeTablesForRichText(container) {
    container.querySelectorAll('table').forEach(table => {
        const isLayout = table.classList.contains('layout-table');

        if (isLayout) {
            table.setAttribute('border', '0');
            table.setAttribute('cellpadding', '0');
            table.setAttribute('cellspacing', '0');
            table.style.border = 'none';
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';

            table.querySelectorAll('td, th').forEach(cell => {
                cell.style.border = 'none';
            });
        } else {
            // Color de cabecera según la sección del informe (data-kind)
            const boxEl = table.closest('.report-box');
            const boxKind = boxEl ? boxEl.getAttribute('data-kind') : '';
            const headerColor = {
                procedure: '#2563eb',
                diagnostics: '#0f766e',
                description: '#4f46e5',
                additional: '#1d4ed8',
                measurements: '#7c3aed',
                staff: '#475569',
                indications: '#059669'
            }[boxKind] || '#2563eb';

            table.setAttribute('border', '1');
            table.setAttribute('cellpadding', '5');
            table.setAttribute('cellspacing', '0');
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.borderColor = '#cbd5e1';

            table.querySelectorAll('th').forEach(th => {
                th.style.backgroundColor = headerColor;
                th.style.background = headerColor; // shorthand, igual que Excel
                th.style.color = '#ffffff';
                th.style.fontWeight = 'bold';
                th.style.padding = '5px 8px';
                th.style.border = `1pt solid ${headerColor}`;
                th.style.textAlign = 'left';
                // Atributo HTML4: muchos editores web lo conservan aunque quiten style.
                th.setAttribute('bgcolor', headerColor);
                // Pistas compatibles con Word (mso-): algunos controles tipo
                // Word ignoran el CSS estándar pero respetan estas propiedades.
                th.style.setProperty('mso-background-source', 'auto');
                th.style.setProperty('mso-pattern', 'gray-5 auto');
                th.style.setProperty('mso-border-alt', `solid ${headerColor} .5pt`);
                th.style.setProperty('mso-font-charset', 'auto');
            });

            table.querySelectorAll('td').forEach(td => {
                td.style.padding = '5px 8px';
                td.style.border = '1pt solid #cbd5e1';
                td.style.setProperty('mso-background-source', 'auto');
                td.style.setProperty('mso-pattern', 'gray-5 auto');
                td.style.setProperty('mso-border-alt', 'solid #cbd5e1 .5pt');
            });

            // Rayado de filas alternas: reforzado con bgcolor (HTML4)
            // y con el shorthand background: (igual que Excel).
            table.querySelectorAll('tbody tr:nth-child(even)').forEach(tr => {
                tr.style.backgroundColor = '#f8fafc';
                tr.style.background = '#f8fafc';
                tr.setAttribute('bgcolor', '#f8fafc');
                tr.style.setProperty('mso-background-source', 'auto');
                tr.style.setProperty('mso-pattern', 'gray-5 auto');
            });

            // Filas de título de medición: banda de color violeta claro
            table.querySelectorAll('tbody tr.report-measurement-title-row').forEach(tr => {
                const rowColor = '#ede9fe';
                tr.style.backgroundColor = rowColor;
                tr.style.background = rowColor;
                tr.setAttribute('bgcolor', rowColor);
                tr.querySelectorAll('td').forEach(td => {
                    td.style.fontWeight = 'bold';
                    td.style.color = '#4c1d95';
                });
            });
        }
    });
}

/**
 * Método de respaldo: selecciona el contenido de un elemento temporal
 * y usa document.execCommand('copy') para empaquetar el HTML en el portapapeles.
 */
function fallbackCopyHtml(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.contentEditable = 'true';
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.opacity = '0';
    tempDiv.innerHTML = htmlContent;

    document.body.appendChild(tempDiv);

    const range = document.createRange();
    range.selectNodeContents(tempDiv);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (copyErr) {
        console.error('execCommand("copy") lanzó un error:', copyErr);
        successful = false;
    }

    selection.removeAllRanges();
    document.body.removeChild(tempDiv);

    if (!successful) {
        throw new Error('No se pudo ejecutar el comando de copia en el navegador.');
    }
}

/**
 * Feedback visual momentáneo en el botón "Copiar con Formato".
 */
function showCopyFeedback(message, btnEl) {
    const btn = btnEl || elements.copyFormattedReportBtn;
    if (!btn) {
        showNotification(message, 'info');
        return;
    }
    const originalHtml = btn.innerHTML;
    const originalBackground = btn.style.background;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i> ' + message;
    btn.style.background = '#16a34a';
    setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.background = originalBackground;
    }, 2500);
}

/**
 * DEPURACIÓN: Genera el mismo HTML listo para copiar (con estilos inline),
 * lo muestra en un modal y lo deja en window.__lastCopiedHtml.
 * Uso desde consola:  inspectReportHtml()
 * Sirve para verificar qué conserva realmente el portapapeles y para
 * probar el pegado en el editor destino (Medicap).
 */
function inspectReportHtml() {
    const reportContent = elements.reportContent;
    if (!reportContent) {
        showNotification('No hay informe generado.', 'error');
        return null;
    }

    const clone = reportContent.cloneNode(true);
    clone.querySelectorAll('.no-print, [data-html2canvas-ignore="true"]').forEach(el => el.remove());
    normalizeTablesForRichText(clone);
    inlineAllStyles(reportContent, clone);

    const fragment = `
        <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;background-color:#ffffff;">
            ${clone.innerHTML}
        </div>
    `.trim();
    const styledHtml = buildOfficeHtml(fragment);

    window.__lastCopiedHtml = styledHtml;
    console.log('[Depuración] HTML a copiar (%d bytes):', styledHtml.length);
    console.log(styledHtml);

    const modal = createModal('HTML a copiar (inspección)', `
        <textarea readonly spellcheck="false"
            style="width:100%;min-height:50vh;font-family:monospace;font-size:11px;border:1px solid #e2e8f0;border-radius:6px;padding:0.5rem;"
            onclick="this.select()"></textarea>
        <p class="text-sm text-gray-500 mt-2">Selecciona el HTML para revisarlo, o cópialo y pégalo en el editor destino para probar la compatibilidad.</p>
    `);
    const ta = modal.querySelector('textarea');
    ta.value = styledHtml;
    return styledHtml;
}
window.inspectReportHtml = inspectReportHtml;

// ===================================================================
// 10.4. MODALES: DATOS COMUNES / PLACEHOLDERS VARIOS
// ===================================================================

function showCommonDataSection() {
    if (elements.mainFormSection) elements.mainFormSection.classList.add('hidden');
    if (elements.proceduresSection) elements.proceduresSection.classList.add('hidden');

    const commonDataSection = document.getElementById('common-data-section');
    if (commonDataSection) {
        commonDataSection.classList.remove('hidden');
        updateCommonDataLists();
    }
}

function attachCommonDataSectionEventListeners() {
    // Configuración de los event listeners para la sección de datos comunes
    const sections = [
        {
            type: 'communes',
            addId: 'addCommune',
            inputId: 'newCommune',
            listId: 'communesList',
            deleteClass: 'delete-commune'
        },
        {
            type: 'insurances',
            addId: 'addInsurance',
            inputId: 'newInsurance',
            listId: 'insurancesList',
            deleteClass: 'delete-insurance'
        },
        {
            type: 'origins',
            addId: 'addOrigin',
            inputId: 'newOrigin',
            listId: 'originsList',
            deleteClass: 'delete-origin'
        },
        {
            type: 'entryDiagnoses',
            addId: 'addEntryDiagnosis',
            inputId: 'newEntryDiagnosis',
            listId: 'entryDiagnosesList',
            deleteClass: 'delete-entry-diagnosis'
        },
        {
            type: 'exitDiagnoses',
            addId: 'addExitDiagnosis',
            inputId: 'newExitDiagnosis',
            listId: 'exitDiagnosesList',
            deleteClass: 'delete-exit-diagnosis'
        },
        {
            type: 'deviceBrands',
            addId: 'addDeviceBrand',
            inputId: 'newDeviceBrand',
            listId: 'deviceBrandsList',
            deleteClass: 'delete-device-brand'
        },
        {
            type: 'deviceTypes',
            addId: 'addDeviceType',
            inputId: 'newDeviceType',
            listId: 'deviceTypesList',
            deleteClass: 'delete-device-type'
        },
        {
            type: 'indications',
            addId: 'commonDataAddIndicationBtn',
            inputId: 'commonDataNewIndication',
            listId: 'commonDataIndicationsList',
            deleteClass: 'delete-indication'
        }
    ];

    // Agregar event listeners para cada sección
    sections.forEach(section => {
        // Event listener para el botón de agregar
        const addButton = document.getElementById(section.addId);
        if (addButton) {
            addButton.addEventListener('click', () => {
                addCommonDataItem(section.type, section.inputId, section.listId, section.deleteClass);
            });

            // También agregar evento para la tecla Enter en el input
            const input = document.getElementById(section.inputId);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        addCommonDataItem(section.type, section.inputId, section.listId, section.deleteClass);
                    }
                });
            }
        }
    });
}

function addCommonDataItem(dataType, inputId, listId, deleteClass) {
    const input = document.getElementById(inputId);
    const newValue = input?.value?.trim();
    if (!newValue) {
        showNotification('Por favor, ingrese un valor', 'error');
        return;
    }
    if (appState.commonData[dataType].includes(newValue)) {
        showNotification(`"${newValue}" ya existe en la lista`, 'error');
        return;
    }
    
    // Agregar y ordenar alfabéticamente
    appState.commonData[dataType].push(newValue);
    appState.commonData[dataType].sort((a, b) => a.localeCompare(b, 'es'));
    
    saveAllData();
    updateCommonDataDropdowns();
    if (input) {
        input.value = '';
        input.focus();
    }
    updateCommonDataList(dataType, listId, deleteClass);
    showNotification(`Se agregó "${newValue}" correctamente`, 'success');
}

async function deleteCommonDataItem(dataType, value, listId, deleteClass) {
    const ok = await showConfirmDialog(
        'Eliminar elemento',
        `¿Está seguro de que desea eliminar "${value}"?`,
        { confirmText: 'Eliminar' }
    );
    if (!ok) return;
    appState.commonData[dataType] = appState.commonData[dataType].filter(item => item !== value);
    saveAllData();
    updateCommonDataDropdowns();
    updateCommonDataList(dataType, listId, deleteClass);
    showNotification(`Se eliminó "${value}" correctamente`, 'success');
}

function updateCommonDataList(dataType, listId, deleteClass) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = appState.commonData[dataType].map(item => `
        <div class="flex justify-between items-center bg-white p-2 rounded shadow mb-2 hover:bg-gray-50">
            <span class="flex-grow">${escapeHtml(item)}</span>
            <button type="button" class="text-red-500 hover:text-red-700 ml-2 ${deleteClass}" data-value="${escapeHtml(item)}" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    list.querySelectorAll(`.${deleteClass}`).forEach(btn => {
        btn.addEventListener('click', () => {
            deleteCommonDataItem(dataType, btn.dataset.value, listId, deleteClass);
        });
    });
}

function showNotification(message, type = 'success') {
    const colorByType = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    const iconByType = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded shadow-lg flex items-center gap-2 ${
        colorByType[type] || colorByType.success
    } text-white`;
    notification.style.zIndex = '4000';
    notification.innerHTML = `<i class="fas ${iconByType[type] || iconByType.success}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(notification);

    // Animación de entrada
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.3s ease-in-out';
    
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Modal de confirmación reutilizable basado en Promise.
 * Resuelve true si el usuario confirma y false si cancela
 * (botón Cancelar, clic fuera del modal o tecla Escape).
 */
function showConfirmDialog(title, message, options = {}) {
    return new Promise((resolve) => {
        const confirmText = options.confirmText || 'Confirmar';
        const cancelText = options.cancelText || 'Cancelar';
        const danger = options.danger !== false; // por defecto, acción destructiva

        const overlay = document.createElement('div');
        overlay.className = 'app-dialog-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15, 23, 42, 0.5);';

        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style.maxWidth = '26rem';
        modal.innerHTML = `
            <div class="modal-header">
                <h2>${escapeHtml(title)}</h2>
            </div>
            <div class="modal-body">
                <p style="margin:0;color:#334155;">${escapeHtml(message)}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-role="cancel">${escapeHtml(cancelText)}</button>
                <button type="button" class="btn ${danger ? 'btn-error' : 'btn-primary'}" data-role="confirm">${escapeHtml(confirmText)}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = (result) => {
            document.removeEventListener('keydown', handleKey);
            overlay.remove();
            resolve(result);
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') close(false);
        };

        modal.querySelector('[data-role="cancel"]').addEventListener('click', () => close(false));
        modal.querySelector('[data-role="confirm"]').addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });
        document.addEventListener('keydown', handleKey);

        modal.querySelector('[data-role="confirm"]').focus();
    });
}
window.showConfirmDialog = showConfirmDialog;

/**
 * Modal con la lista de campos obligatorios pendientes
 * (reemplaza el alert de validación del formulario).
 */
function showValidationErrors(errors) {
    const overlay = document.createElement('div');
    overlay.className = 'app-dialog-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15, 23, 42, 0.5);';

    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.maxWidth = '26rem';
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Faltan campos obligatorios</h2>
        </div>
        <div class="modal-body">
            <ul style="margin:0;padding-left:1.25rem;color:#334155;">
                ${errors.map(err => `<li style="margin-bottom:0.35rem;">${escapeHtml(err)}</li>`).join('')}
            </ul>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-role="close">Aceptar</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
        document.removeEventListener('keydown', handleKey);
        overlay.remove();
    };
    const handleKey = (e) => {
        if (e.key === 'Escape') close();
    };

    modal.querySelector('[data-role="close"]').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', handleKey);

    modal.querySelector('[data-role="close"]').focus();
}
window.showValidationErrors = showValidationErrors;

// Placeholders simples para evitar errores si aún no están implementados
function showTemplatesModal() {
    const modal = createModal('Gestión de Plantillas', `
        <div class="mb-4">
            <h4 class="font-bold mb-2">Guardar Plantilla Actual</h4>
            <div class="flex gap-2 mb-2">
                <input type="text" id="templateName" placeholder="Nombre de plantilla" class="form-input flex-grow p-2 border rounded">
                <button type="button" id="saveTemplateBtn" class="btn bg-blue-500 text-white">Guardar</button>
            </div>
        </div>
        <div class="border-t pt-4">
            <h4 class="font-bold mb-2">Plantillas Guardadas</h4>
            <div id="templatesList" class="space-y-2 max-h-60 overflow-y-auto">
                ${renderTemplatesList()}
            </div>
        </div>
    `);
    modal.querySelector('#saveTemplateBtn').addEventListener('click', saveCurrentTemplate);
    attachTemplatesEventListeners(modal);
}

function renderTemplatesList() {
    if (appState.templates.length === 0) {
        return '<p class="text-gray-500 italic">No hay plantillas guardadas</p>';
    }
    return appState.templates.map(template => `
        <div class="bg-gray-100 p-3 rounded flex justify-between items-center">
            <div>
                <strong>${escapeHtml(template.name)}</strong>
                <p class="text-sm text-gray-600">${new Date(template.date).toLocaleDateString()}</p>
            </div>
            <div class="flex gap-2">
                <button type="button" class="load-template-btn text-blue-500 hover:text-blue-700" data-id="${template.id}">
                    <i class="fas fa-download"></i> Cargar
                </button>
                <button type="button" class="delete-template-btn text-red-500 hover:text-red-700" data-id="${template.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function saveCurrentTemplate() {
    const name = document.getElementById('templateName').value.trim();
    if (!name) {
        showNotification('Por favor, ingrese un nombre para la plantilla', 'error');
        return;
    }

    // Guardar estado completo del formulario
    const templateData = getFormState();

    const template = { 
        id: Date.now().toString(), 
        name, 
        date: new Date().toISOString(), 
        data: templateData,
        version: '2.0'
    };

    appState.templates.push(template);
    saveAllData();
    
    const templatesList = document.getElementById('templatesList');
    if (templatesList) {
        templatesList.innerHTML = renderTemplatesList();
        attachTemplatesEventListeners(templatesList.closest('.modal'));
    }
    updateTemplatesDropdown();
    document.getElementById('templateName').value = '';
    showNotification(`Plantilla "${name}" guardada correctamente`, 'success');
}

async function loadTemplate(templateId) {
    const template = appState.templates.find(t => t.id === templateId);
    if (!template) return;

    const ok = await showConfirmDialog(
        'Cargar plantilla',
        '¿Está seguro de que desea cargar esta plantilla? Se cargarán todos los campos del formulario.',
        { confirmText: 'Cargar' }
    );
    if (!ok) return;

    if (template.version === '2.0' && template.data) {
        // Nuevo formato - carga completa del formulario
        setFormState(template.data);
        showNotification(`Plantilla "${template.name}" cargada correctamente`, 'success');
    } else if (template.formState) {
        // Compatibilidad con formato antiguo
        setFormState(template.formState);
        showNotification('Plantilla (formato antiguo) cargada correctamente.', 'success');
    } else if (template.data) {
        // Formato intermedio - solo diagnósticos e indicaciones
        const data = template.data;
        
        if (elements.entryDiagnosisSelect) elements.entryDiagnosisSelect.value = data.entryDiagnosis || '';
        if (elements.customEntryDiagnosis) elements.customEntryDiagnosis.value = data.customEntryDiagnosis || '';
        if (elements.exitDiagnosisSelect) elements.exitDiagnosisSelect.value = data.exitDiagnosis || '';
        if (elements.customExitDiagnosis) elements.customExitDiagnosis.value = data.customExitDiagnosis || '';
        if (elements.admissionReason) elements.admissionReason.value = data.admissionReason || '';
        if (document.getElementById('procedureDescription')) document.getElementById('procedureDescription').value = data.procedureDescription || '';
        if (document.getElementById('additionalIndications')) document.getElementById('additionalIndications').value = data.additionalIndications || '';

        document.querySelectorAll('#indicationsCheckboxes input').forEach(cb => {
            const label = cb.nextElementSibling.textContent.trim();
            cb.checked = data.indications && data.indications.includes(label);
        });

        toggleCustomFields();
        showNotification('Plantilla cargada correctamente', 'success');
    }

    const modal = document.querySelector('.modal');
    if (modal && modal.parentElement) modal.parentElement.remove();
    if (elements.loadTemplate) elements.loadTemplate.value = '';
}

async function deleteTemplate(templateId) {
    const ok = await showConfirmDialog(
        'Eliminar plantilla',
        '¿Está seguro de que desea eliminar esta plantilla?',
        { confirmText: 'Eliminar' }
    );
    if (!ok) return;
    appState.templates = appState.templates.filter(t => t.id !== templateId);
    saveAllData();
    const templatesList = document.getElementById('templatesList');
    if (templatesList) {
        templatesList.innerHTML = renderTemplatesList();
        attachTemplatesEventListeners(templatesList.closest('.modal'));
    }
    updateTemplatesDropdown();
    showNotification('Plantilla eliminada correctamente', 'success');
}

function attachTemplatesEventListeners(container) {
    container.querySelectorAll('.load-template-btn').forEach(btn => {
        btn.addEventListener('click', () => loadTemplate(btn.dataset.id));
    });
    container.querySelectorAll('.delete-template-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteTemplate(btn.dataset.id));
    });
}

function renderStaffList() {
    if (appState.staff.length === 0) {
        return '<p class="text-gray-500 italic">No hay personal registrado</p>';
    }
    return appState.staff.map(person => `
        <div class="bg-gray-100 p-3 rounded flex justify-between items-center">
            <div>
                <strong>${escapeHtml(person.name)}</strong>
                <p class="text-sm text-gray-600">${escapeHtml(person.role)}</p>
            </div>
            <button type="button" class="delete-staff-btn text-red-500 hover:text-red-700" data-id="${person.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function saveStaff() {
    const name = document.getElementById('staffName').value.trim();
    const role = document.getElementById('staffRole').value;
    if (!name || !role) {
        showNotification('Por favor, complete los campos obligatorios (Nombre, Rol)', 'error');
        return;
    }
    const newStaff = { id: Date.now().toString(), name, role, createdAt: new Date().toISOString() };
    appState.staff.push(newStaff);
    saveAllData();
    renderStaffCheckboxes();
    document.getElementById('staffName').value = '';
    document.getElementById('staffRole').value = '';
    const staffList = document.getElementById('staffList');
    if (staffList) {
        staffList.innerHTML = renderStaffList();
        attachStaffEventListeners(staffList.closest('.modal'));
    }
    showNotification('Personal agregado correctamente', 'success');
}

async function deleteStaff(staffId) {
    const ok = await showConfirmDialog(
        'Eliminar personal',
        '¿Está seguro de que desea eliminar este personal?',
        { confirmText: 'Eliminar' }
    );
    if (!ok) return;
    appState.staff = appState.staff.filter(s => s.id !== staffId);
    saveAllData();
    renderStaffCheckboxes();
    const staffList = document.getElementById('staffList');
    if (staffList) {
        staffList.innerHTML = renderStaffList();
        attachStaffEventListeners(staffList.closest('.modal'));
    }
    showNotification('Personal eliminado correctamente', 'success');
}

function attachStaffEventListeners(container) {
    container.querySelectorAll('.delete-staff-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteStaff(btn.dataset.id));
    });
}

function showStaffModal() {
    const modal = createModal('Gestión de Personal Médico', `
        <div class="mb-4">
            <h4 class="font-bold mb-2">Agregar Personal</h4>
            <div class="grid grid-cols-1 gap-2 mb-2">
                <input type="text" id="staffName" placeholder="Nombre completo" class="form-input p-2 border rounded">
            </div>
            <div class="grid grid-cols-1 gap-2 mb-2">
                <select id="staffRole" class="form-select p-2 border rounded">
                    <option value="">Seleccionar rol</option>
                    <option value="medico">Médico</option>
                    <option value="enfermero">Enfermero(a)</option>
                    <option value="tecnico">Técnico</option>
                    <option value="administrativo">Administrativo</option>
                </select>
            </div>
            <button type="button" id="saveStaffBtn" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                <i class="fas fa-user-plus mr-2"></i>Agregar Personal
            </button>
        </div>
        <div class="border-t pt-4">
            <h4 class="font-bold mb-2">Personal Registrado</h4>
            <div id="staffList" class="space-y-2 max-h-60 overflow-y-auto">
                ${renderStaffList()}
            </div>
        </div>
    `);
    modal.querySelector('#saveStaffBtn').addEventListener('click', saveStaff);
    attachStaffEventListeners(modal);
}

// Funciones para el modal de dispositivos
// Funciones para el modal de dispositivos
function updateDeviceModalLists(modal) {
    const typeList = modal.querySelector('#modal-deviceTypesList');
    const brandList = modal.querySelector('#modal-deviceBrandsList');
    const typeSelect = modal.querySelector('#modal-deviceTypeForModel');
    const brandSelect = modal.querySelector('#modal-deviceBrandForModel');

    typeList.innerHTML = appState.commonData.deviceTypes.map(type => `
        <div class="flex justify-between items-center py-1">
            <span>${escapeHtml(type)}</span>
            <button type="button" class="text-red-500 modal-delete-device-type" data-value="${escapeHtml(type)}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    brandList.innerHTML = appState.commonData.deviceBrands.map(brand => `
        <div class="flex justify-between items-center py-1">
            <span>${escapeHtml(brand)}</span>
            <button type="button" class="text-red-500 modal-delete-device-brand" data-value="${escapeHtml(brand)}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    typeSelect.innerHTML = '<option value="">Seleccionar tipo</option>' + appState.commonData.deviceTypes.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
    brandSelect.innerHTML = '<option value="">Seleccionar marca</option>' + appState.commonData.deviceBrands.map(brand => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`).join('');

    // Re-attach delete listeners
    modal.querySelectorAll('.modal-delete-device-type').forEach(btn => {
        btn.addEventListener('click', () => deleteDeviceType(btn.dataset.value));
    });
    modal.querySelectorAll('.modal-delete-device-brand').forEach(btn => {
        btn.addEventListener('click', () => deleteDeviceBrand(btn.dataset.value));
    });
}

function updateDeviceModelsList(modal) {
    const type = modal.querySelector('#modal-deviceTypeForModel').value;
    const brand = modal.querySelector('#modal-deviceBrandForModel').value;
    const modelsList = modal.querySelector('#modal-deviceModelsList');
    if (!type || !brand) {
        modelsList.innerHTML = '<p class="text-gray-500 text-center py-2">Seleccione un tipo y marca para ver los modelos</p>';
        return;
    }
    const models = appState.commonData.deviceModelsByTypeAndBrand[type]?.[brand] || [];
    modelsList.innerHTML = models.length > 0 ?
        models.map(model => `
            <div class="flex justify-between items-center py-1">
                <span>${escapeHtml(model)}</span>
                <button type="button" class="text-red-500 modal-delete-device-model" data-type="${escapeHtml(type)}" data-brand="${escapeHtml(brand)}" data-model="${escapeHtml(model)}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') :
        '<p class="text-gray-500 text-center py-2">No hay modelos registrados para esta combinación</p>';

    modelsList.querySelectorAll('.modal-delete-device-model').forEach(btn => {
        btn.addEventListener('click', () => deleteDeviceModel(btn.dataset.type, btn.dataset.brand, btn.dataset.model));
    });
}

function addNewDeviceType(event) {
    const modal = event.target.closest('.modal');
    if (!modal) return;
    const input = modal.querySelector('#modal-newDeviceType');
    const value = input.value.trim();
    if (value) {
        if (!appState.commonData.deviceTypes.includes(value)) {
            appState.commonData.deviceTypes.push(value);
            appState.commonData.deviceTypes.sort();
            saveAllData();
            updateDeviceModalLists(modal);
            input.value = '';
        } else {
            showNotification('El tipo de dispositivo ya existe.', 'warning');
        }
    }
}

function addNewDeviceBrand(event) {
    const modal = event.target.closest('.modal');
    if (!modal) return;
    const input = modal.querySelector('#modal-newDeviceBrand');
    const value = input.value.trim();
    if (value) {
        if (!appState.commonData.deviceBrands.includes(value)) {
            appState.commonData.deviceBrands.push(value);
            appState.commonData.deviceBrands.sort();
            saveAllData();
            updateDeviceModalLists(modal);
            input.value = '';
        } else {
            showNotification('La marca de dispositivo ya existe.', 'warning');
        }
    }
}

function addNewDeviceModel(event) {
    const modal = event.target.closest('.modal');
    if (!modal) return;
    const type = modal.querySelector('#modal-deviceTypeForModel').value;
    const brand = modal.querySelector('#modal-deviceBrandForModel').value;
    const modelInput = modal.querySelector('#modal-newDeviceModel');
    const model = modelInput.value.trim();

    if (!type || !brand || !model) {
        showNotification('Por favor, seleccione tipo, marca e ingrese un modelo.', 'warning');
        return;
    }

    if (!appState.commonData.deviceModelsByTypeAndBrand) {
        appState.commonData.deviceModelsByTypeAndBrand = {};
    }
    if (!appState.commonData.deviceModelsByTypeAndBrand[type]) {
        appState.commonData.deviceModelsByTypeAndBrand[type] = {};
    }
    if (!appState.commonData.deviceModelsByTypeAndBrand[type][brand]) {
        appState.commonData.deviceModelsByTypeAndBrand[type][brand] = [];
    }
    if (!appState.commonData.deviceModelsByTypeAndBrand[type][brand].includes(model)) {
        appState.commonData.deviceModelsByTypeAndBrand[type][brand].push(model);
        appState.commonData.deviceModelsByTypeAndBrand[type][brand].sort();
        saveAllData();
        updateDeviceModelsList(modal);
        modelInput.value = '';
    } else {
        showNotification('El modelo de dispositivo ya existe para este tipo y marca.', 'warning');
    }
}

async function deleteDeviceType(value) {
    const ok = await showConfirmDialog(
        'Eliminar tipo de dispositivo',
        `¿Está seguro de que desea eliminar el tipo "${value}"?`,
        { confirmText: 'Eliminar' }
    );
    if (!ok) return;
    appState.commonData.deviceTypes = appState.commonData.deviceTypes.filter(item => item !== value);
    if (appState.commonData.deviceModelsByTypeAndBrand) {
        delete appState.commonData.deviceModelsByTypeAndBrand[value];
    }
    saveAllData();
    const modal = document.querySelector('.modal');
    if (modal) {
        updateDeviceModalLists(modal);
        updateDeviceModelsList(modal);
    }
}

async function deleteDeviceBrand(value) {
    const ok = await showConfirmDialog(
        'Eliminar marca de dispositivo',
        `¿Está seguro de que desea eliminar la marca "${value}"?`,
        { confirmText: 'Eliminar' }
    );
    if (!ok) return;
    appState.commonData.deviceBrands = appState.commonData.deviceBrands.filter(item => item !== value);
    if (appState.commonData.deviceModelsByTypeAndBrand) {
        for (const type in appState.commonData.deviceModelsByTypeAndBrand) {
            delete appState.commonData.deviceModelsByTypeAndBrand[type][value];
        }
    }
    saveAllData();
    const modal = document.querySelector('.modal');
    if (modal) {
        updateDeviceModalLists(modal);
        updateDeviceModelsList(modal);
    }
}

async function deleteDeviceModel(type, brand, model) {
    const ok = await showConfirmDialog(
        'Eliminar modelo de dispositivo',
        `¿Está seguro de que desea eliminar el modelo "${model}"?`,
        { confirmText: 'Eliminar' }
    );
    if (!ok) return;
    if (appState.commonData.deviceModelsByTypeAndBrand?.[type]?.[brand]) {
        appState.commonData.deviceModelsByTypeAndBrand[type][brand] = appState.commonData.deviceModelsByTypeAndBrand[type][brand].filter(item => item !== model);
        saveAllData();
        const modal = document.querySelector('.modal');
        if (modal) updateDeviceModelsList(modal);
    }
}

function showDevicesModal() {
    const modal = createModal('Gestión de Dispositivos', `
        <div class="mb-4">
            <h4 class="font-bold mb-2">Tipos de Dispositivos</h4>
            <div class="flex gap-2 mb-2">
                <input type="text" id="modal-newDeviceType" placeholder="Nuevo tipo de dispositivo" class="form-input flex-grow p-2 border rounded">
                <button type="button" id="modal-addDeviceType" class="btn bg-blue-500 text-white">Agregar</button>
            </div>
            <div id="modal-deviceTypesList" class="max-h-40 overflow-y-auto border rounded p-2"></div>
        </div>
        <div class="mb-4">
            <h4 class="font-bold mb-2">Marcas de Dispositivos</h4>
            <div class="flex gap-2 mb-2">
                <input type="text" id="modal-newDeviceBrand" placeholder="Nueva marca de dispositivo" class="form-input flex-grow p-2 border rounded">
                <button type="button" id="modal-addDeviceBrand" class="btn bg-blue-500 text-white">Agregar</button>
            </div>
            <div id="modal-deviceBrandsList" class="max-h-40 overflow-y-auto border rounded p-2"></div>
        </div>
        <div>
            <h4 class="font-bold mb-2">Modelos por Tipo y Marca</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Tipo de dispositivo</label>
                    <select id="modal-deviceTypeForModel" class="form-input w-full p-2 border rounded">
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Marca de dispositivo</label>
                    <select id="modal-deviceBrandForModel" class="form-input w-full p-2 border rounded">
                    </select>
                </div>
            </div>
            <div class="flex gap-2 mb-2">
                <input type="text" id="modal-newDeviceModel" placeholder="Nuevo modelo" class="form-input flex-grow p-2 border rounded">
                <button type="button" id="modal-addDeviceModel" class="btn bg-blue-500 text-white">Agregar Modelo</button>
            </div>
            <div id="modal-deviceModelsList" class="max-h-40 overflow-y-auto border rounded p-2">
            </div>
        </div>
    `);

    updateDeviceModalLists(modal);
    updateDeviceModelsList(modal);

    modal.querySelector('#modal-addDeviceType').addEventListener('click', addNewDeviceType);
    modal.querySelector('#modal-addDeviceBrand').addEventListener('click', addNewDeviceBrand);
    modal.querySelector('#modal-addDeviceModel').addEventListener('click', addNewDeviceModel);
    modal.querySelector('#modal-deviceTypeForModel').addEventListener('change', () => updateDeviceModelsList(modal));
    modal.querySelector('#modal-deviceBrandForModel').addEventListener('change', () => updateDeviceModelsList(modal));
}

// ===================================================================
// 11. INICIALIZACIÓN DE LA APLICACIÓN
// ===================================================================

async function initializeApp() {
    console.log('Inicializando aplicación...');

    // 1. Cargar datos predefinidos
    const data = await loadPredefinedData();
    appState.commonData = data.commonData;
    appState.measurements = [...data.defaultMeasurements];

    // 2. Inicializar elementos del DOM
    initializeElements();

    // 3. Actualizar dropdowns con datos comunes
    updateCommonDataDropdowns();

    // 4. Cargar datos guardados
    loadAllData();

    // 5. Configurar tiempos por defecto
    setDefaultTimes();

    // 6. Configurar pestañas
    setupTabs();

    // 7. Configurar prestaciones adicionales
    setupAdditionalProcedures();

    // 8. Configurar auto-guardado
    startAutoSave();

    // 9. Configurar event listeners principales
    attachMainEventListeners();

    // 10. Recordatorio de respaldo semanal (con retraso para no solaparse con otras notificaciones)
    setTimeout(checkBackupReminder, 2500);

    console.log('Aplicación inicializada correctamente');
}

function attachMainEventListeners() {
    // Event listeners principales del formulario
    if (elements.procedureNameSelect) {
        elements.procedureNameSelect.addEventListener('change', function() {
            updateProcedureCode(this, elements.procedureCodeInput);
            toggleCustomFields();
            appState.formChanged = true;
        });
    }

    if (elements.entryDiagnosisSelect) {
        elements.entryDiagnosisSelect.addEventListener('change', function() {
            toggleCustomFields();
            appState.formChanged = true;
        });
    }

    if (elements.exitDiagnosisSelect) {
        elements.exitDiagnosisSelect.addEventListener('change', function() {
            toggleCustomFields();
            appState.formChanged = true;
        });
    }

        // Botones principales
    if (elements.previewReportBtn) {
        elements.previewReportBtn.addEventListener('click', () => previewReport());
    }

    if (elements.clearFormBtn) {
        elements.clearFormBtn.addEventListener('click', () => clearForm());
    }

    // Botones de navegación principales
    if (elements.newReportBtn) {
        elements.newReportBtn.addEventListener('click', () => newReport());
    }

    if (elements.proceduresBtn) {
        elements.proceduresBtn.addEventListener('click', () => showProceduresSection());
    }

    if (elements.backToMainBtn) {
        elements.backToMainBtn.addEventListener('click', () => showMainForm());
    }

    if (document.getElementById('backFromCommonDataBtn')) {
        document.getElementById('backFromCommonDataBtn').addEventListener('click', () => showMainForm());
    }

    // Botón de datos comunes
    const commonDataBtn = document.getElementById('commonDataBtn');
    if (commonDataBtn) {
        commonDataBtn.addEventListener('click', () => showCommonDataSection());
    }    // Gestión de procedimientos
    if (elements.saveProcedureBtn) {
        elements.saveProcedureBtn.addEventListener('click', () => saveProcedure());
    }

    if (elements.cancelEditProcedureBtn) {
        elements.cancelEditProcedureBtn.addEventListener('click', () => cancelEditProcedure());
    }

    // Imprimir
    if (elements.printBtn) {
        elements.printBtn.addEventListener('click', () => window.print());
    }

    // Copiar reporte
    if (elements.copyFormattedReportBtn) {
        elements.copyFormattedReportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            copyFormattedReport();
        });
    } else {
        console.warn('copyFormattedReportBtn: elemento NO encontrado en el DOM');
    }

    if (elements.addMeasurementsCheckbox) {
        elements.addMeasurementsCheckbox.addEventListener('change', toggleMeasurements);
    }

    const useDescBtn = document.getElementById('useDescSuggestionBtn');
    if (useDescBtn) {
        useDescBtn.addEventListener('click', useFormDescriptionSuggestion);
    }

    if (elements.addCustomMeasurementBtn) {
        elements.addCustomMeasurementBtn.addEventListener('click', () => addCustomMeasurement());
    }

    // Dropdown functionality
    if (elements.dropdownBtn) {
        elements.dropdownBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdownContent = elements.dropdown?.querySelector('.dropdown-content');
            if (dropdownContent) {
                dropdownContent.classList.toggle('hidden');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        const dropdownContent = elements.dropdown?.querySelector('.dropdown-content');
        if (dropdownContent && !dropdownContent.classList.contains('hidden')) {
            dropdownContent.classList.add('hidden');
        }
    });

    // Delegated handlers for dropdown menu items (robust)
    const dropdownContent = elements.dropdown?.querySelector('.dropdown-content');
    if (dropdownContent) {
        dropdownContent.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            switch (btn.id) {
                case 'templatesBtn':
                    if (typeof showTemplatesModal === 'function') showTemplatesModal();
                    break;
                case 'staffBtn':
                    if (typeof showStaffModal === 'function') showStaffModal();
                    break;
                case 'commonDataBtn':
                    showCommonDataSection();
                    updateCommonDataLists();
                    break;
                case 'devicesBtn':
                    if (typeof showDevicesModal === 'function') showDevicesModal();
                    break;
                case 'exportBtn':
                    exportData();
                    break;
                case 'backupBtn':
                    backupToFile();
                    break;
                case 'importTriggerBtn':
                    const input = document.getElementById('importFile');
                    if (input) input.click();
                    break;
                default:
                    break;
            }
            // hide dropdown after action
            const dc = elements.dropdown?.querySelector('.dropdown-content');
            if (dc) dc.classList.add('hidden');
        });
    }

    // Ítems del menú Opciones
    const importTriggerBtn = document.getElementById('importTriggerBtn');
    const importFile = document.getElementById('importFile');
    if (importTriggerBtn && importFile) {
        importFile.addEventListener('change', (e) => importData(e));
    }

    // Event listeners para indicaciones en datos comunes (ya manejados por attachCommonDataSectionEventListeners)

    // Event listeners para la sección de datos comunes
    attachCommonDataSectionEventListeners();

    // Form change tracking
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('change', () => {
            appState.formChanged = true;
        });
    });
}

// ===================================================================
// 12. VALIDACIÓN Y GENERACIÓN DE REPORTES
// ===================================================================

// Funciones implementadas completamente
function validateForm() {
    const errors = [];
    
    if (!elements.procedureNameSelect?.value && !elements.customProcedureInput?.value) {
        errors.push('Nombre del procedimiento es obligatorio');
    }
    
    if (!elements.procedureCodeInput?.value) {
        errors.push('Código del procedimiento es obligatorio');
    }
    
    if (!elements.procedureDate?.value) {
        errors.push('La fecha del procedimiento es obligatoria');
    }
    
    if (!elements.startTime?.value) {
        errors.push('Hora de inicio es obligatoria');
    }
    
    if (!elements.endTime?.value) {
        errors.push('Hora de término es obligatoria');
    }
    
    if (!elements.commune?.value) {
        errors.push('Comuna de procedencia es obligatoria');
    }
    
    if (!elements.healthInsurance?.value) {
        errors.push('Previsión de salud es obligatoria');
    }
    
    if (!elements.origin?.value) {
        errors.push('Procedencia es obligatoria');
    }
    
    return errors;
}

function previewReport() {
    generateReport();
}

function generateReport() {
    const errors = validateForm();
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }
    
    // Advertencia no bloqueante: los procedimientos pueden cruzar la medianoche
    if (elements.startTime?.value && elements.endTime?.value && elements.endTime.value < elements.startTime.value) {
        showNotification('Advertencia: la hora de término es anterior a la de inicio. Verifique si el procedimiento cruzó la medianoche.', 'warning');
    }
    
    try {
        const reportData = collectReportData();
        const reportHtml = generateReportHtml(reportData);
        
        if (elements.reportContent && elements.generatedReport) {
            elements.reportContent.innerHTML = reportHtml;
            elements.generatedReport.classList.remove('hidden');
            elements.generatedReport.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error al generar el reporte', 'error');
    }
}

// Genera el informe sin la validación estricta del formulario principal.
// Se usa al terminar el asistente, que ya validó sus pasos obligatorios
// durante la navegación, evitando el alert de campos faltantes.
function renderReportSilently() {
    try {
        const reportData = collectReportData();
        const reportHtml = generateReportHtml(reportData);
        if (elements.reportContent && elements.generatedReport) {
            elements.reportContent.innerHTML = reportHtml;
            elements.generatedReport.classList.remove('hidden');
            elements.generatedReport.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('No se pudo generar el informe. Revise los datos en el formulario principal.', 'error');
    }
}

function collectReportData() {
    const procedureName = elements.procedureNameSelect?.value === 'other' ?
        elements.customProcedureInput?.value :
        elements.procedureNameSelect?.options[elements.procedureNameSelect.selectedIndex]?.text;

    const entryDiagnosis = elements.entryDiagnosisSelect?.value === 'custom' ?
        elements.customEntryDiagnosis?.value : elements.entryDiagnosisSelect?.value;

    const exitDiagnosis = elements.exitDiagnosisSelect?.value === 'custom' ?
        elements.customExitDiagnosis?.value : elements.exitDiagnosisSelect?.value;

    return {
        // Procedimiento
        procedureName: procedureName || '',
        procedureCode: elements.procedureCodeInput?.value || '',
        procedureDate: elements.procedureDate?.value || '',
        startTime: elements.startTime?.value || '',
        endTime: elements.endTime?.value || '',
        // Datos clínicos
        commune: elements.commune?.value || '',
        healthInsurance: elements.healthInsurance?.value || '',
        origin: elements.origin?.value || '',
        entryDiagnosis: entryDiagnosis || '',
        exitDiagnosis: exitDiagnosis || '',
        admissionReason: elements.admissionReason?.value || '',
        procedureDescription: document.getElementById('procedureDescription')?.value || '',
        additionalIndications: document.getElementById('additionalIndications')?.value || '',
        // Personal
        mainDoctor: getSelectedStaff('mainDoctor'),
        assistantNurse: getSelectedStaff('assistantNurse'),
        tens: getSelectedStaff('tens'),
        // Indicaciones y mediciones
        indications: getSelectedIndications(),
        measurements: elements.addMeasurementsCheckbox?.checked ? appState.measurements : [],
        customParameters: appState.customParameters,
        additionalProcedures: getAdditionalProcedures()
    };
}


function generateReportHtml(data) {
    // Fecha del procedimiento ingresada por el usuario (respaldo: fecha de hoy)
    const currentDate = formatDateEsCL(data.procedureDate) ||
        new Date().toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

    const sectionTitle = (title) => `<div class="report-box-title">${title}</div>`;

    // Título principal
    let html = `
    <div class="report-main-title" style="text-align:center;">${escapeHtml(data.procedureName).toUpperCase()}</div>
    `;

    // Datos del Procedimiento: recuadro reutilizable (ancho completo o media página)
    const procedureBox = `
        <div class="report-box" data-kind="procedure" style="width:100%;">
            ${sectionTitle('Datos del Procedimiento')}
            <table class="report-table report-data-table" style="font-size:14px;line-height:1.6;">
                <tbody>
                    <tr class="report-data-header-row">
                        <th style="font-size:14px;">Nombre</th>
                        <th style="font-size:14px;">Código</th>
                        <th style="font-size:14px;">Fecha</th>
                        <th style="font-size:14px;">Hora de Inicio</th>
                        <th style="font-size:14px;">Hora de Término</th>
                    </tr>
                    <tr>
                        <td style="font-size:14px;">${escapeHtml(data.procedureName)}</td>
                        <td style="font-size:14px;">${escapeHtml(data.procedureCode)}</td>
                        <td style="font-size:14px;">${currentDate}</td>
                        <td style="font-size:14px;">${data.startTime || '—'}</td>
                        <td style="font-size:14px;">${data.endTime || '—'}</td>
                    </tr>
                    <tr class="report-data-header-row">
                        <th style="font-size:14px;">Comuna</th>
                        <th style="font-size:14px;">Previsión</th>
                        <th colspan="3" style="font-size:14px;">Procedencia</th>
                    </tr>
                    <tr>
                        <td style="font-size:14px;">${escapeHtml(data.commune) || '—'}</td>
                        <td style="font-size:14px;">${escapeHtml(data.healthInsurance) || '—'}</td>
                        <td colspan="3" style="font-size:14px;">${escapeHtml(data.origin) || '—'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Diagnósticos y Personal Médico: dos recuadros lado a lado (media página cada uno)
    html += `
    <table class="layout-table">
        <tbody>
            <tr>
                <td style="width:50%;vertical-align:top;padding-right:6px;">
                    <div class="report-box" data-kind="diagnostics" style="width:100%;">
                        ${sectionTitle('Diagnósticos')}
                        <table class="report-table report-data-table">
                            <tbody>
                                <tr class="report-data-header-row">
                                    <th>Diagnóstico de Ingreso</th>
                                    <th>Diagnóstico de Egreso</th>
                                </tr>
                                <tr>
                                    <td>${escapeHtml(data.entryDiagnosis) || 'No especificado'}</td>
                                    <td>${escapeHtml(data.exitDiagnosis) || 'No especificado'}</td>
                                </tr>
                            </tbody>
                        </table>
                        ${data.admissionReason ? `
                        <div class="report-subsection">
                            <div class="report-subsection-title">Motivo de Ingreso</div>
                            <p class="report-item" style="white-space:pre-line;">${escapeHtml(data.admissionReason)}</p>
                        </div>` : ''}
                    </div>
                </td>
                <td style="width:50%;vertical-align:top;padding-left:6px;">
                    <div class="report-box" data-kind="staff" style="width:100%;">
                        ${sectionTitle('Personal Médico')}
                        <table class="report-table report-data-table">
                            <tbody>
                                <tr class="report-data-header-row">
                                    <th style="width:35%;">Rol</th>
                                    <th>Participantes</th>
                                </tr>
                                <tr>
                                    <td class="report-label-cell">Médico(s) Principal(es)</td>
                                    <td>${data.mainDoctor.length > 0 ? escapeHtml(data.mainDoctor.join(', ')) : 'No especificado'}</td>
                                </tr>
                                <tr>
                                    <td class="report-label-cell">Enfermero(a/os)</td>
                                    <td>${data.assistantNurse.length > 0 ? escapeHtml(data.assistantNurse.join(', ')) : 'No especificado'}</td>
                                </tr>
                                <tr>
                                    <td class="report-label-cell">TENS</td>
                                    <td>${data.tens.length > 0 ? escapeHtml(data.tens.join(', ')) : 'No especificado'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>`;

    // Datos del Procedimiento y Descripción: lado a lado (media página cada uno)
    // si hay descripción; si no, Datos del Procedimiento ocupa el ancho completo.
    if (data.procedureDescription) {
        html += `
        <table class="layout-table">
            <tbody>
                <tr>
                    <td style="width:50%;vertical-align:top;padding-right:6px;">
                        ${procedureBox}
                    </td>
                    <td style="width:50%;vertical-align:top;padding-left:6px;">
                        <div class="report-box" data-kind="description" style="width:100%;">
                            ${sectionTitle('Descripción del Procedimiento')}
                            <p class="report-item" style="white-space:pre-line;">${escapeHtml(data.procedureDescription)}</p>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>`;
    } else {
        html += procedureBox;
    }

    // Prestaciones Adicionales y Mediciones: lado a lado (media página cada una)

    // --- Construir filas de mediciones (si las hay) ---
    let measurementsRows = '';
    if (data.measurements && data.measurements.length > 0) {
        data.measurements.forEach(measurement => {
            const valuedParameters = measurement.parameters.filter(param => param.value);
            if (valuedParameters.length > 0) {
                measurementsRows += `
                    <tr class="report-measurement-title-row">
                        <td colspan="2" class="report-measurement-title">${escapeHtml(measurement.name)}</td>
                    </tr>
                    ${valuedParameters.map(param => `
                        <tr>
                            <td>${escapeHtml(param.name)}</td>
                            <td>${escapeHtml(param.value)}</td>
                        </tr>
                    `).join('')}`;
            }
        });

        const valuedCustomParams = (data.customParameters || []).filter(param => param.value);
        if (valuedCustomParams.length > 0) {
            measurementsRows += `
                <tr class="report-measurement-title-row">
                    <td colspan="2" class="report-measurement-title">Parámetros Personalizados</td>
                </tr>
                ${valuedCustomParams.map(param => `
                    <tr>
                        <td>${escapeHtml(param.name)}</td>
                        <td>${escapeHtml(param.value)}</td>
                    </tr>
                `).join('')}`;
        }
    }

    // --- Caja de prestaciones adicionales (condicional) ---
    let additionalCell = '';
    if (data.additionalProcedures && data.additionalProcedures.length > 0) {
        additionalCell = `
        <div class="report-box" data-kind="additional" style="width:100%;">
            ${sectionTitle('Prestaciones Adicionales')}
            <table class="report-table report-data-table">
                <tbody>
                    <tr class="report-data-header-row">
                        <th>Procedimiento</th>
                        <th style="width:30%;">Código</th>
                    </tr>
                    ${data.additionalProcedures.map(proc => `
                        <tr>
                            <td>${escapeHtml(proc.name)}</td>
                            <td>${escapeHtml(proc.code)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    }

    // --- Caja de mediciones (condicional) ---
    let measurementsCell = '';
    if (measurementsRows) {
        measurementsCell = `
        <div class="report-box" data-kind="measurements" style="width:100%;">
            ${sectionTitle('Mediciones')}
            <table class="report-table report-measurements-table">
                <tbody>
                    <tr class="report-data-header-row">
                        <th style="width:50%;">Parámetro</th>
                        <th>Valor</th>
                    </tr>
                    ${measurementsRows}
                </tbody>
            </table>
        </div>`;
    }

    // --- Fila lado a lado (media página cada una); si solo hay una, celda vacía de relleno ---
    if (additionalCell || measurementsCell) {
        const both = additionalCell && measurementsCell;
        html += `
        <table class="layout-table">
            <tbody>
                <tr>
                    ${additionalCell ? `<td style="width:50%;vertical-align:top;${both ? 'padding-right:6px;' : ''}">${additionalCell}</td>` : ''}
                    ${measurementsCell ? `<td style="width:50%;vertical-align:top;${both ? 'padding-left:6px;' : ''}">${measurementsCell}</td>` : ''}
                    ${both ? '' : '<td style="width:50%;padding:0;margin:0;"></td>'}
                </tr>
            </tbody>
        </table>`;
    }

// Descripción del procedimiento (movida arriba, lado a lado con Datos del Procedimiento)

// Indicaciones post-procedimiento (media página, alineadas a la izquierda)
    if (data.indications.length > 0 || data.additionalIndications) {
        html += `
        <table class="layout-table">
            <tbody>
                <tr>
                    <td style="width:50%;vertical-align:top;">
                        <div class="report-box" data-kind="indications" style="width:100%;">
                            ${sectionTitle('Indicaciones Post-Procedimiento')}
                            ${data.indications.length > 0 ? `
                                <ul class="report-indications-list">
                                    ${data.indications.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                                </ul>` : ''}
                            ${data.additionalIndications ? `
                                <p class="report-item" style="white-space:pre-line;margin-top:0.5rem;">
                                    ${escapeHtml(data.additionalIndications)}
                                </p>` : ''}
                        </div>
                    </td>
                    <td style="width:50%;padding:0;margin:0;"></td>
                </tr>
            </tbody>
        </table>`;
    }

    return html;
}





// ===================================================================
// 12.1 ASISTENCIA IA LOCAL (CONSTRUCCIÓN DE CONTEXTO)
// ===================================================================

function buildAIContext(section) {
    // Recolectar datos actuales del formulario ya mapeados en collectReportData
    const data = collectReportData();

    // Armar estructura base común
    const base = {
        fecha: new Date().toISOString(),
        procedimiento: {
            nombre: data.procedureName,
            codigo: data.procedureCode,
            fecha: data.procedureDate,
            horaInicio: data.startTime,
            horaTermino: data.endTime,
            adicionales: data.additionalProcedures
        },
        paciente: {
            comuna: data.commune,
            prevision: data.healthInsurance,
            procedencia: data.origin
        },
        diagnosticos: {
            ingreso: data.entryDiagnosis,
            egreso: data.exitDiagnosis
        },
        personal: {
            medicos: data.mainDoctor,
            enfermeria: data.assistantNurse,
            tens: data.tens
        },
        mediciones: data.measurements,
        indicacionesSeleccionadas: data.indications
    };

    // Especializar por sección solicitada
    if (section === 'admission') {
        return {
            objetivo: 'Redactar motivo de ingreso clínicamente claro y conciso (2-4 frases).',
            tono: 'formal, médico',
            idioma: 'es-CL',
            contexto: base,
            campoObjetivo: 'admissionReason',
            placeholders: {
                sintomasClave: '[dolor, palpitaciones, síncope, etc.]',
                antecedentesRelevantes: '[HTA, FA, IAM previo, etc.]'
            }
        };
    }

    if (section === 'procedure') {
        return {
            objetivo: 'Redactar descripción detallada, cronológica y precisa del procedimiento (120-200 palabras).',
            incluir: [
                'acceso vascular', 'tipo de catéter/electrodos', 'parámetros programados',
                'hallazgos relevantes', 'complicaciones', 'resultado inmediato'
            ],
            tono: 'formal, médico',
            idioma: 'es-CL',
            contexto: base,
            campoObjetivo: 'procedureDescription'
        };
    }

    if (section === 'indications') {
        return {
            objetivo: 'Sugerir indicaciones post-procedimiento específicas para el caso del paciente.',
            formato: 'viñetas cortas',
            tono: 'claro, práctico',
            idioma: 'es-CL',
            contexto: base,
            campoObjetivo: 'additionalIndications'
        };
    }

    return { contexto: base };
}

function showAIModal(title, payload) {
    const content = `
        <div class="mb-3">
            <p class="text-sm text-gray-600 mb-2">Copia este contexto y pégalo en tu asistente IA local. Puedes editarlo antes si lo necesitas.</p>
            <textarea id="aiPayload" class="form-textarea" rows="12">${escapeHtml(JSON.stringify(payload, null, 2))}</textarea>
        </div>
        <div class="flex justify-end gap-2">
            <button type="button" id="copyAIPayloadBtn" class="btn bg-purple-600 text-white hover:bg-purple-700">Copiar</button>
        </div>
    `;
    const modal = createModal(title, content);
    modal.querySelector('#copyAIPayloadBtn')?.addEventListener('click', () => {
        const ta = modal.querySelector('#aiPayload');
        if (!ta) return;
        navigator.clipboard.writeText(ta.value).then(() => showNotification('Contexto copiado', 'success')).catch(() => {
            ta.select();
            document.execCommand('copy');
            showNotification('Contexto copiado', 'success');
        });
    });
}

// Generadores locales simples (heurísticos) para asistencia inmediata sin salir de la app
function generateAdmissionReasonSuggestion(data) {
    const current = document.getElementById('admissionReason')?.value?.trim() || '';
    const frases = [];

    // 1) Pulir lo ya escrito por el usuario (capitalización y punto final)
    if (current) {
        const cleaned = current
            .replace(/\s+/g, ' ')
            .replace(/\s*([,;:.])\s*/g, '$1 ')
            .replace(/\s*\.$/, '');
        const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        frases.push(capitalized + '.');
    }

    // 2) Completar con contexto mínimo si falta
    if (data.entryDiagnosis) {
        const diagFrase = `Ingreso por ${data.entryDiagnosis.toLowerCase()}.`;
        if (!frases.join(' ').toLowerCase().includes(data.entryDiagnosis.toLowerCase())) {
            frases.unshift(diagFrase);
        }
    }

    // 3) Síntomas probables según diagnóstico
    const sintomas = [];
    if (data.entryDiagnosis && /fibrilación auricular|taquiarritmia/i.test(data.entryDiagnosis)) sintomas.push('palpitaciones');
    if (data.entryDiagnosis && /bradi|bloqueo/i.test(data.entryDiagnosis)) sintomas.push('mareos o síncope');
    if (sintomas.length && !frases.join(' ').toLowerCase().includes('palpit') && !frases.join(' ').toLowerCase().includes('síncope')) {
        frases.push(`Refiere ${sintomas.join(' y ')}.`);
    }

    if (data.origin) {
        const origen = `Derivado desde ${data.origin.toLowerCase()}.`;
        if (!frases.join(' ').toLowerCase().includes(data.origin.toLowerCase())) {
            frases.push(origen);
        }
    }

    return frases.join(' ').replace(/\s+/g, ' ').trim();
}

function generateProcedureDescriptionSuggestion(data) {
    const lineas = [];
    lineas.push(`Bajo condiciones de asepsia y antisepsia, se realiza ${data.procedureName || 'procedimiento'} (${data.procedureCode || 's/código'}).`);
    lineas.push(`Acceso vascular obtenido, se posicionan catéteres/electrodos según protocolo.`);
    if (Array.isArray(data.measurements) && data.measurements.length > 0) {
        const medidasConValores = data.measurements.filter(m => m.parameters?.some(p => p.value));
        if (medidasConValores.length) {
            const resumen = medidasConValores.map(m => `${m.name.toLowerCase()}`).slice(0, 3).join(', ');
            lineas.push(`Se documentan mediciones en ${resumen}.`);
        }
    }
    if (data.additionalProcedures?.length) {
        const extras = data.additionalProcedures.map(p => p.name).filter(Boolean).join(', ');
        if (extras) lineas.push(`Procedimientos adicionales: ${extras}.`);
    }
    lineas.push(`Procedimiento bien tolerado, sin complicaciones inmediatas. Se deja plan de control y vigilancia.`);
    return lineas.join('\n');
}

function generateIndicationsSuggestion(data) {
    const items = [];
    if (data.indications?.length) items.push(...data.indications);

    // Add default indications only if not already selected
    if (!items.includes('Vigilancia de sitio de punción por 24 h')) {
        items.push('Vigilancia de sitio de punción por 24 h');
    }

    if (/anticoag/i.test((data.entryDiagnosis||'') + ' ' + (data.exitDiagnosis||'')) && !items.includes('Revisar esquema de anticoagulación')) {
        items.push('Revisar esquema de anticoagulación');
    }

    return items.join('\n');
}

function applyAISuggestion(fieldId, text, options) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    const replace = !options || options.replace !== false; // por defecto reemplaza
    if (replace) {
        el.value = text;
    } else {
        const current = (el.value || '').trim();
        el.value = current ? (current + (current.endsWith('\n') ? '' : '\n') + text) : text;
    }
    el.dispatchEvent(new Event('change'));
}

// ===================================================================
// 12.1 RESERVADO PARA FUNCIONALIDADES FUTURAS
// ===================================================================

function clearForm() {
    try {
        const formElements = document.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            if (element.type === 'checkbox') {
                element.checked = false;
                element.dispatchEvent(new Event('change'));
            } else {
                element.value = '';
            }
        });

        // Resetear estilos visuales de checkboxes de personal médico
        resetStaffCheckboxesStyles();

        appState.additionalProceduresCount = 0;
        if (elements.procedure2Section) elements.procedure2Section.classList.add('hidden');
        if (elements.procedure3Section) elements.procedure3Section.classList.add('hidden');
        if (elements.addProcedureBtn) elements.addProcedureBtn.classList.remove('hidden');

        appState.measurements = [...defaultMeasurements];
        if (elements.measurementsContainer) elements.measurementsContainer.classList.add('hidden');
        if (elements.addMeasurementsCheckbox) elements.addMeasurementsCheckbox.checked = false;

        if (elements.generatedReport) elements.generatedReport.classList.add('hidden');

        toggleCustomFields();
        setDefaultTimes();
        appState.formChanged = false;

        showNotification('Formulario limpiado correctamente', 'success');
    } catch (error) {
        console.error('Error clearing form:', error);
        showNotification('Error al limpiar el formulario', 'error');
    }
}

function addCustomMeasurement() {
    const newMeasurement = {
        id: 100 + appState.customMeasurementCount++,
        name: "Nueva medición",
        parameters: [
            { name: "Parámetro 1", value: "" }
        ]
    };

    appState.measurements.push(newMeasurement);
    renderMeasurements();
    appState.formChanged = true;
}

function addParameterToMeasurement(measurementId) {
    const measurement = appState.measurements.find(m => m.id === measurementId);
    if (measurement) {
        measurement.parameters.push({ name: "Nuevo parámetro", value: "" });
        renderMeasurements();
        appState.formChanged = true;
    }
}

function removeParameterFromMeasurement(measurementId, paramIndex) {
    const measurement = appState.measurements.find(m => m.id === measurementId);
    if (measurement && measurement.parameters[paramIndex]) {
        measurement.parameters.splice(paramIndex, 1);
        renderMeasurements();
        appState.formChanged = true;
    }
}

function addCustomParameter() {
    appState.customParameters.push({ name: "Nuevo parámetro personalizado", value: "" });
    renderMeasurements();
    appState.formChanged = true;
}

function attachMeasurementEventListeners() {
    if (!elements.measurementsList) return;

    // Delegación para la opción "➕ Agregar nuevo..." en los selects de mediciones
    if (!elements.measurementsList.dataset.addNewDelegated) {
        elements.measurementsList.dataset.addNewDelegated = '1';
        elements.measurementsList.addEventListener('change', function(e) {
            const select = e.target;
            if (select.tagName !== 'SELECT' || select.value !== '__add_new__') return;
            select.value = '';
            handleMeasurementAddNew(select);
        });
    }

    elements.measurementsList.querySelectorAll('.param-value').forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === '__add_new__') return;
            const measurementId = parseInt(this.dataset.measurementId);
            const paramIndex = parseInt(this.dataset.paramIndex);

            const measurement = appState.measurements.find(m => m.id === measurementId);
            if (measurement && measurement.parameters[paramIndex]) {
                measurement.parameters[paramIndex].value = this.value;
                appState.formChanged = true;

                if (this.classList.contains('device-type-select') || this.classList.contains('device-brand-select')) {
                    updateDeviceSelects(measurementId);
                }
            }
        });
    });

    elements.measurementsList.querySelectorAll('.remove-measurement').forEach(btn => {
        btn.addEventListener('click', async function() {
            const measurementId = parseInt(this.dataset.id);
            const ok = await showConfirmDialog(
                'Eliminar medición',
                '¿Está seguro de que desea eliminar esta medición?',
                { confirmText: 'Eliminar' }
            );
            if (!ok) return;
            appState.measurements = appState.measurements.filter(m => m.id !== measurementId);
            renderMeasurements();
            appState.formChanged = true;
        });
    });

    elements.measurementsList.querySelectorAll('.add-parameter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const measurementId = parseInt(this.dataset.measurementId);
            addParameterToMeasurement(measurementId);
        });
    });

    elements.measurementsList.querySelectorAll('.remove-parameter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const measurementId = parseInt(this.dataset.measurementId);
            const paramIndex = parseInt(this.dataset.paramIndex);
            removeParameterFromMeasurement(measurementId, paramIndex);
        });
    });

    elements.measurementsList.querySelectorAll('.parameter-name-input').forEach(input => {
        input.addEventListener('change', function() {
            const measurementId = parseInt(this.dataset.measurementId);
            const paramIndex = parseInt(this.dataset.paramIndex);
            const measurement = appState.measurements.find(m => m.id === measurementId);
            if (measurement && measurement.parameters[paramIndex]) {
                measurement.parameters[paramIndex].name = this.value;
                appState.formChanged = true;
            }
        });
    });

    elements.measurementsList.querySelectorAll('.measurement-name-input').forEach(input => {
        input.addEventListener('change', function() {
            const measurementId = parseInt(this.dataset.id);
            const measurement = appState.measurements.find(m => m.id === measurementId);
            if (measurement) {
                measurement.name = this.value;
                appState.formChanged = true;
            }
        });
    });

    elements.measurementsList.querySelectorAll('.add-custom-parameter-btn').forEach(btn => {
        btn.addEventListener('click', addCustomParameter);
    });

    elements.measurementsList.querySelectorAll('.parameter-name-input[data-custom-param-index]').forEach(input => {
        input.addEventListener('change', function() {
            const index = parseInt(this.dataset.customParamIndex);
            if (appState.customParameters[index]) {
                appState.customParameters[index].name = this.value;
                appState.formChanged = true;
            }
        });
    });

    elements.measurementsList.querySelectorAll('.param-value[data-custom-param-index]').forEach(input => {
        input.addEventListener('change', function() {
            const index = parseInt(this.dataset.customParamIndex);
            if (appState.customParameters[index]) {
                appState.customParameters[index].value = this.value;
                appState.formChanged = true;
            }
        });
    });

    elements.measurementsList.querySelectorAll('.remove-custom-parameter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.closest('.parameter-row').querySelector('.parameter-name-input').dataset.customParamIndex);
            appState.customParameters.splice(index, 1);
            renderMeasurements();
            appState.formChanged = true;
        });
    });
}

function renderStaffCheckboxes() {
    if (elements.mainDoctorCheckboxes) elements.mainDoctorCheckboxes.innerHTML = '';
    if (elements.assistantNurseCheckboxes) elements.assistantNurseCheckboxes.innerHTML = '';
    if (elements.tensCheckboxes) elements.tensCheckboxes.innerHTML = '';
    
    const medicos = appState.staff.filter(person => person.role === 'medico');
    const enfermeros = appState.staff.filter(person => person.role === 'enfermero');
    const tecnicos = appState.staff.filter(person => person.role === 'tecnico');
    
    medicos.forEach(person => {
        const checkbox = createStaffCheckbox(person, 'mainDoctor');
        if (elements.mainDoctorCheckboxes) elements.mainDoctorCheckboxes.appendChild(checkbox);
    });
    
    enfermeros.forEach(person => {
        const checkbox = createStaffCheckbox(person, 'assistantNurse');
        if (elements.assistantNurseCheckboxes) elements.assistantNurseCheckboxes.appendChild(checkbox);
    });
    
    tecnicos.forEach(person => {
        const checkbox = createStaffCheckbox(person, 'tens');
        if (elements.tensCheckboxes) elements.tensCheckboxes.appendChild(checkbox);
    });
}

function createStaffCheckbox(person, role) {
    const container = document.createElement('div');
    container.className = 'staff-selection-container mb-2';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${role}-${person.id}`;
    checkbox.name = role;
    checkbox.value = person.name;
    checkbox.className = 'hidden staff-checkbox';

    const selectionBox = document.createElement('div');
    selectionBox.className = 'staff-selection-box p-3 rounded cursor-pointer transition-all duration-200 bg-white hover:bg-gray-50 border border-gray-200';
    selectionBox.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-sm font-medium">${escapeHtml(person.name)}</span>
            <i class="fas fa-check text-green-500 hidden check-icon"></i>
        </div>
    `;

    const updateStyle = () => {
        if (checkbox.checked) {
            selectionBox.classList.add('bg-green-50', 'border-green-500');
            selectionBox.classList.remove('bg-white', 'hover:bg-gray-50', 'border-gray-200');
            selectionBox.querySelector('.check-icon').classList.remove('hidden');
        } else {
            selectionBox.classList.remove('bg-green-50', 'border-green-500');
            selectionBox.classList.add('bg-white', 'hover:bg-gray-50', 'border-gray-200');
            selectionBox.querySelector('.check-icon').classList.add('hidden');
        }
    };

    selectionBox.addEventListener('click', (e) => {
        checkbox.checked = !checkbox.checked;
        updateStyle();
        checkbox.dispatchEvent(new Event('change'));
    });

    checkbox.addEventListener('change', updateStyle);

    container.appendChild(checkbox);
    container.appendChild(selectionBox);

    return container;
}

function resetStaffCheckboxesStyles() {
    // Resetear todos los estilos visuales de checkboxes de personal médico
    document.querySelectorAll('.staff-selection-box').forEach(box => {
        box.classList.remove('bg-green-50', 'border-green-500');
        box.classList.add('bg-white', 'hover:bg-gray-50', 'border-gray-200');
        const checkIcon = box.querySelector('.check-icon');
        if (checkIcon) {
            checkIcon.classList.add('hidden');
        }
    });
}

function updateTemplatesDropdown() {
    if (!elements.loadTemplate) return;
    
    const currentValue = elements.loadTemplate.value;
    elements.loadTemplate.innerHTML = '<option value="">Cargar Plantilla</option>';
    
    appState.templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        elements.loadTemplate.appendChild(option);
    });
    
    if (currentValue && elements.loadTemplate.querySelector(`option[value="${currentValue}"]`)) {
        elements.loadTemplate.value = currentValue;
    }
}

function setSelectedStaff(role, values) {
    const checkboxes = document.querySelectorAll(`input[name="${role}"]`);
    checkboxes.forEach(cb => {
        cb.checked = values.includes(cb.value);
        cb.dispatchEvent(new Event('change'));
    });
}

function getSelectedStaff(role) {
    const checkboxes = document.querySelectorAll(`input[name="${role}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedIndications() {
    const checkboxes = document.querySelectorAll('#indicationsCheckboxes input:checked');
    return Array.from(checkboxes).map(cb => {
        return cb.nextElementSibling.textContent.trim();
    });
}

function getAdditionalProcedures() {
    const additional = [];
    
    if (elements.procedureName2Select?.value) {
        const name = elements.procedureName2Select.value === 'other' ? 
            elements.customProcedure2Input?.value : 
            elements.procedureName2Select.options[elements.procedureName2Select.selectedIndex]?.text;
        
        additional.push({
            name: name || '',
            code: elements.procedureCode2Input?.value || ''
        });
    }
    
    if (elements.procedureName3Select?.value) {
        const name = elements.procedureName3Select.value === 'other' ? 
            elements.customProcedure3Input?.value : 
            elements.procedureName3Select.options[elements.procedureName3Select.selectedIndex]?.text;
        
        additional.push({
            name: name || '',
            code: elements.procedureCode3Input?.value || ''
        });
    }
    
    return additional;
}

function updateDeviceSelects(measurementId) {
    const measurement = appState.measurements.find(m => m.id === measurementId);
    if (!measurement || measurement.name !== "Dispositivo implantado") return;

    const deviceTypeParam = measurement.parameters.find(p => p.name === "Tipo de dispositivo");
    const deviceBrandParam = measurement.parameters.find(p => p.name === "Marca");
    const deviceModelParam = measurement.parameters.find(p => p.name === "Modelo");

    if (!deviceTypeParam || !deviceBrandParam || !deviceModelParam) return;

    const deviceType = deviceTypeParam.value;
    const deviceBrand = deviceBrandParam.value;

    // Limpiar marca y modelo si se cambió el tipo
    const currentTypeSelect = document.querySelector(`select[data-measurement-id="${measurementId}"].device-type-select`);
    if (currentTypeSelect && currentTypeSelect.dataset.lastValue !== deviceType) {
        deviceBrandParam.value = '';
        deviceModelParam.value = '';
        currentTypeSelect.dataset.lastValue = deviceType;
    }

    // Limpiar modelo si se cambió la marca
    const currentBrandSelect = document.querySelector(`select[data-measurement-id="${measurementId}"].device-brand-select`);
    if (currentBrandSelect && currentBrandSelect.dataset.lastValue !== deviceBrand) {
        deviceModelParam.value = '';
        currentBrandSelect.dataset.lastValue = deviceBrand;
    }

    // Actualizar opciones de marca basadas en el tipo
    if (deviceType && appState.commonData.deviceModelsByTypeAndBrand[deviceType]) {
        deviceBrandParam.options = Object.keys(appState.commonData.deviceModelsByTypeAndBrand[deviceType]);
    } else {
        deviceBrandParam.options = [...appState.commonData.deviceBrands];
    }

    // Actualizar opciones de modelo basadas en tipo y marca
    if (deviceType && deviceBrand && 
        appState.commonData.deviceModelsByTypeAndBrand[deviceType] && 
        appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand]) {
        deviceModelParam.options = appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand];
    } else {
        deviceModelParam.options = [];
    }

    // Re-renderizar solo esta medición específica
    renderSingleMeasurement(measurementId);
}

// Renderiza solo la medición indicada (actualiza selects de dispositivo sin re-renderizar toda la lista)
function renderSingleMeasurement(measurementId) {
    const measurement = appState.measurements.find(m => m.id === measurementId);
    if (!measurement) return;

    const measurementElement = document.querySelector(`[data-id="${measurementId}"]`);
    if (!measurementElement) return;

    const typeSelect = measurementElement.querySelector('.device-type-select');
    const brandSelect = measurementElement.querySelector('.device-brand-select');
    const modelSelect = measurementElement.querySelector('.device-model-select');

    if (typeSelect) {
        const deviceTypeParam = measurement.parameters.find(p => p.name === "Tipo de dispositivo");
        if (deviceTypeParam) {
            typeSelect.innerHTML = `
                <option value="">Seleccionar</option>
                ${appState.commonData.deviceTypes.map(type => `<option value="${escapeHtml(type)}" ${deviceTypeParam.value === type ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}
                <option value="__add_new__">➕ Agregar nuevo...</option>
            `;
        }
    }

    if (brandSelect) {
        const deviceTypeParam = measurement.parameters.find(p => p.name === "Tipo de dispositivo");
        const deviceBrandParam = measurement.parameters.find(p => p.name === "Marca");
        const deviceType = deviceTypeParam ? deviceTypeParam.value : '';
        
        let availableBrands = appState.commonData.deviceBrands;
        let placeholderText = "Seleccionar";
        let isDisabled = false;
        
        if (!deviceType) {
            placeholderText = "Primero seleccione tipo";
            isDisabled = true;
        } else if (appState.commonData.deviceModelsByTypeAndBrand[deviceType]) {
            availableBrands = Object.keys(appState.commonData.deviceModelsByTypeAndBrand[deviceType]);
        }
        
        brandSelect.innerHTML = `
            <option value="">${placeholderText}</option>
            ${availableBrands.map(brand => `<option value="${escapeHtml(brand)}" ${deviceBrandParam && deviceBrandParam.value === brand ? 'selected' : ''}>${escapeHtml(brand)}</option>`).join('')}
            ${isDisabled ? '' : '<option value="__add_new__">➕ Agregar nuevo...</option>'}
        `;
        brandSelect.disabled = isDisabled;
    }

    if (modelSelect) {
        const deviceTypeParam = measurement.parameters.find(p => p.name === "Tipo de dispositivo");
        const deviceBrandParam = measurement.parameters.find(p => p.name === "Marca");
        const deviceModelParam = measurement.parameters.find(p => p.name === "Modelo");
        const deviceType = deviceTypeParam ? deviceTypeParam.value : '';
        const deviceBrand = deviceBrandParam ? deviceBrandParam.value : '';
        
        let availableModels = [];
        let isDisabled = !deviceType || !deviceBrand;
        
        if (deviceType && deviceBrand) {
            if (appState.commonData.deviceModelsByTypeAndBrand[deviceType] && 
                appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand]) {
                availableModels = appState.commonData.deviceModelsByTypeAndBrand[deviceType][deviceBrand];
            }
        }
        
        let placeholderText = "Seleccionar modelo";
        if (deviceType && deviceBrand && availableModels.length === 0) {
            placeholderText = "No hay modelos disponibles";
        } else if (!deviceType) {
            placeholderText = "Primero seleccione tipo";
        } else if (!deviceBrand) {
            placeholderText = "Primero seleccione marca";
        }
        
        modelSelect.innerHTML = `
            <option value="">${placeholderText}</option>
            ${availableModels.map(model => `<option value="${escapeHtml(model)}" ${deviceModelParam && deviceModelParam.value === model ? 'selected' : ''}>${escapeHtml(model)}</option>`).join('')}
            ${isDisabled ? '' : '<option value="__add_new__">➕ Agregar nuevo...</option>'}
        `;
        modelSelect.disabled = isDisabled;
    }
}

// ===================================================================
// 13. FUNCIONES DE DATOS COMUNES
// ===================================================================

// Funciones de datos comunes se movieron a sus nuevas ubicaciones
// El código anterior del modal se eliminó ya que se reemplazó con una vista completa

// ===================================================================
// 14. INICIALIZACIÓN AUTOMÁTICA
// ===================================================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await initializeApp();
    });
} else {
    (async () => {
        await initializeApp();
    })();
}

// ===================================================================
// 15. WIZARD / ASISTENTE PASO A PASO
// ===================================================================

let wizardState = {
    currentStep: 1,
    totalSteps: 8,
    data: {}
};

function openWizardModal() {
    const modal = document.getElementById('wizardModal');
    if (!modal) return;
    
    wizardState.currentStep = 1;
    wizardState.data = {};
    
    modal.classList.remove('hidden');
    updateWizardProgress();
    renderWizardStep(1);
}

function closeWizardModal() {
    const modal = document.getElementById('wizardModal');
    if (modal) modal.classList.add('hidden');
}

// ---- Helpers del asistente para listas despegables y descripción ----

// Genera el HTML del campo de un parámetro de medición en el asistente.
// Devuelve un <select> con opciones predeterminadas si aplica, o null (→ input de texto).
function wizardParamSelectHTML(measurement, param, pi, mi, measValues) {
    const key = mi + '_' + pi;
    const val = measValues[key] !== undefined ? measValues[key] : (param.value || '');
    let options = null;

    const wizValueOf = (idx) => {
        if (idx < 0) return '';
        return measValues[mi + '_' + idx] !== undefined ? measValues[mi + '_' + idx] : (measurement.parameters[idx] ? measurement.parameters[idx].value || '' : '');
    };

    if (param.name === 'Tipo de dispositivo') {
        options = appState.commonData.deviceTypes || [];
    } else if (param.name === 'Marca') {
        const tIdx = measurement.parameters.findIndex(x => x.name === 'Tipo de dispositivo');
        const tVal = wizValueOf(tIdx);
        if (tVal && appState.commonData.deviceModelsByTypeAndBrand[tVal]) {
            options = Object.keys(appState.commonData.deviceModelsByTypeAndBrand[tVal]);
        } else {
            options = appState.commonData.deviceBrands || [];
        }
    } else if (param.name === 'Modelo') {
        const tIdx = measurement.parameters.findIndex(x => x.name === 'Tipo de dispositivo');
        const bIdx = measurement.parameters.findIndex(x => x.name === 'Marca');
        const tVal = wizValueOf(tIdx);
        const bVal = wizValueOf(bIdx);
        if (tVal && bVal && appState.commonData.deviceModelsByTypeAndBrand[tVal] && appState.commonData.deviceModelsByTypeAndBrand[tVal][bVal]) {
            options = appState.commonData.deviceModelsByTypeAndBrand[tVal][bVal];
        }
    } else if (param.name === 'Polaridad de estimulación') {
        options = appState.commonData.stimulationPolarities || [];
    } else if (Array.isArray(param.options) && param.options.length > 0) {
        options = Array.from(new Set([
            ...param.options,
            ...((appState.commonData.measurementOptionDefaults && appState.commonData.measurementOptionDefaults[param.name]) || [])
        ]));
    }

    if (!options || options.length === 0) return null;

    const optionsHTML = options.map(o =>
        `<option value="${escapeHtml(o)}" ${val === o ? 'selected' : ''}>${escapeHtml(o)}</option>`
    ).join('') + '<option value="__add_new__">➕ Agregar nuevo...</option>';

    return `<select data-m-index="${mi}" data-p-index="${pi}" class="wizard-form-select"
        style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;background:#fff;">${optionsHTML}</select>`;
}

// Re-renderiza un select de medición del asistente manteniendo su valor.
function refreshWizardMeasurementSelect(select) {
    if (!select) return;
    const mi = parseInt(select.dataset.mIndex, 10);
    const pi = parseInt(select.dataset.pIndex, 10);
    const measurement = appState.measurements[mi];
    if (!measurement || !measurement.parameters[pi]) return;
    const html = wizardParamSelectHTML(measurement, measurement.parameters[pi], pi, mi, wizardState.data.measurementValues || {});
    if (html !== null) select.outerHTML = html;
}

// Re-renderiza los selects de Marca y Modelo de una medición del asistente (cascada).
function updateWizardDeviceCascade(mi) {
    const measurement = appState.measurements[mi];
    if (!measurement) return;
    const container = document.getElementById('wiz-measurementsContainer');
    if (!container) return;
    const bIdx = measurement.parameters.findIndex(x => x.name === 'Marca');
    const mIdx = measurement.parameters.findIndex(x => x.name === 'Modelo');
    if (bIdx >= 0) {
        const brandSelect = container.querySelector(`select[data-m-index="${mi}"][data-p-index="${bIdx}"]`);
        if (brandSelect) {
            const html = wizardParamSelectHTML(measurement, measurement.parameters[bIdx], bIdx, mi, wizardState.data.measurementValues);
            if (html !== null) brandSelect.outerHTML = html;
        }
    }
    if (mIdx >= 0) {
        const modelSelect = container.querySelector(`select[data-m-index="${mi}"][data-p-index="${mIdx}"]`);
        if (modelSelect) {
            const html = wizardParamSelectHTML(measurement, measurement.parameters[mIdx], mIdx, mi, wizardState.data.measurementValues);
            if (html !== null) {
                modelSelect.outerHTML = html;
            } else {
                modelSelect.outerHTML = `<select data-m-index="${mi}" data-p-index="${mIdx}" disabled class="wizard-form-select"
                    style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;background:#f1f5f9;">
                    <option value="">No hay modelos disponibles</option></select>`;
            }
        }
    }
}

// Maneja "➕ Agregar nuevo..." en un select de medición del asistente.
function handleWizardMeasurementAddNew(select) {
    const mi = parseInt(select.dataset.mIndex, 10);
    const pi = parseInt(select.dataset.pIndex, 10);
    const measurement = appState.measurements[mi];
    if (!measurement || !measurement.parameters[pi]) return;
    const param = measurement.parameters[pi];

    let placeholder = 'Nuevo valor';
    if (param.name === 'Tipo de dispositivo') placeholder = 'Nuevo tipo de dispositivo';
    else if (param.name === 'Marca') placeholder = 'Nueva marca';
    else if (param.name === 'Modelo') placeholder = 'Nuevo modelo';
    else if (param.name === 'Polaridad de estimulación') placeholder = 'Nueva polaridad';

    showInlineAddNew(select, placeholder, (value) => {
        if (!wizardState.data.measurementValues) wizardState.data.measurementValues = {};
        const overrideValues = {};
        measurement.parameters.forEach((pp, idx) => {
            overrideValues[pp.name] = wizardState.data.measurementValues[mi + '_' + idx] !== undefined
                ? wizardState.data.measurementValues[mi + '_' + idx]
                : (pp.value || '');
        });
        if (!addNewMeasurementOption(param, measurement, value, overrideValues)) return false;
        saveAllData();
        wizardState.data.measurementValues[mi + '_' + pi] = value;
        if (param.name === 'Tipo de dispositivo') {
            const bIdx = measurement.parameters.findIndex(x => x.name === 'Marca');
            const mIdx = measurement.parameters.findIndex(x => x.name === 'Modelo');
            if (bIdx >= 0) wizardState.data.measurementValues[mi + '_' + bIdx] = '';
            if (mIdx >= 0) wizardState.data.measurementValues[mi + '_' + mIdx] = '';
        } else if (param.name === 'Marca') {
            const mIdx = measurement.parameters.findIndex(x => x.name === 'Modelo');
            if (mIdx >= 0) wizardState.data.measurementValues[mi + '_' + mIdx] = '';
        }
        refreshWizardMeasurementSelect(select);
        updateWizardDeviceCascade(mi);
        return true;
    });
}

// Prepara un select simple del asistente (comuna/previsión/procedencia) con opción "Agregar nuevo".
function setupWizardCommonSelect(selectId, arr, stateKey, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const rebuild = () => {
        const current = select.value;
        select.innerHTML = '<option value="">Seleccione...</option>' +
            arr.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
        if (current && Array.from(select.options).some(o => o.value === current)) select.value = current;
        attachAddNewOption(select, placeholder, onAdd);
    };
    const onAdd = (value) => {
        if (!addToCommonArray(arr, value, placeholder)) return false;
        wizardState.data[stateKey] = value;
        rebuild();
        select.value = value;
        return true;
    };
    rebuild();
}

// Prepara un select de diagnóstico del asistente con opción "Agregar nuevo" (respeta la opción "Otro").
function setupWizardDiagnosisSelect(selectId, arr, stateKey) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const customId = selectId === 'wiz-entryDiagnosis' ? 'wiz-customEntryDiagnosis' : 'wiz-customExitDiagnosis';
    const customKey = stateKey === 'entryDiagnosis' ? 'customEntryDiagnosis' : 'customExitDiagnosis';
    const rebuild = () => {
        const current = select.value;
        select.innerHTML = '<option value="">Seleccione...</option>' +
            arr.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('') +
            `<option value="custom" ${wizardState.data[stateKey] === 'custom' ? 'selected' : ''}>Otro</option>`;
        if (current && Array.from(select.options).some(o => o.value === current)) select.value = current;
        attachAddNewOption(select, 'Nuevo diagnóstico', onAdd);
    };
    const onAdd = (value) => {
        if (!addToCommonArray(arr, value, 'El diagnóstico')) return false;
        wizardState.data[stateKey] = value;
        wizardState.data[customKey] = '';
        const customInput = document.getElementById(customId);
        if (customInput) customInput.style.display = 'none';
        rebuild();
        select.value = value;
        return true;
    };
    rebuild();
}

// Genera la descripción sugerida a partir de los datos actuales del asistente.
function wizardDescriptionSuggestion() {
    const d = wizardState.data;
    const procedure = appState.procedures.find(p => p.id === d.procedureName);
    const additionalProcedures = [];
    if (d.procedureName2) {
        const p2 = appState.procedures.find(p => p.id === d.procedureName2);
        if (p2) additionalProcedures.push({ name: p2.name });
    }
    if (d.procedureName3) {
        const p3 = appState.procedures.find(p => p.id === d.procedureName3);
        if (p3) additionalProcedures.push({ name: p3.name });
    }
    return generateProcedureDescriptionSuggestion({
        procedureName: procedure ? procedure.name : (d.customProcedureName || ''),
        procedureCode: d.procedureCode || (procedure ? procedure.code : ''),
        measurements: d.addMeasurements ? (appState.measurements || []) : [],
        additionalProcedures
    });
}

// Usa la descripción sugerida en el formulario principal.
function useFormDescriptionSuggestion() {
    applyAISuggestion('procedureDescription', generateProcedureDescriptionSuggestion(collectReportData()));
}

function updateWizardProgress() {
    const fill = document.getElementById('wizardProgressFill');
    const dots = document.querySelectorAll('.wizard-step-dot');
    const counter = document.getElementById('wizardStepCounter');
    
    if (fill) {
        const pct = (wizardState.currentStep / wizardState.totalSteps) * 100;
        fill.style.width = pct + '%';
    }
    
    dots.forEach((dot, idx) => {
        const stepNum = idx + 1;
        dot.classList.remove('active', 'completed');
        if (stepNum < wizardState.currentStep) {
            dot.classList.add('completed');
        } else if (stepNum === wizardState.currentStep) {
            dot.classList.add('active');
        }
    });
    
    if (counter) {
        counter.textContent = `Paso ${wizardState.currentStep} de ${wizardState.totalSteps}`;
    }
    
    // Toggle buttons
    const prevBtn = document.getElementById('wizardPrevBtn');
    const nextBtn = document.getElementById('wizardNextBtn');
    const finishBtn = document.getElementById('wizardFinishBtn');
    
    if (prevBtn) prevBtn.classList.toggle('hidden', wizardState.currentStep === 1);
    if (nextBtn) nextBtn.classList.toggle('hidden', wizardState.currentStep === wizardState.totalSteps);
    if (finishBtn) finishBtn.classList.toggle('hidden', wizardState.currentStep !== wizardState.totalSteps);
}

function validateWizardStep(step) {
    const errors = [];
    
    switch(step) {
        case 1: // Procedimiento Principal
            const procName = document.getElementById('wiz-procedureName')?.value;
            const procCode = document.getElementById('wiz-procedureCode')?.value;
            const procDate = document.getElementById('wiz-procedureDate')?.value;
            const startTime = document.getElementById('wiz-startTime')?.value;
            const endTime = document.getElementById('wiz-endTime')?.value;
            if (!procName) errors.push('Nombre del procedimiento es obligatorio');
            if (!procCode) errors.push('Código del procedimiento es obligatorio');
            if (!procDate) errors.push('La fecha del procedimiento es obligatoria');
            if (!startTime) errors.push('Hora de inicio es obligatoria');
            if (!endTime) errors.push('Hora de término es obligatoria');
            if (startTime && endTime && endTime < startTime) {
                showNotification('Advertencia: la hora de término es anterior a la de inicio. Verifique si el procedimiento cruzó la medianoche.', 'warning');
            }
            break;
        case 3: // Datos del Paciente
            const commune = document.getElementById('wiz-commune')?.value;
            const insurance = document.getElementById('wiz-healthInsurance')?.value;
            const origin = document.getElementById('wiz-origin')?.value;
            if (!commune) errors.push('Comuna es obligatoria');
            if (!insurance) errors.push('Previsión de salud es obligatoria');
            if (!origin) errors.push('Procedencia es obligatoria');
            break;
        case 6: // Descripción
            const desc = document.getElementById('wiz-procedureDescription')?.value;
            if (!desc || !desc.trim()) errors.push('La descripción del procedimiento es obligatoria');
            break;
    }
    
    // Show/hide validation error
    const body = document.getElementById('wizardBody');
    let errorDiv = body?.querySelector('.wizard-validation-error');
    if (errors.length > 0) {
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'wizard-validation-error';
            body?.insertBefore(errorDiv, body.firstChild);
        }
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> <div>${errors.join('<br>')}</div>`;
        errorDiv.classList.remove('hidden');
        return false;
    } else {
        if (errorDiv) errorDiv.classList.add('hidden');
    }
    return true;
}

function collectWizardStepData(step) {
    const data = {};
    switch(step) {
        case 1:
            data.procedureName = document.getElementById('wiz-procedureName')?.value || '';
            data.procedureCode = document.getElementById('wiz-procedureCode')?.value || '';
            data.procedureDate = document.getElementById('wiz-procedureDate')?.value || '';
            data.customProcedureName = document.getElementById('wiz-customProcedureName')?.value || '';
            data.startTime = document.getElementById('wiz-startTime')?.value || '';
            data.endTime = document.getElementById('wiz-endTime')?.value || '';
            break;
        case 2:
            data.procedureName2 = document.getElementById('wiz-procedureName2')?.value || '';
            data.procedureCode2 = document.getElementById('wiz-procedureCode2')?.value || '';
            data.procedureName3 = document.getElementById('wiz-procedureName3')?.value || '';
            data.procedureCode3 = document.getElementById('wiz-procedureCode3')?.value || '';
            break;
        case 3:
            data.commune = document.getElementById('wiz-commune')?.value || '';
            data.healthInsurance = document.getElementById('wiz-healthInsurance')?.value || '';
            data.origin = document.getElementById('wiz-origin')?.value || '';
            break;
        case 4:
            data.mainDoctor = Array.from(document.querySelectorAll('input[name="wiz-mainDoctor"]:checked')).map(cb => cb.value);
            data.assistantNurse = Array.from(document.querySelectorAll('input[name="wiz-assistantNurse"]:checked')).map(cb => cb.value);
            data.tens = Array.from(document.querySelectorAll('input[name="wiz-tens"]:checked')).map(cb => cb.value);
            break;
        case 5:
            data.entryDiagnosis = document.getElementById('wiz-entryDiagnosis')?.value || '';
            data.customEntryDiagnosis = document.getElementById('wiz-customEntryDiagnosis')?.value || '';
            data.exitDiagnosis = document.getElementById('wiz-exitDiagnosis')?.value || '';
            data.customExitDiagnosis = document.getElementById('wiz-customExitDiagnosis')?.value || '';
            data.admissionReason = document.getElementById('wiz-admissionReason')?.value || '';
            break;
        case 6:
            data.procedureDescription = document.getElementById('wiz-procedureDescription')?.value || '';
            break;
        case 7:
            data.addMeasurements = document.getElementById('wiz-addMeasurements')?.checked || false;
            if (data.addMeasurements) {
                data.measurementValues = {};
                document.querySelectorAll('#wiz-measurementsContainer [data-m-index]').forEach(el => {
                    data.measurementValues[el.dataset.mIndex + '_' + el.dataset.pIndex] = el.value;
                });
                data.customParamValues = {};
                document.querySelectorAll('#wiz-measurementsContainer input[data-custom-p-index]').forEach(inp => {
                    data.customParamValues[inp.dataset.customPIndex] = inp.value;
                });
            }
            break;
        case 8:
            data.indications = Array.from(document.querySelectorAll('input[name="wiz-indication"]:checked')).map(cb => cb.value);
            data.additionalIndications = document.getElementById('wiz-additionalIndications')?.value || '';
            break;
    }
    return data;
}

async function applyWizardDataToForm() {
    const d = wizardState.data;
    
    // Apply data to main form
    if (d.procedureName && elements.procedureNameSelect) {
        elements.procedureNameSelect.value = d.procedureName;
        await updateProcedureCode(elements.procedureNameSelect, elements.procedureCodeInput);
        toggleCustomFields();
    }
    if (d.procedureCode && elements.procedureCodeInput) elements.procedureCodeInput.value = d.procedureCode;
    if (d.customProcedureName && elements.customProcedureInput) elements.customProcedureInput.value = d.customProcedureName;
    if (d.startTime && elements.startTime) elements.startTime.value = d.startTime;
    if (d.endTime && elements.endTime) elements.endTime.value = d.endTime;
    if (d.procedureDate && elements.procedureDate) elements.procedureDate.value = d.procedureDate;
    
    // Prestaciones adicionales
    if (d.procedureName2 && elements.procedureName2Select) {
        elements.procedureName2Select.value = d.procedureName2;
        await updateProcedureCode(elements.procedureName2Select, elements.procedureCode2Input);
        if (elements.procedure2Section) {
            elements.procedure2Section.classList.remove('hidden');
            appState.additionalProceduresCount = 1;
        }
    }
    if (d.procedureCode2 && elements.procedureCode2Input) elements.procedureCode2Input.value = d.procedureCode2;
    if (d.procedureName3 && elements.procedureName3Select) {
        elements.procedureName3Select.value = d.procedureName3;
        await updateProcedureCode(elements.procedureName3Select, elements.procedureCode3Input);
        if (elements.procedure3Section) {
            elements.procedure3Section.classList.remove('hidden');
            elements.addProcedureBtn?.classList.add('hidden');
            appState.additionalProceduresCount = 2;
        }
    }
    if (d.procedureCode3 && elements.procedureCode3Input) elements.procedureCode3Input.value = d.procedureCode3;
    
    // Datos paciente
    if (d.commune && elements.commune) elements.commune.value = d.commune;
    if (d.healthInsurance && elements.healthInsurance) elements.healthInsurance.value = d.healthInsurance;
    if (d.origin && elements.origin) elements.origin.value = d.origin;
    
    // Personal
    if (d.mainDoctor) setSelectedStaff('mainDoctor', d.mainDoctor);
    if (d.assistantNurse) setSelectedStaff('assistantNurse', d.assistantNurse);
    if (d.tens) setSelectedStaff('tens', d.tens);
    
    // Diagnósticos
    if (d.entryDiagnosis && elements.entryDiagnosisSelect) {
        elements.entryDiagnosisSelect.value = d.entryDiagnosis;
        toggleCustomFields();
    }
    if (d.customEntryDiagnosis && elements.customEntryDiagnosis) elements.customEntryDiagnosis.value = d.customEntryDiagnosis;
    if (d.exitDiagnosis && elements.exitDiagnosisSelect) {
        elements.exitDiagnosisSelect.value = d.exitDiagnosis;
        toggleCustomFields();
    }
    if (d.customExitDiagnosis && elements.customExitDiagnosis) elements.customExitDiagnosis.value = d.customExitDiagnosis;
    if (d.admissionReason && elements.admissionReason) elements.admissionReason.value = d.admissionReason;
    
    // Descripción
    const descEl = document.getElementById('procedureDescription');
    if (d.procedureDescription && descEl) descEl.value = d.procedureDescription;
    
    // Mediciones
    if (d.addMeasurements && elements.addMeasurementsCheckbox) {
        elements.addMeasurementsCheckbox.checked = true;
        toggleMeasurements();
    } else if (elements.addMeasurementsCheckbox) {
        elements.addMeasurementsCheckbox.checked = false;
        toggleMeasurements();
    }
    // Aplicar valores de mediciones y parámetros personalizados del asistente
    if (d.addMeasurements) {
        if (d.measurementValues) {
            Object.keys(d.measurementValues).forEach(key => {
                const parts = key.split('_');
                const mIdx = parseInt(parts[0], 10);
                const pIdx = parseInt(parts[1], 10);
                const measurement = appState.measurements[mIdx];
                if (measurement && measurement.parameters && measurement.parameters[pIdx]) {
                    measurement.parameters[pIdx].value = d.measurementValues[key];
                }
            });
        }
        if (d.customParamValues) {
            Object.keys(d.customParamValues).forEach(key => {
                const param = appState.customParameters[parseInt(key, 10)];
                if (param) param.value = d.customParamValues[key];
            });
        }
        if (elements.measurementsList) renderMeasurements();
    }
    
    // Indicaciones
    if (d.indications) {
        document.querySelectorAll('#indicationsCheckboxes input').forEach(cb => {
            cb.checked = d.indications.includes(cb.nextElementSibling?.textContent?.trim());
        });
    }
    const addIndEl = document.getElementById('additionalIndications');
    if (d.additionalIndications && addIndEl) addIndEl.value = d.additionalIndications;
    
    appState.formChanged = true;
}

function nextWizardStep() {
    if (!validateWizardStep(wizardState.currentStep)) return;
    
    // Save current step data
    wizardState.data = { ...wizardState.data, ...collectWizardStepData(wizardState.currentStep) };
    
    if (wizardState.currentStep < wizardState.totalSteps) {
        wizardState.currentStep++;
        updateWizardProgress();
        renderWizardStep(wizardState.currentStep);
    }
}

function prevWizardStep() {
    // Save current step data
    wizardState.data = { ...wizardState.data, ...collectWizardStepData(wizardState.currentStep) };
    
    if (wizardState.currentStep > 1) {
        wizardState.currentStep--;
        updateWizardProgress();
        renderWizardStep(wizardState.currentStep);
    }
}

async function finishWizard() {
    if (!validateWizardStep(wizardState.currentStep)) return;
    
    // Save last step data
    wizardState.data = { ...wizardState.data, ...collectWizardStepData(wizardState.currentStep) };
    
    await applyWizardDataToForm();
    closeWizardModal();
    renderReportSilently();
    
    showNotification('Informe generado correctamente mediante el asistente', 'success');
}

function renderWizardStep(step) {
    const body = document.getElementById('wizardBody');
    if (!body) return;
    
    let html = '';
    
    switch(step) {
        case 1:
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 1: Procedimiento Principal</h3>
                    <p class="wizard-step-description">Ingrese los datos del procedimiento principal a realizar.</p>
                    <div class="wizard-form-grid">
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Procedimiento <span class="required">*</span></label>
                            <select id="wiz-procedureName" class="wizard-form-select">
                                <option value="">Seleccione...</option>
                                ${appState.procedures.map(p => `<option value="${p.id}" ${wizardState.data.procedureName === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
                                <option value="other" ${wizardState.data.procedureName === 'other' ? 'selected' : ''}>Otro (especifique)</option>
                            </select>
                            <input type="text" id="wiz-customProcedureName" class="wizard-form-input mt-2" value="${escapeHtml(wizardState.data.customProcedureName || '')}" placeholder="Especifique el nombre del procedimiento" style="${wizardState.data.procedureName === 'other' ? '' : 'display:none;'}">
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Código <span class="required">*</span></label>
                            <input type="text" id="wiz-procedureCode" class="wizard-form-input" value="${escapeHtml(wizardState.data.procedureCode || '')}" placeholder="Ej: 17.0012">
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Fecha <span class="required">*</span></label>
                            <input type="date" id="wiz-procedureDate" class="wizard-form-input" value="${escapeHtml(wizardState.data.procedureDate || toISODate(new Date()))}">
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Hora de Inicio <span class="required">*</span></label>
                            <input type="time" id="wiz-startTime" class="wizard-form-input" value="${wizardState.data.startTime || ''}">
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Hora de Término <span class="required">*</span></label>
                            <input type="time" id="wiz-endTime" class="wizard-form-input" value="${wizardState.data.endTime || ''}">
                        </div>
                    </div>
                </div>
            `;
            break;
        case 2:
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 2: Prestaciones Adicionales</h3>
                    <p class="wizard-step-description">Agregue prestaciones adicionales si las hay (opcional).</p>
                    <div class="wizard-form-grid">
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Prestación Adicional 1</label>
                            <select id="wiz-procedureName2" class="wizard-form-select">
                                <option value="">Ninguna</option>
                                ${appState.procedures.map(p => `<option value="${p.id}" ${wizardState.data.procedureName2 === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Código Prestación 1</label>
                            <input type="text" id="wiz-procedureCode2" class="wizard-form-input" value="${escapeHtml(wizardState.data.procedureCode2 || '')}">
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Prestación Adicional 2</label>
                            <select id="wiz-procedureName3" class="wizard-form-select">
                                <option value="">Ninguna</option>
                                ${appState.procedures.map(p => `<option value="${p.id}" ${wizardState.data.procedureName3 === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Código Prestación 2</label>
                            <input type="text" id="wiz-procedureCode3" class="wizard-form-input" value="${escapeHtml(wizardState.data.procedureCode3 || '')}">
                        </div>
                    </div>
                </div>
            `;
            break;
        case 3:
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 3: Datos del Paciente</h3>
                    <p class="wizard-step-description">Ingrese los datos administrativos del paciente.</p>
                    <div class="wizard-form-grid">
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Comuna <span class="required">*</span></label>
                            <select id="wiz-commune" class="wizard-form-select">
                                <option value="">Seleccione...</option>
                                ${(appState.commonData.communes || []).map(c => `<option value="${escapeHtml(c)}" ${wizardState.data.commune === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Previsión <span class="required">*</span></label>
                            <select id="wiz-healthInsurance" class="wizard-form-select">
                                <option value="">Seleccione...</option>
                                ${(appState.commonData.insurances || []).map(i => `<option value="${escapeHtml(i)}" ${wizardState.data.healthInsurance === i ? 'selected' : ''}>${escapeHtml(i)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Procedencia <span class="required">*</span></label>
                            <select id="wiz-origin" class="wizard-form-select">
                                <option value="">Seleccione...</option>
                                ${(appState.commonData.origins || []).map(o => `<option value="${escapeHtml(o)}" ${wizardState.data.origin === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 4:
            const medicos = appState.staff.filter(p => p.role === 'medico');
            const enfermeros = appState.staff.filter(p => p.role === 'enfermero');
            const tecnicos = appState.staff.filter(p => p.role === 'tecnico');
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 4: Personal Médico</h3>
                    <p class="wizard-step-description">Seleccione el personal que participó en el procedimiento.</p>
                    <div class="wizard-form-group">
                        <label class="wizard-form-label">Médico(s)</label>
                        <div class="wizard-checkbox-group">
                            ${medicos.map(p => `
                                <label class="wizard-checkbox-item">
                                    <input type="checkbox" name="wiz-mainDoctor" value="${escapeHtml(p.name)}" ${(wizardState.data.mainDoctor || []).includes(p.name) ? 'checked' : ''}>
                                    <span>${escapeHtml(p.name)}</span>
                                </label>
                            `).join('') || '<p class="text-gray-500">No hay médicos registrados</p>'}
                        </div>
                    </div>
                    <div class="wizard-form-group">
                        <label class="wizard-form-label">Enfermería</label>
                        <div class="wizard-checkbox-group">
                            ${enfermeros.map(p => `
                                <label class="wizard-checkbox-item">
                                    <input type="checkbox" name="wiz-assistantNurse" value="${escapeHtml(p.name)}" ${(wizardState.data.assistantNurse || []).includes(p.name) ? 'checked' : ''}>
                                    <span>${escapeHtml(p.name)}</span>
                                </label>
                            `).join('') || '<p class="text-gray-500">No hay enfermeros registrados</p>'}
                        </div>
                    </div>
                    <div class="wizard-form-group">
                        <label class="wizard-form-label">TENS</label>
                        <div class="wizard-checkbox-group">
                            ${tecnicos.map(p => `
                                <label class="wizard-checkbox-item">
                                    <input type="checkbox" name="wiz-tens" value="${escapeHtml(p.name)}" ${(wizardState.data.tens || []).includes(p.name) ? 'checked' : ''}>
                                    <span>${escapeHtml(p.name)}</span>
                                </label>
                            `).join('') || '<p class="text-gray-500">No hay técnicos registrados</p>'}
                        </div>
                    </div>
                </div>
            `;
            break;
        case 5:
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 5: Diagnósticos</h3>
                    <p class="wizard-step-description">Ingrese los diagnósticos y motivo de ingreso.</p>
                    <div class="wizard-form-grid">
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Diagnóstico de Ingreso</label>
                            <select id="wiz-entryDiagnosis" class="wizard-form-select">
                                <option value="">Seleccione...</option>
                                ${(appState.commonData.entryDiagnoses || []).map(d => `<option value="${escapeHtml(d)}" ${wizardState.data.entryDiagnosis === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')}
                                <option value="custom" ${wizardState.data.entryDiagnosis === 'custom' ? 'selected' : ''}>Otro</option>
                            </select>
                            <input type="text" id="wiz-customEntryDiagnosis" class="wizard-form-input mt-2" value="${escapeHtml(wizardState.data.customEntryDiagnosis || '')}" placeholder="Especifique diagnóstico" style="${wizardState.data.entryDiagnosis === 'custom' ? '' : 'display:none;'}">
                        </div>
                        <div class="wizard-form-group">
                            <label class="wizard-form-label">Diagnóstico de Egreso</label>
                            <select id="wiz-exitDiagnosis" class="wizard-form-select">
                                <option value="">Seleccione...</option>
                                ${(appState.commonData.exitDiagnoses || []).map(d => `<option value="${escapeHtml(d)}" ${wizardState.data.exitDiagnosis === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')}
                                <option value="custom" ${wizardState.data.exitDiagnosis === 'custom' ? 'selected' : ''}>Otro</option>
                            </select>
                            <input type="text" id="wiz-customExitDiagnosis" class="wizard-form-input mt-2" value="${escapeHtml(wizardState.data.customExitDiagnosis || '')}" placeholder="Especifique diagnóstico" style="${wizardState.data.exitDiagnosis === 'custom' ? '' : 'display:none;'}">
                        </div>
                        <div class="wizard-form-group full-width">
                            <label class="wizard-form-label">Motivo de Ingreso</label>
                            <textarea id="wiz-admissionReason" class="wizard-form-textarea" placeholder="Describa el motivo de ingreso...">${escapeHtml(wizardState.data.admissionReason || '')}</textarea>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 6:
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 6: Descripción del Procedimiento</h3>
                    <p class="wizard-step-description">Describa detalladamente el procedimiento realizado. Este campo es obligatorio.</p>
                    <div class="wizard-form-group full-width">
                        <label class="wizard-form-label">Descripción <span class="required">*</span></label>
                        <textarea id="wiz-procedureDescription" class="wizard-form-textarea" placeholder="Describa el procedimiento realizado...">${escapeHtml(wizardState.data.procedureDescription || '')}</textarea>
                        <button type="button" id="wiz-useDescSuggestion" class="btn bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm px-3 py-2 rounded-lg mt-2 flex items-center gap-2 transition-all">
                            <i class="fas fa-magic"></i> Usar descripción predeterminada
                        </button>
                    </div>
                </div>
            `;
            break;
        case 7:
            const measValues = wizardState.data.measurementValues || {};
            const customVal = wizardState.data.customParamValues || {};
            const measurementsHTML = (appState.measurements || []).map((m, mi) => {
                const paramsHTML = (m.parameters || []).map((p, pi) => {
                    const key = mi + '_' + pi;
                    const val = measValues[key] !== undefined ? measValues[key] : (p.value || '');
                    const selectHTML = wizardParamSelectHTML(m, p, pi, mi, measValues);
                    const fieldHTML = selectHTML !== null ? selectHTML : `
                            <input type="text" data-m-index="${mi}" data-p-index="${pi}" value="${escapeHtml(val)}"
                                   class="wizard-form-input"
                                   style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;background:#fff;"
                                   placeholder="Ingrese valor">`;
                    return `
                        <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.4rem;">
                            <label style="flex:0 0 42%;font-size:0.85rem;color:#475569;">${escapeHtml(p.name)}</label>
                            ${fieldHTML}
                        </div>`;
                }).join('');
                return `
                    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:0.75rem;margin-bottom:0.6rem;background:#f8fafc;">
                        <strong style="font-size:0.9rem;color:#1e293b;display:block;">${escapeHtml(m.name)}</strong>
                        <div style="font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin:0.2rem 0 0.4rem;">Parámetros Predefinidos</div>
                        ${paramsHTML}
                    </div>`;
            }).join('');
            const customHTML = (appState.customParameters || []).map((param, pi) => {
                const val = customVal[pi] !== undefined ? customVal[pi] : (param.value || '');
                return `
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.4rem;">
                        <label style="flex:0 0 42%;font-size:0.85rem;color:#475569;">${escapeHtml(param.name)}</label>
                        <input type="text" data-custom-p-index="${pi}" value="${escapeHtml(val)}"
                               class="wizard-form-input"
                               style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;background:#fff;"
                               placeholder="Valor">
                    </div>`;
            }).join('');
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 7: Mediciones</h3>
                    <p class="wizard-step-description">Indique si desea incluir mediciones en el informe y complete sus valores.</p>
                    <div class="wizard-form-group">
                        <label class="wizard-checkbox-item" style="max-width: 300px;">
                            <input type="checkbox" id="wiz-addMeasurements" ${wizardState.data.addMeasurements ? 'checked' : ''}>
                            <span>Incluir mediciones en el informe</span>
                        </label>
                    </div>
                    <div id="wiz-measurementsContainer" class="wizard-form-group full-width" style="${wizardState.data.addMeasurements ? '' : 'display:none;'}">
                        ${measurementsHTML || '<p class="text-sm text-gray-500">No hay mediciones configuradas en el formulario principal.</p>'}
                        ${(appState.customParameters || []).length > 0 ? `
                        <div style="border:1px solid #a7f3d0;border-radius:8px;padding:0.75rem;margin-top:0.8rem;background:#f0fdf4;">
                            <strong style="font-size:0.9rem;color:#166534;display:block;">Parámetros Personalizados</strong>
                            <div style="font-size:0.75rem;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin:0.2rem 0 0.4rem;">Complete los valores si corresponden</div>
                            ${customHTML}
                        </div>` : ''}
                    </div>
                </div>
            `;
            break;
        case 8:
            html = `
                <div class="wizard-step-content">
                    <h3 class="wizard-step-title">Paso 8: Indicaciones y Resumen</h3>
                    <p class="wizard-step-description">Seleccione las indicaciones post-procedimiento y agregue notas adicionales.</p>
                    <div class="wizard-form-group">
                        <label class="wizard-form-label">Indicaciones</label>
                        <div class="wizard-checkbox-group">
                            ${(appState.commonData.indications || []).map((ind, idx) => `
                                <label class="wizard-checkbox-item">
                                    <input type="checkbox" name="wiz-indication" value="${escapeHtml(ind)}" ${(wizardState.data.indications || []).includes(ind) ? 'checked' : ''}>
                                    <span>${escapeHtml(ind)}</span>
                                </label>
                            `).join('') || '<p class="text-gray-500">No hay indicaciones registradas</p>'}
                        </div>
                    </div>
                    <div class="wizard-form-group full-width">
                        <label class="wizard-form-label">Indicaciones Adicionales</label>
                        <textarea id="wiz-additionalIndications" class="wizard-form-textarea" placeholder="Indicaciones específicas adicionales...">${escapeHtml(wizardState.data.additionalIndications || '')}</textarea>
                    </div>
                    <div class="wizard-summary mt-4">
                        <h4><i class="fas fa-clipboard-check mr-2"></i>Resumen del Informe</h4>
                        <div class="wizard-summary-item">
                            <span class="wizard-summary-label">Procedimiento:</span>
                            <span class="wizard-summary-value">${escapeHtml(wizardState.data.procedureName ? (appState.procedures.find(p => p.id === wizardState.data.procedureName)?.name || wizardState.data.procedureName) : 'No especificado')}</span>
                        </div>
                        <div class="wizard-summary-item">
                            <span class="wizard-summary-label">Código:</span>
                            <span class="wizard-summary-value">${escapeHtml(wizardState.data.procedureCode || 'No especificado')}</span>
                        </div>
                        <div class="wizard-summary-item">
                            <span class="wizard-summary-label">Horario:</span>
                            <span class="wizard-summary-value">${wizardState.data.startTime || '--:--'} - ${wizardState.data.endTime || '--:--'}</span>
                        </div>
                        <div class="wizard-summary-item">
                            <span class="wizard-summary-label">Fecha:</span>
                            <span class="wizard-summary-value">${escapeHtml(formatDateEsCL(wizardState.data.procedureDate) || 'No especificada')}</span>
                        </div>
                        <div class="wizard-summary-item">
                            <span class="wizard-summary-label">Comuna:</span>
                            <span class="wizard-summary-value">${escapeHtml(wizardState.data.commune || 'No especificada')}</span>
                        </div>
                        <div class="wizard-summary-item">
                            <span class="wizard-summary-label">Previsión:</span>
                            <span class="wizard-summary-value">${escapeHtml(wizardState.data.healthInsurance || 'No especificada')}</span>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
    
    body.innerHTML = html;
    
    // Attach dynamic event listeners for procedure code auto-fill
    if (step === 1) {
        const procNameSelect = document.getElementById('wiz-procedureName');
        const procCodeInput = document.getElementById('wiz-procedureCode');
        
        if (procNameSelect && procCodeInput) {
            procNameSelect.addEventListener('change', function() {
                if (this.value && this.value !== 'other') {
                    const selectedProc = appState.procedures.find(p => p.id === this.value);
                    if (selectedProc && selectedProc.code) {
                        procCodeInput.value = selectedProc.code;
                        wizardState.data.procedureCode = selectedProc.code;
                    }
                } else {
                    procCodeInput.value = '';
                    wizardState.data.procedureCode = '';
                }
            });
        }

        // Mostrar/ocultar el campo de nombre personalizado al elegir "Otro"
        const customProcInput = document.getElementById('wiz-customProcedureName');
        if (procNameSelect && customProcInput) {
            procNameSelect.addEventListener('change', () => {
                customProcInput.style.display = procNameSelect.value === 'other' ? 'block' : 'none';
            });
        }

        // Agregar nuevo procedimiento desde la lista desplegable
        attachAddNewOption(procNameSelect, 'Nuevo procedimiento', () => {
            openAddProcedureModal(procNameSelect, (np) => {
                repopulateWizardProcedureSelect(procNameSelect, 'procedureName', np);
            });
            return true;
        }, true);
    }
    
    // Prestaciones adicionales: agregar nuevo procedimiento desde la lista (Paso 2)
    if (step === 2) {
        const proc2Select = document.getElementById('wiz-procedureName2');
        const proc3Select = document.getElementById('wiz-procedureName3');
        if (proc2Select) {
            attachAddNewOption(proc2Select, 'Nuevo procedimiento', () => {
                openAddProcedureModal(proc2Select, (np) => {
                    repopulateWizardProcedureSelect(proc2Select, 'procedureName2', np);
                });
                return true;
            }, true);
        }
        if (proc3Select) {
            attachAddNewOption(proc3Select, 'Nuevo procedimiento', () => {
                openAddProcedureModal(proc3Select, (np) => {
                    repopulateWizardProcedureSelect(proc3Select, 'procedureName3', np);
                });
                return true;
            }, true);
        }
    }

    // Datos del paciente: agregar nuevo en comuna/previsión/procedencia (Paso 3)
    if (step === 3) {
        setupWizardCommonSelect('wiz-commune', appState.commonData.communes || [], 'commune', 'Nueva comuna');
        setupWizardCommonSelect('wiz-healthInsurance', appState.commonData.insurances || [], 'healthInsurance', 'Nueva previsión');
        setupWizardCommonSelect('wiz-origin', appState.commonData.origins || [], 'origin', 'Nueva procedencia');
    }
    
    // Auto-fill codes for additional procedures (Step 2)
    if (step === 2) {
        const updateAdditionalProcedureCode = (selectId, inputId) => {
            const select = document.getElementById(selectId);
            const input = document.getElementById(inputId);
            if (select && input) {
                select.addEventListener('change', function() {
                    if (this.value && this.value !== 'other') {
                        const selectedProc = appState.procedures.find(p => p.id === this.value);
                        if (selectedProc && selectedProc.code) {
                            input.value = selectedProc.code;
                        }
                    } else {
                        input.value = '';
                    }
                });
            }
        };
        
        updateAdditionalProcedureCode('wiz-procedureName2', 'wiz-procedureCode2');
        updateAdditionalProcedureCode('wiz-procedureName3', 'wiz-procedureCode3');
    }
    
    // Attach dynamic event listeners for custom fields + "Agregar nuevo" (Paso 5)
    if (step === 5) {
        const entrySel = document.getElementById('wiz-entryDiagnosis');
        const exitSel = document.getElementById('wiz-exitDiagnosis');
        const entryCustom = document.getElementById('wiz-customEntryDiagnosis');
        const exitCustom = document.getElementById('wiz-customExitDiagnosis');
        
        if (entrySel && entryCustom) {
            entrySel.addEventListener('change', () => {
                entryCustom.style.display = entrySel.value === 'custom' ? 'block' : 'none';
            });
        }
        if (exitSel && exitCustom) {
            exitSel.addEventListener('change', () => {
                exitCustom.style.display = exitSel.value === 'custom' ? 'block' : 'none';
            });
        }
        setupWizardDiagnosisSelect('wiz-entryDiagnosis', appState.commonData.entryDiagnoses || [], 'entryDiagnosis');
        setupWizardDiagnosisSelect('wiz-exitDiagnosis', appState.commonData.exitDiagnoses || [], 'exitDiagnosis');
    }
    
    // Botón "Usar descripción predeterminada" (Paso 6)
    if (step === 6) {
        const descBtn = document.getElementById('wiz-useDescSuggestion');
        if (descBtn) {
            descBtn.addEventListener('click', () => {
                const textarea = document.getElementById('wiz-procedureDescription');
                if (textarea) {
                    applyAISuggestion('wiz-procedureDescription', wizardDescriptionSuggestion());
                    wizardState.data.procedureDescription = textarea.value;
                }
            });
        }
    }
    
    // Attach dynamic event listeners for measurements (Step 7)
    if (step === 7) {
        const addMeasCb = document.getElementById('wiz-addMeasurements');
        const measContainer = document.getElementById('wiz-measurementsContainer');
        if (addMeasCb && measContainer) {
            addMeasCb.addEventListener('change', () => {
                measContainer.style.display = addMeasCb.checked ? '' : 'none';
            });
            // Delegación: guardar valores, cascada y "Agregar nuevo" en selects de mediciones
            measContainer.addEventListener('change', function(e) {
                const select = e.target;
                if (select.tagName !== 'SELECT' || !select.dataset.mIndex) return;
                const mi = parseInt(select.dataset.mIndex, 10);
                const pi = parseInt(select.dataset.pIndex, 10);
                if (!wizardState.data.measurementValues) wizardState.data.measurementValues = {};
                const measurement = appState.measurements[mi];
                if (select.value === '__add_new__') {
                    select.value = '';
                    handleWizardMeasurementAddNew(select);
                    return;
                }
                wizardState.data.measurementValues[mi + '_' + pi] = select.value;
                if (measurement) {
                    const param = measurement.parameters[pi];
                    if (param && (param.name === 'Tipo de dispositivo' || param.name === 'Marca')) {
                        if (param.name === 'Tipo de dispositivo') {
                            const bIdx = measurement.parameters.findIndex(x => x.name === 'Marca');
                            const mIdx = measurement.parameters.findIndex(x => x.name === 'Modelo');
                            if (bIdx >= 0) wizardState.data.measurementValues[mi + '_' + bIdx] = '';
                            if (mIdx >= 0) wizardState.data.measurementValues[mi + '_' + mIdx] = '';
                        } else {
                            const mIdx = measurement.parameters.findIndex(x => x.name === 'Modelo');
                            if (mIdx >= 0) wizardState.data.measurementValues[mi + '_' + mIdx] = '';
                        }
                        updateWizardDeviceCascade(mi);
                    }
                }
            });
        }
    }
    
    // Update checkbox visual state
    body.querySelectorAll('.wizard-checkbox-item input[type="checkbox"]').forEach(cb => {
        const update = () => cb.closest('.wizard-checkbox-item').classList.toggle('checked', cb.checked);
        cb.addEventListener('change', update);
        update();
    });
}

// Conectar el botón del wizard al inicializar
document.addEventListener('DOMContentLoaded', () => {
    const wizardBtn = document.getElementById('wizardBtn');
    if (wizardBtn) {
        wizardBtn.addEventListener('click', openWizardModal);
    }
});
