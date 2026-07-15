import express from 'express';
import axios from 'axios';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import HueColorPkg from 'hue-colors';

const HueColor = HueColorPkg.default;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Configuration management
let currentConfig = {
  bridgeIp: process.env.HUE_BRIDGE_IP || null,
  username: process.env.HUE_USERNAME || null
};

// Load config from file if exists
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      currentConfig = JSON.parse(data);
      console.log('✅ Configuración cargada desde archivo:', JSON.stringify(currentConfig, null, 2));
    } catch (error) {
      console.warn('⚠️ Error al cargar config.json, usando variables de entorno');
    }
  }
}

// Save config to file
function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
    console.log('✅ Configuración guardada:', JSON.stringify(currentConfig, null, 2));
  } catch (error) {
    console.error('❌ Error al guardar configuración:', error.message);
  }
}

loadConfig();

// Bridge Hue configuration
let HUE_BRIDGE_IP = currentConfig.bridgeIp;
let HUE_USERNAME = currentConfig.username;

// Verificación de configuración inicial
if (!HUE_BRIDGE_IP) {
  console.warn('⚠️ HUE_BRIDGE_IP no está configurada. Usa /api/config para configurarla.');
}

// El bridge Hue v1 se vuelve inestable (ECONNRESET) si recibe demasiadas
// conexiones simultáneas, así que se limita la concurrencia a nivel de socket.
const httpAgent = new http.Agent({
  maxSockets: 3
});

let hueAPI = null;

function updateHueAPI() {
  if (HUE_BRIDGE_IP && HUE_USERNAME) {
    hueAPI = axios.create({
      baseURL: `http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME}`,
      httpAgent: httpAgent,
      validateStatus: () => true
    });
  }
}

function buildHueClient(token = HUE_USERNAME) {
  return axios.create({
    baseURL: `http://${HUE_BRIDGE_IP}/api/${token}`,
    httpAgent: httpAgent,
    validateStatus: () => true
  });
}

async function getOwnerName(ownerToken, cache) {
  const token = ownerToken || HUE_USERNAME;
  if (!token) return 'Sin propietario';
  if (cache?.has(token)) return cache.get(token);

  const promise = (async () => {
    try {
      const response = await buildHueClient(token).get('/config');
      const config = response.data || {};
      const whitelist = config.whitelist || {};
      const ownerEntry = whitelist[token];
      return ownerEntry?.name || token;
    } catch (error) {
      console.warn(`No se pudo resolver el owner ${token}:`, error.message);
      return token;
    }
  })();

  cache?.set(token, promise);
  return promise;
}

async function getLightName(ownerToken, lightId, cache) {
  const token = ownerToken || HUE_USERNAME;
  if (!token || !lightId) return null;
  const cacheKey = `${token}::${lightId}`;
  if (cache?.has(cacheKey)) return cache.get(cacheKey);

  const promise = (async () => {
    try {
      const response = await buildHueClient(token).get(`/lights/${lightId}`);
      const lightData = response.data || {};

      if (lightData.name) {
        return lightData.name;
      }

      if (lightData[lightId]?.name) {
        return lightData[lightId].name;
      }

      return `Luz ${lightId}`;
    } catch (error) {
      console.warn(`No se pudo resolver el nombre de la luz ${lightId}:`, error.message);
      return `Luz ${lightId}`;
    }
  })();

  cache?.set(cacheKey, promise);
  return promise;
}

// hue-colors@0.5.5 tiene un bug en miredToRgb: el canal azul usa `kelvin`
// en vez de `kelvin / 100`, lo que da rosados/violetas en vez de blancos
// cálidos. Se convierte `ct` (mireds) a RGB acá con el algoritmo correcto
// (Tanner Helland); xy y hue sí se calculan bien con hue-colors.
function miredToHex(mired, bri = 254) {
  const temp = 1000000 / mired / 100;

  let red;
  if (temp <= 66) {
    red = 255;
  } else {
    red = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
  }

  let green;
  if (temp <= 66) {
    green = 99.4708025861 * Math.log(temp) - 161.1195681661;
  } else {
    green = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
  }

  let blue;
  if (temp >= 66) {
    blue = 255;
  } else if (temp <= 19) {
    blue = 0;
  } else {
    blue = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  }

  const brightnessScale = (bri ?? 254) / 254;
  const toHexPart = (value) => Math.round(Math.min(255, Math.max(0, value)) * brightnessScale)
    .toString(16)
    .padStart(2, '0');

  return `#${toHexPart(red)}${toHexPart(green)}${toHexPart(blue)}`;
}

