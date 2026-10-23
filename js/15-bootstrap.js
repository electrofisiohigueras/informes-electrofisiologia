// ===================================================================
// 13. FUNCIONES DE DATOS COMUNES
// ===================================================================

// Funciones de datos comunes se movieron a sus nuevas ubicaciones
// El código anterior del modal se eliminó ya que se reemplazó con una vista completa

// ===================================================================
// 14. INICIALIZACIÓN AUTOMÁTICA
// ===================================================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await initializeApp();
    });
} else {
    (async () => {
        await initializeApp();
    })();
}

// ===================================================================
// PWA: registro del service worker
// Solo en HTTPS (versión publicada en GitHub Pages). La copia local
// (file://) queda intacta: los service workers no existen allí.
// ===================================================================
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => {
            console.warn('Service worker no registrado (la app funciona igual en línea):', err);
        });
    });
}
