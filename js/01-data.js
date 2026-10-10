// ===================================================================
// SISTEMA DE INFORMES MÉDICOS - ELECTROFISIOLOGÍA
// Archivo JavaScript reorganizado y estructurado
// ===================================================================

// ===================================================================
// 1. CONFIGURACIÓN Y DATOS INICIALES
// ===================================================================

let predefinedData = {};
let defaultMeasurements = [];
let defaultIndications = [];

async function loadPredefinedData() {
    // Si estamos en protocolo file://, saltar fetch para evitar error CORS en consola
    if (window.location.protocol === 'file:') {
        console.warn('Ejecución local detectada (file://). Usando datos de respaldo para evitar errores CORS.');
        predefinedData = fallbackData;
        defaultMeasurements = fallbackData.defaultMeasurements;
        appState.commonData.indications = fallbackData.commonData.indications || [];
        return fallbackData;
    }

    try {
        const response = await fetch('data.json');
        const data = await response.json();
        predefinedData = data;
        defaultMeasurements = data.defaultMeasurements;
        appState.commonData.indications = data.commonData?.indications || [];
        return data;
    } catch (error) {
        console.error('Error loading data.json:', error);
        // Fallback to hardcoded data
        predefinedData = fallbackData;
        defaultMeasurements = fallbackData.defaultMeasurements;
        appState.commonData.indications = fallbackData.commonData.indications || [];
        return fallbackData;
    }
}

const fallbackData = {
            defaultMeasurements: [
                {
                    id: 1,
                    name: "Ventrículo derecho",
                    parameters: [
                        { name: "Sensibilidad", value: "" },
                        { name: "Impedancia", value: "" },
                        { name: "Umbral", value: "" },
                        { name: "Impedancia de choque", value: "" },
                        { name: "Conector", value: "", options: ["DF1", "DF4"] },
                        { name: "Coil", value: "", options: ["Monocoil", "Bicoil"] },
                        { name: "Terapias FV", value: "", range: "150-300 lpm" },
                        { name: "Terapias TV", value: "", range: "100-200 lpm" }
                    ]
                },
                {
                    id: 2,
                    name: "Aurícula derecha",
                    parameters: [
                        { name: "Sensibilidad", value: "" },
                        { name: "Impedancia", value: "" },
                        { name: "Umbral", value: "" }
                    ]
                },
                {
                    id: 3,
                    name: "Ventrículo izquierdo",
                    parameters: [
                        { name: "Sensibilidad", value: "" },
                        { name: "Impedancia", value: "" },
                        { name: "Umbral", value: "" },
                        { name: "Polaridad de estimulación", value: "", options: [] },
                        { name: "Conector", value: "", options: ["IS1", "IS4"] },
                        { name: "Retraso V-V", value: "", range: "0-120 ms" }
                    ]
                },
                {
                    id: 4,
                    name: "Dispositivo implantado",
                    parameters: [
                        { name: "Tipo de dispositivo", value: "", options: [] },
                        { name: "Marca", value: "", options: [] },
                        { name: "Modelo", value: "", options: [] },
                        { name: "Número de serie", value: "" }
                    ]
                }
            ],
            commonData: {
                communes: ['Concepción', 'Talcahuano', 'Chiguayante', 'San Pedro de la Paz', 'Hualpén', 'Coronel', 'Lota', 'Tomé'],
                insurances: ['FONASA', 'ISAPRE', 'Particular', 'FF.AA.'],
                origins: ['Consulta Externa', 'Urgencia', 'Hospitalización', 'Derivación'],
                entryDiagnoses: ['Arritmia cardíaca', 'Bradiarritmia', 'Taquiarritmia', 'Fibrilación auricular', 'Bloqueo cardíaco'],
                exitDiagnoses: ['Procedimiento exitoso', 'Implante de marcapasos', 'Ablación exitosa', 'Estudio electrofisiológico completado'],
                deviceBrands: ['Medtronic', 'Boston Scientific', 'St. Jude Medical', 'Biotronik', 'Sorin', 'Vitatron'],
                deviceTypes: ['Marcapaso', 'Resincronizador', 'Desfibrilador'],
                stimulationPolarities: ['Bipolar', 'Unipolar', 'Extended Bipolar', 'LV Tip to RV Ring', 'LV Ring to RV Coil'],
                deviceModelsByTypeAndBrand: {
                    'Marcapaso': {
                        'Medtronic': ['Azure', 'Advisa', 'Versa', 'Micra'],
                        'Boston Scientific': ['Altrua', 'Ingenio', 'Accolade'],
                        'St. Jude Medical': ['Assurity', 'Endurity', 'Microny'],
                        'Biotronik': ['Edora', 'Elogia', 'Iperia'],
                        'Sorin': ['Reply', 'Esprit', 'Ovatio'],
                        'Vitatron': ['C-series', 'T-series', 'X-series']
                    },
                    'Resincronizador': {
                        'Medtronic': ['Claria', 'Viva', 'Crome'],
                        'Boston Scientific': ['Intua', 'Visionist', 'Altrua'],
                        'St. Jude Medical': ['Unify', 'Quadra', 'Fortify'],
                        'Biotronik': ['Estella', 'Ilesto', 'Etrinsa'],
                        'Sorin': ['Paradym', 'Platinum', 'Reply CRT'],
                        'Vitatron': ['C40', 'T65', 'X80']
                    },
                    'Desfibrilador': {
                        'Medtronic': ['Evera', 'Viva', 'Crome'],
                        'Boston Scientific': ['Emblem', 'Inogen', 'Vitalio'],
                        'St. Jude Medical': ['Ellipse', 'Fortify', 'Unify'],
                        'Biotronik': ['Ilesto', 'Iperia', 'Etrinsa'],
                        'Sorin': ['Platinum', 'Paradym', 'Ovatio'],
                        'Vitatron': ['C-series ICD', 'T-series ICD', 'X-series ICD']
                    }
                },
                indications: []
            }
        };
