// ===================================================================
// COPIADO CON FORMATO (MEDICAP / EXCEL) CON ESTILOS INLINE
// ===================================================================

// Medicap acepta informes de hasta 50.000 caracteres. Si el HTML copiado
// supera ese límite se avisa al usuario porque el destino puede recortarlo.
const MEDICAP_MAX_CHARS = 50000;

/**
 * Handler principal del botón "Copiar con Formato" (copyFormattedReportBtn).
 * Copia el reporte al portapapeles en dos formatos simultáneos:
 *   - text/html: HTML con TODOS los estilos inline (colores, tablas, negritas, etc.)
 *   - text/plain: texto plano como respaldo para editores básicos.
 */
async function copyFormattedReport(btnEl) {
    const reportContent = elements.reportContent;
    if (!reportContent) {
        showNotification('No hay contenido en el informe para copiar.', 'error');
        return;
    }

    try {
        // 1. Clonar el contenedor del reporte para trabajar en memoria
        //    sin afectar el HTML que se muestra en pantalla.
        const clone = reportContent.cloneNode(true);
        clone.querySelectorAll('.no-print, [data-html2canvas-ignore="true"]').forEach(el => el.remove());

        // 2. Normalizar tablas a HTML estándar ANTES de eliminar las clases,
        //    porque normalizeTablesForRichText detecta la clase .layout-table.
        //    forceReportCopyStyles TAMBIÉN necesita las clases (identifica
        //    títulos con classList), por eso corre antes de inlineAllStyles,
        //    que calcula los estilos inline y AL FINAL elimina las clases.
        normalizeTablesForRichText(clone);
        forceReportCopyStyles(clone);

        // 3. Convertir los estilos computados reales (Tailwind + report-styles.css)
        //    a atributos style="..." inline y eliminar las clases.
        inlineAllStyles(reportContent, clone);

        // 4. Envolver en un contenedor con tipografía base para el destino
        //    y empaquetar como documento Office (Word/Excel) para que
        //    destinos como Medicap conserven los colores al pegar.
        const fragment = `
            <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;background-color:#ffffff;">
                ${clone.innerHTML}
            </div>
        `.trim();
        const styledHtml = buildOfficeHtml(fragment);

        const plainText = clone.innerText || clone.textContent || '';

        // Control del límite de caracteres de Medicap: solo avisa, nunca bloquea.
        const reportChars = styledHtml.length;
        if (reportChars > MEDICAP_MAX_CHARS) {
            console.warn('[Copiar Informe] HTML supera el límite de Medicap:', reportChars);
            showNotification(`El informe copiado pesa ~${Math.round(reportChars / 1000)} mil caracteres y supera el límite de ${MEDICAP_MAX_CHARS} de Medicap; el final puede recortarse al pegar.`, 'warning');
        }

        // 5. Método principal: Clipboard API moderna con ClipboardItem.
        //    Se ofrece tanto HTML como texto plano para maximizar compatibilidad
        //    con editores web y de texto enriquecido. Algunos destinos fallan con
        //    HTML puro si no hay respaldo de texto plano.
        if (navigator.clipboard && window.ClipboardItem) {
            try {
                const item = new ClipboardItem({
                    'text/html': new Blob([styledHtml], { type: 'text/html' }),
                    'text/plain': new Blob([plainText], { type: 'text/plain' })
                });
                await navigator.clipboard.write([item]);
                console.log('[Copiar Informe] Ruta: ClipboardItem (HTML + texto plano) | HTML bytes:', styledHtml.length);
                window.__lastCopiedHtml = styledHtml;
                showCopyFeedback(`Copiado · ${(reportChars / 1000).toFixed(1)}k`, btnEl);
                return;
            } catch (clipboardErr) {
                console.warn('ClipboardItem no disponible o denegado, usando respaldo:', clipboardErr);
            }
        }

        // 6. Respaldo: document.execCommand('copy') con selección de un
        //    elemento temporal, que empaqueta el HTML enriquecido.
        fallbackCopyHtml(styledHtml);
        console.log('[Copiar Informe] Ruta: execCommand fallback | HTML bytes:', styledHtml.length);
        window.__lastCopiedHtml = styledHtml;
        showCopyFeedback(`Copiado · ${(reportChars / 1000).toFixed(1)}k`, btnEl);

    } catch (error) {
        console.error('Error al copiar el informe:', error);
        showNotification('Ocurrió un error al copiar el informe. Intente seleccionar el texto manualmente.', 'error');
    }
}

/**
 * Convierte un color CSS en formato rgb()/rgba() a su equivalente HEX.
 * Los colores translúcidos se dejan intactos para no forzar opacidad.
 */
