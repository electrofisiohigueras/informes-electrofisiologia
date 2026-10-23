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
                                data-measurement-id="${measurement.id}" data-param-index="${index}" title="Eliminar parámetro" aria-label="Eliminar parámetro">
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

// Marca la inclusión de mediciones en el informe SIN abrir el editor.
// Se usa al restaurar estado (autosave, plantillas, asistente).
function setMeasurementsIncluded(included) {
    if (elements.addMeasurementsCheckbox) elements.addMeasurementsCheckbox.checked = included;
    if (included) {
        renderMeasurements();
        if (elements.measurementsContainer) elements.measurementsContainer.classList.remove('hidden');
    } else {
        closeMeasurementsModal();
    }
    updateMeasurementsSummary();
}

// Handler del checkbox "Incluir mediciones": abre el editor al marcarlo.
function toggleMeasurements() {
    const included = elements.addMeasurementsCheckbox?.checked || false;
    setMeasurementsIncluded(included);
    if (included) openMeasurementsModal();
}

// Abre el modal del editor de mediciones.
function openMeasurementsModal() {
    const modal = document.getElementById('measurementsModal');
    if (!modal) return;
    renderMeasurements();
    updateMeasurementsSummary();
    modal.classList.remove('hidden');
}

// Cierra el modal del editor de mediciones.
function closeMeasurementsModal() {
    const modal = document.getElementById('measurementsModal');
    if (modal) modal.classList.add('hidden');
    updateMeasurementsSummary();
}
window.closeMeasurementsModal = closeMeasurementsModal;

// Aviso permanente del estado de las mediciones junto al botón del editor:
// indica cuántas mediciones y parámetros tienen valores listos para el informe.
function updateMeasurementsSummary() {
    const el = document.getElementById('measurementsSummary');
    if (!el) return;

    if (!elements.addMeasurementsCheckbox?.checked) {
        el.textContent = 'No incluidas en el informe.';
        el.className = 'text-sm text-gray-500';
        return;
    }

    let secciones = 0;
    let parametros = 0;
    appState.measurements.forEach(m => {
        const conValor = (m.parameters || []).filter(p => p.value);
        if (conValor.length > 0) {
            secciones++;
            parametros += conValor.length;
        }
    });
    const personalizados = appState.customParameters.filter(p => p.value).length;

    if (parametros === 0 && personalizados === 0) {
        el.textContent = 'Incluidas, pero aún sin valores ingresados.';
        el.className = 'text-sm text-amber-800 font-medium';
        return;
    }

    const partes = [];
    if (parametros > 0) {
        partes.push(parametros + (parametros === 1 ? ' parámetro con valor' : ' parámetros con valor') +
            ' en ' + secciones + (secciones === 1 ? ' medición' : ' mediciones'));
    }
    if (personalizados > 0) {
        partes.push(personalizados + (personalizados === 1 ? ' parámetro personalizado' : ' parámetros personalizados'));
    }
    el.textContent = '✔ ' + partes.join(' y ') + '.';
    el.className = 'text-sm text-green-800 font-medium';
}

// Mantener el resumen sincronizado ante cualquier cambio dentro del editor
document.addEventListener('change', (e) => {
    if (e.target && e.target.closest && e.target.closest('#measurementsList')) {
        updateMeasurementsSummary();
    }
});
