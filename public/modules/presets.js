// presets.js
// Feature: aplicar presets rápidos a todas las luces (tab "Presets")

import { apiPut } from '../api.js';
import { getLights, loadLights } from './lights.js';

const presets = {
    bright: { bri: 254, hue: 0, sat: 0, name: 'Brillante' },
    warm: { bri: 200, hue: 10000, sat: 200, name: 'Cálido' },
    cool: { bri: 200, hue: 45000, sat: 150, name: 'Frío' },
    movie: { bri: 100, hue: 0, sat: 254, name: 'Película' },
    reading: { bri: 254, hue: 0, sat: 0, name: 'Lectura' },
    night: { bri: 50, hue: 60000, sat: 254, name: 'Noche' }
};

export async function setPreset(presetName) {
    const lights = getLights();
    if (presetName === 'off') {
        await Promise.all(Object.keys(lights).map((lightId) => apiPut(`/api/lights/${lightId}/state`, { on: false })));
    } else {
        const preset = presets[presetName];
        await Promise.all(Object.keys(lights).map((lightId) => apiPut(`/api/lights/${lightId}/state`, {
            on: true,
            bri: preset.bri,
            hue: preset.hue,
            sat: preset.sat
        })));
    }
    await loadLights();
}

Object.assign(window, {
    setPreset
});
