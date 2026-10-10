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
