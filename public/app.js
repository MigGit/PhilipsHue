// Variables globales
let lights = {};
let groups = {};
let scenes = {};
let schedules = {};
let currentLightId = null;
let currentSceneId = null;

// Presets
const presets = {
    bright: {
        bri: 254,
        hue: 0,
        sat: 0,
        name: 'Brillante'
    },
    warm: {
        bri: 200,
        hue: 10000,
        sat: 200,
        name: 'Cálido'
    },
    cool: {
        bri: 200,
        hue: 45000,
        sat: 150,
        name: 'Frío'
    },
    movie: {
        bri: 100,
        hue: 0,
        sat: 254,
        name: 'Película'
    },
    reading: {
        bri: 254,
        hue: 0,
        sat: 0,
        name: 'Lectura'
    },
    night: {
        bri: 50,
        hue: 60000,
        sat: 254,
        name: 'Noche'
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkConnection();
    loadLights();
    loadGroups();
    loadScenes();
    loadSchedules();
    // Refrescar cada 5 segundos
    setInterval(loadLights, 5000);
    setInterval(loadGroups, 5000);
    setInterval(loadScenes, 10000);
    setInterval(loadSchedules, 10000);
});

// Event Listeners
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Modal sliders
    document.getElementById('brightnessSlider').addEventListener('input', (e) => {
        const percent = Math.round((e.target.value / 254) * 100);
        document.getElementById('brightnessValue').textContent = percent;
    });

    document.getElementById('hueSlider').addEventListener('input', (e) => {
        const hue = e.target.value;
        const percent = Math.round((hue / 65535) * 100);
        document.getElementById('hueValue').textContent = percent;
        updateColorPreview(hue);
    });

    document.getElementById('saturationSlider').addEventListener('input', (e) => {
        const percent = Math.round((e.target.value / 254) * 100);
        document.getElementById('saturationValue').textContent = percent;
    });

    // Cerrar modal con click fuera
    document.getElementById('lightModal').addEventListener('click', (e) => {
        if (e.target.id === 'lightModal') {
            closeLightModal();
        }
    });

    // Cerrar modales de Scene y Schedule con click fuera
    document.getElementById('sceneModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'sceneModal') {
            closeSceneModal();
        }
    });

    document.getElementById('scheduleModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'scheduleModal') {
            closeScheduleModal();
        }
    });
}

// Cambiar pestaña
function switchTab(tabName) {
    // Ocultar todas las tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar la tab seleccionada
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Verificar conexión
async function checkConnection() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            setStatus('connected', 'Conectado');
        } else {
            setStatus('error', 'Error de conexión');
        }
    } catch (error) {
        console.error('Error checking connection:', error);
        setStatus('error', 'Error de conexión');
    }
}

// Actualizar estado
function setStatus(status, text) {
    const statusEl = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    
    statusEl.classList.remove('connected', 'error');
    if (status !== 'connecting') {
        statusEl.classList.add(status);
    }
    statusText.textContent = text;
}

// Cargar luces
async function loadLights() {
    try {
        const response = await fetch('/api/lights');
        const data = await response.json();
        lights = data;
        renderLights();
    } catch (error) {
        console.error('Error loading lights:', error);
    }
}

// Renderizar luces
function renderLights() {
    const container = document.getElementById('lightsContainer');
    
    if (Object.keys(lights).length === 0) {
        container.innerHTML = '<div class="loading">No se encontraron luces</div>';
        return;
    }

    let html = '';
    for (const [id, light] of Object.entries(lights)) {
        if (light.state === undefined) continue;

        const isOn = light.state.on;
        const brightness = light.state.bri || 0;
        const brightnessPercent = Math.round((brightness / 254) * 100);

        html += `
            <div class="light-card" onclick="openLightModal(${id}, '${light.name}')">
                <div class="card-header">
                    <div class="card-title">${light.name}</div>
                    <div class="state-indicator ${isOn ? 'on' : ''}" onclick="toggleLight(event, ${id})">
                        ${isOn ? '💡' : '⚫'}
                    </div>
                </div>
                <div class="card-status">${light.type}</div>
                <div class="light-state">
                    <input type="range" min="0" max="254" value="${brightness}" 
                           class="brightness-mini" 
                           onchange="updateLightBrightness(${id}, this.value)"
                           onclick="event.stopPropagation()">
                    <span>${brightnessPercent}%</span>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Cargar grupos
async function loadGroups() {
    try {
        const response = await fetch('/api/groups');
        const data = await response.json();
        groups = data;
        renderGroups();
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Renderizar grupos
function renderGroups() {
    const container = document.getElementById('groupsContainer');
    
    if (Object.keys(groups).length === 0) {
        container.innerHTML = '<div class="loading">No se encontraron grupos</div>';
        return;
    }

    let html = '';
    for (const [id, group] of Object.entries(groups)) {
        const isOn = group.action?.on || false;
        const brightness = group.action?.bri || 0;
        const brightnessPercent = Math.round((brightness / 254) * 100);

        html += `
            <div class="group-card">
                <div class="card-header">
                    <div class="card-title">${group.name}</div>
                    <div class="state-indicator ${isOn ? 'on' : ''}" 
                         onclick="toggleGroup(event, ${id})">
                        ${isOn ? '💡' : '⚫'}
                    </div>
                </div>
                <div class="card-status">Grupo (${group.lights?.length || 0} luces)</div>
                <div class="light-state">
                    <input type="range" min="0" max="254" value="${brightness}" 
                           class="brightness-mini" 
                           onchange="updateGroupBrightness(${id}, this.value)"
                           onclick="event.stopPropagation()">
                    <span>${brightnessPercent}%</span>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Alternar luz
async function toggleLight(event, lightId) {
    event.stopPropagation();
    const light = lights[lightId];
    const newState = !light.state.on;

    try {
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on: newState })
        });
        await loadLights();
    } catch (error) {
        console.error('Error toggling light:', error);
    }
}

