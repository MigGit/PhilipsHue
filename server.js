import express from 'express';
import axios from 'axios';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Bridge Hue configuration
const HUE_BRIDGE_IP = process.env.HUE_BRIDGE_IP;
const HUE_USERNAME = process.env.HUE_USERNAME;

// Verificación de configuración
if (!HUE_BRIDGE_IP) {
  console.error('❌ Error: HUE_BRIDGE_IP no está configurada en .env');
  process.exit(1);
}

// Crear cliente http que ignora certificados auto-firmados
const httpAgent = new http.Agent({
  rejectUnauthorized: false
});

const hueAPI = axios.create({
  baseURL: `http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}`,
  httpAgent: httpAgent,
  validateStatus: () => true
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ====================
// API Routes - Lights
// ====================

// Obtener todas las luces
app.get('/api/lights', async (req, res) => {
  try {
    const response = await hueAPI.get('/lights');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching lights:', error.message);
    res.status(500).json({ error: 'Error al obtener las luces' });
  }
});

// Obtener una luz específica
app.get('/api/lights/:id', async (req, res) => {
  try {
    const response = await hueAPI.get(`/lights/${req.params.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching light:', error.message);
    res.status(500).json({ error: 'Error al obtener la luz' });
  }
});

// Controlar una luz (encender/apagar)
app.put('/api/lights/:id/state', async (req, res) => {
  try {
    const { on, bri, hue, sat, ct } = req.body;
    const state = {};

    if (on !== undefined) state.on = on;
    if (bri !== undefined) state.bri = Math.min(254, Math.max(0, bri));
    if (hue !== undefined) state.hue = Math.min(65535, Math.max(0, hue));
    if (sat !== undefined) state.sat = Math.min(254, Math.max(0, sat));
    if (ct !== undefined) state.ct = Math.min(500, Math.max(153, ct));

    const response = await hueAPI.put(`/lights/${req.params.id}/state`, state);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating light:', error.message);
    res.status(500).json({ error: 'Error al actualizar la luz' });
  }
});

// ====================
// API Routes - Groups
// ====================

// Obtener todos los grupos
app.get('/api/groups', async (req, res) => {
  try {
    const response = await hueAPI.get('/groups');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
});

// Controlar un grupo
app.put('/api/groups/:id/action', async (req, res) => {
  try {
    const { on, bri, hue, sat, ct } = req.body;
    const action = {};

    if (on !== undefined) action.on = on;
    if (bri !== undefined) action.bri = Math.min(254, Math.max(0, bri));
    if (hue !== undefined) action.hue = Math.min(65535, Math.max(0, hue));
    if (sat !== undefined) action.sat = Math.min(254, Math.max(0, sat));
    if (ct !== undefined) action.ct = Math.min(500, Math.max(153, ct));

    const response = await hueAPI.put(`/groups/${req.params.id}/action`, action);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating group:', error.message);
    res.status(500).json({ error: 'Error al actualizar el grupo' });
  }
});

// ====================
// API Routes - Scenes (Modos de Programación)
// ====================

// Obtener todos los scenes
app.get('/api/scenes', async (req, res) => {
  try {
    const response = await hueAPI.get('/scenes');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching scenes:', error.message);
    res.status(500).json({ error: 'Error al obtener los modos guardados' });
  }
});

// Crear nuevo scene
app.post('/api/scenes', async (req, res) => {
  try {
    const { name, lights, lightStates } = req.body;
    
    if (!name || !lights || !lightStates) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    // Crear objeto con los estados de las luces
    const sceneData = {
      name: name,
      lights: lights
    };

    // Guardar los estados actuales de cada luz
    for (const lightId of lights) {
      sceneData[`lightstates/${lightId}`] = lightStates[lightId] || {};
    }

    const response = await hueAPI.post('/scenes', sceneData);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating scene:', error.message);
    res.status(500).json({ error: 'Error al crear el modo' });
  }
});

// Actualizar un scene existente
app.put('/api/scenes/:sceneId', async (req, res) => {
  try {
    const { name, lights, lightStates } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (lights) updateData.lights = lights;
    
    if (lightStates) {
      for (const lightId of Object.keys(lightStates)) {
        updateData[`lightstates/${lightId}`] = lightStates[lightId];
      }
    }

    const response = await hueAPI.put(`/scenes/${req.params.sceneId}`, updateData);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating scene:', error.message);
    res.status(500).json({ error: 'Error al actualizar el modo' });
  }
});

// Activar un scene
app.put('/api/scenes/:sceneId/recall', async (req, res) => {
  try {
    const sceneId = req.params.sceneId;
    
    // En Philips Hue Gen 1, se activa un scene recallándolo desde un grupo
    const response = await hueAPI.put(`/groups/0/action`, { scene: sceneId });
    res.json(response.data);
  } catch (error) {
    console.error('Error recalling scene:', error.message);
    res.status(500).json({ error: 'Error al activar el modo' });
  }
});

// Eliminar un scene
app.delete('/api/scenes/:sceneId', async (req, res) => {
  try {
    const response = await hueAPI.delete(`/scenes/${req.params.sceneId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting scene:', error.message);
    res.status(500).json({ error: 'Error al eliminar el modo' });
  }
});

// ====================
// API Routes - Schedules (Automatizaciones)
// ====================

// Obtener todos los schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const response = await hueAPI.get('/schedules');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching schedules:', error.message);
    res.status(500).json({ error: 'Error al obtener las automatizaciones' });
  }
});

// Crear un nuevo schedule
app.post('/api/schedules', async (req, res) => {
  try {
    const { name, description, command, time, autodelete } = req.body;

    if (!name || !command || !time) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    const scheduleData = {
      name: name,
      description: description || '',
      command: command,
      time: time,
      autodelete: autodelete !== false
    };

    const response = await hueAPI.post('/schedules', scheduleData);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating schedule:', error.message);
    res.status(500).json({ error: 'Error al crear la automatización' });
  }
});

// Actualizar un schedule
app.put('/api/schedules/:scheduleId', async (req, res) => {
  try {
    const { name, description, command, time, autodelete } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (command) updateData.command = command;
    if (time) updateData.time = time;
    if (autodelete !== undefined) updateData.autodelete = autodelete;

    const response = await hueAPI.put(`/schedules/${req.params.scheduleId}`, updateData);
    res.json(response.data);
  } catch (error) {
    console.error('Error updating schedule:', error.message);
    res.status(500).json({ error: 'Error al actualizar la automatización' });
  }
});

// Eliminar un schedule
app.delete('/api/schedules/:scheduleId', async (req, res) => {
  try {
    const response = await hueAPI.delete(`/schedules/${req.params.scheduleId}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error deleting schedule:', error.message);
    res.status(500).json({ error: 'Error al eliminar la automatización' });
  }
});

// ====================
// API Routes - Config
// ====================

// Test de conexión al bridge
app.get('/api/config', async (req, res) => {
  try {
    const response = await hueAPI.get('/config');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching config:', error.message);
    res.status(500).json({ error: 'Error al conectar con el bridge' });
  }
});

// ====================
// Rutas de error
// ====================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', bridge: HUE_BRIDGE_IP });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ====================
// Iniciar servidor
// ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🏠 Philips Hue Controller - v1.0     ║
║   Running on: http://localhost:${PORT}    ║
║   Bridge IP: ${HUE_BRIDGE_IP}          ║
╚════════════════════════════════════════╝
  `);
  console.log('💡 Para verificar la conexión, visita: /health');
});
