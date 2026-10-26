// ===================================================================
// 17. RESPALDOS EN LA NUBE (GitHub Contents API)
// ===================================================================
// Modelo simple: cada "respaldo" es una INSTANTÁNEA COMPLETA del estado del
// equipo, escrita en la carpeta `backups/` del propio repositorio de la app:
//
//     backups/AAAAMMDDTHHMMSSZ.json   -> instantánea histórica
//     backups/LATEST.json             -> puntero/última instantánea
//
// - Respaldar: baja LATEST.json, fusiona con lo local (gana el más nuevo por
//   registro) y escribe la instantánea nueva + actualiza LATEST.json.
// - Cargar: baja LATEST.json y aplica TODO (procedimientos, personal,
//   plantillas, catálogos y el formulario en curso).
// - Al abrir la app se aplica siempre el último respaldo. Antes de pisar el
//   estado local se guarda una copia de seguridad en localStorage
//   ('preCloudSnapshot'), recuperable con el botón "Importar".
//
// GitHub no permite escribir sin credencial: para RESPALDAR cada colega pega
// una vez su token (fine-grained, Contents leer/escribir en este repo) en el
// modal "Respaldos en la nube". Para LEER el último respaldo no hace falta
// token (el repo es público y se lee por raw.githubusercontent.com).
//
// Lo que NO se propaga con respaldos: los BORRADOS de registros (un registro
// eliminado localmente vuelve a existir al fusionar con el remoto). Para
// borrados definitivos está "Restaurar datos compartidos" (data.json).

const BACKUP_REPO = 'electrofisiohigueras/informes-electrofisiologia';
const BACKUP_BRANCH = 'main';
const BACKUP_FOLDER = 'backups';
const BACKUP_LATEST_PATH = 'backups/LATEST.json';

const LS_BACKUP_TOKEN = 'cloudBackupToken';
const LS_BACKUP_LAST_NAME = 'cloudBackupLastName';
const LS_BACKUP_LAST_AT = 'cloudBackupLastAt';
const LS_PRE_CLOUD_SNAPSHOT = 'preCloudSnapshot';

const GH_API_BASE = 'https://api.github.com/repos/' + BACKUP_REPO + '/contents/';
const GH_RAW_BASE = 'https://raw.githubusercontent.com/' + BACKUP_REPO + '/' + BACKUP_BRANCH + '/';

// Base64 UTF-8 seguro (btoa puro rompe con tildes/ñ)
function backupToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function backupToken() {
    return localStorage.getItem(LS_BACKUP_TOKEN) || '';
}

function backupAuthHeaders() {
    const headers = { 'Accept': 'application/vnd.github+json' };
    const token = backupToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}

// ---- Instantáneas ---------------------------------------------------------

function buildBackupSnapshot() {
    return {
        meta: {
            appVersion: APP_VERSION,
            createdAt: new Date().toISOString()
        },
        state: {
            procedures: appState.procedures || [],
            templates: appState.templates || [],
            staff: appState.staff || [],
            commonData: appState.commonData || {},
            formState: getFormState()
        }
    };
}

// Fusiona dos listas de registros por id: gana el que tenga la marca de
// tiempo más reciente (updatedAt, o createdAt si no existe).
function mergeRecordLists(localList, remoteList) {
    const merged = new Map();
    const stamp = (item) => new Date(item.updatedAt || item.createdAt || 0).getTime() || 0;

    (remoteList || []).forEach(item => merged.set(String(item.id), item));
    (localList || []).forEach(item => {
        const key = String(item.id);
        const current = merged.get(key);
        if (!current || stamp(item) >= stamp(current)) merged.set(key, item);
    });
    return Array.from(merged.values());
}

function mergeStringLists(remoteList, localList) {
    const out = [];
    const push = (value) => {
        if (typeof value === 'string' && value.trim() && !out.includes(value)) out.push(value);
    };
    (remoteList || []).forEach(push);
    (localList || []).forEach(push);
    return out;
}

