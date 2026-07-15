// scenes.js
// Feature: modos guardados / escenas (tab "Modos")

import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml } from '../utils.js';
import { getLights, loadLights } from './lights.js';

let scenes = {};

export async function loadScenes() {
    try {
        scenes = await apiGet('/api/scenes');
        renderScenes();
    } catch (error) {
        console.error('Error loading scenes:', error);
    }
}

function renderScenes() {
    const container = document.getElementById('scenesContainer');
    if (!container) return;
    if (!scenes || Object.keys(scenes).length === 0) {
        container.innerHTML = '<div class="loading">No hay modos guardados</div>';
        return;
    }
    const groupedByOwner = Object.entries(scenes).reduce((acc, [id, scene]) => {
        const ownerKey = scene.ownerName || scene.owner || 'Sin propietario';
        acc[ownerKey] = acc[ownerKey] || [];
        acc[ownerKey].push({ id, ...scene });
        return acc;
    }, {});
    container.innerHTML = Object.keys(groupedByOwner).sort((a, b) => a.localeCompare(b)).map((ownerName) => {
        const ownerScenes = groupedByOwner[ownerName];
        return `
            <div class="scene-owner-group">
                <div class="scene-owner-header">👤 ${escapeHtml(ownerName)}</div>
                ${ownerScenes.map((scene) => {
                    const lightsCount = scene.lightCount || scene.lights?.length || 0;
                    const recycleState = scene.recycle ? 'active' : '';
                    const lightsState = lightsCount > 0 ? 'active' : '';
                    const actionDetails = scene.actionDetails || [];
                    const actionRows = actionDetails.length > 0
                        ? actionDetails.map((detail) => {
                            const swatch = detail.color
                                ? `<span class="scene-color-swatch" style="background:${detail.color};" title="${escapeHtml(detail.color)}"></span>`
                                : '<span class="scene-color-swatch scene-color-swatch-empty"></span>';
                            return `<div class="scene-action-row">${swatch}<span>${escapeHtml(detail.text)}</span></div>`;
                        }).join('')
                        : '<div class="scene-action-row"><span>Sin acciones registradas</span></div>';
                    return `
                        <div class="scene-card">
                            <div class="scene-card-top">
                                <div class="scene-info" onclick="recallScene('${scene.id}')">
                                    <div class="scene-name">🎬 ${escapeHtml(scene.name)}</div>
                                    <div class="scene-desc">${lightsCount} luz${lightsCount !== 1 ? 'es' : ''} · ${scene.recycle ? 'recycle activado' : 'sin recycle'}</div>
                                </div>
                                <div class="scene-actions">
                                    <button class="action-btn-primary" onclick="recallScene('${scene.id}')">Activar</button>
                                    <button class="action-btn-danger" onclick="deleteScene('${scene.id}')">Eliminar</button>
                                </div>
                            </div>
                            <div class="scene-meta">
                                <span class="scene-chip ${lightsState}">✓ lights</span>
                                <span class="scene-chip ${recycleState}">✓ recycle</span>
                            </div>
                            <div class="scene-details">
                                <div class="scene-detail-title">Acción del modo</div>
                                <div class="scene-action-list">${actionRows}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).join('');
}

export function saveCurrentAsScene() {
    const lights = getLights();
    const checkboxContainer = document.getElementById('sceneCheckboxes');
    if (!checkboxContainer) return;
    checkboxContainer.innerHTML = Object.entries(lights).map(([lightId, light]) => `
        <div class="checkbox-item">
            <input type="checkbox" id="light_${lightId}" value="${lightId}" checked>
            <label for="light_${lightId}">${escapeHtml(light.name)}</label>
        </div>
    `).join('');
    document.getElementById('sceneName').value = '';
    document.getElementById('sceneModal').classList.add('open');
}

export async function createScene() {
    const lights = getLights();
    const name = document.getElementById('sceneName').value.trim();
    if (!name) {
        alert('Por favor ingresa un nombre para el modo');
        return;
    }
    const selectedLights = Array.from(document.querySelectorAll('#sceneCheckboxes input[type="checkbox"]:checked')).map((cb) => cb.value);
    if (selectedLights.length === 0) {
        alert('Por favor selecciona al menos una luz');
        return;
    }
    const lightStates = {};
    selectedLights.forEach((lightId) => {
        const light = lights[lightId];
        if (light) {
            lightStates[lightId] = {
                on: light.state.on,
                bri: light.state.bri || 0,
                hue: light.state.hue || 0,
                sat: light.state.sat || 0
            };
        }
    });
    try {
        await apiPost('/api/scenes', { name, lights: selectedLights, lightStates });
        closeSceneModal();
        await loadScenes();
        alert('✓ Modo guardado exitosamente');
    } catch (error) {
        console.error('Error creating scene:', error);
        alert('Error al guardar el modo');
    }
}

export async function recallScene(sceneId) {
    try {
        await apiPut(`/api/scenes/${sceneId}/recall`, {});
        await loadLights();
    } catch (error) {
        console.error('Error recalling scene:', error);
        alert('Error al activar el modo');
    }
}

export async function deleteScene(sceneId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este modo?')) return;
    try {
        await apiDelete(`/api/scenes/${sceneId}`);
        await loadScenes();
        alert('✓ Modo eliminado');
    } catch (error) {
        console.error('Error deleting scene:', error);
        alert('Error al eliminar el modo');
    }
}

export function closeSceneModal() {
    document.getElementById('sceneModal').classList.remove('open');
}

Object.assign(window, {
    saveCurrentAsScene,
    createScene,
    recallScene,
    deleteScene,
    closeSceneModal
});
