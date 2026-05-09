// EJEMPLOS DE AUTOMATIZACIONES - Philips Hue Controller

// ============================================
// 1. DESPERTADOR SIMULADO (Sunrise Alarm)
// ============================================

async function sunriseAlarm(lightId, durationMinutes = 30) {
    const steps = 60; // 60 pasos para suavidad
    const stepDuration = (durationMinutes * 60000) / steps;
    
    const startBri = 1;
    const endBri = 254;
    const briStep = (endBri - startBri) / steps;
    
    console.log(`🌅 Iniciando alarma de amanecer por ${durationMinutes} minutos...`);
    
    for (let i = 0; i <= steps; i++) {
        const brightness = Math.round(startBri + (briStep * i));
        
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                on: true,
                bri: brightness,
                ct: 370  // Cálido para la mañana
            })
        });
        
        await sleep(stepDuration);
    }
    
    console.log('✅ Amanecer completado');
}

// Uso:
// sunriseAlarm(1, 30).catch(console.error);


// ============================================
// 2. CICLO DE TRABAJO (Pomodoro Timer)
// ============================================

async function pomodoroTimer(lightId, workMinutes = 25, breakMinutes = 5) {
    // Luz de trabajo: blanca y brillante
    const workColor = {
        on: true,
        bri: 254,
        ct: 200  // Blanco frío para concentración
    };
    
    // Luz de descanso: cálida y moderada
    const breakColor = {
        on: true,
        bri: 150,
        ct: 400  // Blanco cálido
    };
    
    while (true) {
        // Sesión de trabajo
        console.log(`⏱️  Sesión de trabajo: ${workMinutes}m`);
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workColor)
        });
        
        await sleep(workMinutes * 60000);
        
        // Descanso
        console.log(`☕ Descanso: ${breakMinutes}m`);
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(breakColor)
        });
        
        await sleep(breakMinutes * 60000);
    }
}

// Uso:
// pomodoroTimer(1, 25, 5).catch(console.error);


// ============================================
// 3. ATMÓSFERA DINÁMICA - Cambio de color
// ============================================

async function dynamicMood(lightId, mood = 'calm', duration = 300000) {
    const moods = {
        calm: [
            { hue: 43690, sat: 100, bri: 150 },    // Azul
            { hue: 39000, sat: 150, bri: 130 },    // Azul-verde
            { hue: 34000, sat: 120, bri: 140 }     // Verde
        ],
        energetic: [
            { hue: 0, sat: 254, bri: 254 },        // Rojo
            { hue: 12000, sat: 200, bri: 220 },    // Naranja
            { hue: 7000, sat: 150, bri: 240 }      // Amarillo
        ],
        romantic: [
            { hue: 0, sat: 254, bri: 100 },        // Rojo tenue
            { hue: 350, sat: 230, bri: 120 },      // Rosa
            { hue: 280, sat: 180, bri: 80 }        // Púrpura tenue
        ]
    };
    
    const colors = moods[mood] || moods.calm;
    const stepDuration = duration / colors.length;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
        for (const color of colors) {
            await fetch(`/api/lights/${lightId}/state`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...color, on: true })
            });
            
            await sleep(stepDuration / colors.length);
        }
    }
}

// Uso:
// dynamicMood(1, 'calm', 600000);      // 10 minutos modo calmado
// dynamicMood(2, 'energetic', 300000);  // 5 minutos modo energético


// ============================================
// 4. SINCRONIZACIÓN CON MÚSICA (Simulado)
// ============================================

async function musicSync(lightId, beats = []) {
    for (const beat of beats) {
        const [duration, hue] = beat;
        
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                on: true,
                hue: hue,
                sat: 254,
                bri: 254
            })
        });
        
        await sleep(duration);
    }
}

// Uso:
// const beatPattern = [
//     [500, 0],      // 500ms rojo
//     [500, 21845],  // 500ms verde
//     [500, 43690],  // 500ms azul
//     [500, 0]       // 500ms rojo
// ];
// musicSync(1, beatPattern).catch(console.error);


// ============================================
// 5. MODO CINE (Dimming progresivo)
// ============================================