function mergeCommonData(localCommon, remoteCommon) {
    const merged = { ...(remoteCommon || {}) };
    const LIST_KEYS = [
        'communes', 'insurances', 'origins', 'entryDiagnoses', 'exitDiagnoses',
        'deviceBrands', 'deviceTypes', 'stimulationPolarities', 'indications'
    ];

    LIST_KEYS.forEach(key => {
        const hasRemote = Array.isArray(remoteCommon && remoteCommon[key]);
        const hasLocal = Array.isArray(localCommon && localCommon[key]);
        if (hasRemote || hasLocal) {
            merged[key] = mergeStringLists(
                hasRemote ? remoteCommon[key] : [],
                hasLocal ? localCommon[key] : []
            );
        }
    });

    const models = { ...((remoteCommon && remoteCommon.deviceModelsByTypeAndBrand) || {}) };
    const localModels = (localCommon && localCommon.deviceModelsByTypeAndBrand) || {};
    Object.keys(localModels).forEach(type => {
        models[type] = models[type] || {};
        Object.keys(localModels[type] || {}).forEach(brand => {
            models[type][brand] = mergeStringLists(
                models[type][brand] || [],
                localModels[type][brand] || []
            );
        });
    });
    if (Object.keys(models).length > 0) merged.deviceModelsByTypeAndBrand = models;

    return merged;
}

// "Gana el más nuevo": por registro el más reciente; el formulario en curso
// se toma del lado con la marca de tiempo mayor.
function mergeBackupSnapshots(localSnapshot, remoteSnapshot) {
    if (!remoteSnapshot) return localSnapshot;
    if (!localSnapshot) return remoteSnapshot;

    const localState = localSnapshot.state || {};
    const remoteState = remoteSnapshot.state || {};
    const localAt = new Date(localSnapshot.meta?.createdAt || 0).getTime() || 0;
    const remoteAt = new Date(remoteSnapshot.meta?.createdAt || 0).getTime() || 0;

    return {
        meta: {
            appVersion: APP_VERSION,
            createdAt: new Date(Math.max(localAt, remoteAt) || Date.now()).toISOString(),
            merged: true
        },
        state: {
            procedures: mergeRecordLists(localState.procedures, remoteState.procedures),
            templates: mergeRecordLists(localState.templates, remoteState.templates),
            staff: mergeRecordLists(localState.staff, remoteState.staff),
            commonData: mergeCommonData(localState.commonData, remoteState.commonData),
            formState: localAt >= remoteAt ? (localState.formState || {}) : (remoteState.formState || {})
        }
    };
}

// ---- Lectura --------------------------------------------------------------

// Descarga el último respaldo (LATEST.json). No requiere token.
async function fetchLatestBackupSnapshot() {
    try {
        const response = await fetch(GH_RAW_BASE + BACKUP_LATEST_PATH + '?t=' + Date.now());
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.warn('No se pudo leer el último respaldo:', error);
        return null;
    }
}

// Lista el historial de respaldos (para mostrarlo en el modal).
async function listCloudBackups() {
    try {
        const response = await fetch(GH_API_BASE + BACKUP_FOLDER + '?ref=' + BACKUP_BRANCH, {
            headers: backupAuthHeaders()
        });
        if (!response.ok) return [];
        const items = await response.json();
        if (!Array.isArray(items)) return [];
        return items
            .filter(item => item.type === 'file' && item.name !== 'LATEST.json')
            .sort((a, b) => b.name.localeCompare(a.name));
    } catch (error) {
        console.warn('No se pudo listar los respaldos:', error);
        return [];
    }
}

// ---- Escritura ------------------------------------------------------------