function getColorPreview(state = {}) {
  if (Array.isArray(state?.xy) && state.xy.length >= 2) {
    const [x, y] = state.xy;
    const color = HueColor.fromCIE(x, y, state?.bri ?? 254);
    return { hex: `#${color.toHex()}`, label: 'color xy' };
  }

  if (state?.hue !== undefined) {
    const color = HueColor.fromHsb(state.hue, state?.sat ?? 254, state?.bri ?? 254);
    return { hex: `#${color.toHex()}`, label: 'color hue' };
  }

  if (state?.ct !== undefined) {
    return { hex: miredToHex(state.ct, state?.bri ?? 254), label: 'color ct' };
  }

  return null;
}

function describeLightState(state = {}, lightName = 'Luz') {
  const parts = [];
  const colorPreview = getColorPreview(state);

  if (state?.on === true) {
    parts.push('encender');
  } else if (state?.on === false) {
    parts.push('apagar');
  }

  if (state?.bri !== undefined) {
    parts.push(`brillo ${state.bri}`);
  }

  if (state?.ct !== undefined) {
    parts.push(`temperatura de blanco ${state.ct} mireds`);
  }

  if (state?.transitiontime !== undefined) {
    parts.push(`transición ${state.transitiontime}`);
  }

  if (state?.tt !== undefined) {
    parts.push(`transición ${state.tt}`);
  }

  if (state?.colormode) {
    parts.push(`modo ${state.colormode}`);
  }

  if (state?.effect) {
    parts.push(`efecto ${state.effect}`);
  }

  const summary = parts.length > 0 ? parts.join(' · ') : 'sin cambios';
  return {
    text: `${lightName}: ${summary}`,
    color: colorPreview?.hex || null
  };
}

function buildSceneActionDetails(lightStates = {}, lightNameById = {}) {
  const entries = Object.entries(lightStates || {});
  if (entries.length === 0) {
    return [];
  }

  return entries.map(([lightId, state]) => {
    const lightName = lightNameById[lightId] || `Luz ${lightId}`;
    const detail = describeLightState(state, lightName);
    return {
      id: lightId,
      name: lightName,
      text: detail.text,
      color: detail.color
    };
  });
}

async function enrichSceneData(sceneId, sceneData = {}, caches = {}) {
  const ownerToken = sceneData.owner || HUE_USERNAME;
  const ownerName = await getOwnerName(ownerToken, caches.ownerNames);
  const lightIds = Array.isArray(sceneData.lights) ? sceneData.lights : [];

  const lightNames = await Promise.all(
    lightIds.map((lightId) => getLightName(ownerToken, lightId, caches.lightNames))
  );
  const lightNameById = {};
  lightIds.forEach((lightId, index) => {
    lightNameById[lightId] = lightNames[index];
  });

  const lightStates = sceneData.lightstates || {};
  const actionDetails = buildSceneActionDetails(lightStates, lightNameById);

  return {
    ...sceneData,
    id: sceneId,
    owner: ownerToken,
    ownerName,
    lights: lightIds,
    lightNames,
    lightCount: lightIds.length,
    recycle: sceneData.recycle ?? false,
    lightstates: lightStates,
    actionDetails
  };
}

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

// El bridge Hue v1 tarda varios segundos en enriquecer todas las escenas
// (una petición por escena + por luz, limitada a 3 conexiones simultáneas).
// Se cachea la respuesta un rato corto para que el polling del frontend no
// dispare ese trabajo pesado cada pocos segundos.
let scenesCache = { data: null, timestamp: 0 };
const SCENES_CACHE_TTL_MS = 30000;

function invalidateScenesCache() {
  scenesCache = { data: null, timestamp: 0 };
}

