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

// Solicita cerrar el asistente: pide confirmación si ya se ingresaron datos,
// para evitar perder el trabajo de varios pasos por un clic accidental.
async function requestCloseWizard() {
    // Capturar los datos del paso actual antes de decidir
    wizardState.data = { ...wizardState.data, ...collectWizardStepData(wizardState.currentStep) };
    const hasData = wizardState.data && Object.keys(wizardState.data).length > 0;
    if (hasData) {
        const ok = await showConfirmDialog(
            'Cerrar asistente',
            'Ha ingresado datos en el asistente. Si lo cierra ahora, se perderán. ¿Desea continuar?',
            { confirmText: 'Cerrar sin guardar', cancelText: 'Seguir editando' }
        );
        if (!ok) return;
    }
    closeWizardModal();
}
window.requestCloseWizard = requestCloseWizard;

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
