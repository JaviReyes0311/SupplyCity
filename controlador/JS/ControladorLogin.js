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
                // Guardar email en localStorage antes de la petición
                localStorage.setItem('userEmail', email);
                console.log('Email guardado en localStorage:', email);

                const response = await fetch('../../controlador/php/Login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    const data = await response.json();
                    if (data.success) {
                        window.location.href = data.redirectUrl || '../../vista/HTML/caseback.html';
                    } else {
                        showError(data.message || 'Error en las credenciales');
                        localStorage.removeItem('userEmail');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error de conexión con el servidor');
                localStorage.removeItem('userEmail');
            }
        });
    }

    // Manejar botón SignUp
    if (btnSignUp) {
        btnSignUp.addEventListener('click', function() {
            window.location.href = "../html/signup.html";
        });
    }

    // Manejar botón Forgot Password
    if (btnForgotPassword) {
        btnForgotPassword.addEventListener('click', function() {
            alert('Función de recuperación de contraseña en desarrollo');
        });
    }

    // Función para mostrar errores
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Eliminar mensajes anteriores
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Insertar después del formulario
        if (loginForm) {
            loginForm.appendChild(errorElement);
        } else {
            alert(message);
        }
    }
});