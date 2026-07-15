// lights.js
// Feature: control individual de luces (tab "Luces" + modal de color)

import { apiGet, apiPut } from '../api.js';
import { escapeHtml } from '../utils.js';

let lights = {};
let currentLightId = null;

export function getLights() {
    return lights;
}

export async function loadLights() {
    try {
        lights = await apiGet('/api/lights');
        renderLights();
    } catch (error) {
        console.error('Error loading lights:', error);
    }
}

function renderLights() {
    const container = document.getElementById('lightsContainer');
    if (!container) return;

    if (!lights || Object.keys(lights).length === 0) {
        container.innerHTML = '<div class="loading">No se encontraron luces</div>';
        return;
    }

    container.innerHTML = Object.entries(lights)
        .filter(([, light]) => light?.state !== undefined)
        .map(([id, light]) => {
            const isOn = light.state.on;
            const brightness = light.state.bri || 0;
            const brightnessPercent = Math.round((brightness / 254) * 100);
            return `
                <div class="light-card" onclick="openLightModal(${id}, '${escapeHtml(light.name)}')">
                    <div class="card-header">
                        <div class="card-title">${escapeHtml(light.name)}</div>
                        <div class="state-indicator ${isOn ? 'on' : ''}" onclick="toggleLight(event, ${id})">
                            ${isOn ? '💡' : '⚫'}
                        </div>
                    </div>
                    <div class="card-status">${escapeHtml(light.type || '')}</div>
                    <div class="light-state">
                        <input type="range" min="0" max="254" value="${brightness}"
                               class="brightness-mini"
                               onchange="updateLightBrightness(${id}, this.value)"
                               onclick="event.stopPropagation()">
                        <span>${brightnessPercent}%</span>
                    </div>
                </div>
            `;
        }).join('');
}

export async function toggleLight(event, lightId) {
    event.stopPropagation();
    const light = lights[lightId];
    if (!light) return;
    try {
        await apiPut(`/api/lights/${lightId}/state`, { on: !light.state.on });
        await loadLights();
    } catch (error) {
        console.error('Error toggling light:', error);
    }
}

export async function updateLightBrightness(lightId, brightness) {
    try {
        await apiPut(`/api/lights/${lightId}/state`, {
            on: parseInt(brightness, 10) > 0,
            bri: parseInt(brightness, 10)
        });
    } catch (error) {
        console.error('Error updating brightness:', error);
    }
}

export function openLightModal(lightId, name) {
    currentLightId = lightId;
    const light = lights[lightId];
    if (!light) return;
    const brightness = light.state.bri || 127;
    const hue = light.state.hue || 0;
    const saturation = light.state.sat || 254;
    document.getElementById('modalTitle').textContent = `🎨 ${name}`;
    document.getElementById('brightnessSlider').value = brightness;
    document.getElementById('hueSlider').value = hue;
    document.getElementById('saturationSlider').value = saturation;
    document.getElementById('brightnessValue').textContent = Math.round((brightness / 254) * 100);
    document.getElementById('hueValue').textContent = Math.round((hue / 65535) * 100);
    document.getElementById('saturationValue').textContent = Math.round((saturation / 254) * 100);
    updateColorPreview(hue);
    document.getElementById('lightModal').classList.add('open');
}

export function closeLightModal() {
    document.getElementById('lightModal').classList.remove('open');
    currentLightId = null;
}

export async function applyLightChanges() {
    if (!currentLightId) return;
    const brightness = parseInt(document.getElementById('brightnessSlider').value, 10);
    const hue = parseInt(document.getElementById('hueSlider').value, 10);
    const saturation = parseInt(document.getElementById('saturationSlider').value, 10);
    try {
        await apiPut(`/api/lights/${currentLightId}/state`, {
            on: brightness > 0,
            bri: brightness,
            hue,
            sat: saturation
        });
        await loadLights();
        closeLightModal();
    } catch (error) {
        console.error('Error applying changes:', error);
    }
}

function updateColorPreview(hue) {
    const hslHue = (hue / 65535) * 360;
    const previewLarge = document.getElementById('colorPreviewLarge');
    if (previewLarge) previewLarge.style.background = `hsl(${hslHue}, 100%, 50%)`;
}

export function setQuickColor(hue, saturation) {
    const brightnessSlider = document.getElementById('brightnessSlider');
    const hueSlider = document.getElementById('hueSlider');
    const saturationSlider = document.getElementById('saturationSlider');
    if (brightnessSlider && brightnessSlider.value === '0') brightnessSlider.value = '254';
    if (hueSlider) hueSlider.value = hue;
    if (saturationSlider) saturationSlider.value = saturation;
    document.getElementById('hueValue').textContent = Math.round((hue / 65535) * 100);
    document.getElementById('saturationValue').textContent = Math.round((saturation / 254) * 100);
    updateColorPreview(hue);
}

Object.assign(window, {
    toggleLight,
    updateLightBrightness,
    openLightModal,
    closeLightModal,
    applyLightChanges,
    setQuickColor
});
