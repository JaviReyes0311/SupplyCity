document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
    setupMenuButtons();
    // ... (tus otros event listeners se mantienen igual)
});

function cargarProductos() {
    fetch('../../controlador/php/ObtenerInventario.php')
        .then(response => {
            if (!response.ok) throw new Error('Error en la red');
            return response.json();
        })
        .then(productos => {  // Cambiado de 'usuarios' a 'productos'
            const contenedor = document.querySelector('#Page');
            if (!contenedor) return;
            
            contenedor.innerHTML = '';
            
            const titulo = document.createElement('h1');
            titulo.textContent = 'Gestión de Inventario';
            titulo.style.color = '#004aad';
            titulo.style.marginBottom = '20px';
            contenedor.appendChild(titulo);
            
            const tabla = document.createElement('table');
            tabla.style.width = '100%';
            tabla.style.borderCollapse = 'collapse';
            
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr style="background-color: #004aad; color: white;">
                    <th style="padding: 10px; text-align: left; border-radius: 8px 0 0 0;">ID</th>
                    <th style="padding: 10px; text-align: left;">Nombre</th>
                    <th style="padding: 10px; text-align: left;">Precio</th>
                    <th style="padding: 10px; text-align: left;">Stock</th>
                    <th style="padding: 10px; text-align: left;">Categoría</th>
                    <th style="padding: 10px; text-align: left;">Activo</th>
                    <th style="padding: 10px; text-align: center; border-radius: 0 8px 0 0;">Acciones</th>
                </tr>
            `;
            tabla.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            
            productos.forEach(producto => {  // Cambiado de 'Productos' a 'productos'
                const fila = document.createElement('tr');
                fila.style.borderBottom = '1px solid #ddd';
                fila.style.backgroundColor = 'white';
                
                fila.innerHTML = `
                    <td style="padding: 10px;">${producto.ID}</td>
                    <td style="padding: 10px;">${producto.Nombre}</td>
                    <td style="padding: 10px;">${producto.Precio}</td>
                    <td style="padding: 10px;">${producto.Stock}</td>
                    <td style="padding: 10px;">${producto.Id_Categoria}</td>
                    <td style="padding: 10px;">${producto.Activo ? 'Sí' : 'No'}</td>
                    <td style="padding: 10px; text-align: center;">
                        <button class="action-btn edit-btn" data-id="${producto.ID}" style="margin-right: 5px;">✏️</button>
                        <button class="action-btn delete-btn" data-id="${producto.ID}">🗑️</button>
                    </td>
                `;
                
                tbody.appendChild(fila);
            });
            
            tabla.appendChild(tbody);
            contenedor.appendChild(tabla);
            
            // Agregar eventos a los botones
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    editarProducto(id);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    eliminarProducto(id);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
            mostrarAlerta('Error al cargar productos', 'error');
        });
}

function editarProducto(id) {
    console.log(`Editar producto con ID: ${id}`);
    // Implementa tu lógica de edición aquí
    // window.location.href = `editar_producto.html?id=${id}`;
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de querer eliminar este producto?')) {
        console.log(`Eliminar producto con ID: ${id}`);
        // Implementa tu lógica de eliminación aquí
    }
}

function mostrarAlerta(mensaje, tipo) {
    // Implementa tu sistema de alertas
    alert(`${tipo}: ${mensaje}`);
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
                    // Limpiar localStorage al cerrar sesión
                    localStorage.removeItem('userEmail');
                }
                window.location.href = menuButtons[buttonId];
            });
        }
    });
}
