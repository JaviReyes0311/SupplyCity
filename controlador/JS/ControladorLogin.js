'use strict';

/**
 * ControladorLogin.js — Maneja el formulario de login contra la API .NET.
 *
 * Flujo:
 *  1. El usuario envía email + password.
 *  2. Se hace POST /api/auth/login (JSON).
 *  3. La API responde con { token, userId, tenantId, sucursalId, nombre, tipoUsuario }.
 *  4. Se guarda la sesión en sessionStorage vía Auth.setSession.
 *  5. Se redirige a caseback.html.
 *
 * El token viaja en el body de la respuesta y se guarda en sessionStorage,
 * NUNCA en la URL. Requiere que auth.js esté cargado antes que este script.
 */
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const btnSignUp = document.getElementById('SignUp');
    const btnForgotPassword = document.getElementById('ForgotPassword');
    const btnLogin = document.getElementById('Login');

    // Si ya hay sesión activa, saltar directo (evita re-login innecesario).
    if (Auth.isAuthenticated()) {
        window.location.href = 'caseback.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showError('Por favor complete todos los campos');
                return;
            }

            setLoading(true);

            try {
                const response = await fetch(`${Auth.API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.status === 401) {
                    showError('Credenciales inválidas');
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                // Validación mínima de la respuesta esperada.
                if (!data || !data.token || data.tenantId == null) {
                    throw new Error('Respuesta de login incompleta');
                }

                Auth.setSession(data);

                // Feedback de éxito antes de redirigir (breve pausa para que se vea).
                showSuccess(`Bienvenido, ${data.nombre}`);
                setTimeout(() => {
                    window.location.href = 'caseback.html';
                }, 900);
            } catch (err) {
                console.error('Error en login:', err);
                showError('No se pudo conectar con el servidor. Intenta de nuevo.');
                setLoading(false);
            }
        });
    }

    if (btnSignUp) {
        btnSignUp.addEventListener('click', function () {
            window.location.href = 'signup.html';
        });
    }

    if (btnForgotPassword) {
        btnForgotPassword.addEventListener('click', function () {
            alert('Función de recuperación de contraseña en desarrollo');
        });
    }

    function setLoading(isLoading) {
        if (btnLogin) {
            btnLogin.disabled = isLoading;
            btnLogin.style.opacity = isLoading ? '0.6' : '1';
        }
    }

    function showError(message) {
        if (typeof Toast !== 'undefined') {
            Toast.error(message);
        } else {
            alert(message); // fallback si toast.js no cargó
        }
    }

    function showSuccess(message) {
        if (typeof Toast !== 'undefined') {
            Toast.success(message);
        }
    }
});
