# 📚 Modos de Programación - Scenes y Schedules

## Descripción General

Tu aplicación Philips Hue ahora integra dos características avanzadas de la Generación 1 de Philips Hue:
- **Scenes (Modos)**: Guardar y reproducir configuraciones de luces
- **Schedules (Automatizaciones)**: Programar acciones automáticas por horario

## Scenes (Modos de Programación)

### ¿Qué son los Scenes?

Los Scenes son configuraciones guardadas del estado de tus luces. Puedes guardar cómo tienes configuradas tus luces (color, brillo, saturación) y reproducir esa configuración en cualquier momento con un solo clic.

### Características

✅ Guardar estado actual de luces seleccionadas
✅ Reproducir modos guardados al instante
✅ Seleccionar qué luces incluir en cada modo
✅ Eliminar modos que no uses
✅ Nombre personalizado para cada modo

### Cómo Usar

#### 1. Crear un Nuevo Modo

1. Configura tus luces como quieras (color, brillo, saturación)
2. Ve a la tab **"Modos"**
3. Clic en **"+ Guardar Modo Actual"**
4. Ingresa un nombre descriptivo (ej: "Cena romántica", "Trabajo", "Película")
5. Selecciona qué luces deseas que formen parte de este modo
6. Clic en **"✓ Guardar Modo"**

#### 2. Activar un Modo Guardado

1. Ve a la tab **"Modos"**
2. Busca el modo que deseas activar
3. Clic en el botón **"Activar"**
4. Las luces que incluye el modo se configurarán automáticamente

#### 3. Eliminar un Modo

1. Ve a la tab **"Modos"**
2. Busca el modo que deseas eliminar
3. Clic en el botón **"Eliminar"**
4. Confirma la eliminación

### Casos de Uso

- **Cena**: Luz cálida (3000K) al 80% de brillo
- **Película**: Rojo tenue al 30% de brillo
- **Trabajo**: Luz fría (6500K) al 100% de brillo
- **Lectura**: Blanco puro al 100% de brillo
- **Relajación**: Azul suave al 50% de brillo

## Schedules (Automatizaciones)

### ¿Qué son los Schedules?

Los Schedules te permiten programar acciones automáticas en horarios específicos. Por ejemplo, puedes programar que las luces se enciendan a las 7:00 AM o se apaguen a las 11:00 PM.

### Características

✅ Programar encendido/apagado automático
✅ Horarios específicos (formato 24h)
✅ Aplicar a luces individuales o grupos
✅ Descripción para cada automatización
✅ Editar y eliminar automatizaciones

### Cómo Usar

#### 1. Crear una Nueva Automatización

1. Ve a la tab **"Automatizaciones"**
2. Clic en **"+ Nueva Automatización"**
3. Completa los campos:
   - **Nombre**: Ej: "Encender luz mañana"
   - **Descripción** (opcional): Detalles adicionales
   - **Hora**: Selecciona la hora en formato 24h (ej: 09:00)
   - **Acción**: Encender o Apagar
   - **Objetivo**: Selecciona la luz o grupo de luces
4. Clic en **"✓ Crear Automatización"**

#### 2. Editar una Automatización

1. Ve a la tab **"Automatizaciones"**
2. Busca la automatización que deseas editar
3. Clic en **"Editar"**
4. Modifica los valores deseados
5. Clic en **"✓ Crear Automatización"** para guardar cambios

#### 3. Eliminar una Automatización

1. Ve a la tab **"Automatizaciones"**
2. Busca la automatización que deseas eliminar
3. Clic en **"Eliminar"**
4. Confirma la eliminación

### Casos de Uso

- **Encender a las 7:00 AM**: Para despertarte suavemente
- **Apagar a las 11:00 PM**: Antes de ir a dormir
- **Encender grupo "Salón" a las 18:00**: Al llegar de trabajar
- **Apagar "Oficina" a las 17:30**: Fin de la jornada laboral

## API REST

### Endpoints de Scenes

```javascript
// Obtener todos los scenes
GET /api/scenes

// Crear un nuevo scene
POST /api/scenes
{
  "name": "Nombre del modo",
  "lights": ["1", "2", "3"],
  "lightStates": {
    "1": { "on": true, "bri": 254, "hue": 0, "sat": 0 },
    "2": { "on": true, "bri": 200, "hue": 10000, "sat": 200 }
  }
}

// Actualizar un scene
PUT /api/scenes/:sceneId
{ "name": "Nuevo nombre" }

// Activar un scene
PUT /api/scenes/:sceneId/recall

// Eliminar un scene
DELETE /api/scenes/:sceneId
```

### Endpoints de Schedules

```javascript
// Obtener todos los schedules
GET /api/schedules

// Crear un nuevo schedule
POST /api/schedules
{
  "name": "Encender luz mañana",
  "description": "Encender la luz del salón",
  "command": {
    "address": "/api/lights/1/state",
    "body": { "on": true }
  },
  "time": "09:00",
  "autodelete": true
}

// Actualizar un schedule
PUT /api/schedules/:scheduleId
{ ... }

// Eliminar un schedule
DELETE /api/schedules/:scheduleId
```

## Ejemplos Prácticos

### Ejemplo 1: Crear un modo "Trabajo"

1. Ajusta todas tus luces a:
   - Brillo: 100% (254)
   - Color: Blanco frío (hue: 45000, sat: 0)
2. Ve a **Modos** → **+ Guardar Modo Actual**
3. Nombre: "Trabajo"
4. Selecciona todas las luces
5. Guarda

Resultado: Siempre que necesites luz para trabajar, solo activa este modo.

### Ejemplo 2: Rutina Matutina Automática

1. Ve a **Automatizaciones** → **+ Nueva Automatización**
2. Nombre: "Despertar"
3. Hora: 07:00
4. Acción: Encender
5. Objetivo: Salón (o grupo con todas las luces)
6. Guarda

Resultado: Todas las luces principales se encenderán a las 7 AM automáticamente.

### Ejemplo 3: Modo Película + Automatización

1. Crea un modo "Película" con luces tenues y rojas
2. Crea una automatización para activar automáticamente a las 20:00
3. Crea otra automatización para desactivar a las 23:00

Resultado: Tu hogar se prepara automáticamente para el cine cada noche.

## Limitaciones y Consideraciones

- Los schedules necesitan que el bridge esté encendido para ejecutarse
- Las automatizaciones se repiten diariamente en el horario especificado
- Asegúrate de que el bridge tenga conexión de red estable
- Los Scenes se guardan en el bridge, así que persisten entre reinicios

## Solución de Problemas

### "Error al guardar el modo"
- Verifica que el bridge está conectado
- intenta seleccionar al menos una luz
- Asegúrate de que el nombre no está vacío

### "Automatización no se ejecuta"
- Verifica que el bridge está encendido
- Comprueba la hora en formato 24h
- Intenta eliminar y recrear la automatización

### Las luces no cambian al activar un modo
- Verifica la conexión al bridge
- Intenta actualizar la página (F5)
- Comprueba que las luces están encendidas
