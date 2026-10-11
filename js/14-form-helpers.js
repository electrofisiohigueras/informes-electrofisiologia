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

        clearFormErrorHighlights();
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
    // sr-only (estilo en style.css): oculto visualmente pero operable por teclado
    checkbox.className = 'staff-checkbox';
    checkbox.setAttribute('aria-label', person.name);

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
