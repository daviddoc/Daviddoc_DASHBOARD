// 1. 🛑 ¡IMPORTANTE! Pega aquí la URL de tu App Web de Google Apps Script
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwmtF0a-nxgZ1TpW-PvVGazxQslF7cVawbv2USBjpF38bxDNoPqpP5RD0SjoHEM6zBTnw/exec';

// 2. Estado global (la "fuente de la verdad")
let countdowns = []; // Array de objetos: {title: "...", targetDate: "..."}
let timerInterval = null;

// 3. Referencias a elementos del DOM
const container = document.getElementById('countdowns-container');
const addBtn = document.getElementById('add-btn');
const newTitle = document.getElementById('new-title');
const newDate = document.getElementById('new-date');

// --- FUNCIONES PRINCIPALES ---

/**
 * 4. Carga los countdowns desde Google Sheets al iniciar
 */
async function fetchCountdowns() {
    container.innerHTML = '<p class="loading">Cargando...</p>';
    try {
        const response = await fetch(GAS_URL);
        if (!response.ok) throw new Error('Error al cargar datos');
        countdowns = await response.json();
        renderCountdowns();
    } catch (error) {
        console.error('Error fetching:', error);
        container.innerHTML = '<p class="loading">Error al cargar los countdowns. Asegúrate de que la URL de GAS es correcta y está desplegada.</p>';
    }
}

/**
 * 5. Guarda el estado actual (array 'countdowns') en Google Sheets
 */
async function saveStateToGoogle() {
    console.log('Guardando en Google Sheets...');
    try {
        // Usamos 'mode: no-cors' porque las peticiones POST a Google Apps Script
        // desde un dominio diferente (GitHub Pages) dan problemas de CORS.
        // Esto "dispara y olvida" la petición. No podemos leer la respuesta,
        // pero el script de Google sí la recibe y procesa.
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(countdowns)
        });
        
        console.log('Guardado enviado.');

    } catch (error) {
        console.error('Error saving:', error);
        alert('No se pudo guardar el estado. Revisa la consola.');
    }
}

/**
 * 6. Renderiza (dibuja) los countdowns en el HTML
 */
function renderCountdowns() {
    container.innerHTML = ''; // Limpia el contenedor
    if (countdowns.length === 0) {
        container.innerHTML = '<p class="loading">No hay countdowns. ¡Añade uno!</p>';
    }

    countdowns.forEach((item, index) => {
        const element = document.createElement('div');
        element.className = 'countdown-item';
        // Usamos un data-index para saber cuál borrar
        element.innerHTML = `
            <div class="details">
                <span class="title">${item.title}</span>
                <span class="time" data-target-date="${item.targetDate}">Calculando...</span>
            </div>
            <button class="delete-btn" data-index="${index}">&times; Eliminar</button>
        `;
        container.appendChild(element);
    });

    // (Re)inicia el intervalo del timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateAllTimers, 1000);
    updateAllTimers(); // Llama una vez inmediatamente
}

/**
 * 7. Actualiza todos los relojes (se llama cada segundo)
 */
function updateAllTimers() {
    const timeElements = document.querySelectorAll('.countdown-item .time');
    timeElements.forEach(el => {
        const targetDate = new Date(el.dataset.targetDate);
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            el.textContent = '¡Tiempo cumplido!';
            el.style.color = '#dc3545';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    });
}

/**
 * 8. Manejador para añadir un nuevo countdown
 */
function handleAddCountdown() {
    const title = newTitle.value.trim();
    const date = newDate.value;

    if (!title || !date) {
        alert('Por favor, rellena el título y la fecha.');
        return;
    }

    // Añade al estado local
    countdowns.push({
        title: title,
        targetDate: date
    });

    // Limpia el formulario
    newTitle.value = '';
    newDate.value = '';

    // Actualiza la UI instantáneamente
    renderCountdowns();

    // Guarda el nuevo estado en Google Sheets (en segundo plano)
    saveStateToGoogle();
}

/**
 * 9. Manejador para eliminar un countdown (usa delegación de eventos)
 */
function handleDeleteCountdown(e) {
    // Solo actúa si se hizo clic en un botón de eliminar
    if (e.target.classList.contains('delete-btn')) {
        const index = parseInt(e.target.dataset.index, 10);
        
        if (!confirm(`¿Seguro que quieres eliminar "${countdowns[index].title}"?`)) {
            return;
        }

        // Elimina del estado local
        countdowns.splice(index, 1);

        // Actualiza la UI instantáneamente
        renderCountdowns();

        // Guarda el nuevo estado en Google Sheets (en segundo plano)
        saveStateToGoogle();
    }
}


// --- INICIALIZACIÓN ---

// Carga los datos cuando la página esté lista
document.addEventListener('DOMContentLoaded', fetchCountdowns);

// Asigna los eventos a los botones
addBtn.addEventListener('click', handleAddCountdown);

// Usa delegación de eventos para los botones de eliminar
container.addEventListener('click', handleDeleteCountdown);
