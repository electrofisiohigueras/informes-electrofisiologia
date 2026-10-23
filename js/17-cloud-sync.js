// ===================================================================
// 17. SINCRONIZACIÓN EN LA NUBE (GitHub Contents API)
// ===================================================================
// Los datos PERSONALES de cada colega (procedimientos guardados, plantillas,
// personal, dispositivos y el formulario en curso) se respaldan en un repo
// público aparte (CLOUD_SYNC_REPO), un archivo JSON por "perfil":
//
//     users/<perfil>.json
//
// - Sin login ni administrador: cada usuario elige un Nombre de perfil y pega
//   SU token de GitHub (casilla public_repo: 30 segundos en
//   github.com/settings/tokens/new). El token vive solo en su localStorage.
// - El push ocurre automáticamente tras cada autoguardado (debounce 10 s).
// - El pull al arrancar aplica SOLO si el archivo remoto es más nuevo que la
//   última sincronización local ("gana el más nuevo", estilo last-write-wins).
// - Catálogos compartidos (comunas, diagnósticos, modelos base) NO viajan por
//   aquí: siguen viviendo en data.json del repo de la app (Restaurar
//   catálogos). Así lo que cada colega agrega localmente no pisa a los demás.
//
// Sin token/red la app sigue funcionando 100% local: TODO el flujo normal
// (localStorage) queda intacto.

const CLOUD_SYNC_REPO = 'electrofisiohigueras/informes-data';
const CLOUD_SYNC_BRANCH = 'main';

// Claves localStorage de configuración de sincronización
const LS_CLOUD_PROFILE = 'cloudSyncProfile';
const LS_CLOUD_TOKEN = 'cloudSyncToken';
const LS_CLOUD_SHA = 'cloudSyncSha';
const LS_CLOUD_SYNCED_AT = 'cloudSyncSyncedAt';

// Convierte el nombre de perfil en slug de archivo: "Pancho H." -> pancho-h
function cloudProfileSlug(name) {
    const slug = String(name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 32);
    return slug || '';
}

function cloudSyncConfigured() {
    const token = localStorage.getItem(LS_CLOUD_TOKEN);
    return !!(token && cloudProfileSlug(localStorage.getItem(LS_CLOUD_PROFILE)));
}

function cloudFilePath() {
    const slug = cloudProfileSlug(localStorage.getItem(LS_CLOUD_PROFILE));
    return slug ? 'users/' + slug + '.json' : '';
}

// Base64 UTF-8 seguro (btoa puro rompe con tildes/ñ)
function cloudToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

// ---- Push: sube el estado actual al archivo del perfil -------------------

async function pushCloudData() {
    if (!cloudSyncConfigured()) {
        return { ok: false, reason: 'config' };
    }

    const token = localStorage.getItem(LS_CLOUD_TOKEN);
    const path = cloudFilePath();
    const profileName = localStorage.getItem(LS_CLOUD_PROFILE) || '';
    const updatedAt = new Date().toISOString();

    const payload = {
        api: 1,
        profile: profileName,
        updatedAt: updatedAt,
        procedures: appState.procedures || [],
        templates: appState.templates || [],
        staff: appState.staff || [],
        formState: getFormState()
    };

    const body = {
        message: 'Sincronización ' + profileName + ' (' + updatedAt + ')',
        branch: CLOUD_SYNC_BRANCH,
        content: cloudToBase64(JSON.stringify(payload, null, 2))
    };
    const cachedSha = localStorage.getItem(LS_CLOUD_SHA);
    if (cachedSha) body.sha = cachedSha;

    const url = 'https://api.github.com/repos/' + CLOUD_SYNC_REPO + '/contents/' + path;

    try {
        let response = await fetch(url + '?ref=' + CLOUD_SYNC_BRANCH, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        // El SHA caché puede estar desactualizado (otro PC empujó antes):
        // pedir el SHA vigente y reintentar una vez.
        if (response.status === 409 || response.status === 422) {
            const fresh = await fetch(url, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Accept': 'application/vnd.github+json'
                }
            });
            if (fresh.ok) {
                const meta = await fresh.json();
                if (meta.sha) {
                    body.sha = meta.sha;
                    response = await fetch(url + '?ref=' + CLOUD_SYNC_BRANCH, {
                        method: 'PUT',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Accept': 'application/vnd.github+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(body)
                    });
                }
            }
        }

        if (response.ok) {
            const result = await response.json();
            if (result.content && result.content.sha) {
                localStorage.setItem(LS_CLOUD_SHA, result.content.sha);
            }
            localStorage.setItem(LS_CLOUD_SYNCED_AT, updatedAt);
            return { ok: true };
        }

        if (response.status === 401 || response.status === 403) {
            return { ok: false, reason: 'token' };
        }
        return { ok: false, reason: 'http:' + response.status };
    } catch (error) {
        console.warn('Push a la nube falló (sin red?):', error);
        return { ok: false, reason: 'offline' };
    }
}

