// ===================================================================
// 12. VALIDACIÓN Y GENERACIÓN DE REPORTES
// ===================================================================

// Funciones implementadas completamente
// Cada error es { fieldId, message }: fieldId permite resaltarlo en el formulario.
function validateForm() {
    const errors = [];
    
    if (!elements.procedureNameSelect?.value && !elements.customProcedureInput?.value) {
        errors.push({ fieldId: 'procedureName', message: 'Nombre del procedimiento es obligatorio' });
    }
    
    if (!elements.procedureCodeInput?.value) {
        errors.push({ fieldId: 'procedureCode', message: 'Código del procedimiento es obligatorio' });
    }
    
    if (!elements.procedureDate?.value) {
        errors.push({ fieldId: 'procedureDate', message: 'La fecha del procedimiento es obligatoria' });
    }
    
    if (!elements.startTime?.value) {
        errors.push({ fieldId: 'startTime', message: 'Hora de inicio es obligatoria' });
    }
    
    if (!elements.endTime?.value) {
        errors.push({ fieldId: 'endTime', message: 'Hora de término es obligatoria' });
    }
    
    if (!elements.commune?.value) {
        errors.push({ fieldId: 'commune', message: 'Comuna de procedencia es obligatoria' });
    }
    
    if (!elements.healthInsurance?.value) {
        errors.push({ fieldId: 'healthInsurance', message: 'Previsión de salud es obligatoria' });
    }
    
    if (!elements.origin?.value) {
        errors.push({ fieldId: 'origin', message: 'Procedencia es obligatoria' });
    }
    
    return errors;
}

// Resalta en el formulario los campos con error: borde rojo, mensaje inline bajo
// el campo, activación de la pestaña contenedora y scroll al primero.
function highlightFormErrors(errors) {
    clearFormErrorHighlights();
    if (!errors || errors.length === 0) return;

    // Pestaña que contiene cada campo que vive dentro de las pestañas
    const TAB_OF_FIELD = {
        commune: 'patient-data',
        healthInsurance: 'patient-data',
        origin: 'patient-data'
    };

    let firstElement = null;
    errors.forEach(err => {
        const el = document.getElementById(err.fieldId);
        if (!el) return;
        el.classList.add('input-error');
        const msg = document.getElementById(err.fieldId + 'Error');
        if (msg) msg.classList.remove('hidden');
        if (!firstElement) firstElement = el;

        const tabId = TAB_OF_FIELD[err.fieldId];
        if (tabId) {
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            if (tabBtn && !tabBtn.classList.contains('active')) tabBtn.click();
        }
    });

    if (firstElement) {
        // Esperar a que la pestaña correspondiente se muestre antes de desplazar
        setTimeout(() => {
            firstElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            try { firstElement.focus({ preventScroll: true }); } catch (e) { /* algunos campos no aceptan focus */ }
        }, 150);
    }
}

// Elimina todos los resaltados de validación del formulario.
function clearFormErrorHighlights() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
}

function previewReport() {
    generateReport();
}

function generateReport() {
    const errors = validateForm();
    if (errors.length > 0) {
        showValidationErrors(errors.map(e => e.message));
        highlightFormErrors(errors);
        return;
    }
    
    clearFormErrorHighlights();
    
    // Advertencia no bloqueante: los procedimientos pueden cruzar la medianoche
    if (elements.startTime?.value && elements.endTime?.value && elements.endTime.value < elements.startTime.value) {
        showNotification('Advertencia: la hora de término es anterior a la de inicio. Verifique si el procedimiento cruzó la medianoche.', 'warning');
    }
    
    try {
        const reportData = collectReportData();
        const reportHtml = generateReportHtml(reportData);
        
        if (elements.reportContent && elements.generatedReport) {
            elements.reportContent.innerHTML = reportHtml;
            elements.generatedReport.classList.remove('hidden');
        }

        // Vista previa en modal: no obliga a desplazarse por la página.
        // La fuente de verdad sigue siendo #reportContent (dentro de
        // #generatedReport), sobre la que operan Copiar e Imprimir.
        openReportPreviewModal(reportHtml);
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error al generar el reporte', 'error');
    }
}