// Obtener todos los scenes
app.get('/api/scenes', async (req, res) => {
  try {
    if (scenesCache.data && (Date.now() - scenesCache.timestamp) < SCENES_CACHE_TTL_MS) {
      return res.json(scenesCache.data);
    }

    const response = await hueAPI.get('/scenes');
    const rawScenes = response.data || {};
    const sceneIds = Object.keys(rawScenes);
    const caches = { ownerNames: new Map(), lightNames: new Map() };

    const sceneDetails = await Promise.all(
      sceneIds.map((sceneId) => hueAPI.get(`/scenes/${sceneId}`))
    );

    const enrichedList = await Promise.all(
      sceneIds.map((sceneId, index) => {
        const scene = sceneDetails[index].data || rawScenes[sceneId] || {};
        return enrichSceneData(sceneId, scene, caches);
      })
    );

    const enrichedScenes = {};
    sceneIds.forEach((sceneId, index) => {
      enrichedScenes[sceneId] = enrichedList[index];
    });

    scenesCache = { data: enrichedScenes, timestamp: Date.now() };
    res.json(enrichedScenes);
  } catch (error) {
    console.error('Error fetching scenes:', error.message);
    res.status(500).json({ error: 'Error al obtener los modos guardados' });
  }
});

// Obtener detalle de un scene
app.get('/api/scenes/:sceneId', async (req, res) => {
  try {
    const response = await hueAPI.get(`/scenes/${req.params.sceneId}`);
    const enrichedScene = await enrichSceneData(req.params.sceneId, response.data || {});
    res.json(enrichedScene);
  } catch (error) {
    console.error('Error fetching scene detail:', error.message);
    res.status(500).json({ error: 'Error al obtener el detalle del modo' });
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
    invalidateScenesCache();
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
    invalidateScenesCache();
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
    invalidateScenesCache();
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
// API Routes - Automations (Grouped)
// ====================

// Obtener automatizaciones agrupadas con sus relaciones
app.get('/api/automations-grouped', async (req, res) => {
  try {
    const response = await hueAPI.get('/schedules');
    const schedules = response.data || {};

    // Agrupar automatizaciones por nombre/patrón
    const groups = {};
    
    Object.entries(schedules).forEach(([id, schedule]) => {
      // Extraer nombre de grupo (texto antes del último guión o el nombre completo)
      const scheduleName = schedule.name || '';
      const groupKey = extractGroupName(scheduleName);
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          name: groupKey,
          steps: [],
          description: schedule.description || ''
        };
      }
      
      groups[groupKey].steps.push({
        id: id,
        name: schedule.name,
        time: schedule.time,
        description: schedule.description,
        command: schedule.command,
        startaction: schedule.startaction,
        status: schedule.status
      });
    });

    // Ordenar pasos dentro de cada grupo por time o nombre
    Object.values(groups).forEach(group => {
      group.steps.sort((a, b) => {
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return (a.name || '').localeCompare(b.name || '');
      });

      // Detectar relaciones entre pasos
      group.steps.forEach((step, index) => {
        if (index < group.steps.length - 1) {
          step.nextStepId = group.steps[index + 1].id;
        }
      });
    });

    // Convertir a array y ordenar por nombre
    const automations = Object.values(groups).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    res.json({
      automations: automations,
      total: automations.length,
      stepsTotal: Object.keys(schedules).length
    });
  } catch (error) {
    console.error('Error fetching grouped automations:', error.message);
    res.status(500).json({ error: 'Error al obtener las automatizaciones agrupadas' });
  }
});

// Función auxiliar para extraer el nombre del grupo
function extractGroupName(scheduleName) {
  // Si contiene guión, tomar la parte antes del último guión
  if (scheduleName.includes(' - ')) {
    const parts = scheduleName.split(' - ');
    return parts[0].trim();
  }
  
  // Si contiene números al final (ej: "Rutina 1", "Rutina 2"), usar el prefijo
  const match = scheduleName.match(/^(.+?)\s*\d*$/);
  if (match) {
    return match[1].trim();
  }
  
  return scheduleName;
}

// ====================
// API Routes - Config
// ====================

// Obtener configuración actual
app.get('/api/config', async (req, res) => {
  try {
    if (!HUE_BRIDGE_IP) {
      return res.json({
        configured: false,
        bridgeIp: null,
        username: null,
        status: 'No configurado'
      });
    }

    // Test de conexión
    const testResponse = await axios.get(`http://${HUE_BRIDGE_IP}/api/${HUE_USERNAME || 'test'}/lights`, {
      httpAgent: httpAgent,
      validateStatus: () => true,
      timeout: 5000
    });

    res.json({
      configured: true,
      bridgeIp: HUE_BRIDGE_IP,
      username: HUE_USERNAME,
      connected: testResponse.status === 200,
      status: testResponse.status === 200 ? 'Conectado' : 'No disponible'
    });
  } catch (error) {
    res.json({
      configured: !!HUE_BRIDGE_IP,
      bridgeIp: HUE_BRIDGE_IP,
      username: HUE_USERNAME,
      connected: false,
      status: 'No disponible: ' + error.message
    });
  }
});

// Descubrir bridge automáticamente
app.post('/api/config/discover', async (req, res) => {
  try {
    console.log('🔍 Buscando Philips Hue bridge...');
    const response = await axios.get('https://discovery.meethue.com/', {
      timeout: 10000
    });

    const bridges = Array.isArray(response.data)
      ? response.data.map(bridge => ({
          id: bridge.id,
          internalIpAddress: bridge.internalipaddress || bridge.internalIpAddress || bridge.ipaddress,
          name: bridge.name || 'Bridge'
        }))
      : [];

    res.json({
      success: true,
      bridges
    });
  } catch (error) {
    console.error('Error discovering bridge:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al buscar bridge: ' + error.message,
      bridges: []
    });
  }
});

