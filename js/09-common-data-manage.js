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
    // Botón "Restaurar catálogos desde la web" (solo versión publicada en HTTPS)
    const restoreBtn = document.getElementById('restoreCatalogsBtn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', restoreCatalogsFromWeb);
    }
}

// Catálogos compartidos que sincroniza "Restaurar catálogos": listas de
// datos comunes + catálogo de modelos por tipo y marca. Lo local de cada
// usuario (personal, plantillas, procedimientos, valores de mediciones)
// nunca se toca.
const SHARED_CATALOG_LISTS = [
    'communes', 'insurances', 'origins', 'entryDiagnoses', 'exitDiagnoses',
    'deviceBrands', 'deviceTypes', 'stimulationPolarities', 'indications'
];

function applySharedCatalogs(data) {
    if (!data || !data.commonData) return false;
    let applied = 0;
    SHARED_CATALOG_LISTS.forEach(key => {
        const incoming = data.commonData[key];
        if (Array.isArray(incoming)) {
            appState.commonData[key] = incoming.filter(v => typeof v === 'string' && v.trim());
            applied++;
        }
    });
    const models = data.commonData.deviceModelsByTypeAndBrand;
    if (models && typeof models === 'object' && !Array.isArray(models)) {
        const clean = {};
        Object.keys(models).forEach(type => {
            if (models[type] && typeof models[type] === 'object' && !Array.isArray(models[type])) {
                clean[type] = Object.keys(models[type]).reduce((acc, brand) => {
                    if (Array.isArray(models[type][brand])) {
                        acc[brand] = models[type][brand].filter(v => typeof v === 'string' && v.trim());
                    }
                    return acc;
                }, {});
            }
        });
        if (Object.keys(clean).length > 0) {
            appState.commonData.deviceModelsByTypeAndBrand = clean;
            applied++;
        }
    }
    return applied > 0;
}

async function restoreCatalogsFromWeb() {
    if (window.location.protocol === 'file:') {
        showNotification('Restaurar catálogos requiere la versión publicada (URL de GitHub Pages). En la copia local los catálogos dependen de data.json y localStorage.', 'info');
        return;
    }
    const ok = await showConfirmDialog(
        'Restaurar catálogos',
        'Se reemplazarán los catálogos compartidos (comunas, previsiones, procedencias, diagnósticos, marcas/tipos de dispositivos e indicaciones) por la versión publicada en GitHub. Los elementos agregados localmente en esas listas se perderán.',
        { confirmText: 'Restaurar', cancelText: 'Cancelar' }
    );
    if (!ok) return;
    try {
        // Cache-busting para recibir la versión recién publicada, no la del caché.
        const response = await fetch('data.json?t=' + Date.now());
        if (!response.ok) throw new Error('data.json HTTP ' + response.status);
        const data = await response.json();
        if (!applySharedCatalogs(data)) throw new Error('estructura de catálogos no reconocida');
        saveAllData();
        updateCommonDataDropdowns();
        updateCommonDataLists();
        showNotification('Catálogos restaurados desde la versión publicada', 'success');
    } catch (error) {
        console.error('Error al restaurar catálogos:', error);
        showNotification('No se pudieron restaurar los catálogos. Verifique su conexión e intente nuevamente.', 'error');
    }
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
