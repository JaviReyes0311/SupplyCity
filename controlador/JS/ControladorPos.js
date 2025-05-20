document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    let productosGlobales = [];
    let categoriasGlobales = [];
    let searchTimeout;
    let metodoPagoSeleccionado = '';
    let montoTotal = 0;
    let propina = 0;

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
    
    // Elementos del popup de pago principal
    const ventanaEmergente = document.getElementById('ventana-emergente');
    const cerrarVentanaBtn = document.getElementById('cerrar-ventana');
    const montoTotalPopup = document.getElementById('monto-total-popup');
    const pagoEfectivoBtn = document.getElementById('pago-efectivo');
    const pagoTarjetaBtn = document.getElementById('pago-tarjeta');
    
    // Elementos del popup de pago en efectivo
    const pagoEfectivoPopup = document.getElementById('pago-efectivo-popup');
    const cerrarEfectivoBtn = document.getElementById('cerrar-efectivo');
    const totalEfectivoElement = document.getElementById('total-efectivo');
    const efectivoInput = document.getElementById('efectivo');
    const propinaInput = document.getElementById('propina');
    const cambioMontoElement = document.getElementById('cambio-monto');
    const confirmarEfectivoBtn = document.getElementById('confirmar-efectivo');
    const cancelarEfectivoBtn = document.getElementById('cancelar-efectivo');
    
    // Elementos del popup de pago con tarjeta
    const pagoTarjetaPopup = document.getElementById('pago-tarjeta-popup');
    const cerrarTarjetaBtn = document.getElementById('cerrar-tarjeta');
    const totalTarjetaElement = document.getElementById('total-tarjeta');
    const propinaTarjetaInput = document.getElementById('propina-tarjeta');
    const confirmarTarjetaBtn = document.getElementById('confirmar-tarjeta');
    const cancelarTarjetaBtn = document.getElementById('cancelar-tarjeta');
    
    // Elementos del popup de confirmación final
    const confirmacionPagoPopup = document.getElementById('confirmacion-pago-popup');
    const cerrarConfirmacionBtn = document.getElementById('cerrar-confirmacion');
    const metodoPagoTexto = document.getElementById('metodo-pago-texto');
    const montoPagoTexto = document.getElementById('monto-pago-texto');
    const confirmarPagoFinalBtn = document.getElementById('confirmar-pago-final');
    const cancelarPagoFinalBtn = document.getElementById('cancelar-pago-final');

    // Cargar productos y configurar eventos
    cargarProductos();
    configurarEventosMenu();
    configurarEventosCarrito();
    configurarEventosBusqueda();
    configurarEventosPopup();

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
                mostrarAlerta('Error al cargar productos', 'error');
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
        filtrarProductos();
    }

    // Función para vaciar el carrito
    function vaciarCarrito() {
        carrito = [];
        localStorage.setItem('carrito', JSON.stringify(carrito));
        actualizarCarritoUI();
        filtrarProductos();
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
                mostrarAlerta('El carrito está vacío', 'error');
                return;
            }
            
            // Calcular el total
            montoTotal = carrito.reduce((total, item) => {
                const producto = productosGlobales.find(p => p.id == item.id);
                return total + (producto ? producto.precio * item.quantity : 0);
            }, 0);
            
            // Mostrar el popup de pago
            mostrarPopupPago(montoTotal.toFixed(2));
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

    // Configurar eventos del popup de pago
    function configurarEventosPopup() {
        // Popup principal
        cerrarVentanaBtn.addEventListener('click', cerrarPopupPago);
        pagoEfectivoBtn.addEventListener('click', () => {
            metodoPagoSeleccionado = 'efectivo';
            mostrarPopupEfectivo();
        });
        pagoTarjetaBtn.addEventListener('click', () => {
            metodoPagoSeleccionado = 'tarjeta';
            mostrarPopupTarjeta();
        });
        
        // Popup de efectivo
        cerrarEfectivoBtn.addEventListener('click', cerrarPopupEfectivo);
        confirmarEfectivoBtn.addEventListener('click', confirmarPagoEfectivo);
        cancelarEfectivoBtn.addEventListener('click', cerrarPopupEfectivo);
        
        // Eventos para calcular cambio en tiempo real
        efectivoInput.addEventListener('input', calcularCambio);
        propinaInput.addEventListener('input', calcularPropina);
        
        // Popup de tarjeta
        cerrarTarjetaBtn.addEventListener('click', cerrarPopupTarjeta);
        confirmarTarjetaBtn.addEventListener('click', confirmarPagoTarjeta);
        cancelarTarjetaBtn.addEventListener('click', cerrarPopupTarjeta);
        
        // Popup de confirmación final
        cerrarConfirmacionBtn.addEventListener('click', cerrarConfirmacionPago);
        confirmarPagoFinalBtn.addEventListener('click', procesarPagoFinal);
        cancelarPagoFinalBtn.addEventListener('click', cerrarConfirmacionPago);
    }

    // Mostrar popup de pago principal
    function mostrarPopupPago(total) {
        montoTotalPopup.textContent = `$${total}`;
        ventanaEmergente.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // Cerrar popup de pago principal
    function cerrarPopupPago() {
        ventanaEmergente.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Mostrar popup de pago en efectivo
    function mostrarPopupEfectivo() {
        cerrarPopupPago();
        totalEfectivoElement.textContent = `$${montoTotal.toFixed(2)}`;
        efectivoInput.value = '';
        propinaInput.value = '';
        cambioMontoElement.textContent = '$0.00';
        pagoEfectivoPopup.style.display = 'flex';
    }

    // Cerrar popup de pago en efectivo
    function cerrarPopupEfectivo() {
        pagoEfectivoPopup.style.display = 'none';
        mostrarPopupPago(montoTotal.toFixed(2));
    }

    // Mostrar popup de pago con tarjeta
    function mostrarPopupTarjeta() {
        cerrarPopupPago();
        totalTarjetaElement.textContent = `$${montoTotal.toFixed(2)}`;
        propinaTarjetaInput.value = '';
        pagoTarjetaPopup.style.display = 'flex';
    }

    // Cerrar popup de pago con tarjeta
    function cerrarPopupTarjeta() {
        pagoTarjetaPopup.style.display = 'none';
        mostrarPopupPago(montoTotal.toFixed(2));
    }

    // Mostrar popup de confirmación final
    function mostrarConfirmacionPago() {
        // Cerrar todos los popups abiertos
        pagoEfectivoPopup.style.display = 'none';
        pagoTarjetaPopup.style.display = 'none';
        
        // Configurar texto según método de pago
        metodoPagoTexto.textContent = metodoPagoSeleccionado === 'efectivo' ? 'efective' : 'card';
        montoPagoTexto.textContent = `$${(montoTotal + (montoTotal * (propina / 100))).toFixed(2)}`;
        
        // Mostrar popup de confirmación
        confirmacionPagoPopup.style.display = 'flex';
    }

    // Cerrar popup de confirmación final
    function cerrarConfirmacionPago() {
        confirmacionPagoPopup.style.display = 'none';
        mostrarPopupPago(montoTotal.toFixed(2));
    }

    // Calcular cambio en pago en efectivo
    function calcularCambio() {
        const efectivo = parseFloat(efectivoInput.value.replace('$', '')) || 0;
        const totalConPropina = montoTotal * (1 + (propina / 100));
        const cambio = efectivo - totalConPropina;
        
        cambioMontoElement.textContent = `$${cambio >= 0 ? cambio.toFixed(2) : '0.00'}`;
    }

    // Calcular propina en pago en efectivo
    function calcularPropina() {
        propina = parseFloat(propinaInput.value) || 0;
        calcularCambio();
    }

    // Confirmar pago en efectivo
    function confirmarPagoEfectivo() {
        const efectivo = parseFloat(efectivoInput.value.replace('$', '')) || 0;
        const totalConPropina = montoTotal * (1 + (propina / 100));
        
        if (efectivo < totalConPropina) {
            mostrarAlerta('El efectivo ingresado es menor al total con propina', 'error');
            return;
        }
        
        mostrarConfirmacionPago();
    }

    // Confirmar pago con tarjeta
    function confirmarPagoTarjeta() {
        propina = parseFloat(propinaTarjetaInput.value) || 0;
        mostrarConfirmacionPago();
    }

    // Procesar pago final
    function procesarPagoFinal() {
        cerrarConfirmacionPago();
        cartPanel.classList.add('hidden');
        
        // Preparar datos de la venta
        const productosVendidos = carrito.map(item => {
            const producto = productosGlobales.find(p => p.id == item.id);
            return {
                id: producto.id,
                nombre: producto.nombre,
                cantidad: item.quantity,
                precio: producto.precio,
                subtotal: producto.precio * item.quantity
            };
        });
        
        const venta = {
            fecha: new Date().toISOString(),
            metodoPago: metodoPagoSeleccionado,
            total: montoTotal,
            propina: propina,
            totalConPropina: montoTotal * (1 + (propina / 100)),
            productos: productosVendidos
        };
        
        // Enviar datos al servidor
        fetch('../../controlador/php/procesar_pago.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(venta)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarAlerta(`Pago con ${metodoPagoSeleccionado} realizado por $${venta.totalConPropina.toFixed(2)}`, 'success');
                vaciarCarrito();
            } else {
                mostrarAlerta(`Error al procesar el pago: ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta('Error al conectar con el servidor', 'error');
        });
    }

    // Función para mostrar alertas
    function mostrarAlerta(mensaje, tipo) {
        // Implementación básica con alert()
        alert(`${tipo.toUpperCase()}: ${mensaje}`);
        
        // Puedes reemplazar esto con un sistema de notificaciones más elegante
        /* Ejemplo con notificaciones personalizadas:
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.remove();
        }, 3000);
        */
    }
});