document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    let productosGlobales = [];
    let categoriasGlobales = [];
    let searchTimeout;

    // Elementos del DOM
    const cartPanel = document.getElementById('cart-panel');
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCounter = document.getElementById('cart-counter');
    const totalAmountElement = document.getElementById('total-amount');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');

    // Cargar productos y configurar eventos
    cargarProductos();
    configurarEventosMenu();
    configurarEventosCarrito();
    configurarEventosBusqueda();

    // Función para cargar productos
    function cargarProductos() {
        fetch('../../controlador/php/get_productos.php')
            .then(response => {
                if (!response.ok) throw new Error('Error al cargar productos');
                return response.json();
            })
            .then(productos => {
                productosGlobales = productos;
                // Extraer categorías únicas
                categoriasGlobales = [...new Set(productos.map(p => p.categoria))];
                actualizarFiltroCategorias();
                renderizarProductos(productos);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar productos');
            });
    }

    // Función para renderizar productos
    function renderizarProductos(productos) {
        const contenedor = document.querySelector('#Page');
        if (!contenedor) return;
        
        // Filtrar solo productos con stock disponible (opcional)
        const productosConStock = productos.filter(p => p.stock > 0);
        
        contenedor.innerHTML = productosConStock.map(producto => {
            const itemCarrito = carrito.find(item => item.id == producto.id);
            const cantidadInicial = itemCarrito ? itemCarrito.quantity : 0;

            return `
                <div class="product-card" data-id="${producto.id}" data-category="${producto.categoria}">
                    <img src="../../vista/IMAGES/logo-generico.png" alt="${producto.nombre}" class="product-img">
                    <div class="product-info">
                        <h3 class="product-name">${producto.nombre}</h3>
                        <p class="product-category">${producto.categoria}</p>
                        <p class="product-price">$${producto.precio.toFixed(2)}</p>
                        <p class="product-description">${producto.descripcion}</p>
                    </div>
                    <div class="product-actions">
                        <button class="action-btn remove-btn">−</button>
                        <span class="quantity">${cantidadInicial}</span>
                        <button class="action-btn add-btn">+</button>
                    </div>
                </div>
            `;
        }).join('');
        
        agregarEventosBotones();
        actualizarCarritoUI();
    }

    // Función para actualizar el filtro de categorías
    function actualizarFiltroCategorias() {
        if (!categoryFilter) return;
        
        // Limpiar opciones existentes (excepto la primera)
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Agregar categorías
        categoriasGlobales.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoryFilter.appendChild(option);
        });
    }

    // Función para filtrar productos
    function filtrarProductos() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        
        const productosFiltrados = productosGlobales.filter(producto => {
            const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm) || 
                                 producto.descripcion.toLowerCase().includes(searchTerm);
            const matchesCategory = !selectedCategory || producto.categoria === selectedCategory;
            
            return matchesSearch && matchesCategory;
        });
        
        renderizarProductos(productosFiltrados);
    }

    // Función para agregar eventos a los botones de productos
    function agregarEventosBotones() {
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const quantityElement = this.parentElement.querySelector('.quantity');
                if (!quantityElement) return;
                
                let quantity = parseInt(quantityElement.textContent) + 1;
                quantityElement.textContent = quantity;
                actualizarCarrito(this.closest('.product-card'));
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const quantityElement = this.parentElement.querySelector('.quantity');
                if (!quantityElement) return;
                
                let quantity = parseInt(quantityElement.textContent);
                if (quantity > 0) {
                    quantity--;
                    quantityElement.textContent = quantity;
                    actualizarCarrito(this.closest('.product-card'));
                }
            });
        });
    }

    // Función para actualizar el carrito
    function actualizarCarrito(productCard) {
        const productId = productCard.getAttribute('data-id');
        const quantity = parseInt(productCard.querySelector('.quantity').textContent);
        
        const index = carrito.findIndex(item => item.id === productId);
        
        if (index >= 0) {
            if (quantity > 0) {
                carrito[index].quantity = quantity;
            } else {
                carrito.splice(index, 1);
            }
        } else if (quantity > 0) {
            carrito.push({ id: productId, quantity });
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        actualizarCarritoUI();
    }

    // Función para actualizar la UI del carrito
    function actualizarCarritoUI() {
        // Actualizar contador
        const totalItems = carrito.reduce((total, item) => total + item.quantity, 0);
        cartCounter.textContent = totalItems;
        
        // Actualizar lista de productos
        cartItemsContainer.innerHTML = '';
        
        let total = 0;
        
        carrito.forEach(item => {
            const producto = productosGlobales.find(p => p.id == item.id);
            if (producto) {
                const subtotal = producto.precio * item.quantity;
                total += subtotal;
                
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${producto.nombre}</h4>
                        <p>${producto.descripcion}</p>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <span class="cart-item-price">$${subtotal.toFixed(2)}</span>
                        <button class="remove-item-btn" data-id="${producto.id}">🗑️</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemElement);
            }
        });
        
        // Actualizar total
        totalAmountElement.textContent = `$${total.toFixed(2)}`;
        
        // Agregar eventos a los botones de eliminar
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                eliminarDelCarrito(this.getAttribute('data-id'));
            });
        });
    }

    // Función para eliminar un producto del carrito
    function eliminarDelCarrito(productId) {
        carrito = carrito.filter(item => item.id !== productId);
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarCarritoUI();
        filtrarProductos(); // Vuelve a aplicar los filtros actuales
    }

    // Función para vaciar el carrito
    function vaciarCarrito() {
        carrito = [];
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarCarritoUI();
        filtrarProductos(); // Vuelve a aplicar los filtros actuales
    }

    // Función para actualizar el contador del carrito
    function actualizarContadorCarrito() {
        const totalItems = carrito.reduce((total, item) => total + item.quantity, 0);
        console.log(`Total items en carrito: ${totalItems}`);
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

    // Configurar eventos del carrito
    function configurarEventosCarrito() {
        openCartBtn.addEventListener('click', () => {
            cartPanel.classList.remove('hidden');
        });
        
        closeCartBtn.addEventListener('click', () => {
            cartPanel.classList.add('hidden');
        });
        
        clearCartBtn.addEventListener('click', vaciarCarrito);
        
        checkoutBtn.addEventListener('click', () => {
            if (carrito.length === 0) {
                alert('El carrito está vacío');
                return;
            }
            alert('Proceder al pago. Total: $' + 
                carrito.reduce((total, item) => {
                    const producto = productosGlobales.find(p => p.id == item.id);
                    return total + (producto ? producto.precio * item.quantity : 0);
                }, 0).toFixed(2));
        });
    }

    // Configurar eventos de búsqueda
    function configurarEventosBusqueda() {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(filtrarProductos, 300);
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', filtrarProductos);
        }
    }
});