function showNotification(message, type = 'success') {
    const colorByType = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    const iconByType = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded shadow-lg flex items-center gap-2 ${
        colorByType[type] || colorByType.success
    } text-white`;
    notification.style.zIndex = '4000';
    notification.innerHTML = `<i class="fas ${iconByType[type] || iconByType.success}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(notification);

    // Animación de entrada
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'all 0.3s ease-in-out';
    
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    });

    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Modal de confirmación reutilizable basado en Promise.
 * Resuelve true si el usuario confirma y false si cancela
 * (botón Cancelar, clic fuera del modal o tecla Escape).
 */
function showConfirmDialog(title, message, options = {}) {
    return new Promise((resolve) => {
        const confirmText = options.confirmText || 'Confirmar';
        const cancelText = options.cancelText || 'Cancelar';
        const danger = options.danger !== false; // por defecto, acción destructiva

        const overlay = document.createElement('div');
        overlay.className = 'app-dialog-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15, 23, 42, 0.5);';

        const modal = document.createElement('div');
        modal.className = 'modal-content';
        modal.style.maxWidth = '26rem';
        modal.innerHTML = `
            <div class="modal-header">
                <h2>${escapeHtml(title)}</h2>
            </div>
            <div class="modal-body">
                <p style="margin:0;color:#334155;">${escapeHtml(message)}</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-role="cancel">${escapeHtml(cancelText)}</button>
                <button type="button" class="btn ${danger ? 'btn-error' : 'btn-primary'}" data-role="confirm">${escapeHtml(confirmText)}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = (result) => {
            document.removeEventListener('keydown', handleKey);
            overlay.remove();
            resolve(result);
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') close(false);
        };

        modal.querySelector('[data-role="cancel"]').addEventListener('click', () => close(false));
        modal.querySelector('[data-role="confirm"]').addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });
        document.addEventListener('keydown', handleKey);

        modal.querySelector('[data-role="confirm"]').focus();
    });
}
window.showConfirmDialog = showConfirmDialog;

/**
 * Modal con la lista de campos obligatorios pendientes
 * (reemplaza el alert de validación del formulario).
 */
function showValidationErrors(errors) {
    const overlay = document.createElement('div');
    overlay.className = 'app-dialog-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(15, 23, 42, 0.5);';

    const modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.maxWidth = '26rem';
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Faltan campos obligatorios</h2>
        </div>
        <div class="modal-body">
            <ul style="margin:0;padding-left:1.25rem;color:#334155;">
                ${errors.map(err => `<li style="margin-bottom:0.35rem;">${escapeHtml(err)}</li>`).join('')}
            </ul>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-role="close">Aceptar</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

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

    modal.querySelector('[data-role="close"]').focus();
}
window.showValidationErrors = showValidationErrors;

// Placeholders simples para evitar errores si aún no están implementados