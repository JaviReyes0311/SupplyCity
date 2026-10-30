'use strict';

/**
 * auth.js — Módulo centralizado de sesión y acceso a la API.
 *
 * Responsabilidades:
 *  - Guardar / leer / limpiar la sesión del usuario (token JWT + tenant_id + datos).
 *  - Exponer un helper apiFetch() que agrega el Bearer token automáticamente.
 *  - Proteger páginas con requireAuth() (redirige a login si no hay sesión).
 *
 * Persistencia: sessionStorage (sobrevive recargas F5, se borra al cerrar la pestaña).
 * En la beta final se evaluará migrar a cookies HttpOnly para mayor seguridad.
 *
 * El token NUNCA viaja en la URL. Siempre en el header Authorization.
 */
const Auth = (function () {
    // ---- Configuración ----
    // Base URL de la API .NET. Ajustar si el puerto cambia (ver launchSettings.json).
    const API_BASE = 'http://localhost:5102';

    // Clave única bajo la que se guarda toda la sesión en sessionStorage.
    const SESSION_KEY = 'supplycity.session';

    // Ruta al login, relativa a las páginas de /vista/HTML/.
    const LOGIN_PAGE = 'login.html';

    // ---- Sesión ----

    /**
     * Guarda la sesión completa devuelta por POST /api/auth/login.
     * @param {{token:string, userId:number, tenantId:number, sucursalId:number, nombre:string, tipoUsuario:string}} data
     */
    function setSession(data) {
        const session = {
            token: data.token,
            userId: data.userId,
            tenantId: data.tenantId,
            sucursalId: data.sucursalId,
            nombre: data.nombre,
            tipoUsuario: data.tipoUsuario,
            savedAt: Date.now()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    /** Devuelve la sesión actual o null si no hay. */
    function getSession() {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            // Sesión corrupta: limpiar para evitar estados raros.
            clearSession();
            return null;
        }
    }

    function getToken() {
        const s = getSession();
        return s ? s.token : null;
    }

    function getTenantId() {
        const s = getSession();
        return s ? s.tenantId : null;
    }

    function isAuthenticated() {
        return getToken() !== null;
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    function logout() {
        clearSession();
        window.location.href = LOGIN_PAGE;
    }

    // ---- Guard de páginas protegidas ----

    /**
     * Llamar al inicio de cualquier página que requiera sesión.
     * Si no hay sesión, redirige al login y devuelve false.
     */
    function requireAuth() {
        if (!isAuthenticated()) {
            window.location.href = LOGIN_PAGE;
            return false;
        }
        return true;
    }

    // ---- Helper de llamadas a la API ----

    /**
     * fetch hacia la API con el Bearer token agregado automáticamente.
     * @param {string} path  Ruta relativa a la API, p.ej. '/api/productos'.
     * @param {RequestInit} [options]
     * @returns {Promise<Response>}
     *
     * Si la API responde 401 (token inválido/expirado), limpia la sesión
     * y redirige al login.
     */
    async function apiFetch(path, options = {}) {
        const token = getToken();
        const headers = Object.assign(
            { 'Content-Type': 'application/json' },
            options.headers || {}
        );
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            clearSession();
            window.location.href = LOGIN_PAGE;
        }

        return response;
    }

    // API pública del módulo
    return {
        API_BASE,
        setSession,
        getSession,
        getToken,
        getTenantId,
        isAuthenticated,
        clearSession,
        logout,
        requireAuth,
        apiFetch
    };
})();
