// schedules.js
// Feature: automatizaciones programadas (tab "Automatizaciones") + diagrama D3

import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { escapeHtml } from '../utils.js';
import { getLights } from './lights.js';
import { getGroups } from './groups.js';

let schedules = {};
let automations = [];
let currentAutomationId = null;
let currentScheduleId = null;

export async function loadSchedules() {
    try {
        const data = await apiGet('/api/automations-grouped');
        automations = data.automations || [];
        schedules = automations.reduce((acc, automation) => {
            (automation.steps || []).forEach((step) => {
                acc[step.id] = step;
            });
            return acc;
        }, {});
        renderAutomationsList();
    } catch (error) {
        console.error('Error loading schedules:', error);
    }
}

function renderAutomationsList() {
    const container = document.getElementById('automationsListContainer');
    if (!container) return;
    if (!automations || automations.length === 0) {
        container.innerHTML = '<div class="loading">No hay automatizaciones programadas</div>';
        return;
    }
    container.innerHTML = `
        <div class="automations-group">
            ${automations.map((automation) => {
                const stepsCount = automation.steps?.length || 0;
                const isActive = currentAutomationId === automation.id ? 'active' : '';
                return `
                    <div class="automation-item ${isActive}" onclick="selectAutomation('${automation.id}')">
                        <div class="automation-header">
                            <h4>${escapeHtml(automation.name)}</h4>
                            <span class="steps-badge">${stepsCount} paso${stepsCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="automation-description">${escapeHtml(automation.description || 'Sin descripción')}</div>
                        <div class="automation-actions">
                            <button class="action-btn-small" onclick="editAutomation(event, '${automation.id}')">✏️</button>
                            <button class="action-btn-small danger" onclick="deleteAutomation(event, '${automation.id}')">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function selectAutomation(automationId) {
    currentAutomationId = automationId;
    const automation = automations.find((a) => a.id === automationId);
    renderAutomationsList();
    if (automation) renderAutomationDiagram(automation);
}

function renderAutomationDiagram(automation) {
    const container = document.getElementById('diagramContainer');
    if (!container) return;
    container.innerHTML = '';
    const steps = automation.steps || [];
    if (steps.length === 0) {
        container.innerHTML = '<div class="diagram-placeholder">No hay pasos en esta automatización</div>';
        return;
    }
    const width = container.clientWidth || 800;
    const height = Math.max(400, steps.length * 100);
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #ddd')
        .style('background', '#f9f9f9');
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    const nodeWidth = 250;
    const nodeHeight = 80;
    const horizontalSpacing = (width - margin.left - margin.right) / 2;
    const nodes = steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        time: step.time,
        description: step.description,
        x: (index % 2) * horizontalSpacing + 50,
        y: Math.floor(index / 2) * (nodeHeight + 60) + 40
    }));
    const links = steps.map((step, index) => {
        if (!step.nextStepId) return null;
        const nextNode = nodes.find((n) => n.id === step.nextStepId);
        return nextNode ? { source: nodes[index], target: nextNode } : null;
    }).filter(Boolean);
    svg.append('defs').append('marker')
        .attr('id', 'arrowhead')
        .attr('markerWidth', 10)
        .attr('markerHeight', 10)
        .attr('refX', 9)
        .attr('refY', 3)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', '0 0, 10 3, 0 6')
        .attr('fill', '#4CAF50');
    g.selectAll('line').data(links).enter().append('line')
        .attr('x1', (d) => d.source.x + nodeWidth / 2)
        .attr('y1', (d) => d.source.y + nodeHeight)
        .attr('x2', (d) => d.target.x + nodeWidth / 2)
        .attr('y2', (d) => d.target.y)
        .attr('stroke', '#4CAF50')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');
    const nodeGroups = g.selectAll('g.node').data(nodes).enter().append('g')
        .attr('class', 'node')
        .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    nodeGroups.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 8)
        .attr('fill', '#e8f5e9')
        .attr('stroke', '#4CAF50')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', function () { d3.select(this).attr('fill', '#c8e6c9').attr('stroke-width', 3); })
        .on('mouseout', function () { d3.select(this).attr('fill', '#e8f5e9').attr('stroke-width', 2); });
    nodeGroups.append('text')
        .attr('x', nodeWidth / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', '12px')
        .text((d) => d.name.length > 30 ? d.name.substring(0, 27) + '...' : d.name);
    nodeGroups.append('text')
        .attr('x', nodeWidth / 2)
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#666')
        .text((d) => d.time || 'Sin hora');
    nodeGroups.append('text')
        .attr('x', nodeWidth / 2)
        .attr('y', 65)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#999')
        .text((d) => d.description ? (d.description.length > 25 ? d.description.substring(0, 22) + '...' : d.description) : 'N/A');
    nodeGroups.append('title')
        .text((d) => `${d.name}\nHora: ${d.time || 'N/A'}\n${d.description || 'Sin descripción'}`);
    const deleteButtons = nodeGroups.append('g')
        .attr('transform', `translate(${nodeWidth - 20}, -8)`);
    deleteButtons.append('circle')
        .attr('r', 10)
        .attr('fill', '#ff5252')
        .style('cursor', 'pointer')
        .on('click', function (event, d) {
            event.stopPropagation();
            if (confirm(`¿Eliminar el paso "${d.name}"?`)) deleteSchedule(d.id);
        });
    deleteButtons.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 4)
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text('×');
}

