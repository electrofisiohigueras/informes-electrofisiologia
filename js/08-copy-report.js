// ===================================================================
// COPIADO CON FORMATO (MEDICAP / EXCEL) CON ESTILOS INLINE
// ===================================================================

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
        normalizeTablesForRichText(clone);

        // 3. Convertir los estilos computados reales (Tailwind + report-styles.css)
        //    a atributos style="..." inline y eliminar las clases.
        inlineAllStyles(reportContent, clone);

        // 4. Envolver en un contenedor con tipografía base para el destino
        //    y empaquetar como documento Office (Word/Excel) para que
        //    destinos como Medicap conserven los colores al pegar.
        forceReportCopyStyles(clone);
        const fragment = `
            <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;background-color:#ffffff;">
                ${clone.innerHTML}
            </div>
        `.trim();
        const styledHtml = buildOfficeHtml(fragment);

        const plainText = clone.innerText || clone.textContent || '';

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
                showCopyFeedback('Copiado (HTML moderno)', btnEl);
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
        showCopyFeedback('Copiado (respaldo execCommand)', btnEl);

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
    const essentialStyles = [
        'font-family', 'font-size', 'font-weight', 'font-style', 'color',
        'background-color', 'text-align', 'text-transform', 'text-decoration',
        'line-height', 'letter-spacing', 'padding', 'padding-top', 'padding-right',
        'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right',
        'margin-bottom', 'margin-left', 'border', 'border-top', 'border-right',
        'border-bottom', 'border-left', 'border-color', 'border-style', 'border-width',
        'border-collapse', 'width', 'min-width', 'max-width', 'height',
        'vertical-align', 'white-space', 'box-sizing', 'border-radius', 'display'
    ];

    for (let i = 0; i < origElements.length; i++) {
        const orig = origElements[i];
        const cln = cloneElements[i];

        if (!orig || !cln || cln.nodeType !== Node.ELEMENT_NODE) continue;

        const computed = window.getComputedStyle(orig);
        let styleString = '';

        essentialStyles.forEach(prop => {
            let val = computed.getPropertyValue(prop);
            if (val && val !== 'initial' && val !== 'none' && val !== 'normal' && val !== 'rgba(0, 0, 0, 0)') {
                if (prop === 'color' || prop === 'background-color') {
                    val = rgbToHex(val);
                }
                styleString += `${prop}:${val};`;
            }
        });

        // Reemplazar gradientes CSS por colores sólidos (los editores
        // de texto enriquecido ignoran los gradientes).
        if (computed.backgroundImage && computed.backgroundImage !== 'none') {
            if (orig.classList.contains('report-box-title') || orig.tagName === 'TH') {
                styleString += 'background-color:#2563eb;color:#ffffff;';
            } else if (orig.tagName === 'HEADER' || orig.classList.contains('report-title') || orig.classList.contains('report-main-title')) {
                styleString += 'background-color:#1e3a5f;color:#ffffff;';
            }
        }

        // Unir estilos ya presentes (p.ej. los fijados por normalizeTablesForRichText
        // o los inline del generador) con los estilos computados.
        const existingStyle = cln.getAttribute('style') || '';

        // Si ya existe un ancho explícito (p.ej. el recuadro compacto de Personal
        // Médico con width:50%), preservarlo: el ancho computado en px fijo haría
        // que la caja se viera de ancho distinto al pegar en destinos como Medicap.
        if (/(?:^|;)\s*width\s*:/.test(existingStyle)) {
            styleString = styleString.replace(/width\s*:[^;]+(?:;|$)/g, '');
        }

        cln.setAttribute('style', `${existingStyle};${styleString}`);

        // Eliminar 'class' para que el destino no dependa de hojas externas.
        cln.removeAttribute('class');
    }
}

function forceReportCopyStyles(root) {
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
                th.style.border = `1pt solid ${headerColor}`;
                th.style.textAlign = 'left';
                // Atributo HTML4: muchos editores web lo conservan aunque quiten style.
                th.setAttribute('bgcolor', headerColor);
                // Pistas compatibles con Word (mso-): algunos controles tipo
                // Word ignoran el CSS estándar pero respetan estas propiedades.
                th.style.setProperty('mso-background-source', 'auto');
                th.style.setProperty('mso-pattern', 'gray-5 auto');
                th.style.setProperty('mso-border-alt', `solid ${headerColor} .5pt`);
                th.style.setProperty('mso-font-charset', 'auto');
            });

            table.querySelectorAll('td').forEach(td => {
                td.style.padding = '5px 8px';
                td.style.border = '1pt solid #cbd5e1';
                td.style.setProperty('mso-background-source', 'auto');
                td.style.setProperty('mso-pattern', 'gray-5 auto');
                td.style.setProperty('mso-border-alt', 'solid #cbd5e1 .5pt');
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
    inlineAllStyles(reportContent, clone);

    const fragment = `
        <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;background-color:#ffffff;">
            ${clone.innerHTML}
        </div>
    `.trim();
    const styledHtml = buildOfficeHtml(fragment);

    window.__lastCopiedHtml = styledHtml;
    console.log('[Depuración] HTML a copiar (%d bytes):', styledHtml.length);
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
