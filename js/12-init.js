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

    // Selector "Cargar Plantilla" del encabezado de Datos del Procedimiento
    // Botón visible de gestión de plantillas (junto al selector de carga)
    const manageTemplatesBtn = document.getElementById('manageTemplatesBtn');
    if (manageTemplatesBtn) {
        manageTemplatesBtn.addEventListener('click', () => showTemplatesModal());
    }

    if (elements.loadTemplate) {
        elements.loadTemplate.addEventListener('change', function() {
            if (this.value) {
                loadTemplate(this.value);
            }
        });
    }

    if (elements.clearFormBtn) {
        elements.clearFormBtn.addEventListener('click', async () => {
            const ok = await showConfirmDialog(
                'Limpiar formulario',
                '¿Desea limpiar el formulario? Se perderán los datos no guardados.',
                { confirmText: 'Limpiar' }
            );
            if (ok) clearForm();
        });
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

    // Imprimir (solo si hay un informe generado; evita imprimir una página en blanco)
    if (elements.printBtn) {
        elements.printBtn.addEventListener('click', () => {
            const report = elements.generatedReport;
            const content = elements.reportContent;
            if (!report || report.classList.contains('hidden') || !content || !content.innerHTML.trim()) {
                showNotification('Primero genere el informe con "Vista Previa" antes de imprimir.', 'warning');
                return;
            }
            window.print();
        });
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

    // Quitar el resaltado de error en cuanto el usuario corrige el campo
    document.addEventListener('input', (e) => {
        const el = e.target;
        if (el.classList && el.classList.contains('input-error')) {
            el.classList.remove('input-error');
            const msg = document.getElementById(el.id + 'Error');
            if (msg) msg.classList.add('hidden');
        }
    });
}