// ---- Pull: descarga el archivo del perfil y (si es más nuevo) lo aplica ---

async function fetchCloudFile() {
    if (!cloudSyncConfigured()) return { ok: false, reason: 'config' };

    const token = localStorage.getItem(LS_CLOUD_TOKEN);
    const path = cloudFilePath();
    const url = 'https://api.github.com/repos/' + CLOUD_SYNC_REPO + '/contents/' + path + '?ref=' + CLOUD_SYNC_BRANCH;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/vnd.github+json'
            }
        });
        if (response.status === 404) return { ok: false, reason: 'not-found' };
        if (response.status === 401 || response.status === 403) return { ok: false, reason: 'token' };
        if (!response.ok) return { ok: false, reason: 'http:' + response.status };

        const meta = await response.json();
        if (!meta.content) return { ok: false, reason: 'empty' };
        const decoded = decodeURIComponent(escape(atob(meta.content.replace(/\n/g, ''))));
        return { ok: true, data: JSON.parse(decoded), sha: meta.sha };
    } catch (error) {
        console.warn('Pull de la nube falló (sin red?):', error);
        return { ok: false, reason: 'offline' };
    }
}

// Aplica los datos nube sobre appState y re-renderiza (estilo importData).
function applyCloudData(cloudData) {
    if (cloudData.procedures) {
        appState.procedures = cloudData.procedures;
        updateProcedureDropdown();
    }
    if (cloudData.templates) {
        appState.templates = cloudData.templates;
        updateTemplatesDropdown();
    }
    if (cloudData.staff) {
        appState.staff = cloudData.staff;
        renderStaffCheckboxes();
    }
    if (cloudData.formState) {
        setFormState(cloudData.formState);
    }
    saveAllData();
    localStorage.setItem(LS_CLOUD_SYNCED_AT, cloudData.updatedAt || new Date().toISOString());
}

// Pull manual (desde la pantalla de configuración): pide confirmación.
async function pullCloudData() {
    if (!cloudSyncConfigured()) {
        showNotification('Configure el perfil y el token antes de sincronizar.', 'warning');
        return;
    }
    const result = await fetchCloudFile();
    if (!result.ok) {
        if (result.reason === 'not-found') {
            showNotification('Aún no hay datos en la nube para este perfil. Use "Guardar y sincronizar ahora".', 'info');
        } else if (result.reason === 'token') {
            showNotification('El token no es válido o está vencido. Revise la configuración.', 'error');
        } else {
            showNotification('No se pudo descargar desde la nube (' + result.reason + ').', 'error');
        }
        return;
    }

    const ok = await showConfirmDialog(
        'Descargar mis datos',
        'Esto reemplazará TODO lo guardado en este navegador por la copia de la nube del perfil "' +
            escapeHtml(result.data.profile || '') + '" (guardada ' + escapeHtml(result.data.updatedAt || 'sin fecha') + '). ¿Continuar?',
        { confirmText: 'Descargar y reemplazar' }
    );
    if (!ok) return;

    localStorage.setItem(LS_CLOUD_SHA, result.sha || '');
    applyCloudData(result.data);
    showNotification('Datos descargados desde la nube', 'success');
}

// ---- Push automático con debounce (enganchado a saveAllData) -------------

function scheduleCloudPush() {
    if (!cloudSyncConfigured()) return;
    if (appState.cloudPushTimer) clearTimeout(appState.cloudPushTimer);
    appState.cloudPushTimer = setTimeout(async () => {
        appState.cloudPushTimer = null;
        const result = await pushCloudData();
        if (result.ok) {
            showSaveIndicator();
        } else if (result.reason === 'token') {
            showNotification('Sincronización en la nube: token inválido. Abra Opciones > Sincronización en la nube.', 'error');
        }
        // 'offline' / 'config' / 'http:...' se ignoran en autosave (silencioso).
    }, 10000);
}

// ---- Pull automático al arrancar ----------------------------------------

async function initCloudSyncAtStartup() {
    if (!cloudSyncConfigured()) return;
    const result = await fetchCloudFile();
    if (!result.ok) return;

    const lastSync = localStorage.getItem(LS_CLOUD_SYNCED_AT);
    if (result.data.updatedAt && (!lastSync || new Date(result.data.updatedAt) > new Date(lastSync))) {
        localStorage.setItem(LS_CLOUD_SHA, result.sha || '');
        applyCloudData(result.data);
        showNotification('Datos del perfil "' + escapeHtml(result.data.profile || '') + '" restaurados desde la nube', 'info');
    }
}

