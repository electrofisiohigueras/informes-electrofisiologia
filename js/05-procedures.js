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
                    <button type="button" class="text-blue-500 hover:text-blue-700 edit-procedure" data-id="${procedure.id}" aria-label="Editar procedimiento">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="text-red-500 hover:text-red-700 delete-procedure" data-id="${procedure.id}" aria-label="Eliminar procedimiento">
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
                procedure.updatedAt = new Date().toISOString();
            }
            appState.editingProcedureId = null;
        } else {
            const now = new Date().toISOString();
            const newProcedure = {
                id: Date.now().toString(),
                name,
                code,
                description: description || '',
                createdAt: now,
                updatedAt: now
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
