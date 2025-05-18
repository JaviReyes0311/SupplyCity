// FUNCIONES PRINCIPALES
document.addEventListener('DOMContentLoaded', function() {
cargarUsuarios();

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

var btnShft = document.querySelector('#Shft');
btnShft.addEventListener('click',function(){
    console.log("prueba");
    window.location.href = "../html/login.html";
})
   
});
function cargarUsuarios() {
    fetch('../../controlador/php/ObtenerUsuarios.php') // Asegúrate de que esta ruta sea correcta
        .then(response => {
            if (!response.ok) throw new Error('Error en la red');
            return response.json();
        })
        .then(usuarios => {
            const contenedor = document.querySelector('#Page');
            if (!contenedor) return;
            
            // Limpiar el contenedor antes de agregar nuevos elementos
            contenedor.innerHTML = '';
            
            // Crear título de la sección
            const titulo = document.createElement('h1');
            titulo.textContent = 'Gestión de Usuarios';
            titulo.style.color = '#004aad';
            titulo.style.marginBottom = '20px';
            contenedor.appendChild(titulo);
            
            // Crear tabla para mostrar usuarios
            const tabla = document.createElement('table');
            tabla.style.width = '100%';
            tabla.style.borderCollapse = 'collapse';
            
            // Crear encabezados de tabla
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr style="background-color: #004aad; color: white;">
                    <th style="padding: 10px; text-align: left; border-radius: 8px 0 0 0;">Email</th>
                    <th style="padding: 10px; text-align: left;">Nombre</th>
                    <th style="padding: 10px; text-align: left;">Apellido</th>
                    <th style="padding: 10px; text-align: left;">Tipo de Usuario</th>
                    <th style="padding: 10px; text-align: left;">Fecha de Creación</th>
                    <th style="padding: 10px; text-align: left; ">Ultimo Acceso</th>
                    <th style="padding: 10px; text-align: center;border-radius: 0 8px 0 0;">Acciones</th>
                </tr>
            `;
            tabla.appendChild(thead);
            
            // Crear cuerpo de tabla
            const tbody = document.createElement('tbody');
            
            // Agregar cada usuario como una fila en la tabla
            usuarios.forEach(usuario => {
                const fila = document.createElement('tr');
                fila.style.borderBottom = '1px solid #ddd';
                fila.style.backgroundColor = 'white';
                
                fila.innerHTML = `
                    <td style="padding: 10px;">${usuario.user}</td>
                    <td style="padding: 10px;">${usuario.Nombre}</td>
                    <td style="padding: 10px;">${usuario.Apellido}</td>
                    <td style="padding: 10px;">${usuario.Tipo_Usuario}</td>
                    <td style="padding: 10px;">${formatFecha(usuario.Fecha_Creacion)}</td>
                    <td style="padding: 10px;">${formatFecha(usuario.Ultimo_Login)}</td>
                    <td style="padding: 10px; text-align: center;">
                        <button class="action-btn" id="btn1" style="margin-right: 5px;">✏️</button>
                        <button class="action-btn" id="btn2">🗑️</button>
                    </td>
                `;
                
                tbody.appendChild(fila);
            });
            
            tabla.appendChild(tbody);
            contenedor.appendChild(tabla);
            
            // Agregar eventos a los botones de acción
            agregarEventosBotones();
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            mostrarAlerta('Error al cargar usuarios', 'error');
        });
}

// Función para formatear la fecha (opcional)
function formatFecha(fechaString) {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para agregar eventos a los botones
function agregarEventosBotones() {
    document.querySelectorAll('#btn1').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fila = e.target.closest('tr');
            const email = fila.cells[0].textContent;
            editarUsuario(email);
        });
    });
    
    document.querySelectorAll('#btn2').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fila = e.target.closest('tr');
            const email = fila.cells[0].textContent;
            eliminarUsuario(email);
        });
    });
}

// Funciones para editar y eliminar usuarios (puedes implementarlas)
function editarUsuario(email) {
    console.log(`Editar usuario: ${email}`);
    // Aquí puedes implementar la lógica para editar
}

function eliminarUsuario(email) {
    console.log(`Eliminar usuario: ${email}`);
    // Aquí puedes implementar la lógica para eliminar
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    // Implementa tu sistema de alertas o usa alert() temporalmente
    alert(`${tipo}: ${mensaje}`);
}

// Cargar usuarios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarUsuarios);