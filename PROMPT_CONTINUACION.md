# CONTEXTO DEL PROYECTO: InformeMedico 19

Eres un desarrollador web. Vas a continuar el trabajo sobre una aplicación web
médica 100% estática (vanilla JS, sin build, sin frameworks). No rompas nada:
todo el comportamiento depende de IDs y clases que usa el JavaScript.

## 1. Ubicación y archivos
Carpeta del proyecto (Windows):
`C:\Users\LABOR\Documents\PANCHO\respaldo informes\InformeMedico 19\`

Archivos clave:
- `index.html` — estructura y layout de la app
- `style.css` — estilos de la interfaz
- `report-styles.css` — estilos del informe generado (impresión y copiado)
- `js/` — lógica dividida en 16 módulos que se cargan EN ORDEN con
  `<script>` clásicos (globals compartidos; NO usar ES modules, Chrome los
  bloquea en `file://`):
  - `01-data.js` datos iniciales, fallbackData, loadPredefinedData
  - `02-state.js` appState, elements, initializeElements
  - `03-utils.js` escapeHtml, toISODate, formatDateEsCL, createModal,
    utilidades "agregar nuevo", setDefaultTimes, setupTabs
  - `04-common-data.js` dropdowns de datos comunes
  - `05-procedures.js` procedimientos: CRUD, códigos, prestaciones adicionales
  - `06-measurements.js` render de mediciones y dispositivos
  - `07-persistence.js` localStorage, autosave, export/import, respaldo
  - `08-copy-report.js` pipeline de copiado estilo Office (Medicap)
  - `09-common-data-manage.js` sección de gestión de datos comunes (CRUD)
  - `10-dialogs.js` showNotification, showConfirmDialog, showValidationErrors
  - `11-templates-staff-devices.js` plantillas, personal, modal dispositivos
  - `12-init.js` initializeApp, attachMainEventListeners
  - `13-report.js` validación, generación del informe, sugerencias IA
  - `14-form-helpers.js` clearForm, listeners de mediciones, checkboxes staff
  - `15-bootstrap.js` arranque (DOMContentLoaded -> initializeApp)
  - `16-wizard.js` asistente completo de 8 pasos
- `data.json` — datos iniciales; la app persiste en localStorage
- `TODO.md` — pendientes (completado)

REGLA DEL SPLIT: los `let`/`const` top-level de cada archivo viven en el
ámbito léxico global compartido; un módulo solo puede USAR declaraciones de
módulos ANTERIORES en tiempo de carga (en runtime puede usar cualquiera).
Al agregar funciones, ubicalas en el módulo temático correcto y respeta el
orden de carga. Verificar SIEMPRE con `node --check` cada archivo editado.

La app se abre directo con el archivo HTML (protocolo `file://`). No hay servidor.
`node` SÍ está instalado (v22): se puede usar `node --check` para validar
sintaxis JS, y funciona sin problemas sobre `file://`.

## 2. Control de versiones: GIT EN USO
La carpeta es un repositorio git (identidad local: LABOR). Historial reciente:
- `157d28c` Estado inicial (pre-mejoras)
- `ec32bd0` Bloque A: reemplazo de alert/confirm por notificaciones y modales propios
- `accd0d8` Bloque B: fecha del procedimiento, advertencia medianoche, código muerto fuera
- `beb76df` Bloque C: escapado HTML seguro + validación de esquema al importar
- `bd19755` Bloque D: respaldo de datos + recordatorio semanal
- `bcd6451` Eliminar common-data-modal.html obsoleto
- `34bf513` UX: guardia al imprimir sin informe + confirmación al cerrar asistente
- `a46e585` Refactor: dividir el JS en 16 módulos js/ (concatenación byte-exacto)

Antes de editar: `git status` / `git diff`. Commits pequeños y en español.
El flujo de carpetas "InformeMedico N" puede seguir usándose como respaldo físico,
pero el historial real vive en git.

