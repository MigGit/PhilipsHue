# 🔧 Configuración Avanzada

## Estructura del Proyecto Completo

```
PhilipHug/
├── server.js                 # Servidor Express principal
├── get-key.js               # Script para obtener API key
├── package.json             # Dependencias
├── .env                     # Variables de entorno (NO subir a Git)
├── .env.example             # Plantilla de configuración
├── .gitignore               # Archivos a ignorar en Git
│
├── public/                  # Archivos frontend
│   ├── index.html          # Página web principal
│   ├── styles.css          # Estilos CSS
│   └── app.js              # JavaScript del cliente
│
├── README.md                # Documentación general
├── QUICKSTART.md            # Guía rápida
├── INSTALL_WINDOWS.md       # Instalación en Windows
├── API_REFERENCE.md         # Referencia de API
└── AUTOMATIONS.md           # Ejemplos de automatizaciones
```

## Variables de Entorno (.env)

Archivo `.env` (crear manualmente copia de `.env.example`):

```bash
# ===== Bridge Hue =====
HUE_BRIDGE_IP=192.168.1.100
HUE_USERNAME=tu_usuario_generado

# ===== Servidor =====
PORT=3000

# ===== Desarrollo (opcional) =====
NODE_ENV=development
DEBUG=true
```

## Configuración del Servidor

### Puerto personalizado

Cambiar `.env`:
```
PORT=8080
```

### Modo producción

```bash
NODE_ENV=production npm start
```

## Endpoints Disponibles

### 🌐 Configuración

```
GET /health
├── Respuesta: { status: "OK", bridge: "192.168.1.100" }

GET /api/config
├── Información del bridge
└── Respuesta: { name, zigbeechannel, ipaddress, etc }
```

### 💡 Luces (Lights)

```
GET /api/lights
├── Obtener todas las luces
└── Respuesta: { "1": {...}, "2": {...}, ... }

GET /api/lights/:id
├── Información de una luz específica
└── Respuesta: { state, type, name, modelid, etc }

PUT /api/lights/:id/state
├── Cambiar estado de una luz
├── Body: { "on": true, "bri": 254, "hue": 0, "sat": 254 }
└── Respuesta: Array de cambios realizados
```

### 👥 Grupos (Groups)

```
GET /api/groups
├── Obtener todos los grupos
└── Respuesta: { "1": {...}, "2": {...}, ... }

PUT /api/groups/:id/action
├── Cambiar estado de un grupo
├── Body: { "on": true, "bri": 254, "hue": 0, "sat": 254 }
└── Respuesta: Array de cambios realizados
```

## Ejemplos de Peticiones

### Con curl

```bash
# Obtener todas las luces
curl http://localhost:3000/api/lights

# Encender luz 1
curl -X PUT http://localhost:3000/api/lights/1/state \
  -H "Content-Type: application/json" \
  -d '{"on": true}'

# Cambiar color luz 1 a rojo
curl -X PUT http://localhost:3000/api/lights/1/state \
  -H "Content-Type: application/json" \
  -d '{"hue": 0, "sat": 254, "bri": 254}'
```

### Con JavaScript/Fetch

```javascript
// Obtener luces
fetch('http://localhost:3000/api/lights')
  .then(r => r.json())
  .then(data => console.log(data));

// Encender luz
fetch('http://localhost:3000/api/lights/1/state', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ on: true, bri: 254 })
})
.then(r => r.json())
.then(data => console.log(data));
```

### Con Python

```python
import requests
import json

BASE_URL = "http://localhost:3000/api"

# Obtener lights
lights = requests.get(f"{BASE_URL}/lights").json()
print(lights)

# Encender luz 1
response = requests.put(
    f"{BASE_URL}/lights/1/state",
    headers={"Content-Type": "application/json"},
    data=json.dumps({"on": True, "bri": 254})
)
print(response.json())
```

## Integración con Home Assistant

Si usas Home Assistant, puedes integrar este servidor:

```yaml
# configuration.yaml
light:
  - platform: rest
    name: "Hue Light 1"
    resource: http://localhost:3000/api/lights/1
    command_on:
      service: rest_command.hue_on
    command_off:
      service: rest_command.hue_off

rest_command:
  hue_on:
    url: "http://localhost:3000/api/lights/1/state"
    method: PUT
    payload: '{"on": true}'
    content_type: application/json
    
  hue_off:
    url: "http://localhost:3000/api/lights/1/state"
    method: PUT
    payload: '{"on": false}'
    content_type: application/json
```

## Automatizaciones con Node-Cron

Instalar cron:
```bash
npm install node-cron
```

Crear `automations.js`:
```javascript
import cron from 'node-cron';

// Despertador a las 7:00 AM
cron.schedule('0 7 * * *', async () => {
  console.log('🌅 Despertador activado');
  
  // Iluminar lentamente
  for (let i = 1; i <= 254; i += 5) {
    await fetch('http://localhost:3000/api/lights/1/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on: true, bri: i })
    });
    await new Promise(r => setTimeout(r, 100));
  }
});

// Apagar luces a las 23:00
cron.schedule('0 23 * * *', async () => {
  console.log('🌙 Apagando luces');
  await fetch('http://localhost:3000/api/lights/1/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on: false })
  });
});
```

Iniciar con:
```bash
node automations.js &
npm start
```

## Seguridad

### ⚠️ Importante para producción

Este servidor está configurado para funcionar **en local**. Si quieres acceso remoto:

1. **Nunca expongas el puerto 3000 directamente a Internet**
2. **Usa un firewall**
3. **Añade autenticación** (JWT, API key, etc)
4. **Usa HTTPS/SSL**

Ejemplo con autenticación básica:

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

## Debugging

### Ver requests del servidor

En `server.js`, añadir:

```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

### Logs más detallados

Ejecutar con:
```bash
DEBUG=* npm start
```

## Performance

### Cachear respuestas

```javascript
const cache = new Map();

app.get('/api/lights', (req, res) => {
  if (cache.has('lights')) {
    return res.json(cache.get('lights'));
  }
  // ... obtener luces ...
});

// Actualizar caché cada 5 segundos
setInterval(async () => {
  const lights = await hueAPI.get('/lights');
  cache.set('lights', lights.data);
}, 5000);
```

### Limitar rate

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100 // 100 peticiones por minuto
});

app.use('/api', limiter);
```

## Proxying desde NGINX

Si quieres usar NGINX como reverse proxy:

```nginx
server {
  listen 80;
  server_name hue.local;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

¡Personaliza según tus necesidades! 🚀
