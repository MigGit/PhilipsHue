// groups.js
// Feature: control de grupos de luces (tab "Grupos")

import { apiGet, apiPut } from '../api.js';
import { escapeHtml } from '../utils.js';

let groups = {};

export function getGroups() {
    return groups;
}

export async function loadGroups() {
    try {
        groups = await apiGet('/api/groups');
        renderGroups();
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function renderGroups() {
    const container = document.getElementById('groupsContainer');
    if (!container) return;

    if (!groups || Object.keys(groups).length === 0) {
        container.innerHTML = '<div class="loading">No se encontraron grupos</div>';
        return;
    }

    container.innerHTML = Object.entries(groups)
        .map(([id, group]) => {
            const isOn = group.action?.on || false;
            const brightness = group.action?.bri || 0;
            const brightnessPercent = Math.round((brightness / 254) * 100);
            return `
                <div class="group-card">
                    <div class="card-header">
                        <div class="card-title">${escapeHtml(group.name)}</div>
                        <div class="state-indicator ${isOn ? 'on' : ''}" onclick="toggleGroup(event, ${id})">
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
        }).join('');
}

export async function toggleGroup(event, groupId) {
    event.stopPropagation();
    const group = groups[groupId];
    if (!group) return;
    try {
        await apiPut(`/api/groups/${groupId}/action`, { on: !group.action?.on });
        await loadGroups();
    } catch (error) {
        console.error('Error toggling group:', error);
    }
}

export async function updateGroupBrightness(groupId, brightness) {
    try {
        await apiPut(`/api/groups/${groupId}/action`, {
            on: parseInt(brightness, 10) > 0,
            bri: parseInt(brightness, 10)
        });
    } catch (error) {
        console.error('Error updating group brightness:', error);
    }
}

Object.assign(window, {
    toggleGroup,
    updateGroupBrightness
});