function rgbToHex(color) {
    if (!color || typeof color !== 'string') return color;
    const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (!m) return color;
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (a < 0.9) return color; // translúcido: no forzar
    const r = Math.min(255, parseInt(m[1], 10));
    const g = Math.min(255, parseInt(m[2], 10));
    const b = Math.min(255, parseInt(m[3], 10));
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Envuelve el fragmento del informe en un documento HTML con formato
 * de Office (Word/Excel). Destinos como Medicap, que usan el motor de
 * Word/MSHTML, detectan estas señales y conservan los colores al pegar,
 * igual que cuando copias directamente desde Excel.
 */
function buildOfficeHtml(fragment) {
    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="ProgId" content="Excel.Sheet">
    <meta name="Generator" content="Microsoft Excel 15">
    <!--[if gte mso 9]><xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>Informe</x:Name>
                    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
            </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        <w:WordDocument><w:View>Normal</w:View><w:Zoom>0</w:Zoom><w:TrackMoves>false</w:TrackMoves><w:TrackFormatting>false</w:TrackFormatting></w:WordDocument>
    </xml><![endif]-->
    <style>
        @page WordSection1 { size: letter portrait; margin: 0.75in; }
        div.WordSection1 { page: WordSection1; }
        table { border-collapse: collapse; }
        .WordSection1 p { margin-top: 0; margin-bottom: 6pt; }
        .WordSection1 ul, .WordSection1 ol { margin-top: 0; margin-bottom: 6pt; }
    </style>
</head>
<body lang="es-CL">
<div class="WordSection1">
    ${fragment}
</div>
</body>
</html>`.trim();
}

/**
 * Recorre el árbol DOM del elemento original y su clon de forma simétrica,
 * extrayendo los estilos CSS computados reales e inyectándolos como
 * style="..." inline. Finalmente elimina las clases CSS del clon.
 */
function inlineAllStyles(original, clone) {
    const origElements = [original, ...original.querySelectorAll('*')];
    const cloneElements = [clone, ...clone.querySelectorAll('*')];

    // Propiedades clave que interpretan correctamente Medicap, Word y Excel.
    // Lista al mínimo: display/box-sizing los ignora el motor Word y los
    // longhands de padding/margin/border duplican la información del
    // shorthand; cada declaración es un carácter menos para el límite de
    // 50.000 caracteres que admite Medicap por informe.
    const essentialStyles = [
        'font-family', 'font-size', 'font-weight', 'font-style', 'color',
        'background-color', 'text-align', 'text-transform', 'text-decoration',
        'line-height', 'padding', 'margin',
        'border-collapse', 'width', 'min-width', 'max-width', 'height',
        'vertical-align', 'white-space', 'border-radius'
    ];

    // Los valores 'auto' de dimensiones solo generan ruido: el destino usa el
    // ancho natural del tag salvo que exista un width inline explícito.
    const skipAuto = new Set(['width', 'min-width', 'max-width', 'height']);

    // El wrapper del fragmento imponen 'Segoe UI', Tahoma, ... a todo el
    // informe; los elementos con esa misma familia no necesitan inline.
    const WRAPPER_FONT_KEY = 'segoeuitahomagenevaverdanasans-serif';
    const fontKey = (s) => (s || '').replace(/\s+/g, '').replace(/['"]/g, '').toLowerCase();

    // Color base del wrapper (los hijos heredan su color, no hace falta repetirlo).
    const WRAPPER_COLOR = '#1a1a1a';

    const rootComputed = (() => {
        try { return window.getComputedStyle(original); } catch (e) { return null; }
    })();
    const rootLh = rootComputed ? rootComputed.lineHeight : null;
    const rootFs = rootComputed ? rootComputed.fontSize : null;

    // Parseador de style="..." a mapa (último valor gana, igual que CSS) para
    // fusionar sin duplicados los estilos ya fijados por los pases previos
    // (forceReportCopyStyles y normalizeTablesForRichText) con los computados.
    const parseStyle = (attr) => {
        const map = new Map();
        if (attr) {
            attr.split(';').forEach(decl => {
                const sep = decl.indexOf(':');
                if (sep === -1) return;
                const key = decl.slice(0, sep).trim();
                const val = decl.slice(sep + 1).trim();
                if (key && val) map.set(key, val);
            });
        }
        return map;
    };

    for (let i = 0; i < origElements.length; i++) {
        const orig = origElements[i];
        const cln = cloneElements[i];

        if (!orig || !cln || cln.nodeType !== Node.ELEMENT_NODE) continue;

        const computed = window.getComputedStyle(orig);
        const computedMap = new Map();

        essentialStyles.forEach(prop => {
            let val = computed.getPropertyValue(prop);
            if (!val || val === 'initial' || val === 'none' || val === 'normal' || val === 'rgba(0, 0, 0, 0)') return;
            // Filtros de valores por defecto que no aportan nada inline.
            if (val === '0px') return;
            if (prop === 'font-weight' && val === '400') return;
            if (prop === 'text-align' && val === 'start') return;
            if (prop === 'vertical-align' && val === 'baseline') return;
            if (prop === 'border-radius' && val === '0px') return;
            if (prop === 'text-decoration' && /^none\b/.test(val.trim())) return;
            if (skipAuto.has(prop) && val.trim() === 'auto') return;
            if (prop === 'border-collapse' && orig.tagName !== 'TABLE') return;
            // Heredados de la base del wrapper: el contenedor ya los define.
            if (prop === 'font-family' && fontKey(val) === WRAPPER_FONT_KEY) return;
            // line-height solo se omite si el interlineado px y el tamaño de
            // fuente coinciden con la base: así el heredado del wrapper (1.5)
            // da exactamente el mismo valor que el calculado en la app.
            if (prop === 'line-height' && rootLh !== null && val === rootLh && rootFs !== null && computed.fontSize === rootFs) return;
            if (prop === 'color') {
                val = rgbToHex(val);
                if (!val || val === WRAPPER_COLOR) return;
            }
            if (prop === 'background-color') {
                val = rgbToHex(val);
            }
            computedMap.set(prop, val);
        });

        // Si ya existe un ancho explícito (p.ej. el recuadro compacto de Personal
        // Médico con width:50%): preservarlo; el ancho computado en px fijo
        // haría que la caja se vea de ancho distinto al pegar en Medicap.
        const existingMap = parseStyle(cln.getAttribute('style'));
        if (existingMap.has('width')) computedMap.delete('width');

        // Bordes por lado: fusionar width+style+color en un solo shorthand
        // (border-top:1px solid #cbd5e1) que Word/Medicap respetan mejor y
        // ocupa un tercio de los tres longhands.
        // Si el border:"..." existente (normalmente legado de normalizeTables)
        // dice canónicamente lo mismo que los 4 lados, no se emiten longhands:
        // el shorthand ya cubre todo y ahorra ~128 chars por celda.
        const existingBorder = existingMap.get('border');
        const existingBorderCanon = existingBorder
            ? existingBorder.replace(/\s+/g, '').toLowerCase()
            : null;

        ['top', 'right', 'bottom', 'left'].forEach(side => {
            const sideStyle = computed.getPropertyValue('border-' + side + '-style');
            const sideWidth = computed.getPropertyValue('border-' + side + '-width');
            const sideColor = computed.getPropertyValue('border-' + side + '-color');
            if (!sideStyle || sideStyle === 'none' || sideStyle === 'hidden') return;
            if (!sideWidth || sideWidth === '0px') return;
            const mergedVal = sideWidth + ' ' + sideStyle + ' ' + rgbToHex(sideColor);
            if (existingBorderCanon && mergedVal.replace(/\s+/g, '').toLowerCase() === existingBorderCanon) return;
            computedMap.set('border-' + side, mergedVal);
        });

        // Reemplazar gradientes CSS por colores sólidos (los editores
        // de texto enriquecido ignoran los gradientes).
        if (computed.backgroundImage && computed.backgroundImage !== 'none') {
            if (orig.classList.contains('report-box-title') || orig.tagName === 'TH') {
                computedMap.set('background-color', '#2563eb');
                computedMap.set('color', '#ffffff');
            } else if (orig.tagName === 'HEADER' || orig.classList.contains('report-title') || orig.classList.contains('report-main-title')) {
                computedMap.set('background-color', '#1e3a5f');
                computedMap.set('color', '#ffffff');
            }
        }

        // Fusionar: existentes primero, computados después (el último gana,
        // igual que el orden del atributo style de la versión anterior).
        const merged = new Map(existingMap);
        computedMap.forEach((val, key) => merged.set(key, val));

        if (merged.size) {
            const css = Array.from(merged, ([key, val]) => key + ':' + val).join(';') + ';';
            cln.setAttribute('style', css);
        } else {
            cln.removeAttribute('style');
        }

        // Eliminar 'class' para que el destino no dependa de hojas externas.
        cln.removeAttribute('class');
    }
}

function forceReportCopyStyles(root) {
    // Tamaños de texto para el HTML copiado. Deben coincidir con las variables
    // tipográficas de report-styles.css (mismo orden de especificidad).
    // OJO: correr SIEMPRE antes de inlineAllStyles, que elimina las clases
    // y haría imposibles las detecciones classList de más abajo.
    if (!root) return;

    const setStyle = (el, styles) => {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
        const current = el.getAttribute('style') || '';
        const next = Object.entries(styles).map(([key, value]) => `${key}:${value};`).join('');
        el.setAttribute('style', `${current};${next}`);
    };

    root.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();

        if (tag === 'table') {
            setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
        }

        if (['th', 'td', 'p', 'li', 'div', 'span', 'strong', 'b', 'label'].includes(tag)) {
            const isTitle = el.classList.contains('report-box-title');
            const isSubTitle = el.classList.contains('report-subsection-title');
            const isMainTitle = el.classList.contains('report-main-title');

            if (isMainTitle) {
                setStyle(el, { 'font-size': '30px', 'line-height': '1.2', 'font-weight': '800' });
            } else if (isTitle) {
                setStyle(el, { 'font-size': '17px', 'line-height': '1.35', 'font-weight': '700' });
            } else if (isSubTitle) {
                setStyle(el, { 'font-size': '14px', 'line-height': '1.4', 'font-weight': '700' });
            } else if (tag === 'th') {
                setStyle(el, { 'font-size': '11px', 'line-height': '1.4' });
            } else if (tag === 'td') {
                setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
            } else if (tag === 'p' || tag === 'li') {
                setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
            } else if (tag === 'div') {
                setStyle(el, { 'font-size': '12.5px', 'line-height': '1.5' });
            }
        }
    });

    // Keep-together para el motor Word/Medicap: cada sección intenta viajar
    // entera al paginar. El motor relaja el avoid cuando una sección es más
    // alta que la página (no puede evitarse físicamente).
    root.querySelectorAll('.report-box').forEach(box => {
        setStyle(box, { 'page-break-inside': 'avoid', 'mso-pagination': 'lines-together' });
        box.querySelectorAll('table, tr').forEach(el => {
            setStyle(el, { 'page-break-inside': 'avoid' });
        });
    });
}

/**
 * Garantiza que las tablas usen atributos HTML tradicionales (border,
 * cellpadding, cellspacing) y estilos compatibles con editores enriquecidos
 * (igual que las tablas que genera Microsoft Excel).
 */
function normalizeTablesForRichText(container) {
    container.querySelectorAll('table').forEach(table => {
        const isLayout = table.classList.contains('layout-table');

        if (isLayout) {
            table.setAttribute('border', '0');
            table.setAttribute('cellpadding', '0');
            table.setAttribute('cellspacing', '0');
            table.style.border = 'none';
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';

            table.querySelectorAll('td, th').forEach(cell => {
                cell.style.border = 'none';
            });
        } else {
            // Color de cabecera según la sección del informe (data-kind)
            const boxEl = table.closest('.report-box');
            const boxKind = boxEl ? boxEl.getAttribute('data-kind') : '';
            const headerColor = {
                procedure: '#2563eb',
                diagnostics: '#0f766e',
                description: '#4f46e5',
                additional: '#1d4ed8',
                measurements: '#7c3aed',
                staff: '#475569',
                indications: '#059669'
            }[boxKind] || '#2563eb';

            table.setAttribute('border', '1');
            table.setAttribute('cellpadding', '5');
            table.setAttribute('cellspacing', '0');
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.borderColor = '#cbd5e1';

            table.querySelectorAll('th').forEach(th => {
                th.style.backgroundColor = headerColor;
                th.style.background = headerColor; // shorthand, igual que Excel
                th.style.color = '#ffffff';
                th.style.fontWeight = 'bold';
                th.style.padding = '5px 8px';
                // 1px (no 1pt): el valor computado devuelto por el navegador es
                // '1px solid ...' y así el dedupe de inlineAllStyles elimina los
                // 4 longhands equivalentes (~128 chars por celda).
                th.style.border = `1px solid ${headerColor}`;
                th.style.textAlign = 'left';
                // Atributo HTML4: muchos editores web lo conservan aunque quiten style.
                th.setAttribute('bgcolor', headerColor);
                // Pistas compatibles con Word (mso-): algunos controles tipo
                // Word ignoran el CSS estándar pero respetan estas propiedades.
                // Solo en th: en td se descartaron para rendir el límite de
                // 50.000 caracteres que Medicap acepta por informe.
                th.style.setProperty('mso-background-source', 'auto');
                th.style.setProperty('mso-pattern', 'gray-5 auto');
                th.style.setProperty('mso-border-alt', `solid ${headerColor} .5pt`);
                th.style.setProperty('mso-font-charset', 'auto');
            });

            table.querySelectorAll('td').forEach(td => {
                td.style.padding = '5px 8px';
                td.style.border = '1px solid #cbd5e1';
            });

            // Rayado de filas alternas: reforzado con bgcolor (HTML4)
            // y con el shorthand background: (igual que Excel).
            table.querySelectorAll('tbody tr:nth-child(even)').forEach(tr => {
                tr.style.backgroundColor = '#f8fafc';
                tr.style.background = '#f8fafc';
                tr.setAttribute('bgcolor', '#f8fafc');
                tr.style.setProperty('mso-background-source', 'auto');
                tr.style.setProperty('mso-pattern', 'gray-5 auto');
            });

            // Filas de título de medición: banda de color violeta claro
            table.querySelectorAll('tbody tr.report-measurement-title-row').forEach(tr => {
                const rowColor = '#ede9fe';
                tr.style.backgroundColor = rowColor;
                tr.style.background = rowColor;
                tr.setAttribute('bgcolor', rowColor);
                tr.querySelectorAll('td').forEach(td => {
                    td.style.fontWeight = 'bold';
                    td.style.color = '#4c1d95';
                });
            });
        }
    });
}

/**
 * Método de respaldo: selecciona el contenido de un elemento temporal
 * y usa document.execCommand('copy') para empaquetar el HTML en el portapapeles.
 */
function fallbackCopyHtml(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.contentEditable = 'true';
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.opacity = '0';
    tempDiv.innerHTML = htmlContent;

    document.body.appendChild(tempDiv);

    const range = document.createRange();
    range.selectNodeContents(tempDiv);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (copyErr) {
        console.error('execCommand("copy") lanzó un error:', copyErr);
        successful = false;
    }

    selection.removeAllRanges();
    document.body.removeChild(tempDiv);

    if (!successful) {
        throw new Error('No se pudo ejecutar el comando de copia en el navegador.');
    }
}

/**
 * Feedback visual momentáneo en el botón "Copiar con Formato".
 */
function showCopyFeedback(message, btnEl) {
    const btn = btnEl || elements.copyFormattedReportBtn;
    if (!btn) {
        showNotification(message, 'info');
        return;
    }
    const originalHtml = btn.innerHTML;
    const originalBackground = btn.style.background;
    btn.innerHTML = '<i class="fas fa-check mr-1"></i> ' + message;
    btn.style.background = '#16a34a';
    setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.background = originalBackground;
    }, 2500);
}

/**
 * DEPURACIÓN: Genera el mismo HTML listo para copiar (con estilos inline),
 * lo muestra en un modal y lo deja en window.__lastCopiedHtml.
 * Uso desde consola:  inspectReportHtml()
 * Sirve para verificar qué conserva realmente el portapapeles y para
 * probar el pegado en el editor destino (Medicap).
 */
function inspectReportHtml() {
    const reportContent = elements.reportContent;
    if (!reportContent) {
        showNotification('No hay informe generado.', 'error');
        return null;
    }

    const clone = reportContent.cloneNode(true);
    clone.querySelectorAll('.no-print, [data-html2canvas-ignore="true"]').forEach(el => el.remove());
    normalizeTablesForRichText(clone);
    forceReportCopyStyles(clone); // misma posición que en copyFormattedReport
    inlineAllStyles(reportContent, clone);

    const fragment = `
        <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;background-color:#ffffff;">
            ${clone.innerHTML}
        </div>
    `.trim();
    const styledHtml = buildOfficeHtml(fragment);

    window.__lastCopiedHtml = styledHtml;
    console.log('[Depuración] HTML a copiar (%d bytes):', styledHtml.length);
    if (styledHtml.length > MEDICAP_MAX_CHARS) {
        console.warn('[Depuración] HTML supera el límite de Medicap:', styledHtml.length);
        showNotification(`El HTML supera el límite de ${MEDICAP_MAX_CHARS} caracteres de Medicap (${styledHtml.length}).`, 'warning');
    }
    console.log(styledHtml);

    const modal = createModal('HTML a copiar (inspección)', `
        <textarea readonly spellcheck="false"
            style="width:100%;min-height:50vh;font-family:monospace;font-size:11px;border:1px solid #e2e8f0;border-radius:6px;padding:0.5rem;"
            onclick="this.select()"></textarea>
        <p class="text-sm text-gray-500 mt-2">Selecciona el HTML para revisarlo, o cópialo y pégalo en el editor destino para probar la compatibilidad.</p>
    `);
    const ta = modal.querySelector('textarea');
    ta.value = styledHtml;
    return styledHtml;
}
window.inspectReportHtml = inspectReportHtml;
