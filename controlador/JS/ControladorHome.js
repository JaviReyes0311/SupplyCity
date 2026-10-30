'use strict';

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar email del usuario
    displayUserEmail();
    
    // Configurar botones del menú
    setupMenuButtons();
    
    // Configurar botones de turno
    setupShiftButtons();
});

function displayUserEmail() {

    // El nombre viene de la sesión guardada por auth.js tras el login.
    const session = (typeof Auth !== 'undefined') ? Auth.getSession() : null;
    const userNameElement = document.getElementById('UserName');

    if (session && userNameElement) {
        userNameElement.textContent = `Username: ${session.nombre}`;
    } else {
        console.warn('No hay sesión activa para mostrar el usuario');
    }

    // Verifica si hay un valor almacenado
    const casebackAmount = localStorage.getItem('casebackAmount');
    
    if (casebackAmount) {
        // Asigna el valor al elemento h3
        document.getElementById('Caseback').textContent = 'Caseback: ' + casebackAmount + '$';
        
        // Opcional: limpia el localStorage después de usarlo
        // localStorage.removeItem('casebackAmount');
    }
}

function setupMenuButtons() {
    // Mapeo de botones a sus URLs
    const menuButtons = {
        'btnHome': '../html/Home.html',
        'btnStngs': '../html/settings.html',
        'btnPos': '../html/Pos.html',
        'btnUsers': '../html/Users.html',
        'btnInv': '../html/Inventor.html',
        'btnAcnts': '../html/Accounts.html',
        'btnStd': '../html/Stadistics.html',
        'Shft': '../html/login.html'
    };

    // Configurar eventos para cada botón
    Object.keys(menuButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                if (buttonId === 'Shft') {
                    // Cerrar sesión: limpia el token/sesión y redirige al login.
                    if (typeof Auth !== 'undefined') {
                        Auth.logout();
                        return;
                    }
                }
                window.location.href = menuButtons[buttonId];
            });
        }
    });
}

function setupShiftButtons() {
    const startShiftBtn = document.getElementById('StartShift');
    const finishShiftBtn = document.getElementById('FinishShift');
    const shiftTimeElement = document.getElementById('ShiftTime');

    if (startShiftBtn) {
        startShiftBtn.addEventListener('click', function() {
            const startTime = new Date();
            localStorage.setItem('shiftStartTime', startTime.toISOString());
            updateShiftTime();
            alert('Turno iniciado');
        });
    }

    if (finishShiftBtn) {
        finishShiftBtn.addEventListener('click', function() {
            localStorage.removeItem('shiftStartTime');
            if (shiftTimeElement) {
                shiftTimeElement.textContent = 'Shift Time: -';
            }
            alert('Turno finalizado');
        });
    }

    // Actualizar el tiempo del turno cada minuto
    setInterval(updateShiftTime, 60000);
    updateShiftTime();
}

function updateShiftTime() {
    const shiftStartTime = localStorage.getItem('shiftStartTime');
    const shiftTimeElement = document.getElementById('ShiftTime');

    if (shiftStartTime && shiftTimeElement) {
        const startTime = new Date(shiftStartTime);
        const currentTime = new Date();
        const diffMs = currentTime - startTime;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);

        shiftTimeElement.textContent = `Shift Time: ${diffHrs}h ${diffMins}m`;
    }
}