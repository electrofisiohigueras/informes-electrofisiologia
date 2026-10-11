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
            <button type="button" class="text-red-500 hover:text-red-700 ml-2 ${deleteClass}" data-value="${escapeHtml(item)}" title="Eliminar" aria-label="Eliminar">
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