async function ghPutFile(path, base64Content, message, sha) {
    const body = { message: message, branch: BACKUP_BRANCH, content: base64Content };
    if (sha) body.sha = sha;

    const response = await fetch(GH_API_BASE + path, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + backupToken(),
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (response.ok) {
        const data = await response.json();
        return { ok: true, sha: data && data.content ? data.content.sha : null };
    }
    if (response.status === 401 || response.status === 403) return { ok: false, reason: 'token' };
    if (response.status === 409 || response.status === 422) return { ok: false, reason: 'conflict' };
    return { ok: false, reason: 'http:' + response.status };
}

// SHA actual de un archivo (para actualizar LATEST.json sin conflictos).
async function ghGetFileSha(path) {
    try {
        const response = await fetch(GH_API_BASE + path + '?ref=' + BACKUP_BRANCH, {
            headers: backupAuthHeaders()
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data && data.sha ? data.sha : null;
    } catch (error) {
        return null;
    }
}

// Crea una instantánea y actualiza LATEST.json.
async function createCloudBackup() {
    if (!backupToken()) return { ok: false, reason: 'token' };

    const localSnapshot = buildBackupSnapshot();
    const remoteSnapshot = await fetchLatestBackupSnapshot();
    const merged = mergeBackupSnapshots(localSnapshot, remoteSnapshot);

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const content = backupToBase64(JSON.stringify(merged, null, 2));

    const snapshot = await ghPutFile(
        BACKUP_FOLDER + '/' + stamp + '.json',
        content,
        'Respaldo ' + stamp,
        null
    );
    if (!snapshot.ok) return snapshot;

    // Actualizar el puntero del último respaldo (reintento con el SHA actual).
    let latest = await ghPutFile(
        BACKUP_LATEST_PATH,
        content,
        'Ultimo respaldo ' + stamp,
        await ghGetFileSha(BACKUP_LATEST_PATH)
    );
    if (!latest.ok && latest.reason === 'conflict') {
        latest = await ghPutFile(
            BACKUP_LATEST_PATH,
            content,
            'Ultimo respaldo ' + stamp,
            await ghGetFileSha(BACKUP_LATEST_PATH)
        );
    }
    if (!latest.ok) return latest;

    localStorage.setItem(LS_BACKUP_LAST_NAME, stamp + '.json');
    localStorage.setItem(LS_BACKUP_LAST_AT, merged.meta.createdAt);
    return { ok: true, fileName: stamp + '.json' };
}

// ---- Aplicar --------------------------------------------------------------

// Aplica una instantánea sobre la app (reemplazo completo del estado).
function applyBackupSnapshot(snapshot) {
    if (!snapshot || !snapshot.state) return false;
    const state = snapshot.state;

    if (Array.isArray(state.procedures)) appState.procedures = state.procedures;
    if (Array.isArray(state.templates)) appState.templates = state.templates;
    if (Array.isArray(state.staff)) appState.staff = state.staff;
    if (state.commonData && typeof state.commonData === 'object') {
        appState.commonData = { ...appState.commonData, ...state.commonData };
    }
    if (state.formState && Object.keys(state.formState).length > 0) {
        setFormState(state.formState);
    }

    saveAllData();
    updateCommonDataDropdowns();
    updateProcedureDropdown();
    updateTemplatesDropdown();
    renderStaffCheckboxes();
    updateCommonDataLists();
    return true;
}

// Guarda el estado local actual antes de aplicar el respaldo del equipo
// (recuperable con el botón "Importar" de la app).
function savePreCloudSnapshot() {
    try {
        const snapshot = {
            meta: { appVersion: APP_VERSION, createdAt: new Date().toISOString() },
            state: {
                procedures: appState.procedures || [],
                templates: appState.templates || [],
                staff: appState.staff || [],
                commonData: appState.commonData || {},
                formState: getFormState()
            }
        };
        localStorage.setItem(LS_PRE_CLOUD_SNAPSHOT, JSON.stringify(snapshot));
    } catch (error) {
        console.warn('No se pudo guardar la copia de seguridad local:', error);
    }
}

// Carga (manual) el último respaldo del equipo.
async function loadLatestCloudBackup(showSuccessMessage) {
    const snapshot = await fetchLatestBackupSnapshot();
    if (!snapshot) {
        showNotification('No hay respaldos en la nube todavía. Use "Respaldar ahora" para crear el primero.', 'info');
        return false;
    }

    const ok = await showConfirmDialog(
        'Cargar último respaldo',
        'Se reemplazarán los datos de este equipo por el último respaldo publicado (' +
            escapeHtml((snapshot.meta && snapshot.meta.createdAt || '').slice(0, 19).replace('T', ' ')) +
            '). Se guarda una copia del estado actual por si necesita volver atrás. ¿Continuar?',
        { confirmText: 'Cargar respaldo' }
    );
    if (!ok) return false;

    savePreCloudSnapshot();
    applyBackupSnapshot(snapshot);
    if (showSuccessMessage !== false) {
        showNotification('Último respaldo aplicado', 'success');
    }
    return true;
}

// Auto-carga al abrir la app (el último respaldo del equipo manda).
async function initCloudBackupAtStartup() {
    const snapshot = await fetchLatestBackupSnapshot();
    if (!snapshot) return;

    savePreCloudSnapshot();
    applyBackupSnapshot(snapshot);
    showNotification(
        'Se aplicó el último respaldo del equipo (' +
            escapeHtml((snapshot.meta && snapshot.meta.createdAt || '').slice(0, 19).replace('T', ' ')) + ')',
        'info'
    );
}

// ---- Modal de configuración ----------------------------------------------

function openCloudBackupModal() {
    const token = backupToken();
    const lastAt = localStorage.getItem(LS_BACKUP_LAST_AT);
    const lastName = localStorage.getItem(LS_BACKUP_LAST_NAME);

    const content = `
        <div class="space-y-4">
            <div class="p-3 rounded-lg bg-blue-50 text-blue-900 text-sm">
                <i class="fas fa-cloud-upload-alt mr-1"></i>
                Los respaldos viven en la carpeta <code>backups/</code> del repositorio de la app.
                Cada respaldo es una instantánea completa y <strong>gana el más nuevo</strong>.
                Al abrir la app se aplica el último respaldo del equipo.
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                    <label for="backupTokenInput" class="form-label">Token de GitHub (solo para respaldar)</label>
                    <input type="password" id="backupTokenInput" class="form-input" value="${escapeHtml(token)}" placeholder="github_pat_...">
                    <p class="text-xs text-gray-500 mt-1">
                        Fine-grained, con permiso <strong>Contents: Read and write</strong> solo en este repositorio.
                        Se guarda únicamente en este navegador. Para <em>cargar</em> el último respaldo no hace falta token.
                    </p>
                </div>
                <div class="form-group">
                    <label class="form-label">Último respaldo</label>
                    <div id="backupStatusText" class="form-input bg-gray-50 text-sm">
                        ${lastAt
                            ? escapeHtml(lastAt.slice(0, 19).replace('T', ' ')) + (lastName ? ' (' + escapeHtml(lastName) + ')' : '')
                            : 'Sin respaldos creados en este equipo todavía'}
                    </div>
                    <p class="text-xs text-gray-500 mt-1">El archivo <code>LATEST.json</code> es el puntero al respaldo vigente.</p>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 pt-2 border-t">
                <button type="button" id="backupSaveBtn" class="btn btn-primary">
                    <i class="fas fa-check mr-1"></i> Guardar token
                </button>
                <button type="button" id="backupCreateBtn" class="btn bg-green-600 text-white hover:bg-green-700">
                    <i class="fas fa-cloud-upload-alt mr-1"></i> Respaldar ahora
                </button>
                <button type="button" id="backupLoadBtn" class="btn bg-gray-600 text-white hover:bg-gray-700">
                    <i class="fas fa-cloud-download mr-1"></i> Cargar último respaldo
                </button>
            </div>
        </div>
    `;

    const modal = createModal('Respaldos en la nube', content);

    modal.querySelector('#backupSaveBtn').addEventListener('click', () => {
        const value = modal.querySelector('#backupTokenInput').value.trim();
        localStorage.setItem(LS_BACKUP_TOKEN, value);
        showNotification(value ? 'Token guardado en este navegador' : 'Token borrado', value ? 'success' : 'info');
    });

    modal.querySelector('#backupCreateBtn').addEventListener('click', async () => {
        if (!backupToken()) {
            showNotification('Pegue su token de GitHub para poder respaldar.', 'warning');
            return;
        }
        showNotification('Respaldando...', 'info');
        const result = await createCloudBackup();
        if (result.ok) {
            showNotification('Respaldo publicado: ' + result.fileName, 'success');
            const status = modal.querySelector('#backupStatusText');
            if (status) {
                const stamp = localStorage.getItem(LS_BACKUP_LAST_AT) || '';
                status.textContent = stamp.slice(0, 19).replace('T', ' ') + ' (' + result.fileName + ')';
            }
        } else if (result.reason === 'token') {
            showNotification('El token fue rechazado por GitHub (401/403). Verifique permisos y vigencia.', 'error');
        } else if (result.reason === 'conflict') {
            showNotification('Conflicto al escribir el respaldo. Intente nuevamente.', 'error');
        } else {
            showNotification('No se pudo respaldar (' + result.reason + ').', 'error');
        }
    });

    modal.querySelector('#backupLoadBtn').addEventListener('click', () => loadLatestCloudBackup(true));
}

// Botón del menú Opciones (delegación: no depende del orden de carga del DOM).
document.addEventListener('click', function (e) {
    if (e.target.closest('#cloudBackupBtn')) {
        e.preventDefault();
        openCloudBackupModal();
    }
});
