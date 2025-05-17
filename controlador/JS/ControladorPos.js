document.addEventListener('DOMContentLoaded', function() {
cargarProductos();

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

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Cargar productos desde el servidor
function cargarProductos() {
    fetch('../../controlador/php/get_productos.php')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar productos');
            return response.json();
        })
        .then(productos => {
            const contenedor = document.querySelector('#Page');
            if (!contenedor) return;
            
            contenedor.innerHTML = productos.map(producto => {
                const itemCarrito = carrito.find(item => item.id == producto.id);
                const cantidadInicial = itemCarrito ? itemCarrito.quantity : 0;

                return `
                    <div class="product-card" data-id="${producto.id}">
                        <img src="../../vista/IMAGES/logo-generico.png" alt="${producto.nombre}" class="product-img">
                        <div class="product-info">
                            <h3 class="product-name">${producto.nombre}</h3>
                            <p class="product-price">$${producto.precio}</p>
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
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar productos');
        });
}

// Agregar eventos a los botones
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

// Actualizar el carrito en localStorage
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
}

// Mostrar cantidad de items en el carrito
function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((total, item) => total + item.quantity, 0);
    console.log(`Total items en carrito: ${totalItems}`);
    // Aquí puedes agregar un contador visual si lo deseas
}