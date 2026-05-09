# 📚 Documentación Técnica - API Philips Hue

## Parámetros de Control de Luces

### Estado de Luz (Light State)

| Parámetro | Tipo | Rango | Descripción |
|-----------|------|-------|-------------|
| `on` | Boolean | true/false | Enciende o apaga la luz |
| `bri` | Integer | 0-254 | Brillo (0=apagado, 254=máximo) |
| `hue` | Integer | 0-65535 | Color (rueda de color) |
| `sat` | Integer | 0-254 | Saturación (0=blanco, 254=color puro) |
| `ct` | Integer | 153-500 | Temperatura de color en mired |
| `effect` | String | "none", "colorloop" | Efectos especiales |
| `bri_inc` | Integer | -254 a 254 | Incremento de brillo (relativo) |
| `hue_inc` | Integer | -65535 a 65535 | Incremento de color (relativo) |
| `sat_inc` | Integer | -254 a 254 | Incremento de saturación (relativo) |
| `ct_inc` | Integer | -65355 a 65355 | Incremento de temperatura (relativo) |

### Valores de Temperatura de Color (CT)

```
153 mired  = 6535K  (Luz muy fría - Azul)
200 mired  = 5000K  (Luz fría - Blanco frío)
370 mired  = 2700K  (Luz cálida - Incandescente)
500 mired  = 2000K  (Luz muy cálida - Roja)
```

Conversión: K = 1000000 / mired

### Valores de Hue (Color)

```
0°      = Rojo
60°     = Amarillo
120°    = Verde
180°    = Cian
240°    = Azul
300°    = Magenta
```

Hue de Philips (0-65535) = Grados × 182.04

## Ejemplos de Uso

### Encender/Apagar
```javascript
// Encender
PUT /api/lights/1/state
{ "on": true }

// Apagar
PUT /api/lights/1/state
{ "on": false }
```

### Ajustar Brillo
```javascript
// 50% de brillo
PUT /api/lights/1/state
{ "bri": 127 }

// Máximo brillo
PUT /api/lights/1/state
{ "bri": 254 }
```

### Cambiar Color
```javascript
// Rojo puro
PUT /api/lights/1/state
{ "on": true, "hue": 0, "sat": 254, "bri": 254 }

// Verde puro
PUT /api/lights/1/state
{ "on": true, "hue": 21845, "sat": 254, "bri": 254 }

// Azul puro
PUT /api/lights/1/state
{ "on": true, "hue": 43690, "sat": 254, "bri": 254 }
```

### Blanco Cálido
```javascript
PUT /api/lights/1/state
{
  "on": true,
  "bri": 200,
  "ct": 370
}
```

### Blanco Frío
```javascript
PUT /api/lights/1/state
{
  "on": true,
  "bri": 200,
  "ct": 200
}
```

### Efecto Color Loop
```javascript
PUT /api/lights/1/state
{
  "effect": "colorloop",
  "bri": 254
}
```

## Estructura de Respuesta

### Respuesta de luz individual
```json
{
  "state": {
    "on": true,
    "bri": 200,
    "hue": 10000,
    "sat": 200,
    "ct": 370,
    "xy": [0.3127, 0.3291],
    "effect": "none",
    "colormode": "hs",
    "reachable": true
  },
  "type": "Color light",
  "name": "Luz Salón",
  "modelid": "LCL001",
  "manufacturername": "Philips",
  "swversion": "66012658"
}
```

### Respuesta de grupo
```json
{
  "action": {
    "on": true,
    "bri": 200,
    "hue": 10000,
    "sat": 200,
    "ct": 370,
    "effect": "none",
    "colormode": "hs"
  },
  "lights": ["1", "2", "3"],
  "type": "Room",
  "name": "Salón",
  "class": "Living room"
}
```

## Límites y Consideraciones

- **Brillo (bri)**: El rango es 0-254, pero muchas luces no apagan completamente en 0, algunos luces mínimo es 1
- **Velocidad**: Las transiciones máximas están limitadas a 900 (9 segundos)
- **Colores**: No todos los colores XY son posibles en todas las luces
- **Temperatura**: Solo disponible en luces con soporte CT

## Códigos de Error

| Código | Significado |
|--------|------------|
| 1 | No autorizado |
| 2 | Parámetro inválido |
| 3 | Recurso no disponible |
| 4 | Método no permitido |
| 5 | Recurso no disponible para POST |
| 6 | Parámetros faltantes |
| 7 | Parámetro ilegal |
| 8 | Tipo no soportado |
| 901 | Error interno |

## Ejemplo: Control Avanzado

```javascript
// Script para hacer transición suave
const transitionColor = async (lightId, hueStart, hueEnd, steps = 10, delayMs = 100) => {
  const hueStep = (hueEnd - hueStart) / steps;
  
  for (let i = 0; i <= steps; i++) {
    const hue = Math.round(hueStart + (hueStep * i));
    
    await fetch(`/api/lights/${lightId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hue: hue,
        sat: 254,
        bri: 254
      })
    });
    
    await new Promise(r => setTimeout(r, delayMs));
  }
};

// Uso: Transición de rojo a azul
await transitionColor(1, 0, 43690, 20, 200);
```

## Recursos Útiles

- [Documentación oficial Philips Hue API](https://developers.meethue.com/)
- [Calculadora de colores Hue](https://the8bit.io/hue-colors/)
- [Herramienta de experimentación API](https://philips-hue-api.herokuapp.com/)
