// ===================================================================
// 6. GESTIÓN DE DATOS COMUNES (DROPDOWNS)
// ===================================================================

function updateCommonDataDropdowns() {
    if (elements.commune) {
        elements.commune.innerHTML = '<option value="">Seleccione una comuna</option>' +
            appState.commonData.communes.map(commune =>
                `<option value="${escapeHtml(commune)}">${escapeHtml(commune)}</option>`
            ).join('');
        attachAddNewOption(elements.commune, 'Nueva comuna', (value) => {
            if (!addToCommonArray(appState.commonData.communes, value, 'La comuna')) return false;
            updateCommonDataDropdowns();
            elements.commune.value = value;
            return true;
        });
    }

    if (elements.healthInsurance) {
        elements.healthInsurance.innerHTML = '<option value="">Seleccione previsión</option>' +
            appState.commonData.insurances.map(insurance =>
                `<option value="${escapeHtml(insurance)}">${escapeHtml(insurance)}</option>`
            ).join('');
        attachAddNewOption(elements.healthInsurance, 'Nueva previsión', (value) => {
            if (!addToCommonArray(appState.commonData.insurances, value, 'La previsión')) return false;
            updateCommonDataDropdowns();
            elements.healthInsurance.value = value;
            return true;
        });
    }

    if (elements.origin) {
        elements.origin.innerHTML = '<option value="">Seleccione procedencia</option>' +
            appState.commonData.origins.map(origin =>
                `<option value="${escapeHtml(origin)}">${escapeHtml(origin)}</option>`
            ).join('');
        attachAddNewOption(elements.origin, 'Nueva procedencia', (value) => {
            if (!addToCommonArray(appState.commonData.origins, value, 'La procedencia')) return false;
            updateCommonDataDropdowns();
            elements.origin.value = value;
            return true;
        });
    }

    if (elements.entryDiagnosisSelect) {
        elements.entryDiagnosisSelect.innerHTML = '<option value="">Seleccione diagnóstico</option>' +
            appState.commonData.entryDiagnoses.map(diagnosis =>
                `<option value="${escapeHtml(diagnosis)}">${escapeHtml(diagnosis)}</option>`
            ).join('') + '<option value="custom">Otro (especifique)</option>';
        attachAddNewOption(elements.entryDiagnosisSelect, 'Nuevo diagnóstico', (value) => {
            if (!addToCommonArray(appState.commonData.entryDiagnoses, value, 'El diagnóstico')) return false;
            updateCommonDataDropdowns();
            elements.entryDiagnosisSelect.value = value;
            return true;
        });
    }

    if (elements.exitDiagnosisSelect) {
        elements.exitDiagnosisSelect.innerHTML = '<option value="">Seleccione diagnóstico</option>' +
            appState.commonData.exitDiagnoses.map(diagnosis =>
                `<option value="${escapeHtml(diagnosis)}">${escapeHtml(diagnosis)}</option>`
            ).join('') + '<option value="custom">Otro (especifique)</option>';
        attachAddNewOption(elements.exitDiagnosisSelect, 'Nuevo diagnóstico', (value) => {
            if (!addToCommonArray(appState.commonData.exitDiagnoses, value, 'El diagnóstico')) return false;
            updateCommonDataDropdowns();
            elements.exitDiagnosisSelect.value = value;
            return true;
        });
    }

    // Update indications checkboxes
    updateIndicationsCheckboxes();
}

function updateIndicationsCheckboxes() {
    const container = document.getElementById('indicationsCheckboxes');
    if (!container) return;

    container.innerHTML = '';

    appState.commonData.indications.forEach((indication, index) => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `indication-${index}`;
        checkbox.className = 'rounded';

        const span = document.createElement('span');
        span.textContent = indication;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    });
}
