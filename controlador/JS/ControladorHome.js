'use strict'
document.addEventListener('DOMContentLoaded', function() {

   

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
    //window.location.href = "../html/Undefined.html";
})

var btnAcnts = document.querySelector('#btnAcnts');
btnAcnts.addEventListener('click',function(){
    console.log("prueba");
    //window.location.href = "../html/Undefined.html";
})

var btnStd = document.querySelector('#btnStd');
btnStd.addEventListener('click',function(){
    console.log("prueba");
    //window.location.href = "../html/Undefined.html";
})

var btnShft = document.querySelector('#Shft');
btnShft.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/login.html";
})
    
   
   });


    // Verifica si hay un valor almacenado
    const casebackAmount = localStorage.getItem('casebackAmount');
    
    if (casebackAmount) {
        // Asigna el valor al elemento h3
        document.getElementById('Caseback').textContent = 'Caseback: ' + casebackAmount + '$';
        
        // Opcional: limpia el localStorage después de usarlo
        // localStorage.removeItem('casebackAmount');
    }
    


    
    