// Actualizar configuración del bridge
app.post('/api/config/update', async (req, res) => {
  try {
    const { bridgeIp, username } = req.body;

    if (!bridgeIp) {
      return res.status(400).json({ error: 'bridgeIp es requerida' });
    }

    // Validar que el bridge es accesible
    console.log(`🔗 Validando conexión con ${bridgeIp}...`);
    
    const testResponse = await axios.get(`http://${bridgeIp}/api/0/lights`, {
      httpAgent: httpAgent,
      validateStatus: () => true,
      timeout: 5000
    });

    if (testResponse.status !== 200) {
      return res.status(400).json({ 
        error: 'No se puede conectar con el bridge',
        details: `Status: ${testResponse.status}`
      });
    }

    // Actualizar configuración en memoria
    HUE_BRIDGE_IP = bridgeIp;
    if (username) {
      HUE_USERNAME = username;
    } else if (!HUE_USERNAME) {
      // Si no hay username actual y no se proporciona uno, usar el por defecto
      HUE_USERNAME = 'newdeveloper';
    }

    // Actualizar configuración guardada
    currentConfig.bridgeIp = bridgeIp;
    currentConfig.username = HUE_USERNAME;
    saveConfig();

    // Actualizar cliente HTTP
    updateHueAPI();

    console.log(`✅ Bridge actualizado: ${HUE_BRIDGE_IP}`);
    console.log(`✅ Username: ${HUE_USERNAME}`);

    res.json({
      success: true,
      message: 'Configuración actualizada',
      bridgeIp: HUE_BRIDGE_IP,
      username: HUE_USERNAME
    });
  } catch (error) {
    console.error('Error updating config:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración: ' + error.message
    });
  }
});

// Obtener configuración del bridge
app.get('/api/config/bridge', async (req, res) => {
  try {
    if (!hueAPI) {
      return res.status(400).json({ error: 'Bridge no configurado' });
    }

    const response = await hueAPI.get('/config');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching bridge config:', error.message);
    res.status(500).json({ error: 'Error al obtener configuración del bridge' });
  }
});

// ====================
// Rutas de error
// ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', bridge: HUE_BRIDGE_IP, configured: !!HUE_BRIDGE_IP });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', bridge: HUE_BRIDGE_IP, configured: !!HUE_BRIDGE_IP });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ====================
// Iniciar servidor
// ====================

updateHueAPI();

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🏠 Philips Hue Controller - v1.0     ║
║   Running on: http://localhost:${PORT}    ║
║   Bridge IP: ${HUE_BRIDGE_IP || 'No configurada'}          ║
║   Status: ${HUE_BRIDGE_IP ? '✅ Listo' : '⚠️  Configura tu bridge'}    ║
╚════════════════════════════════════════╝
  `);
  console.log('💡 Para verificar la conexión, visita: /health');
  if (!HUE_BRIDGE_IP) {
    console.log('📱 Para configurar el bridge, abre: http://localhost:3000/?settings');
  }
});
