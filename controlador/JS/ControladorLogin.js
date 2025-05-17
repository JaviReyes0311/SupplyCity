'use strict';

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const btnSignUp = document.getElementById('SignUp');
    const btnForgotPassword = document.getElementById('ForgotPassword');

    // Mostrar error si existe en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
        showError(error);
        // Limpiar parámetro de error de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Manejar envío del formulario
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            // Validación básica en cliente
            if (!email || !password) {
                showError('Por favor complete todos los campos');
                return;
            }

            try {
                const response = await fetch('../../controlador/php/Login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
                });

                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    const data = await response.text();
                    showError('Error en las credenciales');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error de conexión con el servidor');
            }
        });
    }

    // Manejar botón SignUp
    if (btnSignUp) {
        btnSignUp.addEventListener('click', function() {
            window.location.href = "../html/signup.html";
        });
    }

    // Manejar botón Forgot Password (pendiente de implementación)
    if (btnForgotPassword) {
        btnForgotPassword.addEventListener('click', function() {
            alert('Función de recuperación de contraseña en desarrollo');
        });
    }

    // Función para mostrar errores
    function showError(message) {
        // Puedes implementar un sistema de notificación más elegante aquí
        alert(`Error: ${message}`);
    }
});