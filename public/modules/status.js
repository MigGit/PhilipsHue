// status.js
// Estado de conexión mostrado en el header de la app

import { apiGet } from '../api.js';

export async function checkConnection() {
    try {
        const data = await apiGet('/api/health');
        setStatus(data.configured ? 'connected' : 'error', data.configured ? 'Conectado' : 'Bridge no configurado');
    } catch (error) {
        console.error('Error checking connection:', error);
        setStatus('error', 'Error de conexión');
    }
}

export function setStatus(status, text) {
    const statusEl = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    if (!statusEl || !statusText) return;
    statusEl.classList.remove('connected', 'error');
    if (status !== 'connecting') statusEl.classList.add(status);
    statusText.textContent = text;
}