// Muestra el informe en un modal de vista previa con acciones de
// Cerrar, Imprimir y Copiar Informe. El HTML mostrado es el mismo que
// queda en #reportContent, por lo que el pipeline de copiado no cambia.
function openReportPreviewModal(reportHtml) {
    // Cerrar una vista previa anterior si existe
    const prev = document.querySelector('.report-preview-overlay');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.className = 'report-preview-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15, 23, 42, 0.5);';

    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.maxWidth = '64rem';
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Vista Previa del Informe</h2>
        </div>
        <div class="modal-body report-preview-body"></div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-role="close">Cerrar</button>
            <button type="button" class="btn btn-secondary" data-role="print"><i class="fas fa-print mr-1"></i> Imprimir</button>
            <button type="button" class="btn text-white shadow-lg" data-role="copy" style="background: linear-gradient(135deg, #f59e0b, #ea580c);">
                <i class="fas fa-paint-brush mr-1"></i> Copiar Informe
            </button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('.report-preview-body').innerHTML = reportHtml;

    const close = () => {
        document.removeEventListener('keydown', handleKey);
        overlay.remove();
    };
    const handleKey = (e) => {
        if (e.key === 'Escape') close();
    };

    modal.querySelector('[data-role="close"]').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', handleKey);

    modal.querySelector('[data-role="print"]').addEventListener('click', () => window.print());

    const copyBtn = modal.querySelector('[data-role="copy"]');
    copyBtn.addEventListener('click', () => copyFormattedReport(copyBtn));
}
window.openReportPreviewModal = openReportPreviewModal;

// Genera el informe sin la validación estricta del formulario principal.
// Se usa al terminar el asistente, que ya validó sus pasos obligatorios
// durante la navegación, evitando el alert de campos faltantes.
function renderReportSilently() {
    try {
        const reportData = collectReportData();
        const reportHtml = generateReportHtml(reportData);
        if (elements.reportContent && elements.generatedReport) {
            elements.reportContent.innerHTML = reportHtml;
            elements.generatedReport.classList.remove('hidden');
        }
        // Mismo destino que el botón "Vista Previa": modal con Copiar/Imprimir
        openReportPreviewModal(reportHtml);
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('No se pudo generar el informe. Revise los datos en el formulario principal.', 'error');
    }
}

function collectReportData() {
    const procedureName = elements.procedureNameSelect?.value === 'other' ?
        elements.customProcedureInput?.value :
        elements.procedureNameSelect?.options[elements.procedureNameSelect.selectedIndex]?.text;

    const entryDiagnosis = elements.entryDiagnosisSelect?.value === 'custom' ?
        elements.customEntryDiagnosis?.value : elements.entryDiagnosisSelect?.value;

    const exitDiagnosis = elements.exitDiagnosisSelect?.value === 'custom' ?
        elements.customExitDiagnosis?.value : elements.exitDiagnosisSelect?.value;

    return {
        // Procedimiento
        procedureName: procedureName || '',
        procedureCode: elements.procedureCodeInput?.value || '',
        procedureDate: elements.procedureDate?.value || '',
        startTime: elements.startTime?.value || '',
        endTime: elements.endTime?.value || '',
        // Datos clínicos
        commune: elements.commune?.value || '',
        healthInsurance: elements.healthInsurance?.value || '',
        origin: elements.origin?.value || '',
        entryDiagnosis: entryDiagnosis || '',
        exitDiagnosis: exitDiagnosis || '',
        admissionReason: elements.admissionReason?.value || '',
        procedureDescription: document.getElementById('procedureDescription')?.value || '',
        additionalIndications: document.getElementById('additionalIndications')?.value || '',
        // Personal
        mainDoctor: getSelectedStaff('mainDoctor'),
        assistantNurse: getSelectedStaff('assistantNurse'),
        tens: getSelectedStaff('tens'),
        // Indicaciones y mediciones
        indications: getSelectedIndications(),
        measurements: elements.addMeasurementsCheckbox?.checked ? appState.measurements : [],
        customParameters: appState.customParameters,
        additionalProcedures: getAdditionalProcedures()
    };
}


