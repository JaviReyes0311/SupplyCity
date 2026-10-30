'use strict';

/**
 * toast.js — Notificaciones tipo "toast" reutilizables en todo el front.
 *
 * Uso:
 *   Toast.success('Sesión iniciada');
 *   Toast.error('Credenciales inválidas');
 *   Toast.info('Procesando...');
 *
 * No depende de ninguna librería. Crea su propio contenedor y estilos mínimos
 * si no existen. El CSS visual vive en vista/CSS/toast.css (se incluye aparte),
 * pero este módulo inyecta un fallback por si esa hoja no está cargada.
 */
const Toast = (function () {
    const CONTAINER_ID = 'toast-container';

    function ensureContainer() {
        let container = document.getElementById(CONTAINER_ID);
        if (!container) {
            container = document.createElement('div');
            container.id = CONTAINER_ID;
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * @param {string} message  Texto a mostrar.
     * @param {'success'|'error'|'info'} [type]  Tipo visual.
     * @param {number} [durationMs]  Tiempo visible antes de auto-cerrar.
     */
    function show(message, type = 'info', durationMs = 3000) {
        const container = ensureContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.textContent = message;

        container.appendChild(toast);

        // Forzar reflow para que la transición de entrada aplique.
        // eslint-disable-next-line no-unused-expressions
        toast.offsetHeight;
        toast.classList.add('toast--visible');

        const remove = () => {
            toast.classList.remove('toast--visible');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            // Fallback si no hay transición.
            setTimeout(() => toast.remove(), 400);
        };

        const timer = setTimeout(remove, durationMs);

        // Click para cerrar antes de tiempo.
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            remove();
        });

        return toast;
    }

    return {
        show,
        success: (msg, ms) => show(msg, 'success', ms),
        error: (msg, ms) => show(msg, 'error', ms),
        info: (msg, ms) => show(msg, 'info', ms)
    };
})();
