// ===================================================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN
// ===================================================================

let appState = {
    autoSaveInterval: null,
    formChanged: false,
    measurements: [],
    customMeasurementCount: 0,
    customParameters: [],
    procedures: [],
    editingProcedureId: null,
    templates: [],
    staff: [],
    additionalProceduresCount: 0,
    commonData: {
        indications: []
    }
};

// ===================================================================
// 3. ELEMENTOS DEL DOM
// ===================================================================

let elements = {};

function initializeElements() {
    elements = {
        // Elementos principales del formulario
        procedureNameSelect: document.getElementById('procedureName'),
        customProcedureInput: document.getElementById('customProcedure'),
        procedureCodeInput: document.getElementById('procedureCode'),
        procedureDate: document.getElementById('procedureDate'),
        startTime: document.getElementById('startTime'),
        endTime: document.getElementById('endTime'),
        
        // Secciones principales
        mainFormSection: document.getElementById('mainForm'),
        proceduresSection: document.getElementById('procedures-section'),
        commonDataSection: document.getElementById('common-data-section'),
        
        // Prestaciones adicionales
        procedureName2Select: document.getElementById('procedureName2'),
        customProcedure2Input: document.getElementById('customProcedure2'),
        procedureCode2Input: document.getElementById('procedureCode2'),
        procedureName3Select: document.getElementById('procedureName3'),
        customProcedure3Input: document.getElementById('customProcedure3'),
        procedureCode3Input: document.getElementById('procedureCode3'),
        addProcedureBtn: document.getElementById('addProcedureBtn'),
        procedure2Section: document.getElementById('procedure2-section'),
        procedure3Section: document.getElementById('procedure3-section'),
        
        // Botones principales
        previewReportBtn: document.getElementById('previewReportBtn'),
        generateReportBtn: document.getElementById('generateReportBtn'),
        clearFormBtn: document.getElementById('clearFormBtn'),
        newReportBtn: document.getElementById('newReportBtn'),
        proceduresBtn: document.getElementById('proceduresBtn'),
        printBtn: document.getElementById('printBtn'),
        
        // Reporte generado
        generatedReport: document.getElementById('generatedReport'),
        reportHeader: document.getElementById('reportHeader'),
        reportContent: document.getElementById('reportContent'),
        copyFormattedReportBtn: document.getElementById('copyFormattedReportBtn'),

        // Diagnósticos
        entryDiagnosisSelect: document.getElementById('entryDiagnosis'),
        customEntryDiagnosis: document.getElementById('customEntryDiagnosis'),
        exitDiagnosisSelect: document.getElementById('exitDiagnosis'),
        customExitDiagnosis: document.getElementById('customExitDiagnosis'),
        admissionReason: document.getElementById('admissionReason'),
        
        // Navegación y dropdown
        dropdown: document.querySelector('.dropdown'),
        dropdownBtn: document.querySelector('.dropdown-btn'),
        saveIndicator: document.getElementById('saveIndicator'),
        
        // Mediciones
        addMeasurementsCheckbox: document.getElementById('addMeasurements'),
        measurementsContainer: document.getElementById('measurementsContainer'),
        measurementsList: document.getElementById('measurementsList'),
        addCustomMeasurementBtn: document.getElementById('addCustomMeasurement'),
        
        // Gestión de procedimientos
        saveProcedureBtn: document.getElementById('saveProcedureBtn'),
        cancelEditProcedureBtn: document.getElementById('cancelEditProcedureBtn'),
        proceduresListContainer: document.getElementById('proceduresListContainer'),
        newProcedureName: document.getElementById('newProcedureName'),
        newProcedureCode: document.getElementById('newProcedureCode'),
        newProcedureDescription: document.getElementById('newProcedureDescription'),
        procedureFormTitle: document.getElementById('procedureFormTitle'),
        proceduresSection: document.getElementById('procedures-section'),
        mainFormSection: document.getElementById('mainForm'),
        backToMainBtn: document.getElementById('backToMainBtn'),
        
        // Pestañas
        tabButtons: document.querySelectorAll('.nav-tabs .tab-btn'),
        
        // Datos del paciente
        origin: document.getElementById('origin'),
        commune: document.getElementById('commune'),
        healthInsurance: document.getElementById('healthInsurance'),
        
        // Plantillas
        loadTemplate: document.getElementById('loadTemplate'),
        
        // Personal médico
        mainDoctorCheckboxes: document.getElementById('mainDoctorCheckboxes'),
        assistantNurseCheckboxes: document.getElementById('assistantNurseCheckboxes'),
        tensCheckboxes: document.getElementById('tensCheckboxes'),
        
        // Dispositivos
        devicesBtn: document.getElementById('devicesBtn')
    };
    
    // Verificar elementos críticos
    const criticalElements = [
        'procedureNameSelect', 'previewReportBtn', 'clearFormBtn', 
        'newReportBtn', 'proceduresBtn', 'saveProcedureBtn', 'devicesBtn'
    ];
    
    criticalElements.forEach(elementKey => {
        if (!elements[elementKey]) {
            console.warn(`Elemento crítico no encontrado: ${elementKey}`);
        }
    });
}