function generateReportHtml(data) {
    // Fecha del procedimiento ingresada por el usuario (respaldo: fecha de hoy)
    const currentDate = formatDateEsCL(data.procedureDate) ||
        new Date().toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

    /* Numeración secuencial de secciones: el contador incrementa en el orden
       en que se construye el HTML, que coincide con el orden visual del
       informe: 1 Datos del Procedimiento, 2 Personal Médico + Prestaciones
       Adicionales (2.1 / 2.2, lado a lado; 2 solo si no hay adicionales),
       3 Diagnósticos, 4 Descripción, 5 Mediciones,
       6 Dispositivo Implantado, 7 Indicaciones. */
    let sectionNo = 0;
    const sectionTitle = (title) => {
        sectionNo += 1;
        return `<div class="report-box-title">${sectionNo}. ${title}</div>`;
    };
    // Título principal
    let html = `
    <div class="report-main-title" style="text-align:center;">${escapeHtml(data.procedureName).toUpperCase()}</div>
    `;

    // Datos del Procedimiento: recuadro a ancho completo
    html += `
        <div class="report-box" data-kind="procedure" style="width:100%;">
            ${sectionTitle('Datos del Procedimiento')}
            <table class="report-table report-data-table">
                <tbody>
                    <tr class="report-data-header-row">
                        <th>Nombre</th>
                        <th>Código</th>
                        <th>Fecha</th>
                        <th>Hora de Inicio</th>
                        <th>Hora de Término</th>
                    </tr>
                    <tr>
                        <td>${escapeHtml(data.procedureName)}</td>
                        <td>${escapeHtml(data.procedureCode)}</td>
                        <td>${currentDate}</td>
                        <td>${data.startTime || '—'}</td>
                        <td>${data.endTime || '—'}</td>
                    </tr>
                    <tr class="report-data-header-row">
                        <th>Comuna</th>
                        <th>Previsión</th>
                        <th colspan="3">Procedencia</th>
                    </tr>
                    <tr>
                        <td>${escapeHtml(data.commune) || '—'}</td>
                        <td>${escapeHtml(data.healthInsurance) || '—'}</td>
                        <td colspan="3">${escapeHtml(data.origin) || '—'}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Sección 2: Personal Médico (2.1); si hay Prestaciones Adicionales se
    // emparejan lado a lado como 2.1 / 2.2 dentro de la misma sección 2.
    // Si no hay adicionales, Personal Médico queda solo como sección 2.
    let additionalCell = '';
    if (data.additionalProcedures && data.additionalProcedures.length > 0) {
        additionalCell = `
        <div class="report-box" data-kind="additional" style="width:100%;">
            <div class="report-box-title">2.2 Prestaciones Adicionales</div>
            <table class="report-table report-data-table">
                <tbody>
                    <tr class="report-data-header-row">
                        <th>Procedimiento</th>
                        <th style="width:30%;">Código</th>
                    </tr>
                    ${data.additionalProcedures.map(proc => `
                        <tr>
                            <td>${escapeHtml(proc.name)}</td>
                            <td>${escapeHtml(proc.code)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
    }

    const pairedWithAdditional = additionalCell !== '';
    const staffTitleHtml = pairedWithAdditional
        ? `<div class="report-box-title">2.1 Personal Médico</div>`
        : sectionTitle('Personal Médico');
    const staffBoxHtml = `
    <div class="report-box" data-kind="staff" style="width:100%;">
        ${staffTitleHtml}
        <table class="report-table report-data-table">
            <tbody>
                <tr class="report-data-header-row">
                    <th style="width:35%;">Rol</th>
                    <th>Participantes</th>
                </tr>
                <tr>
                    <td class="report-label-cell">Médico(s) Principal(es)</td>
                    <td>${data.mainDoctor.length > 0 ? escapeHtml(data.mainDoctor.join(', ')) : 'No especificado'}</td>
                </tr>
                <tr>
                    <td class="report-label-cell">Enfermero(a/os)</td>
                    <td>${data.assistantNurse.length > 0 ? escapeHtml(data.assistantNurse.join(', ')) : 'No especificado'}</td>
                </tr>
                <tr>
                    <td class="report-label-cell">TENS</td>
                    <td>${data.tens.length > 0 ? escapeHtml(data.tens.join(', ')) : 'No especificado'}</td>
                </tr>
            </tbody>
        </table>
    </div>`;

    if (pairedWithAdditional) {
        sectionNo += 1; // la sección 2 la comparten 2.1 y 2.2
        html += `
        <table class="layout-table">
            <tbody>
                <tr>
                    <td style="width:50%;vertical-align:top;padding-right:12px;">${staffBoxHtml}</td>
                    <td style="width:50%;vertical-align:top;padding-left:12px;">${additionalCell}</td>
                </tr>
            </tbody>
        </table>`;
    } else {
        html += staffBoxHtml;
    }

    // Diagnósticos: recuadro a ancho completo, diagnostics + motivo de ingreso (sección 3)
    html += `
    <div class="report-box" data-kind="diagnostics" style="width:100%;">
        ${sectionTitle('Diagnósticos')}
        <table class="report-table report-data-table">
            <tbody>
                <tr class="report-data-header-row">
                    <th>Diagnóstico de Ingreso</th>
                    <th>Diagnóstico de Egreso</th>
                </tr>
                <tr>
                    <td>${escapeHtml(data.entryDiagnosis) || 'No especificado'}</td>
                    <td>${escapeHtml(data.exitDiagnosis) || 'No especificado'}</td>
                </tr>
            </tbody>
        </table>
        ${data.admissionReason ? `
        <div class="report-subsection">
            <div class="report-subsection-title">Motivo de Ingreso</div>
            <p class="report-item" style="white-space:pre-line;">${escapeHtml(data.admissionReason)}</p>
        </div>` : ''}
    </div>`;

    // Descripción del Procedimiento: recuadro a ancho completo (sección 4)
    if (data.procedureDescription) {
        html += `
        <div class="report-box" data-kind="description" style="width:100%;">
            ${sectionTitle('Descripción del Procedimiento')}
            <p class="report-item" style="white-space:pre-line;">${escapeHtml(data.procedureDescription)}</p>
        </div>`;
    }

    // Prestaciones Adicionales y Mediciones: recuadros a ancho completo

    // --- Mediciones: una sola tabla tipo matriz. Las columnas son los
    //     parámetros que tengan valor (unión en orden de aparición) y las
    //     filas, las mediciones. La primera celda de cabecera queda vacía.
    //     Los valores solo aparecen si fueron ingresados; lo demás se deja
    //     en blanco. ---
    // El aparato "Dispositivo implantado" va en una TABLA DISTINTA (sección
    // aparte tras la matriz): se excluye de la matriz y de la unión de
    // columnas. Búsqueda por nombre, insensible a mayúsculas.
    const DEVICE_ROW_NAME = 'dispositivo implantado';
    let measurementsRows = '';
    const paramLabels = [];
    const apparatusRows = [];
    const deviceParams = [];

    if (data.measurements && data.measurements.length > 0) {
        data.measurements.forEach(measurement => {
            const valued = measurement.parameters.filter(param => param.value);
            if (valued.length === 0) return;
            if (measurement.name.trim().toLowerCase() === DEVICE_ROW_NAME) {
                valued.forEach(param => deviceParams.push(param));
                return;
            }
            const cells = {};
            valued.forEach(param => {
                if (!paramLabels.includes(param.name)) paramLabels.push(param.name);
                cells[param.name] = param.value;
            });
            apparatusRows.push({ name: measurement.name, cells: cells });
        });

        if (apparatusRows.length > 0) {
            measurementsRows += `
                <tr class="report-data-header-row">
                    <th></th>${paramLabels.map(label => `<th>${escapeHtml(label)}</th>`).join('')}
                </tr>
                ${apparatusRows.map(row => `
                <tr>
                    <td class="report-label-cell">${escapeHtml(row.name)}</td>
                    ${paramLabels.map(label => `<td>${row.cells[label] ? escapeHtml(row.cells[label]) : ''}</td>`).join('')}
                </tr>`).join('')}`;
        }
    }

    // Parámetros personalizados (si hay): banda propia tras la matriz
    const valuedCustomParams = (data.customParameters || []).filter(param => param.value);
    if (valuedCustomParams.length > 0) {
        measurementsRows += `
            <tr class="report-measurement-title-row">
                <td colspan="${paramLabels.length + 1}" class="report-measurement-title">Parámetros Personalizados</td>
            </tr>
            ${valuedCustomParams.map(param => `
            <tr>
                <td class="report-label-cell">${escapeHtml(param.name)}</td>
                <td colspan="${Math.max(paramLabels.length, 1)}">${escapeHtml(param.value)}</td>
            </tr>`).join('')}`;
    }

    // --- Caja de mediciones (condicional) ---
    let measurementsCell = '';
    if (measurementsRows) {
        measurementsCell = `
        <div class="report-box" data-kind="measurements" style="width:100%;">
            ${sectionTitle('Mediciones')}
            <table class="report-table report-measurements-table">
                <tbody>${measurementsRows}</tbody>
            </table>
        </div>`;
    }

    // --- Caja de Dispositivo Implantado (tabla distinta de la matriz) ---
    let deviceCell = '';
    if (deviceParams.length > 0) {
        deviceCell = `
        <div class="report-box" data-kind="measurements" style="width:100%;">
            ${sectionTitle('Dispositivo Implantado')}
            <table class="report-table report-device-table">
                <tbody>
                    ${deviceParams.map(param => `
                    <tr>
                        <td class="report-label-cell" style="width:30%;">${escapeHtml(param.name)}</td>
                        <td>${escapeHtml(param.value)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    }

    // Mediciones y Dispositivo Implantado: cada recuadro a ancho completo
    if (measurementsCell) {
        html += measurementsCell;
    }
    if (deviceCell) {
        html += deviceCell;
    }

    // Indicaciones post-procedimiento (ancho completo)
    if (data.indications.length > 0 || data.additionalIndications) {
        html += `
        <div class="report-box" data-kind="indications" style="width:100%;">
            ${sectionTitle('Indicaciones Post-Procedimiento')}
            ${data.indications.length > 0 ? `
                <ul class="report-indications-list">
                    ${data.indications.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>` : ''}
            ${data.additionalIndications ? `
                <p class="report-item" style="white-space:pre-line;margin-top:0.5rem;">
                    ${escapeHtml(data.additionalIndications)}
                </p>` : ''}
        </div>`;
    }

    return html;
}





// ===================================================================
// 12.1 ASISTENCIA IA LOCAL (CONSTRUCCIÓN DE CONTEXTO)
// ===================================================================

function buildAIContext(section) {
    // Recolectar datos actuales del formulario ya mapeados en collectReportData
    const data = collectReportData();

    // Armar estructura base común
    const base = {
        fecha: new Date().toISOString(),
        procedimiento: {
            nombre: data.procedureName,
            codigo: data.procedureCode,
            fecha: data.procedureDate,
            horaInicio: data.startTime,
            horaTermino: data.endTime,
            adicionales: data.additionalProcedures
        },
        paciente: {
            comuna: data.commune,
            prevision: data.healthInsurance,
            procedencia: data.origin
        },
        diagnosticos: {
            ingreso: data.entryDiagnosis,
            egreso: data.exitDiagnosis
        },
        personal: {
            medicos: data.mainDoctor,
            enfermeria: data.assistantNurse,
            tens: data.tens
        },
        mediciones: data.measurements,
        indicacionesSeleccionadas: data.indications
    };

    // Especializar por sección solicitada
    if (section === 'admission') {
        return {
            objetivo: 'Redactar motivo de ingreso clínicamente claro y conciso (2-4 frases).',
            tono: 'formal, médico',
            idioma: 'es-CL',
            contexto: base,
            campoObjetivo: 'admissionReason',
            placeholders: {
                sintomasClave: '[dolor, palpitaciones, síncope, etc.]',
                antecedentesRelevantes: '[HTA, FA, IAM previo, etc.]'
            }
        };
    }

    if (section === 'procedure') {
        return {
            objetivo: 'Redactar descripción detallada, cronológica y precisa del procedimiento (120-200 palabras).',
            incluir: [
                'acceso vascular', 'tipo de catéter/electrodos', 'parámetros programados',
                'hallazgos relevantes', 'complicaciones', 'resultado inmediato'
            ],
            tono: 'formal, médico',
            idioma: 'es-CL',
            contexto: base,
            campoObjetivo: 'procedureDescription'
        };
    }

    if (section === 'indications') {
        return {
            objetivo: 'Sugerir indicaciones post-procedimiento específicas para el caso del paciente.',
            formato: 'viñetas cortas',
            tono: 'claro, práctico',
            idioma: 'es-CL',
            contexto: base,
            campoObjetivo: 'additionalIndications'
        };
    }

    return { contexto: base };
}

function showAIModal(title, payload) {
    const content = `
        <div class="mb-3">
            <p class="text-sm text-gray-600 mb-2">Copia este contexto y pégalo en tu asistente IA local. Puedes editarlo antes si lo necesitas.</p>
            <textarea id="aiPayload" class="form-textarea" rows="12">${escapeHtml(JSON.stringify(payload, null, 2))}</textarea>
        </div>
        <div class="flex justify-end gap-2">
            <button type="button" id="copyAIPayloadBtn" class="btn bg-purple-600 text-white hover:bg-purple-700">Copiar</button>
        </div>
    `;
    const modal = createModal(title, content);
    modal.querySelector('#copyAIPayloadBtn')?.addEventListener('click', () => {
        const ta = modal.querySelector('#aiPayload');
        if (!ta) return;
        navigator.clipboard.writeText(ta.value).then(() => showNotification('Contexto copiado', 'success')).catch(() => {
            ta.select();
            document.execCommand('copy');
            showNotification('Contexto copiado', 'success');
        });
    });
}

// Generadores locales simples (heurísticos) para asistencia inmediata sin salir de la app
function generateAdmissionReasonSuggestion(data) {
    const current = document.getElementById('admissionReason')?.value?.trim() || '';
    const frases = [];

    // 1) Pulir lo ya escrito por el usuario (capitalización y punto final)
    if (current) {
        const cleaned = current
            .replace(/\s+/g, ' ')
            .replace(/\s*([,;:.])\s*/g, '$1 ')
            .replace(/\s*\.$/, '');
        const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        frases.push(capitalized + '.');
    }

    // 2) Completar con contexto mínimo si falta
    if (data.entryDiagnosis) {
        const diagFrase = `Ingreso por ${data.entryDiagnosis.toLowerCase()}.`;
        if (!frases.join(' ').toLowerCase().includes(data.entryDiagnosis.toLowerCase())) {
            frases.unshift(diagFrase);
        }
    }

    // 3) Síntomas probables según diagnóstico
    const sintomas = [];
    if (data.entryDiagnosis && /fibrilación auricular|taquiarritmia/i.test(data.entryDiagnosis)) sintomas.push('palpitaciones');
    if (data.entryDiagnosis && /bradi|bloqueo/i.test(data.entryDiagnosis)) sintomas.push('mareos o síncope');
    if (sintomas.length && !frases.join(' ').toLowerCase().includes('palpit') && !frases.join(' ').toLowerCase().includes('síncope')) {
        frases.push(`Refiere ${sintomas.join(' y ')}.`);
    }

    if (data.origin) {
        const origen = `Derivado desde ${data.origin.toLowerCase()}.`;
        if (!frases.join(' ').toLowerCase().includes(data.origin.toLowerCase())) {
            frases.push(origen);
        }
    }

    return frases.join(' ').replace(/\s+/g, ' ').trim();
}

function generateProcedureDescriptionSuggestion(data) {
    const lineas = [];
    lineas.push(`Bajo condiciones de asepsia y antisepsia, se realiza ${data.procedureName || 'procedimiento'} (${data.procedureCode || 's/código'}).`);
    lineas.push(`Acceso vascular obtenido, se posicionan catéteres/electrodos según protocolo.`);
    if (Array.isArray(data.measurements) && data.measurements.length > 0) {
        const medidasConValores = data.measurements.filter(m => m.parameters?.some(p => p.value));
        if (medidasConValores.length) {
            const resumen = medidasConValores.map(m => `${m.name.toLowerCase()}`).slice(0, 3).join(', ');
            lineas.push(`Se documentan mediciones en ${resumen}.`);
        }
    }
    if (data.additionalProcedures?.length) {
        const extras = data.additionalProcedures.map(p => p.name).filter(Boolean).join(', ');
        if (extras) lineas.push(`Procedimientos adicionales: ${extras}.`);
    }
    lineas.push(`Procedimiento bien tolerado, sin complicaciones inmediatas. Se deja plan de control y vigilancia.`);
    return lineas.join('\n');
}

function generateIndicationsSuggestion(data) {
    const items = [];
    if (data.indications?.length) items.push(...data.indications);

    // Add default indications only if not already selected
    if (!items.includes('Vigilancia de sitio de punción por 24 h')) {
        items.push('Vigilancia de sitio de punción por 24 h');
    }

    if (/anticoag/i.test((data.entryDiagnosis||'') + ' ' + (data.exitDiagnosis||'')) && !items.includes('Revisar esquema de anticoagulación')) {
        items.push('Revisar esquema de anticoagulación');
    }

    return items.join('\n');
}

function applyAISuggestion(fieldId, text, options) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    const replace = !options || options.replace !== false; // por defecto reemplaza
    if (replace) {
        el.value = text;
    } else {
        const current = (el.value || '').trim();
        el.value = current ? (current + (current.endsWith('\n') ? '' : '\n') + text) : text;
    }
    el.dispatchEvent(new Event('change'));
}
