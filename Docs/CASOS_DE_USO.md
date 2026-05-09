# 💡 Casos de Uso Prácticos

Ejemplos reales de cómo usar el Philips Hue Controller en tu hogar.

## 🌅 Escenario 1: Despertador Inteligente

**Problema:** Despertarse es difícil cuando está oscuro.

**Solución:** Encender luces gradualmente 30 minutos antes de despertarse.

```javascript
// Agregar a server.js
app.post('/api/automations/wake-up', async (req, res) => {
  const { lightId } = req.body;
  console.log('🌅 Despertador iniciado');
  
  // Aumentar brillo gradualmente
  for (let bri = 1; bri <= 254; bri += 2) {
    await fetch(`/api/lights/${lightId}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        on: true,
        bri: bri,
        ct: 350  // Color cálido
      })
    });
    await new Promise(r => setTimeout(r, 1000)); // 1 seg entre pasos
  }
  res.json({ status: 'complete' });
});
```

**Uso:** Llamar desde cualquier lugar:
```
POST http://localhost:3000/api/automations/wake-up
Body: { "lightId": "1" }
```

---

## 🎯 Escenario 2: Modo Concentración

**Problema:** Necesitas luz perfecta para trabajar sin distracciones.

**Solución:** Luz blanca neutra que reduce los cambios de color.

```javascript
app.post('/api/automations/focus', async (req, res) => {
  // Luz óptima para concentración
  await fetch(`/api/lights/1/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      on: true,
      bri: 254,           // Máximo brillo
      ct: 250,            // Blanco frío
      effect: 'none'      // Sin efectos
    })
  });
  res.json({ status: 'focus-mode-activated' });
});
```

---

## 🛋️ Escenario 3: Cine en Casa

**Problema:** Las luces deben apagarse suavemente sin deslumbrarte.

**Solución:** Apagado gradual que prepara tus ojos.

```javascript
app.post('/api/automations/movie-time', async (req, res) => {
  const steps = 20;
  
  // 1. Cambiar a rojo oscuro
  await fetch(`/api/lights/1/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      on: true,
      hue: 0,           // Rojo
      sat: 254,
      bri: 100
    })
  });
  
  // 2. Bajar gradualmente el brillo
  for (let bri = 100; bri >= 1; bri -= (100 / steps)) {
    await fetch(`/api/lights/1/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on: true, bri: Math.round(bri) })
    });
    await new Promise(r => setTimeout(r, 500));
  }
  
  await fetch(`/api/lights/1/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on: false })
  });
  
  res.json({ status: 'movie-mode' });
});
```

---

## 🌙 Escenario 4: Modo Nocturno

**Problema:** Luz normal despierta a tu pareja/familia.

**Solución:** Luz roja muy tenue que no afecta el ciclo de sueño.

```javascript
app.post('/api/automations/night-mode', async (req, res) => {
  await fetch(`/api/lights/1/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      on: true,
      hue: 0,         // Rojo puro
      sat: 254,       // Saturación máxima
      bri: 50         // Brillo mínimo
    })
  });
  res.json({ status: 'night-mode' });
});
```

---

## 👨‍💼 Escenario 5: Videoconferencia

**Problema:** Necesitas iluminación profesional para videollamadas.

**Solución:** Luz frontal uniforme que te ilumina correctamente.

```javascript
app.post('/api/automations/video-call', async (req, res) => {
  // Luz blanca frontal ideal para cámara
  await fetch(`/api/lights/1/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      on: true,
      bri: 240,       // Casi máximo (no deslumbra cámara)
      ct: 300,        // Blanco neutral
      effect: 'none'
    })
  });
  
  // Apagar otras luces para menos sombras
  await fetch(`/api/lights/2/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on: false })
  });
  
  res.json({ status: 'video-mode' });
});
```

---

## 📚 Escenario 6: Lectura

**Problema:** Leer con mala iluminación causa fatiga ocular.

**Solución:** Brillo máximo con color cálido-neutro.

```javascript
app.post('/api/automations/reading', async (req, res) => {
  await fetch(`/api/lights/1/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      on: true,
      bri: 254,       // Máximo brillo
      sat: 0,         // Sin color (blanco puro)
      ct: 370         // Ligeramente cálido
    })
  });
  res.json({ status: 'reading-mode' });
});
```

---

## 🥤 Escenario 7: Descanso de Café

**Problema:** Necesitas una pausa mental.

**Solución:** Colores relajantes y brillo moderado.

```javascript
app.post('/api/automations/relax', async (req, res) => {
  const relaxingColors = [
    { hue: 43690, name: 'Azul' },      // Azul puro
    { hue: 39000, name: 'Azul-Verde' },
    { hue: 34000, name: 'Verde' }
  ];
  
  // Ciclo suave de colores relajantes
  for (let i = 0; i < 3; i++) {
    const color = relaxingColors[i];
    
    await fetch(`/api/lights/1/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        on: true,
        hue: color.hue,
        sat: 150,
        bri: 150
      })
    });
    
    await new Promise(r => setTimeout(r, 5000)); // 5 segundos cada color
  }
  
  res.json({ status: 'relax-mode' });
});
```

---

## 🎮 Escenario 8: Gaming

**Problema:** Jugar con mala iluminación causa fatiga, pero falta visibilidad.

**Solución:** Luz azul que no distrae pero mantiene visibilidad.

```javascript
app.post('/api/automations/gaming', async (req, res) => {
  await fetch(`/api/lights/1/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      on: true,
      hue: 43690,     // Azul puro
      sat: 100,       // Saturación moderada
      bri: 120,       // No deslumbra
      ct: 200         // Tono frío
    })
  });
  res.json({ status: 'gaming-mode' });
});
```

---

## 🧘 Escenario 9: Meditación

**Problema:** Necesitas ambiente que favorezca la relajación.

**Solución:** Transición suave a colores cálidos tenues.

```javascript
app.post('/api/automations/meditation', async (req, res) => {
  // Transición gradual a luz cálida tenue
  const colors = [
    { bri: 200, ct: 300 },
    { bri: 150, ct: 350 },
    { bri: 100, ct: 400 },
    { bri: 75, ct: 450 }
  ];
  
  for (const color of colors) {
    await fetch(`/api/lights/1/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        on: true,
        bri: color.bri,
        ct: color.ct
      })
    });
    
    await new Promise(r => setTimeout(r, 3000)); // 3 seg cada transición
  }
  
  res.json({ status: 'meditation-mode' });
});
```

---

## 🎨 Escenario 10: Fiesta/Celebración

**Problema:** Quieres una atmósfera festiva.

**Solución:** Cambio dinámico de colores.

```javascript
app.post('/api/automations/party', async (req, res) => {
  const colors = [
    { hue: 0, name: 'Rojo' },
    { hue: 7000, name: 'Amarillo' },
    { hue: 21845, name: 'Verde' },
    { hue: 43690, name: 'Azul' },
    { hue: 60000, name: 'Púrpura' }
  ];
  
  // Ciclo de colores rápido
  const duration = 30000; // 30 segundos total
  const colorTime = duration / colors.length;
  
  const startTime = Date.now();
  while (Date.now() - startTime < duration) {
    for (const color of colors) {
      await fetch(`/api/lights/1/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on: true,
          hue: color.hue,
          sat: 254,
          bri: 254,
          effect: 'colorloop'
        })
      });
      
      await new Promise(r => setTimeout(r, colorTime / colors.length));
    }
  }
  
  res.json({ status: 'party-mode' });
});
```

---

## 📞 Cómo Integrar en tu App

### Opción 1: Botones en la Web UI

Añadir en `public/index.html`:
```html
<button onclick="activateScenario('wake-up')">🌅 Despertador</button>
<button onclick="activateScenario('focus')">🎯 Concentración</button>
<button onclick="activateScenario('movie')">🎬 Cine</button>
```

Añadir en `public/app.js`:
```javascript
async function activateScenario(scenario) {
  const response = await fetch(`/api/automations/${scenario}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lightId: 1 })
  });
  const data = await response.json();
  console.log(`✅ ${scenario}:`, data);
}
```

### Opción 2: Programado por Hora

Instalar `node-cron`:
```bash
npm install node-cron
```

Crear `cron-automations.js`:
```javascript
import cron from 'node-cron';

// 7:00 AM - Despertador
cron.schedule('0 7 * * *', async () => {
  await activateScenario('wake-up');
});

// 9:00 AM - Modo concentración
cron.schedule('0 9 * * *', async () => {
  await activateScenario('focus');
});

// 18:00 - Relax
cron.schedule('0 18 * * *', async () => {
  await activateScenario('relax');
});

// 22:00 - Modo nocturno
cron.schedule('0 22 * * *', async () => {
  await activateScenario('night-mode');
});
```

### Opción 3: Integración IFTTT/Home Assistant

Exponer endpoint y usar en automatizaciones:
```
POST http://tu-ip:3000/api/automations/{scenario}
```

---

## 🎯 Mi Rutina Ideal

Aquí una ejemplo de rutina diaria personalizada:

```
06:00 - Despertador suave (gradual)
07:00 - Luz cálida para ducharse
08:00 - Blanco frío para desayuno
09:00 - Modo concentración para trabajo
12:00 - Descanso visual (relax mode)
14:00 - Blanco neutro para tarde
18:00 - Luz cálida al atardecer
20:00 - Reducir brillo (relax)
22:00 - Modo nocturno
00:00 - Apagar
```

¡Personaliza según tu rutina! 🌟
