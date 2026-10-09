# CONTEXTO DEL PROYECTO: InformeMedico 17

Eres un desarrollador web. Vas a continuar el trabajo sobre una aplicación web
médica 100% estática (vanilla JS, sin build, sin frameworks). No rompas nada:
todo el comportamiento depende de IDs y clases que usa el JavaScript.

## 1. Ubicación y archivos
Carpeta del proyecto (Windows):
`C:\Users\LABOR\Documents\PANCHO\respaldo informes\InformeMedico 17\`

Es una copia de la versión "InformeMedico 16" (carpeta hermana:
`C:\Users\LABOR\Documents\PANCHO\respaldo informes\InformeMedico 16\`),
creada para editar con libertad sin afectar la versión en uso.

Archivos clave:
- `index.html` — estructura y layout de la app (antes `informe_medico16.html`)
- `style.css` — estilos de la interfaz (contiene secciones "MEJORAS DE DISEÑO UI/UX - PASE 1 y PASE 2")
- `report-styles.css` — estilos del informe generado (impresión, PDF y copiado)
- `script_organized.js` — toda la lógica (~4300 líneas, archivo único)
- `data.json` — datos iniciales; la app persiste en localStorage
- `common-data-modal.html` — modal alternativo de datos comunes (referencia)
- `TODO.md` — pendientes

La app se abre directo con el archivo HTML (protocolo `file://`). No hay servidor.
`node` NO está instalado en el equipo; no uses comandos que lo requieran.

## 2. Qué hace la app
Sistema de registro de informes de procedimientos médicos de electrofisiología:
- Formulario con pestañas (Paciente, Personal, Diagnósticos, Descripción con
  mediciones, Indicaciones) y campos de procedimiento/prestaciones adicionales.
- Asistente paso a paso (modal wizard de 8 pasos).
- Gestión de datos comunes (comunas, previsiones, procedencias, diagnósticos,
  dispositivos, indicaciones) y de procedimientos/personal/plantillas.
- Generación de informe: botones de acción (Limpiar, Vista Previa, Descargar PDF)
  y, en el panel del informe: "Copiar Informe", "Descargar PDF" y "Copiar Imagen".

Dependencias por CDN (requieren internet): Tailwind CSS, Font Awesome 6,
html2pdf.js (0.10.1). No agregar dependencias nuevas sin permiso del usuario.

## 3. Reglas inquebrantables
- NO cambiar IDs ni clases que usa `script_organized.js` (busca primero con grep).
- NO eliminar `.no-print` ni `data-html2canvas-ignore="true"`.
- El informe debe seguir siendo compatible con el botón "Copiar Informe"
  (estilos inline computados): conservar legibilidad y colores sólidos en `.report-*`.
- Verificar siempre: llaves balanceadas en CSS/JS. (No hay node; valida con
  conteo de `{`/`}`.)

## 4. Lo que YA está resuelto (no rehacer sin motivo)
### 4a. Copiado con formato hacia Medicap (PROBLEMA PRINCIPAL YA RESUELTO)
El destino final es "Medicap", un editor web rich-text que elimina los colores
del HTML genérico pegado, pero SÍ respeta el HTML que imita el formato de
Office/Excel (por eso acepta pegados desde Excel).

Implementación actual en `script_organized.js`:
- `copyFormattedReport()` — botón "Copiar Informe" (`copyFormattedReportBtn`).
  Clona `#reportContent`, elimina `.no-print`/`data-html2canvas-ignore`,
  llama a `normalizeTablesForRichText` ANTES de `inlineAllStyles` (orden crítico),
  envuelve en `buildOfficeHtml` y escribe al portapapeles.
- `ClipboardItem` con SOLO `text/html` (sin `text/plain`): obliga al editor rico
  a usar el HTML (si se ofrece texto plano, algunos editores pegan plano).
  Si falla, respaldo `fallbackCopyHtml()` (execCommand).
- `normalizeTablesForRichText()` — tablas al estilo Excel:
  atributo `border`, `bgcolor` (#2563eb cabeceras, #f8fafc filas alternas),
  `background:` shorthand + `background-color`, bordes `1pt solid`,
  estilos `mso-*` (mso-background-source, mso-pattern, mso-font-charset).
- `inlineAllStyles()` + `rgbToHex()` — inlinea estilos computados convirtiendo
  `rgb()` a hex (colores translúcidos se dejan igual).
- `buildOfficeHtml()` — envuelve el fragmento como documento Office:
  namespaces o/x/w, `<meta name="ProgId" content="Excel.Sheet">`,
  `<meta name="Generator" content="Microsoft Excel 15">`, comentarios
  condicionales `<!--[if gte mso 9]><xml><x:ExcelWorkbook>...` y `<w:WordDocument>`,
  `<style>` con `@page WordSection1`. NO incluye `<title>` (se quitó porque
  aparecía como texto sin formato al pegar).
- `showCopyFeedback(message, btnEl)` — feedback en el botón (indica la ruta:
  "Copiado (HTML moderno)" vs "Copiado (respaldo execCommand)").
- `inspectReportHtml()` — helper de depuración (consola): genera el mismo HTML,
  lo muestra en un modal y lo deja en `window.__lastCopiedHtml`.

Resultado verificado por el usuario: pega con formato y colores en Medicap.
También pega con formato en Google Docs.

### 4b. "Copiar Imagen" (botón `copyReportImageBtn`, verde)
`copyReportAsImage()` captura `#generatedReport` con `html2canvas` (CDN) y escribe
PNG al portapapeles. OJO: si el CDN de html2pdf no carga (sin internet), falla
con "La librería de captura (html2canvas) no está disponible". El usuario
prefiere el pegado en formato texto, no imagen. Pregúntale si quiere conservar
o eliminar este botón antes de tocarlo.

### 4c. Diseño visual
`style.css` tiene dos bloques de mejoras al final: "MEJORAS DE DISEÑO VISUAL -
UI/UX" (PASE 1) y "MEJORAS DE DISEÑO UI/UX - PASE 2" (PASE 2). Incluyen:
- Modales estáticos (`#commonDataModal`, `#wizardModal`) ahora como overlay
  centrado con backdrop (antes se renderizaban en el flujo de la página).
- Estilos base para `.modal-content`, `.modal-header`, `.modal-close-btn`,
  `.modal-body`, `.modal-footer`.
- `.app-header` con gradiente y botones frosted; SE QUITÓ su `overflow: hidden`
  porque recortaba el menú desplegable "Opciones" (bug corregido).
- Botones, pestañas, inputs, checkboxes, scrollbars y responsive mejorados.

## 5. Estado actual / pendientes conocidos
- Copiar con formato: RESUELTO y verificado en Medicap y Google Docs.
- Revisar `TODO.md` para pendientes de funcionalidad.
- Posibles mejoras a proponer al usuario (no implementar sin confirmar):
  quitar/ajustar el botón "Copiar Imagen"; más opciones de pegado; mejoras de
  accesibilidad; modo oscuro (ya se mencionó).

## 6. Cómo trabajar seguro
- Antes de editar, grep en `script_organized.js` para confirmar qué clases/IDs usa.
- Cambios en CSS/JS: verificar balance de `{`/`}` al final.
- Los cambios se prueban recargando el archivo HTML en el navegador
  (el usuario usa F12/consola).
- Mantén el idioma de la conversación en español.

## 7. Instrucción inicial sugerida
Continúa el trabajo. Lee primero `index.html`, `script_organized.js`,
`style.css` y `report-styles.css` para familiarizarte, luego revisa `TODO.md`
y propón el siguiente paso más valioso (sin modificar nada hasta que el usuario
lo apruebe).
