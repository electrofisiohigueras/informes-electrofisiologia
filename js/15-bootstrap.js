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
