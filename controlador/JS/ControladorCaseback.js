'use strict';
document.getElementById('casebackForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const casebackValue = document.getElementById('casebackInput').value;
    
    if (!casebackValue) {
        alert('Por favor ingresa un valor para Caseback');
        return;
    }
    
    localStorage.setItem('casebackAmount', casebackValue);
    console.log('Valor guardado:', casebackValue); // Para depuración
    
    // Redirecciona después de 500ms para asegurar que se guarde el valor
    setTimeout(() => {
        window.location.href = '../../vista/HTML/HOME.html';
    }, 5000);
});