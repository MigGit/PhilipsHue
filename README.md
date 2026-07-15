# 💡 Philips Hue Controller - First Generation

Web app para controlar tu Philips Hue de primera generación de forma local, sin depender del servidor de Philips.

## Características

✅ Control completo de luces individuales
✅ Control de grupos de luces
✅ Presets predefinidos (Brillante, Cálido, Frío, Película, Lectura, Noche)
✅ Control de brillo, color y saturación
✅ Interfaz web moderna y responsive
✅ Funcionamiento completamente local

## Requisitos

- Node.js 24+
- Philips Hue Bridge (Primera generación o posterior)
- Red local con acceso al bridge

## Instalación

### 1. Clonar o descargar el proyecto

```bash
cd d:\Desarrollo\IA\PhilipHug
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Encontrar la IP de tu Bridge Hue

En Windows, puedes usar:
```bash
ipconfig
```

O acceder a tu router y buscar "Philips Hue Bridge" en la lista de dispositivos conectados.

Alternativa: Visita https://discovery.meethue.com/

### 4. Obtener el API Username

Para conectarte al bridge, necesitas un API username. Ejecuta:

```bash
npm run get-key
```

Este script te guiará para obtener tu API key del bridge Hue.

**Pasos:**
1. Presiona el botón físico en la parte superior del bridge Hue
2. El script generará un username y lo guardará en `.env`

### 5. Configurar .env

Copia `.env.example` a `.env` y actualiza los valores:

```bash
cp .env.example .env
```

Edita `.env`:
```
HUE_BRIDGE_IP=192.168.X.XXX
HUE_USERNAME=usuario_generado
PORT=3000
```

**Nota:** Reemplaza `192.168.X.XXX` con la IP real de tu bridge.

### Creacion de Contenedor

Todo lo relacionado con Docker vive en la carpeta `Docker/` (Dockerfile,
docker-compose.yml, scripts helper). El contexto de build sigue siendo la
raíz del proyecto — se indica el Dockerfile con `-f`:

Crear la imagen 
```bash
# Compatible con X86
docker build -f Docker/Dockerfile -t philips-hue-controller:1.0.0 .
# Compatible con ARM
docker buildx build --platform linux/arm64 -f Docker/Dockerfile -t philips-hue:1.0.0 --load .
```

Crear entregable
```bash
# Compatible con X86
docker create --name philips-hue philips-hue:1.0.0
# Compatible con ARM
docker create --platform linux/arm64 --name philips-hue philips-hue:1.0.0
```

Extrae la imagen a tar
```bash
docker save -o ./Docker/philips-hue-arm64.tar philips-hue:1.0.0
```

Elimina entregable
```bash
docker rm philips-hue
docker rmi philips-hue
```

## Uso

### Iniciar el servidor local

```bash
npm start
```

O en modo desarrollo (con hot-reload):
```bash
npm run dev
```

### Iniciar el servidor Docker

```bash
docker run -p 3000:3000 philips-hue    
```

### Acceder a la interfaz

Abre tu navegador en: `http://localhost:3000`

## Interfaz

La app tiene tres pestañas principales:

### 🕯️ Luces
- Controla cada luz individualmente
- Enciende/apaga
- Ajusta brillo
- Personaliza color y saturación

### 👥 Grupos
- Controla grupos de luces
- Ajusta todas las luces de una estancia a la vez

### 🎨 Presets
Opciones predefinidas:
- ☀️ **Brillante**: Blanco máximo para trabajar
- 🔆 **Cálido**: Luz cálida para la tarde
- ❄️ **Frío**: Luz fría para concentrarse
- 🎬 **Película**: Iluminación ambiental baja
- 📖 **Lectura**: Luz blanca perfecta para leer
- 🌙 **Noche**: Luz tenue roja para la noche

## ⚙️ Configuración Dinámica del Bridge

La aplicación ahora incluye una pantalla de configuración completa para detectar y actualizar la IP del bridge automáticamente.

### 🔍 Búsqueda Automática
- Escanea tu red para encontrar todos los bridges Hue disponibles
- Muestra la IP de cada bridge detectado
- Guarda la configuración de forma persistente

### 🔧 Configuración Manual
- Ingresa manualmente la IP si conoces el bridge
- Valida la conexión antes de guardar
- Permite actualizar el username

### 📝 Almacenamiento Persistente
- La configuración se guarda en `config.json`
- Se carga automáticamente al reiniciar
- Compatible con variables de entorno

**Para más detalles:** Ver [BRIDGE_CONFIGURATION.md](Docs/BRIDGE_CONFIGURATION.md)

## API Endpoints

### Luces

```
GET  /api/lights              - Obtener todas las luces
GET  /api/lights/:id          - Obtener información de una luz
PUT  /api/lights/:id/state    - Cambiar estado de una luz
```

Body para PUT:
```json
{
  "on": true,
  "bri": 254,        // 0-254
  "hue": 0,          // 0-65535
  "sat": 254,        // 0-254
  "ct": 250          // 153-500 (temperatura de color)
}
```

### Grupos

```
GET  /api/groups              - Obtener todos los grupos
PUT  /api/groups/:id/action   - Cambiar estado del grupo
```

## Solución de problemas

### "Error al conectar con el bridge"
- Verifica que `HUE_BRIDGE_IP` sea correcto
- Asegúrate de que el bridge está en la red
- Intenta hacer ping: `ping 192.168.X.XXX`

### "Usuario no autorizado"
- Vuelve a ejecutar `npm run get-key`
- El script creará un nuevo username autorizado

### Las luces no responden
- Verifica que el bridge tiene acceso a internet (puede ser requerido para algunas operaciones)
- Reinicia el bridge (desconecta 30 segundos)

## Estructura del Proyecto

```
.
├── server.js              # Servidor Express principal
├── package.json           # Dependencias
├── .env                   # Configuración (crear desde .env.example)
├── .env.example           # Ejemplo de configuración
├── get-key.js             # Script para obtener API key
├── public/
│   ├── index.html         # Interfaz web
│   ├── styles.css         # Estilos
│   ├── api.js              # Comunicación común con el backend
│   ├── utils.js             # Utilidades compartidas
│   ├── app.js                # Shell: navegación entre tabs y arranque
│   ├── partials/               # HTML de cada tab
│   └── modules/                 # Lógica de cada tab (un módulo por feature)
├── .dockerignore          # Debe estar en la raíz (contexto de build), no en Docker/
└── Docker/                # Todo lo relacionado con Docker
    ├── Dockerfile
    ├── Dockerfile.prod
    ├── docker-compose.yml
    └── docker-helper.ps1 / docker-helper.sh
```

Documentación completa: [Docs/MANUAL_COMPLETO.md](Docs/MANUAL_COMPLETO.md)

## Notas

- Esta app funciona completamente en local y no envía datos a servidores externos
- Compatible con Philips Hue Gen 1+
- No interfiere con la app oficial de Philips Hue
- Ideal para automatización y casos de uso específicos

## Licencia

MIT

## Autor

Creado para MigSoft para uso Philips Hue 1.0.0

## Nota

En el directorio Docs están todos los prompt utilizados para generar la app