// ---- Pantalla de configuración ------------------------------------------

function openCloudSyncModal() {
    const token = localStorage.getItem(LS_CLOUD_TOKEN) || '';
    const profile = localStorage.getItem(LS_CLOUD_PROFILE) || '';
    const syncedAt = localStorage.getItem(LS_CLOUD_SYNCED_AT);
    const active = cloudSyncConfigured();

    const content = `
        <div class="space-y-4">
            <div class="p-3 rounded-lg ${active ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'} text-sm">
                <i class="fas fa-cloud mr-1"></i>
                ${active
                    ? 'Sincronización activa para el perfil <strong>' + escapeHtml(profile) + '</strong>.' +
                      (syncedAt ? ' Última sincronización: ' + escapeHtml(syncedAt.slice(0, 19).replace('T', ' ')) + '.' : '')
                    : 'La sincronización no está configurada: los datos viven solo en este navegador.'}
            </div>

            <h4 class="font-semibold text-gray-800">Cómo activarla (una vez)</h4>
            <ol class="list-decimal ml-5 text-sm text-gray-600 space-y-1">
                <li>Cree su token:
                    <a href="https://github.com/settings/tokens/new?scopes=public_repo&description=Sistema%20Informes%20Electrofisiologia"
                       target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">github.com/settings/tokens/new</a>
                    (casilla <code>public_repo</code> marcada), copie el texto generado.
                </li>
                <li>Elija un <strong>nombre de perfil</strong> y use el MISMO nombre en todos sus computadores.</li>
                <li>Pegue el token y guarde. Desde ahora cada guardado sube automáticamente.</li>
                <li>¿Nuevo computador? Configure el mismo perfil y use <em>Descargar mis datos</em> (o espere el arranque).</li>
            </ol>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                    <label for="cloudProfileInput" class="form-label">Nombre del perfil</label>
                    <input type="text" id="cloudProfileInput" class="form-input" value="${escapeHtml(profile)}" placeholder="Ej: Pancho">
                </div>
                <div class="form-group">
                    <label for="cloudTokenInput" class="form-label">Token de GitHub (queda local)</label>
                    <input type="password" id="cloudTokenInput" class="form-input" value="${escapeHtml(token)}" placeholder="ghp_...">
                </div>
            </div>

            <div class="flex flex-wrap justify-between gap-2 pt-2 border-t">
                <button type="button" id="cloudSaveBtn" class="btn btn-primary">
                    <i class="fas fa-check mr-1"></i> Guardar y sincronizar ahora
                </button>
                <button type="button" id="cloudPullBtn" class="btn bg-gray-600 text-white hover:bg-gray-700">
                    <i class="fas fa-cloud-arrow-down mr-1"></i> Descargar mis datos
                </button>
            </div>
        </div>
    `;

    const modal = createModal('Sincronización en la nube', content);
    modal.querySelector('#cloudSaveBtn').addEventListener('click', async () => {
        const name = modal.querySelector('#cloudProfileInput').value.trim();
        const newToken = modal.querySelector('#cloudTokenInput').value.trim();
        if (!name) {
            showNotification('Indique un nombre de perfil.', 'warning');
            return;
        }
        if (!newToken) {
            showNotification('Indique su token de GitHub.', 'warning');
            return;
        }
        localStorage.setItem(LS_CLOUD_PROFILE, name);
        localStorage.setItem(LS_CLOUD_TOKEN, newToken);
        showNotification('Guardado. Sincronizando con la nube...', 'info');
        const result = await pushCloudData();
        if (result.ok) {
            showNotification('Datos sincronizados en la nube', 'success');
            const active = getActiveAppModal();
            if (active && active.parentElement && active.parentElement.hasAttribute('data-app-modal')) {
                document.body.removeChild(active.parentElement);
            }
        } else if (result.reason === 'token') {
            showNotification('El token fue rechazado por GitHub (401). Verifique permisos y vigencia.', 'error');
        } else {
            showNotification('No se pudo sincronizar (' + result.reason + '). Configuración guardada de todas formas.', 'warning');
        }
    });
    modal.querySelector('#cloudPullBtn').addEventListener('click', pullCloudData);
}

// Botón del menú Opciones (delegación: funciona aunque el DOM cargue después)
document.addEventListener('click', function (e) {
    if (e.target.closest('#cloudSyncBtn')) {
        e.preventDefault();
        openCloudSyncModal();
    }
});
