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
    
    // Mostrar estadísticas con gráfica de progreso fija
    mostrarProgresoTurno();
});

function mostrarProgresoTurno() {
    const contenedor = document.querySelector('#Page');
    if (!contenedor) return;
    
    // Obtener el tiempo de inicio del turno
    const shiftStartTime = localStorage.getItem('shiftStartTime');
    
    if (!shiftStartTime) {
        contenedor.innerHTML = '<p>No hay datos de turno disponibles</p>';
        return;
    }
    
    // Calcular progreso del turno
    const startTime = new Date(shiftStartTime);
    const now = new Date();
    const horasTranscurridas = ((now - startTime) / (1000 * 60 * 60));
    const porcentajeCompletado = Math.min((horasTranscurridas / 8) * 100, 100); // Máximo 100%
    
    // Limpiar contenedor
    contenedor.innerHTML = '';
    
    // Crear título
    const titulo = document.createElement('h1');
    titulo.textContent = 'Progreso del Turno';
    titulo.style.color = '#004aad';
    titulo.style.marginBottom = '20px';
    contenedor.appendChild(titulo);
    
    // Contenedor principal
    const chartContainer = document.createElement('div');
    chartContainer.style.width = '80%';
    chartContainer.style.margin = '0 auto';
    chartContainer.style.backgroundColor = 'white';
    chartContainer.style.padding = '20px';
    chartContainer.style.borderRadius = '10px';
    chartContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    
    // Canvas para la gráfica
    const canvas = document.createElement('canvas');
    canvas.id = 'turnoChart';
    chartContainer.appendChild(canvas);
    contenedor.appendChild(chartContainer);
    
    // Crear gráfica de progreso
    const ctx = document.getElementById('turnoChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Progreso del Turno'],
            datasets: [{
                label: 'Horas trabajadas',
                data: [horasTranscurridas],
                backgroundColor: [
                    'rgba(0, 74, 173, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 74, 173, 1)'
                ],
                borderWidth: 1
            }, {
                label: 'Turno completo',
                data: [8], // 8 horas fijas
                backgroundColor: [
                    'rgba(200, 200, 200, 0.2)'
                ],
                borderColor: [
                    'rgba(200, 200, 200, 1)'
                ],
                borderWidth: 1,
                type: 'bar' // Gráfica de fondo
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y', // Barras horizontales
            scales: {
                x: {
                    beginAtZero: true,
                    max: 8, // Fijamos 8 horas como máximo
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Horas trabajadas: ${context.raw.toFixed(2)}`;
                            }
                            return `Duración total: 8 horas`;
                        }
                    }
                }
            }
        }
    });
    
    // Información detallada
    const infoContainer = document.createElement('div');
    infoContainer.style.marginTop = '20px';
    infoContainer.style.padding = '15px';
    infoContainer.style.backgroundColor = 'white';
    infoContainer.style.borderRadius = '8px';
    infoContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    infoContainer.innerHTML = `
        <h3 style="color: #004aad; margin-bottom: 10px;">Detalles del Turno</h3>
        <p><strong>Inicio:</strong> ${startTime.toLocaleTimeString()} (${startTime.toLocaleDateString()})</p>
        <p><strong>Progreso:</strong> ${horasTranscurridas.toFixed(2)} horas de 8 (${porcentajeCompletado.toFixed(1)}%)</p>
        <div style="margin-top: 10px; height: 20px; background: #f0f0f0; border-radius: 10px;">
            <div style="height: 100%; width: ${porcentajeCompletado}%; background: #004aad; border-radius: 10px;"></div>
        </div>
    `;
    
    contenedor.appendChild(infoContainer);
    
    // Actualizar cada minuto (opcional)
    setInterval(() => {
        const newHours = ((new Date() - startTime) / (1000 * 60 * 60));
        chart.data.datasets[0].data = [newHours];
        chart.update();
        
        // Actualizar también la barra de progreso en el texto
        const progressBar = infoContainer.querySelector('div > div');
        const newPercentage = Math.min((newHours / 8) * 100, 100);
        progressBar.style.width = `${newPercentage}%`;
        
        // Actualizar texto
        const progressText = infoContainer.querySelector('p:nth-child(2)');
        progressText.innerHTML = `<strong>Progreso:</strong> ${newHours.toFixed(2)} horas de 8 (${newPercentage.toFixed(1)}%)`;
    }, 60000); // Actualizar cada minuto
}