export function openScheduleModal() {
    const lights = getLights();
    const groups = getGroups();
    const targetSelect = document.getElementById('scheduleTarget');
    if (!targetSelect) return;
    currentScheduleId = null;
    targetSelect.innerHTML = '<option value="">Selecciona un objetivo...</option>' +
        Object.entries(lights).map(([lightId, light]) => `\n            <option value="light_${lightId}">💡 ${escapeHtml(light.name)}</option>`).join('') +
        Object.entries(groups).map(([groupId, group]) => `\n            <option value="group_${groupId}">👥 ${escapeHtml(group.name)}</option>`).join('');
    document.getElementById('scheduleName').value = '';
    document.getElementById('scheduleDescription').value = '';
    document.getElementById('scheduleTime').value = '09:00';
    document.getElementById('scheduleAction').value = '';
    document.getElementById('scheduleModal').classList.add('open');
}

export function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.remove('open');
    currentScheduleId = null;
}

export async function createSchedule() {
    const name = document.getElementById('scheduleName').value.trim();
    const description = document.getElementById('scheduleDescription').value.trim();
    const time = document.getElementById('scheduleTime').value;
    const action = document.getElementById('scheduleAction').value;
    const target = document.getElementById('scheduleTarget').value;
    if (!name || !time || !action || !target) {
        alert('Por favor completa todos los campos');
        return;
    }
    const [targetType, targetId] = target.split('_');
    const command = {
        address: `/api/${targetType}s/${targetId}/${targetType === 'light' ? 'state' : 'action'}`,
        body: { on: action === 'on' }
    };
    try {
        if (currentScheduleId) {
            await apiPut(`/api/schedules/${currentScheduleId}`, { name, description, command, time, autodelete: true });
        } else {
            await apiPost('/api/schedules', { name, description, command, time, autodelete: true });
        }
        closeScheduleModal();
        await loadSchedules();
        alert('✓ Automatización guardada');
    } catch (error) {
        console.error('Error creating/updating schedule:', error);
        alert('Error al guardar la automatización');
    }
}

export function editSchedule(scheduleId) {
    const schedule = schedules[scheduleId];
    if (!schedule) return;
    currentScheduleId = scheduleId;
    document.getElementById('scheduleName').value = schedule.name;
    document.getElementById('scheduleDescription').value = schedule.description || '';
    document.getElementById('scheduleTime').value = schedule.time || '09:00';
    document.getElementById('scheduleModal').classList.add('open');
}

export async function deleteSchedule(scheduleId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta automatización?')) return;
    try {
        await apiDelete(`/api/schedules/${scheduleId}`);
        await loadSchedules();
        alert('✓ Automatización eliminada');
    } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Error al eliminar la automatización');
    }
}

export function editAutomation(event, scheduleId) {
    event.stopPropagation();
    editSchedule(scheduleId);
}

export async function deleteAutomation(event, scheduleId) {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar este paso?')) return;
    try {
        await apiDelete(`/api/schedules/${scheduleId}`);
        await loadSchedules();
        alert('✓ Paso eliminado');
    } catch (error) {
        console.error('Error deleting automation step:', error);
        alert('Error al eliminar el paso');
    }
}

Object.assign(window, {
    selectAutomation,
    openScheduleModal,
    closeScheduleModal,
    createSchedule,
    editSchedule,
    deleteSchedule,
    editAutomation,
    deleteAutomation
});
