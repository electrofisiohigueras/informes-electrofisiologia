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