## 3. Qué hace la app
Sistema de registro de informes de procedimientos médicos de electrofisiología:
- Formulario con pestañas (Paciente, Personal, Diagnósticos, Descripción con
  mediciones, Indicaciones), fecha del procedimiento y prestaciones adicionales.
- Asistente paso a paso (modal wizard de 8 pasos) con fecha incluida.
- Gestión de datos comunes, procedimientos, personal, plantillas y dispositivos.
- Generación de informe con "Vista Previa" y, en el panel del informe,
  "Copiar Informe" (pegado con formato en Medicap). Imprimir vía menú navegador.

Dependencias locales (`vendor/`, no requieren internet): Tailwind CSS, Font
Awesome 6. No agregar dependencias nuevas sin permiso del usuario.

## 4. Reglas inquebrantables
- NO cambiar IDs ni clases que usa el JS en `js/*.js` (grep primero).
- NO eliminar `.no-print` ni `data-html2canvas-ignore="true"`.
- El informe debe seguir siendo compatible con "Copiar Informe" (pipeline de
  estilos inline; ver 5a).
- PROHIBIDO reintroducir `alert()`/`confirm()`: usar `showNotification()`
  (tipos: success, error, warning, info) y `showConfirmDialog()` (Promise).
- `escapeHtml()` usa entidades NUMÉRICAS (&#38; &#60; &#62; &#34; &#39;) a
  propósito: escapa comillas y es seguro en atributos. NO convertirlas a
  entidades con nombre (& etc.): algunas herramientas las colapsan a su
  carácter literal y rompen el escapado. Verificar tras editar esa función.
- Las funciones de borrado y carga son ASYNC (await showConfirmDialog):
  deleteProcedure, deleteTemplate, deleteStaff, deleteDeviceType/Brand/Model,
  deleteCommonDataItem, newReport, loadTemplate, updateProcedureCode,
  applyWizardDataToForm, finishWizard, saveCurrentTemplate, clearFormBtn
  handler. Conservar las cadenas de await.
- `validateForm()` devuelve objetos { fieldId, message } (no strings):
  generateReport usa errors.map(e => e.message) para el modal y
  highlightFormErrors(errors) para resaltar los campos. IDs de error inline:
  id de campo + "Error" (ej. procedureDateError).
- Verificar sintaxis con `node --check` en cada archivo `js/` editado.

## 5. Lo que YA está resuelto (no rehacer sin motivo)

### 5a. Copiado con formato hacia Medicap (SIN CAMBIOS, RESUELTO)
El destino final es "Medicap", editor rich-text que elimina colores del HTML
genérico pero respeta el HTML estilo Office/Excel.

Pipeline en `js/08-copy-report.js` (NO tocar el orden):
- `copyFormattedReport()` — clona `#reportContent`, limpia `.no-print`/
  `data-html2canvas-ignore`, `normalizeTablesForRichText` ANTES de
  `inlineAllStyles` (orden crítico), `buildOfficeHtml`, ClipboardItem
  (text/html + text/plain), respaldo `fallbackCopyHtml()` (execCommand).
- `normalizeTablesForRichText()` — atributos `border`/`bgcolor`, shorthand
  `background:`, bordes `1pt solid`, estilos `mso-*`.
- `inlineAllStyles()` + `rgbToHex()` — inlinea estilos computados (rgb a hex).
- `buildOfficeHtml()` — namespaces o/x/w, ProgId Excel.Sheet, condicionales
  mso, `@page WordSection1`. Sin `<title>`.
- `showCopyFeedback()` — feedback en el botón; `inspectReportHtml()` depura
  (mismo HTML en modal + `window.__lastCopiedHtml`).

Verificado: pega con formato y colores en Medicap y Google Docs.

### 5b. Diálogos propios (Bloque A)
- `showConfirmDialog(titulo, mensaje, {confirmText, cancelText, danger})` ->
  Promise<boolean>; overlay z-3000, clase `.modal-content` existente, Escape
  cancela, clic fuera cancela.
- `showValidationErrors(errores)` — modal con lista de campos faltantes
  (reemplaza el alert de validateForm).
- `showNotification(mensaje, tipo)` — 4 tipos con iconos, z-4000, escapa el
  mensaje con escapeHtml.

### 5c. Fecha del procedimiento (Bloque B)
- IDs: `procedureDate` (formulario), `wiz-procedureDate` (wizard paso 1),
  `procedureDateError`.
- Helpers: `toISODate(fecha)` (ISO yyyy-mm-dd) y `formatDateEsCL(iso)`
  (formato largo es-CL, parseo local sin desfase UTC).
- `generateReportHtml()` usa `formatDateEsCL(data.procedureDate)` con respaldo
  en la fecha de hoy. NO volver a usar `new Date()` como fecha del informe.
- Persistida en getFormState/setFormState (autosave y plantillas) y en el
  resumen del wizard (paso 8).
- Advertencia NO bloqueante si hora de término < inicio (cruce de medianoche);
  `setDefaultTimes()` limita la hora por defecto a 23:59.

### 5d. Seguridad (Bloque C)
- `escapeHtml()` reescrito: escapa y comillas (seguro en atributos value=,
  data-value=, title=). Todos los renders de datos de usuario lo usan.
- `validateImportedData(data)` — valida esquema del JSON importado (claves y
  tipos; procedures/templates/staff/commonData incl.
  deviceModelsByTypeAndBrand). `importData()` la llama ANTES del confirm y
  rechaza con notificación si hay errores.

### 5e. Respaldo de datos (Bloque D)
- Botón "Respaldar datos" (`backupBtn`) en menú Opciones.
- `backupToFile()` — File System Access API (`showSaveFilePicker`,
  Chrome/Edge) con respaldo a descarga directa si no está disponible.
- `checkBackupReminder()` — al iniciar (setTimeout 2.5s), si pasaron >7 días
  sin respaldo ofrece "Descargar respaldo" / "Recordar luego".
- `localStorage.lastBackupDate` se actualiza en todo respaldo/exportación.

### 5f. Diseño visual
`style.css` mantiene los bloques "MEJORAS DE DISEÑO VISUAL - UI/UX" (PASE 1)
y "MEJORAS DE DISEÑO UI/UX - PASE 2": modales overlay, `.app-header` gradiente,
scrollbars, etc. Los diálogos nuevos (5b) reutilizan `.modal-content`.

## 6. Estado actual / pendientes conocidos
- Copiar con formato: RESUELTO y verificado.
- Bloques A-D verificados con `node --check` + smoke test de funciones puras
  (escapeHtml, fechas, validador): 19 asertions OK.
- PENDIENTE de prueba en navegador por el usuario (checklist en la conversación):
  fecha en informe, wizard completo, diálogos de borrado, respaldo, pegado en
  Medicap tras recargar.
- `common-data-modal.html` ELIMINADO (era obsoleto, IDs colisionables).
- Plantillas: selector "Cargar Plantilla" de la cabecera CONECTADO (change ->
  loadTemplate); guardar con nombre existente ofrece SOBRESCRIBIR; al cargar
  v2.0 la fecha del procedimiento se resetea a HOY (la plantilla no viaja con
  fecha). OJO: las plantillas capturan los VALORES de las mediciones
  (pendiente de decisión clínica: limpiar valores al guardar o advertir).
- Posibles mejoras futuras (no implementar sin confirmar): focus trap + ARIA
  en modales, modo oscuro, renombrar/duplicar plantillas, vista previa de
  plantilla antes de cargar, dots del wizard navegables.

## 7. Cómo trabajar seguro
- `git status` / `git diff` antes y después; commit por cambio lógico.
- Grep de IDs/clases antes de tocar HTML o JS.
- `node --check` en cada archivo `js/` editado.
- Los cambios se prueban recargando el HTML en el navegador (F12/consola).
- Mantén el idioma de la conversación en español.

## 8. Instrucción inicial sugerida
Continúa el trabajo. Lee `PROMPT_CONTINUACION.md` (este archivo),
`index.html` y los módulos de `js/`; revisa `git log --oneline` y `TODO.md`.
Propón el siguiente paso más valioso sin modificar nada hasta aprobación.
