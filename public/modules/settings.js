// settings.js
// Feature: configuración del bridge (tab "Configuración")

import { apiGet, apiPost } from '../api.js';
import { escapeHtml } from '../utils.js';
import { loadLights } from './lights.js';
import { checkConnection } from './status.js';

export async function loadConfigStatus() {
    try {
        const data = await apiGet('/api/config');
        const statusDiv = document.getElementById('configStatus');
        if (!statusDiv) return;
        if (data.configured) {
            statusDiv.innerHTML = `
                <div class="status-success">
                    ✅ Bridge Configurado
                    <div class="config-details">
                        <p><strong>IP:</strong> ${escapeHtml(data.bridgeIp || '')}</p>
                        <p><strong>Estado:</strong> ${data.connected ? '🟢 Conectado' : '🔴 No disponible'}</p>
                    </div>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="status-warning">
                    ⚠️ Bridge No Configurado
                    <p>Por favor, usa la búsqueda automática o configuración manual</p>
                </div>
            `;
        }
        if (data.bridgeIp) document.getElementById('bridgeIpInput').value = data.bridgeIp;
        if (data.username) document.getElementById('usernameInput').value = data.username;
    } catch (error) {
        console.error('Error loading config status:', error);
    }
}

export async function discoverBridge(event) {
    const button = event?.currentTarget || event?.target;
    if (button) {
        button.disabled = true;
        button.textContent = '🔍 Buscando...';
    }
    try {
        const data = await apiPost('/api/config/discover', {});
        const resultsDiv = document.getElementById('discoveryResults');
        if (!resultsDiv) return;
        if (data.success && data.bridges.length > 0) {
            resultsDiv.innerHTML = `
                <div class="discovery-results"><h4>Bridges encontrados:</h4>
                    ${data.bridges.map((bridge) => `
                        <div class="bridge-item">
                            <div class="bridge-info">
                                <strong>${escapeHtml(bridge.name || 'Bridge')}</strong>
                                <span class="bridge-ip">${escapeHtml(bridge.internalIpAddress || '')}</span>
                            </div>
                            <button class="btn btn-small" onclick="selectBridgeIp('${escapeHtml(bridge.internalIpAddress || '')}')">Usar</button>
                        </div>
                    `).join('')}
                </div>
            `;
            resultsDiv.style.display = 'block';
        } else {
            resultsDiv.innerHTML = '<p class="error-text">❌ No se encontraron bridges. Verifica tu conexión de red.</p>';
            resultsDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error discovering bridge:', error);
        const resultsDiv = document.getElementById('discoveryResults');
        if (resultsDiv) {
            resultsDiv.innerHTML = `<p class="error-text">❌ Error: ${escapeHtml(error.message)}</p>`;
            resultsDiv.style.display = 'block';
        }
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = '🔍 Buscar Bridge';
        }
    }
}

export function selectBridgeIp(ip) {
    const bridgeIpInput = document.getElementById('bridgeIpInput');
    if (bridgeIpInput) {
        bridgeIpInput.value = ip;
        bridgeIpInput.focus();
    }
}

export async function updateBridgeConfig() {
    const ip = document.getElementById('bridgeIpInput').value.trim();
    const username = document.getElementById('usernameInput').value.trim();
    const messageDiv = document.getElementById('configMessage');
    if (!messageDiv) return;
    if (!ip) {
        messageDiv.innerHTML = '<p class="error-text">❌ Por favor ingresa una IP válida</p>';
        return;
    }
    messageDiv.innerHTML = '<p class="loading">Validando configuración...</p>';
    const payload = { bridgeIp: ip };
    if (username) payload.username = username;
    try {
        const data = await apiPost('/api/config/update', payload);
        if (data.success) {
            messageDiv.innerHTML = '<p class="success-text">✅ Configuración guardada exitosamente!</p>';
            setTimeout(() => {
                loadConfigStatus();
                checkConnection();
                loadLights();
            }, 2500);
        } else {
            messageDiv.innerHTML = `<p class="error-text">❌ Error: ${escapeHtml(data.error || data.message || 'Error desconocido')}</p>`;
        }
    } catch (error) {
        console.error('Error updating config:', error);
        messageDiv.innerHTML = `<p class="error-text">❌ Error: ${escapeHtml(error.message)}</p>`;
    }
}

Object.assign(window, {
    discoverBridge,
    selectBridgeIp,
    updateBridgeConfig
});
