#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

async function main() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     Philips Hue - Generador de API Key                    ║
║                                                            ║
║  Este script obtiene una API key autorizada del bridge    ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Verificar si .env ya existe
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const overwrite = await question('\n⚠️  El archivo .env ya existe. ¿Deseas sobrescribir? (s/n): ');
        if (overwrite.toLowerCase() !== 's') {
            console.log('Operación cancelada.');
            rl.close();
            return;
        }
    }

    // Obtener IP del bridge
    const bridgeIP = await question('\n🌐 Ingresa la IP de tu bridge Hue: ');
    
    if (!bridgeIP.match(/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)) {
        console.error('❌ IP inválida');
        rl.close();
        return;
    }

    console.log(`
📍 IP del Bridge: ${bridgeIP}

⏳ Esperando autorización...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 IMPORTANTE:
   1. Dirígete a tu bridge Hue físico
   2. Presiona el botón LINK (el botón en la parte superior)
   3. Tienes 30 segundos para presionarlo

Esperando...
    `);

    // Intentar obtener autorización
    let authorized = false;
    let username = '';
    let attempts = 0;
    const maxAttempts = 30; // 30 intentos (1 por segundo durante 30s)

    while (!authorized && attempts < maxAttempts) {
        attempts++;
        
        try {
            username = await generateUsername(bridgeIP);
            authorized = true;
            console.log('\n✅ ¡Autorizado!');
        } catch (error) {
            process.stdout.write('.');
            await sleep(1000);
        }
    }

    if (!authorized) {
        console.error('\n❌ No se pudo autorizar. Verifica que:');
        console.error('   - El bridge esté encendido');
        console.error('   - Hayas presionado el botón LINK');
        console.error('   - La IP sea correcta');
        rl.close();
        return;
    }

    // Guardar en .env
    const envContent = `# Configuración de Philips Hue
HUE_BRIDGE_IP=${bridgeIP}
HUE_USERNAME=${username}

# Puerto del servidor
PORT=3000
`;

    fs.writeFileSync(envPath, envContent);
    console.log(`
✅ Configuración guardada en .env

📋 Detalles:
   Bridge IP: ${bridgeIP}
   Username:  ${username}

🚀 Próximos pasos:
   1. npm install
   2. npm start
   3. Abre http://localhost:3000 en tu navegador

💡 Sugerencia: Guarda este username en un lugar seguro
    `);

    rl.close();
}

function generateUsername(bridgeIP) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            devicetype: "philips_hue_controller"
        });

        const options = {
            hostname: bridgeIP,
            port: 80,
            path: '/api',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            agent: new http.Agent({
                rejectUnauthorized: false
            })
        };

        const req = http.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    
                    // Verificar si hay error
                    if (response[0] && response[0].error) {
                        reject(new Error(response[0].error.description));
                    } else if (response[0] && response[0].success) {
                        resolve(response[0].success.username);
                    } else {
                        reject(new Error('Respuesta inesperada del bridge'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
