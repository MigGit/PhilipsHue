// app.js
// Shell de la aplicación: carga de tabs, navegación y arranque de cada módulo de feature.
// Cada módulo en modules/ es dueño de su propio estado, render y llamadas a la API,
// y se auto-registra en window para los onclick del HTML.

import { loadLights, closeLightModal } from './modules/lights.js';
import { loadGroups } from './modules/groups.js';
import './modules/presets.js';
import { loadScenes, closeSceneModal } from './modules/scenes.js';
import { loadSchedules, closeScheduleModal } from './modules/schedules.js';
import { loadConfigStatus } from './modules/settings.js';
import { checkConnection } from './modules/status.js';

const tabTemplates = {
    lights: 'partials/lights.html',
    groups: 'partials/groups.html',
    presets: 'partials/presets.html',
    scenes: 'partials/scenes.html',
    schedules: 'partials/schedules.html',
    settings: 'partials/settings.html'
};

window.addEventListener('DOMContentLoaded', async () => {
    await loadTabTemplates();
    setupEventListeners();
    await refreshAllData();
    setInterval(loadLights, 5000);
    setInterval(loadGroups, 5000);
    setInterval(loadScenes, 10000);
    setInterval(loadSchedules, 10000);
    setInterval(loadConfigStatus, 30000);
});

async function loadTabTemplates() {
    const tabContent = document.getElementById('tabContent');
    if (!tabContent) return;

    const htmlPieces = await Promise.all(
        Object.values(tabTemplates).map(async (path) => {
            const response = await fetch(path);
            if (!response.ok) {
                return `<div class="loading">No se pudo cargar ${path}</div>`;
            }
            return response.text();
        })
    );

    tabContent.innerHTML = htmlPieces.join('\n');
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('lightModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'lightModal') closeLightModal();
    });

    document.getElementById('sceneModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'sceneModal') closeSceneModal();
    });

    document.getElementById('scheduleModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'scheduleModal') closeScheduleModal();
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
    document.getElementById(tabName)?.classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
}

async function refreshAllData() {
    await Promise.all([
        checkConnection(),
        loadConfigStatus(),
        loadLights(),
        loadGroups(),
        loadScenes(),
        loadSchedules()
    ]);
}