async function movieMode(lightId, duration = 3000) {
    console.log('🎬 Iniciando modo cine...');
    
    // Bajar lentamente las luces hasta apagar
    const steps = 30;
    const stepDuration = duration / steps;
    
    // Primero cambiar a rojo oscuro (para no perder la vista)
    await fetch(`/api/lights/${lightId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            on: true,
            hue: 0,
            sat: 254,
            bri: 150
        })
    });
    
    // Luego bajar el brillo gradualmente
    for (let i = 150; i >= 1; i -= (150 / steps)) {
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                on: true,
                hue: 0,
                sat: 254,
                bri: Math.round(i)
            })
        });
        
        await sleep(stepDuration);
    }
    
    // Apagar completamente
    await fetch(`/api/lights/${lightId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: false })
    });
    
    console.log('✅ Modo cine iniciado');
}

// Uso:
// movieMode(1, 5000).catch(console.error);  // 5 segundos para dimming


// ============================================
// 6. CICLO CIRCADIANO (Ajuste según hora)
// ============================================

async function circadianRhythm(lightId, checkIntervalMinutes = 60) {
    const getColorForHour = (hour) => {
        if (hour >= 6 && hour < 10) {
            // Mañana: Blanco cálido y brillante
            return { bri: 254, ct: 250, name: 'Morning' };
        } else if (hour >= 10 && hour < 14) {
            // Mediodía: Blanco neutral
            return { bri: 254, ct: 370, name: 'Noon' };
        } else if (hour >= 14 && hour < 18) {
            // Tarde: Blanco cálido
            return { bri: 220, ct: 350, name: 'Afternoon' };
        } else if (hour >= 18 && hour < 21) {
            // Atardecer: Muy cálido
            return { bri: 150, ct: 400, name: 'Evening' };
        } else {
            // Noche: Muy tenue y rojo
            return { bri: 50, ct: 500, name: 'Night' };
        }
    };
    
    while (true) {
        const hour = new Date().getHours();
        const color = getColorForHour(hour);
        
        console.log(`🕐 Ajustando luz para ${color.name} (hora: ${hour})`);
        
        await fetch(`/api/lights/${lightId}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                on: true,
                bri: color.bri,
                ct: color.ct
            })
        });
        
        await sleep(checkIntervalMinutes * 60000);
    }
}

// Uso:
// circadianRhythm(1, 30).catch(console.error);  // Verificar cada 30 minutos


// ============================================
// 7. ALARMA INTELIGENTE (Despertador)
// ============================================

async function smartAlarm(lightId, alarmTime = '07:00', durationMinutes = 20) {
    const checkInterval = 60000; // Verificar cada minuto
    
    while (true) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentTime === alarmTime) {
            console.log(`🚨 ¡Alarma activada! ${alarmTime}`);
            await sunriseAlarm(lightId, durationMinutes);
            return;
        }
        
        await sleep(checkInterval);
    }
}

// Uso:
// smartAlarm(1, '07:30', 25).catch(console.error);


// ============================================
// FUNCIÓN AUXILIAR
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================================
// CÓMO USAR ESTOS EJEMPLOS
// ============================================

/*
1. INTEGRAR EN EL SERVIDOR:
   - Importa estas funciones en server.js
   - Crea endpoints para activarlas
   
   Ejemplo:
   
   import { sunriseAlarm } from './automations.js';
   
   app.post('/api/automations/sunrise', async (req, res) => {
       const { lightId, duration } = req.body;
       sunriseAlarm(lightId, duration).catch(console.error);
       res.json({ status: 'started' });
   });

2. USAR DESDE CRON:
   - Instala 'node-cron': npm install node-cron
   - Configura automatizaciones para horas específicas
   
   Ejemplo:
   
   import cron from 'node-cron';
   
   // Ejecutar a las 7:00 AM todos los días
   cron.schedule('0 7 * * *', () => {
       sunriseAlarm(1, 30);
   });

3. PERSONALIZAR:
   - Ajusta colores, duraciones y valores según tu hogar
   - Combina funciones para crear escenas complejas

*/