// Actualizar brillo de luz
async function updateLightBrightness(lightId, brightness) {
    try {
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                on: brightness > 0,
                bri: parseInt(brightness)
            })
        });
    } catch (error) {
        console.error('Error updating brightness:', error);
    }
}

// Alternar grupo
async function toggleGroup(event, groupId) {
    event.stopPropagation();
    const group = groups[groupId];
    const newState = !group.action.on;

    try {
        await fetch(`/api/groups/${groupId}/action`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on: newState })
        });
        await loadGroups();
    } catch (error) {
        console.error('Error toggling group:', error);
    }
}

// Actualizar brillo del grupo
async function updateGroupBrightness(groupId, brightness) {
    try {
        await fetch(`/api/groups/${groupId}/action`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                on: brightness > 0,
                bri: parseInt(brightness)
            })
        });
    } catch (error) {
        console.error('Error updating group brightness:', error);
    }
}

// Abrir modal de control de luz
function openLightModal(lightId, name) {
    currentLightId = lightId;
    const light = lights[lightId];
    
    const brightness = light.state.bri || 127;
    const hue = light.state.hue || 0;
    const saturation = light.state.sat || 254;
    
    document.getElementById('modalTitle').textContent = `🎨 ${name}`;
    document.getElementById('brightnessSlider').value = brightness;
    document.getElementById('hueSlider').value = hue;
    document.getElementById('saturationSlider').value = saturation;
    
    // Actualizar labels con porcentajes
    const brightnessPercent = Math.round((brightness / 254) * 100);
    const huePercent = Math.round((hue / 65535) * 100);
    const satPercent = Math.round((saturation / 254) * 100);
    
    document.getElementById('brightnessValue').textContent = brightnessPercent;
    document.getElementById('hueValue').textContent = huePercent;
    document.getElementById('saturationValue').textContent = satPercent;
    
    updateColorPreview(hue);
    
    document.getElementById('lightModal').classList.add('open');
}

// Cerrar modal
function closeLightModal() {
    document.getElementById('lightModal').classList.remove('open');
    currentLightId = null;
}

