# 💡 Philips Hue Controller — Manual Completo

Documento único que condensa toda la documentación del proyecto (antes repartida en
19 archivos dentro de `Docs/`). Aplica a un **Philips Hue Bridge de primera
generación**, controlado 100% en local, sin depender de los servidores de Philips.

## Índice

1. [Resumen del proyecto](#1-resumen-del-proyecto)
2. [Requisitos](#2-requisitos)
3. [Instalación y primeros pasos](#3-instalación-y-primeros-pasos)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Configuración del bridge](#5-configuración-del-bridge)
6. [Interfaz y funcionalidades](#6-interfaz-y-funcionalidades)
7. [Referencia de la API REST](#7-referencia-de-la-api-rest)
8. [Automatizaciones y casos de uso](#8-automatizaciones-y-casos-de-uso)
9. [Docker](#9-docker)
10. [Seguridad y producción](#10-seguridad-y-producción)
11. [Checklist de instalación](#11-checklist-de-instalación)
12. [Solución de problemas (FAQ)](#12-solución-de-problemas-faq)
13. [Recursos y licencia](#13-recursos-y-licencia)

---

## 1. Resumen del proyecto

Web app para controlar un Philips Hue Bridge Gen 1 desde el navegador:

- Control local — no depende de los servidores/nube de Philips.
- Interfaz web moderna, oscura y responsive (móvil/tablet/desktop).
- API REST propia que hace de proxy hacia el bridge.
- Backend: Node.js + Express + Axios.
- Frontend: HTML5 + CSS3 + JavaScript vanilla (ES modules, sin frameworks).
- Sin dependencia de internet, salvo para el descubrimiento automático de
  bridges (`discovery.meethue.com`) y el conversor de color (`hue-colors`,
  librería local, no requiere red).

### Funcionalidades principales

- Control de luces individuales (encender/apagar, brillo, color, saturación).
- Control de grupos (habitaciones/zonas).
- Presets rápidos para toda la casa.
- Modos (Scenes): guardar y reactivar configuraciones completas de luces.
- Automatizaciones (Schedules): acciones programadas por hora, con diagrama
  visual de los pasos.
- Configuración dinámica del bridge: descubrimiento automático o manual de la
  IP, sin tocar archivos.

---

## 2. Requisitos

- Node.js 24+ y npm 10+ (`node --version`, `npm --version`).
- Philips Hue Bridge (Gen 1 en adelante) conectado a la red.
- El computador/servidor debe estar en la **misma red local** que el bridge.
- (Opcional) Docker + Docker Compose, si se prefiere desplegar en contenedor.

---

## 3. Instalación y primeros pasos

### 3.1. En 3 pasos

```bash
npm install                 # instala dependencias
npm run get-key              # obtiene credenciales del bridge (botón LINK)
npm start                    # inicia el servidor
```

Abrir en el navegador: `http://localhost:3000` (o el `PORT` configurado).

### 3.2. Paso a paso

1. **Verificar Node.js**
   ```powershell
   node --version
   npm --version
   ```
2. **Instalar dependencias**
   ```bash
   npm install
   ```
   Instala: `express`, `axios`, `cors`, `dotenv`, `hue-colors`
   (conversión de color) y sus transitivas.
3. **Encontrar la IP del bridge**
   - Router: abrir la administración del router y buscar "Philips Hue Bridge"
     en dispositivos conectados.
   - App oficial de Hue: Configuración → Información del Bridge.
   - Descubrimiento: `https://discovery.meethue.com/` devuelve un JSON con
     los bridges visibles desde tu red.
   - Desde la propia app: pestaña **⚙️ Configuración** → **🔍 Buscar Bridge**
     (ver [sección 5](#5-configuración-del-bridge)).
4. **Obtener el API username (`npm run get-key`)**
   - El script pide la IP del bridge.
   - Hay que presionar el botón físico **LINK** (parte superior del bridge,
     junto a la antena) **mientras el script está esperando** — hay ~30
     segundos de margen.
   - Al terminar, genera/actualiza el archivo `.env` con `HUE_BRIDGE_IP` y
     `HUE_USERNAME`.
5. **Configurar `.env`** (si no se generó automáticamente, copiar desde
   `.env.example`):
   ```env
   HUE_BRIDGE_IP=192.168.1.100
   HUE_USERNAME=usuario_generado
   PORT=3000
   ```
6. **Iniciar el servidor**
   ```bash
   npm start        # producción
   npm run dev       # desarrollo, reinicia solo al cambiar server.js
   ```
7. **Abrir la interfaz**: `http://localhost:3000`.

### 3.3. Acceso desde otro dispositivo (móvil/tablet)

Sirve mientras el dispositivo esté en la misma red:

```
http://<IP_DEL_SERVIDOR>:3000
```

La IP del servidor se obtiene con `ipconfig` (Windows) buscando "IPv4
Address".

### 3.4. Detener la aplicación

`Ctrl + C` en la terminal donde corre `npm start`/`npm run dev`.

---

## 4. Estructura del proyecto

```
PhilipsHue/
├── server.js                 # Servidor Express — toda la API REST
├── get-key.js                 # Script para obtener el username del bridge
├── config.json                 # Config dinámica del bridge (autogenerado, ver §5)
├── package.json                # Dependencias y scripts npm
├── .env / .env.example          # Variables de entorno
│
├── public/                      # Frontend (servido como estático)
│   ├── index.html               # Shell HTML: header, tabs, modales
│   ├── styles.css                # Estilos (tema oscuro, responsive)
│   ├── api.js                     # Capa común de comunicación con el backend
│   │                                 (apiGet/apiPost/apiPut/apiDelete)
│   ├── utils.js                    # Utilidades compartidas (escapeHtml)
│   ├── app.js                      # Shell de la app: navegación entre tabs,
│   │                                 arranque, polling
│   ├── partials/                   # Fragmentos HTML de cada tab
│   │   ├── lights.html
│   │   ├── groups.html
│   │   ├── presets.html
│   │   ├── scenes.html
│   │   ├── schedules.html
│   │   └── settings.html
│   └── modules/                    # Un módulo JS por funcionalidad — cada uno
│       │                             es dueño de su estado, su render y sus
│       │                             llamadas a la API, y se auto-registra en
│       │                             `window` para los `onclick` del HTML
│       ├── status.js                # Estado de conexión (header)
│       ├── lights.js                 # Tab Luces + modal de color
│       ├── groups.js                  # Tab Grupos
│       ├── presets.js                  # Tab Presets
│       ├── scenes.js                    # Tab Modos (Scenes)
│       ├── schedules.js                  # Tab Automatizaciones (Schedules) + diagrama
│       └── settings.js                    # Tab Configuración del bridge
│
├── .dockerignore                # Debe vivir en la RAÍZ (ver nota abajo), no en Docker/
├── .env.docker / .env.docker.example   # Variables para Docker (también en la raíz)
│
├── Docker/                      # Todo lo demás relacionado con Docker
│   ├── Dockerfile                 # Imagen simple (dev/producción)
│   ├── Dockerfile.prod             # Multi-stage, usuario no-root, más liviana
│   ├── docker-compose.yml           # Orquestación con healthcheck
│   ├── docker-helper.ps1             # Helper Windows PowerShell
│   └── docker-helper.sh               # Helper Linux/Mac
│
└── Docs/                          # Documentación (este archivo la consolida)
```

> `.dockerignore` tiene que quedarse en la raíz del proyecto aunque el resto
> de Docker viva en `Docker/`: Docker busca ese archivo en la raíz del build
> **context**, y el contexto sigue siendo la raíz del proyecto (ahí están
> `server.js`, `public/`, `package.json` — el `Dockerfile` no puede copiar
> nada que esté fuera de su contexto). Los `docker build`/`docker-compose`
> apuntan al Dockerfile con `-f Docker/Dockerfile`, pero el contexto sigue
> siendo `.` (la raíz).

> Nota histórica: la separación de `app.js` en `public/modules/` es reciente.
> Antes toda la lógica de las 6 pestañas vivía en un único `app.js`; ahora
> cada pestaña tiene su propio módulo, y `api.js`/`utils.js` son el código
> común compartido (comunicación HTTP y helpers de escape de HTML).

---

## 5. Configuración del bridge

La IP del bridge puede cambiar (reinicios, DHCP del router). La app permite
gestionarla sin editar archivos a mano, desde la pestaña **⚙️ Configuración**.

### 5.1. Prioridad de configuración

```
Variables de entorno (.env)  >  config.json  >  valores por defecto
```

### 5.2. Búsqueda automática (recomendado)

1. Pestaña **⚙️ Configuración** → **🔍 Buscar Bridge**.
2. La app consulta `discovery.meethue.com` (requiere internet solo para este
   paso) y muestra los bridges encontrados con su IP.
3. Clic en **Usar** sobre el bridge deseado.
4. Clic en **💾 Guardar Configuración**.

### 5.3. Configuración manual

1. Ingresar la IP del bridge (ej. `192.168.1.100`).
2. (Opcional) actualizar el username — si se deja vacío se mantiene el
   actual.
3. **💾 Guardar Configuración**. El servidor valida que el bridge responda
   antes de guardar.

### 5.4. Persistencia — `config.json`

Se crea/actualiza automáticamente en la raíz del proyecto al guardar desde la
UI:

```json
{
  "bridgeIp": "192.168.1.100",
  "username": "usuario_generado"
}
```

### 5.5. Estado de conexión

La pestaña Configuración muestra en vivo:

- ✅ **Bridge Configurado** — IP actual + 🟢 Conectado / 🔴 No disponible.
- ⚠️ **Bridge No Configurado** — falta completar los pasos anteriores.

### 5.6. Variables de entorno relevantes

```env
HUE_BRIDGE_IP=192.168.1.100
HUE_USERNAME=usuario_generado
PORT=3000
NODE_ENV=production      # opcional
```

### 5.7. Problemas comunes

| Problema | Causa / Solución |
|---|---|
| "No se encontraron bridges" | El descubrimiento automático necesita internet. Usar configuración manual con la IP exacta. |
| "No se puede conectar con el bridge" | IP incorrecta o bridge apagado/fuera de red. Verificar con `ping <ip>`. |
| La configuración no se guarda | El proceso de Node no tiene permisos de escritura en la carpeta del proyecto (revisar volumen si es Docker). |

---

## 6. Interfaz y funcionalidades

La app tiene **6 pestañas**:

### 6.1. 💡 Luces

- Lista todas las luces con su estado (encendida/apagada) y brillo.
- Clic en una luz abre un modal de edición con:
  - **Paleta de 8 colores rápidos**: 🔴 Rojo · 🟠 Naranja · 🟡 Amarillo ·
    🟢 Verde · 🔵 Azul · 🟣 Púrpura · 🩷 Rosado · ⚪ Blanco. Un clic ajusta
    hue/saturación al instante (y sube el brillo a máximo si estaba en 0).
  - **Vista previa de color** en tiempo real (barra grande arriba del modal).
  - Sliders de **Brillo**, **Color (Hue)** y **Saturación**, mostrados en
    porcentaje (0-100%) en vez de los valores crudos del protocolo Hue.
- El estado se refresca solo cada 5 segundos.

### 6.2. 👥 Grupos

- Igual que Luces, pero a nivel de grupo/habitación (todas sus luces a la
  vez). Slider de brillo rápido directamente en la tarjeta del grupo.

### 6.3. 🎨 Presets

Aplican brillo/color a **todas las luces simultáneamente**:

| Preset | Brillo | Hue | Sat | Uso |
|---|---|---|---|---|
| ☀️ Brillante | 254 | 0 | 0 | Blanco máximo |
| 🔆 Cálido | 200 | 10000 | 200 | Tarde/noche |
| ❄️ Frío | 200 | 45000 | 150 | Concentración |
| 🎬 Película | 100 | 0 | 254 | Ambiente bajo, rojizo |
| 📖 Lectura | 254 | 0 | 0 | Blanco puro, máximo brillo |
| 🌙 Noche | 50 | 60000 | 254 | Muy tenue |
| ⚫ Apagar todo | — | — | — | Apaga todas las luces |

### 6.4. 🎬 Modos (Scenes)

Guardan y reproducen configuraciones completas de luces (nativo del bridge
Hue, no algo propio de esta app).

- **Guardar el estado actual**: "+ Guardar Modo Actual" → nombre → elegir
  qué luces incluir → Guardar.
- **Activar**: clic en "Activar" sobre la tarjeta del modo (o clic en el
  nombre/descr).
- **Eliminar**: clic en "Eliminar" + confirmación.
- Las tarjetas agrupan los modos por propietario (`owner` del bridge) y
  muestran, **por cada luz del modo, un cuadrito con su color real** (calculado
  a partir de `xy`, `hue`/`sat` o `ct` con la librería `hue-colors`) junto a
  una descripción textual (ej. "encender · brillo 199"). Si una luz del modo
  no tiene información de color (solo on/off), se muestra un cuadrito con
  patrón rayado.
- El listado (`GET /api/scenes`) es una operación costosa en un bridge Gen 1
  (una petición HTTP por escena + por luz), así que el backend la cachea 30
  segundos y limita la concurrencia hacia el bridge a 3 conexiones
  simultáneas para no saturarlo.

### 6.5. ⏰ Automatizaciones (Schedules)

Acciones programadas por horario (nativo del bridge).

- **Crear**: "+ Nueva Automatización" → nombre, descripción opcional, hora
  (24h), acción (Encender/Apagar/Activar Modo), objetivo (luz o grupo).
- **Editar / Eliminar** desde cada tarjeta.
- Las automatizaciones con nombres relacionados se agrupan automáticamente
  (mismo prefijo antes de un guion, o mismo texto sin el número final) y se
  muestran como un **diagrama de pasos** (dibujado con D3.js) que conecta
  cada paso con el siguiente según su hora.

### 6.6. ⚙️ Configuración

Ver [sección 5](#5-configuración-del-bridge).

---

## 7. Referencia de la API REST

Todas las rutas son relativas a `http://localhost:<PORT>`. El servidor actúa
de proxy hacia el bridge Hue (`http://<HUE_BRIDGE_IP>/api/<HUE_USERNAME>/...`).

### 7.1. Parámetros de estado de luz/grupo

| Parámetro | Tipo | Rango | Descripción |
|---|---|---|---|
| `on` | boolean | `true`/`false` | Encender/apagar |
| `bri` | integer | 0–254 | Brillo |
| `hue` | integer | 0–65535 | Color (rueda de color) |
| `sat` | integer | 0–254 | Saturación (0 = blanco) |
| `ct` | integer | 153–500 | Temperatura de color, en *mired* (`K = 1.000.000 / mired`) |
| `effect` | string | `"none"`, `"colorloop"` | Efectos |

Temperaturas de referencia: 153 mired ≈ 6535K (frío/azulado) · 370 mired ≈
2700K (incandescente) · 500 mired ≈ 2000K (muy cálido).

Hue en grados × 182.04 = Hue en la escala 0-65535 de Philips (0°=rojo,
120°=verde, 240°=azul).

### 7.2. Luces

```
GET  /api/lights              Todas las luces
GET  /api/lights/:id          Una luz
PUT  /api/lights/:id/state    Cambiar estado (body: on/bri/hue/sat/ct)
```

### 7.3. Grupos

```
GET  /api/groups                Todos los grupos
PUT  /api/groups/:id/action     Cambiar estado (mismo body que luces)
```

### 7.4. Modos (Scenes)

```
GET    /api/scenes                  Todos los modos, enriquecidos
                                     (ownerName, lightNames, lightCount,
                                     actionDetails[] con texto + color hex
                                     por luz). Cacheado 30s en el servidor.
GET    /api/scenes/:sceneId         Detalle de un modo
POST   /api/scenes                  Crear
       body: { name, lights: ["1","2"], lightStates: { "1": {on,bri,hue,sat} } }
PUT    /api/scenes/:sceneId         Actualizar (name / lights / lightStates)
PUT    /api/scenes/:sceneId/recall  Activar el modo
DELETE /api/scenes/:sceneId         Eliminar
```

### 7.5. Automatizaciones (Schedules)

```
GET    /api/schedules                 Todos los schedules (formato nativo del bridge)
POST   /api/schedules                 Crear
       body: { name, description, command: { address, body }, time: "09:00", autodelete: true }
PUT    /api/schedules/:scheduleId     Actualizar
DELETE /api/schedules/:scheduleId     Eliminar
GET    /api/automations-grouped       Schedules agrupados por nombre, con
                                       pasos ordenados por hora y relación
                                       nextStepId entre pasos consecutivos
                                       (usado para el diagrama de la pestaña
                                       Automatizaciones)
```

### 7.6. Configuración del bridge

```
GET  /api/config             Estado actual (configured, bridgeIp, username,
                              connected — hace un test de conexión en vivo)
POST /api/config/discover    Descubre bridges vía discovery.meethue.com
POST /api/config/update      body: { bridgeIp, username? } — valida y
                              persiste en config.json
GET  /api/config/bridge      Config cruda del bridge (vía hueAPI)
```

### 7.7. Salud

```
GET /api/health     { status, bridge, configured }
GET /health          idéntico, alias sin /api
```

### 7.8. Ejemplos

**curl**
```bash
curl http://localhost:3000/api/lights

curl -X PUT http://localhost:3000/api/lights/1/state \
  -H "Content-Type: application/json" \
  -d '{"on": true, "hue": 0, "sat": 254, "bri": 254}'
```

**JavaScript (fetch)**
```javascript
const lights = await fetch('http://localhost:3000/api/lights').then(r => r.json());

await fetch('http://localhost:3000/api/lights/1/state', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ on: true, bri: 254 })
});
```

**Python**
```python
import requests

BASE_URL = "http://localhost:3000/api"
lights = requests.get(f"{BASE_URL}/lights").json()

requests.put(
    f"{BASE_URL}/lights/1/state",
    json={"on": True, "bri": 254}
)
```

### 7.9. Límites y consideraciones

- El brillo mínimo real puede no ser 0 en todas las luces (algunas no apagan
  del todo en `bri=0`).
- La transición máxima (`transitiontime`) está limitada a 900 (9 s).
- No todos los colores XY son alcanzables por todas las luces.
- `ct` solo aplica a luces con soporte de temperatura de color.
- Un bridge Gen 1 soporta pocas conexiones HTTP simultáneas — evitar
  ráfagas de peticiones en paralelo (el propio servidor ya limita esto para
  `/api/scenes`, ver §6.4).

### 7.10. Códigos de error del bridge

| Código | Significado |
|---|---|
| 1 | No autorizado |
| 2 | Parámetro inválido |
| 3 | Recurso no disponible |
| 4 | Método no permitido |
| 6 | Parámetros faltantes |
| 7 | Parámetro ilegal |
| 901 | Error interno del bridge |

---

## 8. Automatizaciones y casos de uso

Las automatizaciones (§6.5, nativas del bridge) cubren horarios fijos de
encendido/apagado. Para lógica más elaborada (transiciones graduales, ciclos,
reacción a eventos) se puede escribir un script aparte que hable con la API
de este proyecto. El patrón base es siempre el mismo:

```javascript
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setLight(lightId, state) {
  await fetch(`http://localhost:3000/api/lights/${lightId}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
}
```

A partir de ese patrón, estos son los escenarios más pedidos:

### 8.1. Despertador con amanecer gradual

Sube el brillo lentamente en tono cálido durante N minutos.

```javascript
async function sunriseAlarm(lightId, durationMinutes = 30) {
  const steps = 60;
  const stepMs = (durationMinutes * 60000) / steps;
  for (let i = 0; i <= steps; i++) {
    const bri = Math.round(1 + ((254 - 1) / steps) * i);
    await setLight(lightId, { on: true, bri, ct: 370 });
    await sleep(stepMs);
  }
}
```

Variante "alarma inteligente" (espera hasta una hora fija y luego dispara el
amanecer):

```javascript
async function smartAlarm(lightId, alarmTime = '07:00', durationMinutes = 20) {
  while (true) {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (hhmm === alarmTime) return sunriseAlarm(lightId, durationMinutes);
    await sleep(60000);
  }
}
```

### 8.2. Modo cine (dimming progresivo)

Cambia a rojo tenue y luego baja el brillo hasta apagar, para no deslumbrar.

```javascript
async function movieMode(lightId, durationMs = 5000, steps = 30) {
  await setLight(lightId, { on: true, hue: 0, sat: 254, bri: 150 });
  const stepMs = durationMs / steps;
  for (let bri = 150; bri >= 1; bri -= 150 / steps) {
    await setLight(lightId, { on: true, hue: 0, sat: 254, bri: Math.round(bri) });
    await sleep(stepMs);
  }
  await setLight(lightId, { on: false });
}
```

### 8.3. Ciclo circadiano (color según la hora del día)

```javascript
function colorForHour(hour) {
  if (hour >= 6 && hour < 10) return { bri: 254, ct: 250 };   // mañana
  if (hour >= 10 && hour < 14) return { bri: 254, ct: 370 };  // mediodía
  if (hour >= 14 && hour < 18) return { bri: 220, ct: 350 };  // tarde
  if (hour >= 18 && hour < 21) return { bri: 150, ct: 400 };  // atardecer
  return { bri: 50, ct: 500 };                                // noche
}

async function circadianRhythm(lightId, checkIntervalMinutes = 60) {
  while (true) {
    await setLight(lightId, { on: true, ...colorForHour(new Date().getHours()) });
    await sleep(checkIntervalMinutes * 60000);
  }
}
```

### 8.4. Modo Pomodoro (trabajo/descanso)

```javascript
async function pomodoroTimer(lightId, workMinutes = 25, breakMinutes = 5) {
  while (true) {
    await setLight(lightId, { on: true, bri: 254, ct: 200 });   // trabajo: frío
    await sleep(workMinutes * 60000);
    await setLight(lightId, { on: true, bri: 150, ct: 400 });   // descanso: cálido
    await sleep(breakMinutes * 60000);
  }
}
```

### 8.5. Atmósferas / ciclo de colores

```javascript
const moods = {
  calm: [{ hue: 43690, sat: 100, bri: 150 }, { hue: 39000, sat: 150, bri: 130 }, { hue: 34000, sat: 120, bri: 140 }],
  energetic: [{ hue: 0, sat: 254, bri: 254 }, { hue: 12000, sat: 200, bri: 220 }, { hue: 7000, sat: 150, bri: 240 }],
  romantic: [{ hue: 0, sat: 254, bri: 100 }, { hue: 350, sat: 230, bri: 120 }, { hue: 280, sat: 180, bri: 80 }],
  party: [{ hue: 0 }, { hue: 7000 }, { hue: 21845 }, { hue: 43690 }, { hue: 60000 }]
};

async function cycleMood(lightId, mood = 'calm', totalDurationMs = 300000) {
  const colors = moods[mood] || moods.calm;
  const start = Date.now();
  while (Date.now() - start < totalDurationMs) {
    for (const color of colors) {
      await setLight(lightId, { ...color, on: true });
      await sleep(totalDurationMs / colors.length / colors.length);
    }
  }
}
```

### 8.6. Otros escenarios (solo parámetros — mismo patrón `setLight`)

| Escenario | `bri` | `hue`/`ct` | `sat` | Notas |
|---|---|---|---|---|
| 🎯 Concentración / trabajo | 254 | `ct: 250` (frío) | — | `effect: 'none'` |
| 🌙 Modo nocturno | 50 | `hue: 0` (rojo) | 254 | No altera el ciclo de sueño |
| 👨‍💼 Videollamada | 240 | `ct: 300` (neutro) | — | Apagar luces laterales para menos sombra |
| 📖 Lectura | 254 | `ct: 370` | 0 | Blanco puro, máximo brillo |
| 🧘 Meditación | 200→75 (gradual) | `ct: 300→450` | — | 4 pasos de 3s cada uno |
| 🎮 Gaming | 120 | `hue: 43690, ct: 200` | 100 | Azul suave, no deslumbra |
| 🥤 Descanso / relax | 150 | ciclo azul→verde | 150 | 3 colores, 5s cada uno |

### 8.7. Integrar estos scripts

- **Botón en la UI**: exponer un endpoint propio en `server.js`
  (`app.post('/api/automations/:name', ...)`) que llame a la función
  correspondiente, y un botón en `public/` que haga `POST` a esa ruta.
- **Por horario (cron)**:
  ```bash
  npm install node-cron
  ```
  ```javascript
  import cron from 'node-cron';
  cron.schedule('0 7 * * *', () => sunriseAlarm(1, 30));   // 7:00 AM
  cron.schedule('0 23 * * *', () => setLight(1, { on: false })); // 23:00
  ```
- **Home Assistant** (vía `rest` platform):
  ```yaml
  light:
    - platform: rest
      name: "Hue Light 1"
      resource: http://localhost:3000/api/lights/1
      command_on:
        service: rest_command.hue_on
  rest_command:
    hue_on:
      url: "http://localhost:3000/api/lights/1/state"
      method: PUT
      payload: '{"on": true}'
      content_type: application/json
  ```
- **IFTTT / cualquier sistema externo**: apuntar un webhook a
  `POST http://<ip>:3000/api/automations/<nombre>`.

---

## 9. Docker

El proyecto incluye todo lo necesario para correr en contenedor. Todos los
archivos de Docker viven en la carpeta **`Docker/`** (excepto
`.dockerignore`, que por requisito técnico debe quedarse en la raíz — ver
nota en §4). El **contexto de build siempre es la raíz del proyecto**, nunca
`Docker/`, porque ahí están `server.js`, `public/` y `package.json`; por eso
todos los comandos pasan `-f Docker/Dockerfile` mientras el contexto sigue
siendo `.`.

### 9.1. Archivos incluidos

| Archivo | Rol |
|---|---|
| `Docker/Dockerfile` | Imagen simple, Node 24 Alpine, healthcheck incluido |
| `Docker/Dockerfile.prod` | Multi-stage, usuario no-root, `dumb-init`, imagen más chica |
| `Docker/docker-compose.yml` | Orquestación: puerto, env vars, healthcheck, red `hue-network`. `build.context: ..` + `build.dockerfile: Docker/Dockerfile` |
| `.dockerignore` (raíz) | Excluye `node_modules`, `.git`, `Docker/` (incluye el `.tar` exportado), etc. del build |
| `.env.docker` / `.env.docker.example` (raíz) | Variables para Docker |
| `Docker/docker-helper.ps1` / `Docker/docker-helper.sh` | Scripts con atajos (`up`, `logs`, `status`, `down`, `restart`, `shell`, `clean`, `reset`) — resuelven las rutas de `Dockerfile`/`docker-compose.yml`/`.env.docker` solas, se pueden invocar desde cualquier directorio |

### 9.2. Camino rápido — Docker Compose (recomendado)

```bash
cp .env.docker.example .env.docker
# editar .env.docker con HUE_BRIDGE_IP / HUE_USERNAME reales

docker-compose -f Docker/docker-compose.yml up -d
docker-compose -f Docker/docker-compose.yml logs -f          # ver logs
docker-compose -f Docker/docker-compose.yml ps               # estado / health
docker-compose -f Docker/docker-compose.yml down             # detener
docker-compose -f Docker/docker-compose.yml up -d --build    # reconstruir tras cambiar código
```

App disponible en `http://localhost:3000` (mapeo por defecto `3000:3000` en
`docker-compose.yml`). Todos los comandos de arriba se ejecutan **desde la
raíz del proyecto** (por eso el `-f Docker/docker-compose.yml`); si se
ejecutan parados dentro de `Docker/`, la ruta pasa a ser `-f
docker-compose.yml`.

### 9.3. Docker manual

```bash
# build (x86) — contexto "." = raíz, Dockerfile vive en Docker/
docker build -f Docker/Dockerfile -t philips-hue-controller:latest .

# build multi-arquitectura (incluye ARM, p.ej. Raspberry Pi)
docker buildx build --platform linux/amd64,linux/arm64 -f Docker/Dockerfile -t philips-hue:latest .
docker buildx build --platform linux/arm64 -f Docker/Dockerfile -t philips-hue:latest --load .

# ejecutar
docker run -d --name hue-controller -p 3000:3000 \
  -e HUE_BRIDGE_IP=192.168.1.100 \
  -e HUE_USERNAME=usuario_generado \
  --restart unless-stopped \
  philips-hue-controller:latest

docker logs -f hue-controller
docker stop hue-controller && docker rm hue-controller
```

### 9.4. Exportar la imagen como `.tar` (para transferir sin registry)

```bash
docker create --platform linux/arm64 --name philips-hue philips-hue
docker save -o philips-hue-arm64.tar philips-hue:latest
docker rm philips-hue
```

### 9.5. Helper scripts

Se pueden invocar desde cualquier carpeta — resuelven internamente las rutas
a `Docker/Dockerfile`, `Docker/docker-compose.yml` y al `.env.docker` de la
raíz:

```powershell
# Windows PowerShell (desde la raíz del proyecto)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\Docker\docker-helper.ps1 up | logs | status | restart | down | shell | clean | reset | help
```
```bash
# Linux/Mac (desde la raíz del proyecto)
chmod +x Docker/docker-helper.sh
./Docker/docker-helper.sh up|logs|status|restart|down|shell|clean|reset|help
```

### 9.6. Variables de entorno (Docker)

| Variable | Default | Requerida |
|---|---|---|
| `HUE_BRIDGE_IP` | `192.168.1.100` | Sí (o configurar luego desde la UI) |
| `HUE_USERNAME` | `newdeveloper` | Sí |
| `PORT` | `3000` | No |
| `NODE_ENV` | `production` | No |

### 9.7. Especificaciones de imagen

- Base: Node 24 Alpine.
- Tamaño: ~200-250 MB (`Dockerfile`) / ~180-220 MB (`Dockerfile.prod`).
- Memoria en ejecución: ~50-100 MB. Arranque: <5s.
- Healthcheck: `GET /health` cada 30s, timeout 10s, 3 reintentos.

### 9.8. Reverse proxy (NGINX) — opcional, para HTTPS/dominio propio

```nginx
server {
  listen 80;
  server_name hue.local;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
```

### 9.9. Troubleshooting Docker

| Problema | Solución |
|---|---|
| Contenedor no inicia | `docker logs hue-controller --tail 50` |
| "HUE_BRIDGE_IP no está configurada" | Pasar `-e HUE_BRIDGE_IP=...` o configurarlo luego vía UI (persiste en el volumen del contenedor) |
| No puede conectar al bridge | `docker exec hue-controller ping 192.168.1.100` — confirmar que el contenedor comparte red con el bridge |
| Puerto en uso | Cambiar el mapeo, ej. `-p 8080:3000` |

---

## 10. Seguridad y producción

### ✅ Ya implementado

- Credenciales fuera del código (`.env` / `config.json`, ambos ignorados por
  Git).
- CORS habilitado para desarrollo.
- Conexión al bridge siempre dentro de la LAN.
- El descubrimiento automático es la única llamada saliente a internet, y es
  opcional (se puede configurar todo manualmente).

### ⚠️ Recomendado antes de exponer fuera de la LAN

1. **Nunca** exponer el puerto directamente a internet sin más.
2. Agregar autenticación (JWT o API key) delante de `/api`:
   ```javascript
   const basicAuth = (req, res, next) => {
     const auth = req.headers.authorization;
     if (!auth || auth !== `Bearer ${process.env.API_KEY}`) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   };
   app.use('/api', basicAuth);
   ```
3. Usar HTTPS real (reverse proxy NGINX/Traefik + certificado válido), no el
   HTTP plano que usa el bridge en LAN.
4. Rate limiting:
   ```bash
   npm install express-rate-limit
   ```
   ```javascript
   import rateLimit from 'express-rate-limit';
   app.use('/api', rateLimit({ windowMs: 60_000, max: 100 }));
   ```
5. Si se usa Docker, preferir `Dockerfile.prod` (usuario no-root) y no subir
   la imagen a un registro público con credenciales embebidas (no debería
   haber ninguna, ya que se inyectan por variable de entorno).

### ⛔ Nunca

- Compartir o commitear `.env` / `config.json`.
- Exponer el puerto de la app directamente a internet sin autenticación.
- Usarla en redes públicas/no confiables sin VPN.

---

## 11. Checklist de instalación

- [ ] Node.js 24+ y npm instalados
- [ ] Bridge Hue conectado a la misma red que el servidor
- [ ] `npm install` sin errores
- [ ] IP del bridge localizada
- [ ] `npm run get-key` ejecutado, botón LINK presionado a tiempo
- [ ] `.env` contiene `HUE_BRIDGE_IP` y `HUE_USERNAME`
- [ ] `npm start` corre sin errores, banner de bienvenida visible
- [ ] `http://localhost:3000` carga la interfaz
- [ ] Indicador de estado dice "Conectado"
- [ ] Las 6 pestañas cargan datos (Luces, Grupos, Presets, Modos,
      Automatizaciones, Configuración)
- [ ] Se puede encender/apagar y cambiar color de una luz de prueba
- [ ] (Opcional) Acceso verificado desde un móvil en la misma red

### Pruebas rápidas de API (PowerShell)

```powershell
Invoke-WebRequest http://localhost:3000/api/lights

$body = @{ on = $true } | ConvertTo-Json
Invoke-WebRequest -Method PUT -Uri http://localhost:3000/api/lights/1/state `
  -ContentType 'application/json' -Body $body

Invoke-WebRequest http://localhost:3000/health
```

---

## 12. Solución de problemas (FAQ)

### Instalación

| Problema | Solución |
|---|---|
| `npm` no se reconoce como comando | Reinstalar Node.js desde nodejs.org marcando "Add to PATH" |
| No se obtiene el API key con `get-key` | Presionar el botón LINK **mientras** el script espera (ventana de ~30s); reintentar `npm run get-key` |
| Puerto en uso | Cambiar `PORT` en `.env`, o liberar el puerto: `Get-NetTCPConnection -LocalPort 3000 \| Stop-NetTCPConnection -Force` |
| Certificado SSL/TLS inválido | Normal en bridges Hue antiguos; la app ya lo maneja, no afecta funcionalidad |

### Conexión al bridge

| Problema | Solución |
|---|---|
| "Error al conectar con el bridge" | Verificar `HUE_BRIDGE_IP`; `ping <ip>`; confirmar misma red |
| "Usuario no autorizado" | Repetir `npm run get-key` para generar un username válido |
| Las luces no responden | Confirmar que el bridge está encendido; desconectarlo 30s y reintentar |
| "No se encontraron bridges" (descubrimiento) | Requiere internet; si no hay, usar configuración manual con la IP exacta |

### Preguntas frecuentes

- **¿Necesito internet?** No para el uso normal — todo el control es LAN.
  Solo el descubrimiento automático de bridges lo usa (opcional).
- **¿Compatible con mi Hue?** Gen 1 en adelante; probado en primera
  generación.
- **¿Puedo usarla junto a la app oficial de Philips Hue?** Sí, son
  complementarias.
- **¿Qué pasa si el bridge cambia de IP?** Se reconfigura desde la pestaña
  Configuración, sin tocar archivos ni reiniciar el servidor.
- **¿Puedo acceder desde el celular?** Sí, misma red, usando la IP del
  servidor.
- **¿Puedo integrar con Home Assistant?** Sí, ver §8.7.
- **¿Es seguro exponerla en internet?** No sin autenticación — ver §10.

---

## 13. Recursos y licencia

- Documentación oficial Philips Hue API: https://developers.meethue.com/
- Librería de conversión de color usada por el backend: `hue-colors` (npm).
- Licencia del proyecto: MIT — libre para uso personal y comercial.

---

*Este documento reemplaza y consolida: INDEX.md, INICIO.md, QUICKSTART.md,
CONFIGURACION_RAPIDA.md, INSTALL_WINDOWS.md, BRIDGE_CONFIGURATION.md,
CAMBIOS_CONFIGURACION.md, ADVANCED_CONFIG.md, API_REFERENCE.md,
AUTOMATIONS.md, CASOS_DE_USO.md, CHECKLIST.md, MEJORAS_COLOR.md,
RESUMEN_IMPLEMENTACION.md, SCENES_SCHEDULES.md, DOCKER_GUIDE.md,
DOCKER_QUICKSTART.md, DOCKER_COMMANDS.md y DOCKER_SETUP_SUMMARY.md.*
