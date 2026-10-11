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
                <button type="button" class="delete-template-btn text-red-500 hover:text-red-700" data-id="${template.id}" aria-label="Eliminar plantilla">
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
            <button type="button" class="delete-staff-btn text-red-500 hover:text-red-700" data-id="${person.id}" aria-label="Eliminar personal">
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
            <button type="button" class="text-red-500 modal-delete-device-type" data-value="${escapeHtml(type)}" aria-label="Eliminar tipo de dispositivo">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    brandList.innerHTML = appState.commonData.deviceBrands.map(brand => `
        <div class="flex justify-between items-center py-1">
            <span>${escapeHtml(brand)}</span>
            <button type="button" class="text-red-500 modal-delete-device-brand" data-value="${escapeHtml(brand)}" aria-label="Eliminar marca de dispositivo">
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
                <button type="button" class="text-red-500 modal-delete-device-model" data-type="${escapeHtml(type)}" data-brand="${escapeHtml(brand)}" data-model="${escapeHtml(model)}" aria-label="Eliminar modelo de dispositivo">
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
