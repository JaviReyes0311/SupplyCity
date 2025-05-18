'use strict'
document.addEventListener('DOMContentLoaded', function() {

     // Cargar tema al iniciar
    // Cargar tema al iniciar
    cargarTema();
    
    // Manejador para el botón de cambio de tema
    const themeButton = document.getElementById('switchTheme');
    if (themeButton) {
        themeButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
            alternarTema();
        });
    }

    var btnHome = document.querySelector('#btnHome');
btnHome.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/Home.html";
})
var btnSettings = document.querySelector('#btnStngs');
btnSettings.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/settings.html";
})

var btnPos = document.querySelector('#btnPos');
btnPos.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/Pos.html";
})


var btnUsers = document.querySelector('#btnUsers');
btnUsers.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/Users.html";
})

var btnInv = document.querySelector('#btnInv');
btnInv.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/Inventor.html";
})

var btnAcnts = document.querySelector('#btnAcnts');
btnAcnts.addEventListener('click',function(){
    console.log("prueba");
    //window.location.href = "../html/Undefined.html";
})

var btnStd = document.querySelector('#btnStd');
btnStd.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/Stadistics.html";

})
var btnStd2 = document.querySelector('#btnStd2');
btnStd2.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/Stadistics.html";
})
    var btnLO = document.querySelector('#btnLO');
btnLO.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/login.html";


})

var btnShft = document.querySelector('#Shft');
btnShft.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/login.html";
})
 
});
// Funciones para el manejo del tema
function cargarTema() {
    const temaGuardado = localStorage.getItem('tema');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Si no hay tema guardado, usar la preferencia del sistema
    if (temaGuardado === null && prefersDark) {
        document.body.classList.add('dark-theme');
    } else if (temaGuardado === 'oscuro') {
        document.body.classList.add('dark-theme');
    }
    
    actualizarTextoBotonTema();
}

function alternarTema() {
    document.body.classList.toggle('dark-theme');
    const estaOscuro = document.body.classList.contains('dark-theme');
    localStorage.setItem('tema', estaOscuro ? 'oscuro' : 'claro');
    
    actualizarTextoBotonTema();
}

function actualizarTextoBotonTema() {
    const estaOscuro = document.body.classList.contains('dark-theme');
    const themeBtn = document.getElementById('switchTheme');
    if (themeBtn) {
        themeBtn.textContent = estaOscuro ? 'Light Mode' : 'Dark Mode';
    }
}