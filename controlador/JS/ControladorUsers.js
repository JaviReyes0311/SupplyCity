document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let usuariosGlobales = [];
    let tiposUsuarioGlobales = [];
    let searchTimeout;

    // Elementos del DOM
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');

    // Cargar usuarios y configurar eventos
    cargarUsuarios();
    configurarEventosMenu();
    configurarEventosBusqueda();

    // Función para cargar usuarios
    function cargarUsuarios() {
        fetch('../../controlador/php/ObtenerUsuarios.php')
            .then(response => {
                if (!response.ok) throw new Error('Error en la red');
                return response.json();
            })
            .then(usuarios => {
                usuariosGlobales = usuarios;
                // Extraer tipos de usuario únicos
                tiposUsuarioGlobales = [...new Set(usuarios.map(u => u.Tipo_Usuario))];
                actualizarFiltroTiposUsuario();
                renderizarUsuarios(usuarios);
            })
            .catch(error => {
                console.error('Error al cargar usuarios:', error);
                mostrarAlerta('Error al cargar usuarios', 'error');
            });
    }

    // Función para renderizar usuarios
    function renderizarUsuarios(usuarios) {
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
                <th style="padding: 10px; text-align: left;">Ultimo Acceso</th>
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
    }

    // Función para actualizar el filtro de tipos de usuario
    function actualizarFiltroTiposUsuario() {
        if (!categoryFilter) return;
        
        // Limpiar opciones existentes (excepto la primera)
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Agregar tipos de usuario
        tiposUsuarioGlobales.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            categoryFilter.appendChild(option);
        });
    }

    // Función para filtrar usuarios
    function filtrarUsuarios() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = categoryFilter.value;
        
        const usuariosFiltrados = usuariosGlobales.filter(usuario => {
            const matchesSearch = usuario.user.toLowerCase().includes(searchTerm) || 
                                usuario.Nombre.toLowerCase().includes(searchTerm) ||
                                usuario.Apellido.toLowerCase().includes(searchTerm);
            const matchesType = !selectedType || usuario.Tipo_Usuario === selectedType;
            
            return matchesSearch && matchesType;
        });
        
        renderizarUsuarios(usuariosFiltrados);
    }

    // Función para formatear la fecha
    function formatFecha(fechaString) {
        if (!fechaString) return 'Nunca';
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    // Funciones para editar y eliminar usuarios
    function editarUsuario(email) {
        console.log(`Editar usuario: ${email}`);
        // Aquí puedes implementar la lógica para editar
        // Por ejemplo: window.location.href = `editar_usuario.html?email=${encodeURIComponent(email)}`;
    }

    function eliminarUsuario(email) {
        if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${email}?`)) {
            console.log(`Eliminar usuario: ${email}`);
            // Aquí puedes implementar la lógica para eliminar
            // fetch(`eliminar_usuario.php?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
            // .then(response => {
            //     if (response.ok) {
            //         mostrarAlerta('Usuario eliminado correctamente', 'success');
            //         cargarUsuarios();
            //     }
            // });
        }
    }

    // Función para mostrar alertas
    function mostrarAlerta(mensaje, tipo) {
        // Implementa tu sistema de alertas o usa alert() temporalmente
        alert(`${tipo}: ${mensaje}`);
    }

    // Configurar eventos del menú
    function configurarEventosMenu() {
        document.querySelector('#btnHome').addEventListener('click', function() {
            window.location.href = "../html/Home.html";
        });
        document.querySelector('#btnStngs').addEventListener('click', function() {
            window.location.href = "../html/settings.html";
        });
        document.querySelector('#btnPos').addEventListener('click', function() {
            window.location.href = "../html/Pos.html";
        });
        document.querySelector('#btnUsers').addEventListener('click', function() {
            window.location.href = "../html/Users.html";
        });
        document.querySelector('#btnInv').addEventListener('click', function() {
            window.location.href = "../html/Inventor.html";
        });
        document.querySelector('#btnStd').addEventListener('click', function() {
            window.location.href = "../html/Stadistics.html";
        });
        document.querySelector('#Shft').addEventListener('click', function() {
            window.location.href = "../html/login.html";
        });
    }

    // Configurar eventos de búsqueda
    function configurarEventosBusqueda() {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(filtrarUsuarios, 300);
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filtrarUsuarios);
        }
    }
});