// Aplicar cambios de luz
async function applyLightChanges() {
    const brightness = parseInt(document.getElementById('brightnessSlider').value);
    const hue = parseInt(document.getElementById('hueSlider').value);
    const saturation = parseInt(document.getElementById('saturationSlider').value);

    try {
        await fetch(`/api/lights/${currentLightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                on: brightness > 0,
                bri: brightness,
                hue: hue,
                sat: saturation
            })
        });
        await loadLights();
        closeLightModal();
    } catch (error) {
        console.error('Error applying changes:', error);
    }
}

// Actualizar vista previa de color
function updateColorPreview(hue) {
    // Convertir HUE de Philips (0-65535) a HSL (0-360)
    const hslHue = (hue / 65535) * 360;
    
    // Actualizar preview grande
    const previewLarge = document.getElementById('colorPreviewLarge');
    if (previewLarge) {
        previewLarge.style.background = `hsl(${hslHue}, 100%, 50%)`;
    }
    
    // Actualizar preview pequeño (si existe)
    const preview = document.getElementById('colorPreview');
    if (preview) {
        preview.style.background = `hsl(${hslHue}, 100%, 50%)`;
    }
}

// Establecer color rápido desde la paleta
function setQuickColor(hue, saturation) {
    const brightnessSlider = document.getElementById('brightnessSlider');
    const hueSlider = document.getElementById('hueSlider');
    const saturationSlider = document.getElementById('saturationSlider');
    
    // Establecer valor de brillo al máximo si estaba en 0
    if (brightnessSlider.value === '0') {
        brightnessSlider.value = 254;
    }
    
    // Establecer los valores
    hueSlider.value = hue;
    saturationSlider.value = saturation;
    
    // Actualizar labels de valores
    const huePercent = Math.round((hue / 65535) * 100);
    const satPercent = Math.round((saturation / 254) * 100);
    
    document.getElementById('hueValue').textContent = huePercent;
    document.getElementById('saturationValue').textContent = satPercent;
    
    // Actualizar preview
    updateColorPreview(hue);
}

// Aplicar presets
async function setPreset(presetName) {
    if (presetName === 'off') {
        // Apagar todas las luces
        for (const lightId in lights) {
            await fetch(`/api/lights/${lightId}/state`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ on: false })
            });
        }
    } else {
        const preset = presets[presetName];
        // Aplicar a todas las luces
        for (const lightId in lights) {
            await fetch(`/api/lights/${lightId}/state`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    on: true,
                    bri: preset.bri,
                    hue: preset.hue,
                    sat: preset.sat
                })
            });
        }
    }
    await loadLights();
}

// ========================================
// SCENES (MODOS DE PROGRAMACIÓN)
// ========================================

// Cargar scenes
async function loadScenes() {
    try {
        const response = await fetch('/api/scenes');
        const data = await response.json();
        scenes = data;
        renderScenes();
    } catch (error) {
        console.error('Error loading scenes:', error);
    }
}

// Renderizar scenes
function renderScenes() {
    const container = document.getElementById('scenesContainer');
    
    if (!scenes || Object.keys(scenes).length === 0) {
        container.innerHTML = '<div class="loading">No hay modos guardados</div>';
        return;
    }

    let html = '';
    for (const [id, scene] of Object.entries(scenes)) {
        const lightsCount = scene.lights?.length || 0;
        
        html += `
            <div class="scene-card">
                <div class="scene-info" onclick="recallScene('${id}')">
                    <div class="scene-name">🎬 ${scene.name}</div>
                    <div class="scene-desc">${lightsCount} luz(ces)</div>
                </div>
                <div class="scene-actions">
                    <button class="action-btn-primary" onclick="recallScene('${id}')">Activar</button>
                    <button class="action-btn-danger" onclick="deleteScene('${id}')">Eliminar</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Abrir modal para guardar scene
function saveCurrentAsScene() {
    // Llenar checkboxes con las luces actuales
    const checkbox_container = document.getElementById('sceneCheckboxes');
    let html = '';
    
    for (const lightId in lights) {
        const light = lights[lightId];
        html += `
            <div class="checkbox-item">
                <input type="checkbox" id="light_${lightId}" value="${lightId}" checked>
                <label for="light_${lightId}">${light.name}</label>
            </div>
        `;
    }
    
    checkbox_container.innerHTML = html;
    document.getElementById('sceneName').value = '';
    document.getElementById('sceneModal').classList.add('open');
}

// Crear scene
async function createScene() {
    const name = document.getElementById('sceneName').value.trim();
    
    if (!name) {
        alert('Por favor ingresa un nombre para el modo');
        return;
    }

    // Obtener las luces seleccionadas
    const selectedLights = Array.from(
        document.querySelectorAll('#sceneCheckboxes input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    if (selectedLights.length === 0) {
        alert('Por favor selecciona al menos una luz');
        return;
    }

    // Recolectar los estados actuales de las luces
    const lightStates = {};
    for (const lightId of selectedLights) {
        const light = lights[lightId];
        lightStates[lightId] = {
            on: light.state.on,
            bri: light.state.bri || 0,
            hue: light.state.hue || 0,
            sat: light.state.sat || 0
        };
    }

    try {
        const response = await fetch('/api/scenes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                lights: selectedLights,
                lightStates: lightStates
            })
        });

        if (response.ok) {
            closeSceneModal();
            loadScenes();
            alert('✓ Modo guardado exitosamente');
        } else {
            alert('Error al guardar el modo');
        }
    } catch (error) {
        console.error('Error creating scene:', error);
        alert('Error al guardar el modo');
    }
}

// Activar scene
async function recallScene(sceneId) {
    try {
        const response = await fetch(`/api/scenes/${sceneId}/recall`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            await loadLights();
            console.log('Modo activado');
        } else {
            alert('Error al activar el modo');
        }
    } catch (error) {
        console.error('Error recalling scene:', error);
        alert('Error al activar el modo');
    }
}

// Eliminar scene
async function deleteScene(sceneId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este modo?')) {
        return;
    }

    try {
        const response = await fetch(`/api/scenes/${sceneId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadScenes();
            alert('✓ Modo eliminado');
        } else {
            alert('Error al eliminar el modo');
        }
    } catch (error) {
        console.error('Error deleting scene:', error);
        alert('Error al eliminar el modo');
    }
}

// Cerrar modal de scene
function closeSceneModal() {
    document.getElementById('sceneModal').classList.remove('open');
}

// ========================================
// SCHEDULES (AUTOMATIZACIONES)
// ========================================

// Cargar schedules
async function loadSchedules() {
    try {
        const response = await fetch('/api/schedules');
        const data = await response.json();
        schedules = data;
        renderSchedules();
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
}

// Renderizar schedules
function renderSchedules() {
    const container = document.getElementById('schedulesContainer');
    
    if (!schedules || Object.keys(schedules).length === 0) {
        container.innerHTML = '<div class="loading">No hay automatizaciones programadas</div>';
        return;
    }

    let html = '';
    for (const [id, schedule] of Object.entries(schedules)) {
        const time = schedule.time || 'N/A';
        const description = schedule.description || schedule.name || 'Automatización';
        
        html += `
            <div class="schedule-card">
                <div class="schedule-info" onclick="editSchedule('${id}')">
                    <div class="schedule-name">⏰ ${schedule.name}</div>
                    <div class="schedule-desc">${time} - ${description}</div>
                </div>
                <div class="schedule-actions">
                    <button class="action-btn-secondary" onclick="editSchedule('${id}')">Editar</button>
                    <button class="action-btn-danger" onclick="deleteSchedule('${id}')">Eliminar</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Abrir modal de schedule
function openScheduleModal() {
    // Llenar el select de targets (luces y grupos)
    const targetSelect = document.getElementById('scheduleTarget');
    let options = '<option value="">Selecciona un objetivo...</option>';
    
    for (const lightId in lights) {
        const light = lights[lightId];
        options += `<option value="light_${lightId}">💡 ${light.name}</option>`;
    }
    
    for (const groupId in groups) {
        const group = groups[groupId];
        options += `<option value="group_${groupId}">👥 ${group.name}</option>`;
    }
    
    targetSelect.innerHTML = options;
    
    document.getElementById('scheduleName').value = '';
    document.getElementById('scheduleDescription').value = '';
    document.getElementById('scheduleTime').value = '09:00';
    document.getElementById('scheduleAction').value = '';
    
    document.getElementById('scheduleModal').classList.add('open');
}

// Crear or editar schedule
async function createSchedule() {
    const name = document.getElementById('scheduleName').value.trim();
    const description = document.getElementById('scheduleDescription').value.trim();
    const time = document.getElementById('scheduleTime').value;
    const action = document.getElementById('scheduleAction').value;
    const target = document.getElementById('scheduleTarget').value;

    if (!name || !time || !action || !target) {
        alert('Por favor completa todos los campos');
        return;
    }

    // Construir el comando para el schedule
    const [targetType, targetId] = target.split('_');
    const command = {
        address: `/api/${targetType}s/${targetId}/${targetType === 'light' ? 'state' : 'action'}`,
        body: { on: action === 'on' }
    };

    try {
        const endpoint = currentSceneId ? `/api/schedules/${currentSceneId}` : '/api/schedules';
        const method = currentSceneId ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                description: description,
                command: command,
                time: time,
                autodelete: true
            })
        });

        if (response.ok) {
            closeScheduleModal();
            loadSchedules();
            alert('✓ Automatización guardada');
        } else {
            alert('Error al guardar la automatización');
        }
    } catch (error) {
        console.error('Error creating/updating schedule:', error);
        alert('Error al guardar la automatización');
    }
}

// Editar schedule
function editSchedule(scheduleId) {
    const schedule = schedules[scheduleId];
    if (!schedule) return;

    currentSceneId = scheduleId; // Usar currentSceneId temporalmente
    
    document.getElementById('scheduleName').value = schedule.name;
    document.getElementById('scheduleDescription').value = schedule.description || '';
    document.getElementById('scheduleTime').value = schedule.time || '09:00';
    
    document.getElementById('scheduleModal').classList.add('open');
}

// Eliminar schedule
async function deleteSchedule(scheduleId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta automatización?')) {
        return;
    }

    try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadSchedules();
            alert('✓ Automatización eliminada');
        } else {
            alert('Error al eliminar la automatización');
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Error al eliminar la automatización');
    }
}

// Cerrar modal de schedule
function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('open');
    currentSceneId = null;
}
