# ✅ Checklist de Instalación

Use este checklist para verificar que todo esté correctamente configurado.

## 1️⃣ Requisitos Previos

- [ ] Node.js 24+ instalado (`node --version`)
- [ ] npm 10+ instalado (`npm --version`)
- [ ] Philips Hue Bridge conectado a la red
- [ ] Computadora en la misma red que el bridge

## 2️⃣ Instalación Inicial

- [ ] Clonar/descargar el proyecto
- [ ] Navegar a `d:\Desarrollo\IA\PhilipHug`
- [ ] Ejecutar `npm install` sin errores
- [ ] Archivo `package-lock.json` creado

## 3️⃣ Configuración del Bridge

- [ ] Encontrar la IP del bridge (ej: 192.168.1.100)
- [ ] Ejecutar `npm run get-key`
- [ ] Ingresar IP del bridge cuando se pida
- [ ] Presionar botón LINK en el bridge físico
- [ ] Script genera archivo `.env`
- [ ] Verificar que `.env` contiene `HUE_BRIDGE_IP` y `HUE_USERNAME`

## 4️⃣ Iniciar el Servidor

- [ ] Ejecutar `npm start`
- [ ] Ver mensaje de bienvenida
- [ ] Servidor ejecutándose en puerto 3000
- [ ] No hay errores en la consola

## 5️⃣ Verificar Conexión

- [ ] Abrir navegador en `http://localhost:3000`
- [ ] Cargar la interfaz web
- [ ] Botón de estado muestra "Conectado"
- [ ] Se cargan las luces o grupos disponibles

## 6️⃣ Probar Funcionalidades

### Control Básico
- [ ] Ver lista de luces
- [ ] Ver lista de grupos
- [ ] Ver pestaña de presets

### Control de Luces
- [ ] Hacer click en una luz
- [ ] Modal de control abre
- [ ] Ajustar brillo funciona
- [ ] Cambiar color funciona
- [ ] Cerrar modal funciona

### Presets
- [ ] Click en preset "Brillante"
- [ ] Luces responden
- [ ] Click en preset "Apagar Todo"
- [ ] Todas las luces se apagan

## 7️⃣ API Testing (Opcional)

```powershell
# Desde PowerShell:

# Test 1: Obtener todas las luces
Invoke-WebRequest http://localhost:3000/api/lights

# Test 2: Encender una luz
$body = @{ on = $true } | ConvertTo-Json
Invoke-WebRequest -Method PUT -Uri http://localhost:3000/api/lights/1/state `
  -ContentType 'application/json' -Body $body

# Test 3: Verificar estado
Invoke-WebRequest http://localhost:3000/health
```

## 8️⃣ Acceso desde Otro Dispositivo (Opcional)

- [ ] Obtener IP de tu PC (`ipconfig`)
- [ ] Abrir en móvil/tablet: `http://<IP_TU_PC>:3000`
- [ ] Interfaz funciona correctamente

## 9️⃣ Troubleshooting

Si algo no funciona:

- [ ] Verificar que `.env` existe y tiene contenido
- [ ] Hacer ping al bridge: `ping 192.168.1.100`
- [ ] Revisar logs del servidor en la consola
- [ ] Intentar `npm run get-key` de nuevo
- [ ] Reiniciar el servidor (`Ctrl+C` y `npm start`)
- [ ] Verificar que puerto 3000 no está en uso

## 🔟 Documentación

- [ ] Leer [QUICKSTART.md](QUICKSTART.md)
- [ ] Revisar [API_REFERENCE.md](API_REFERENCE.md) para integraciones
- [ ] Explorar [AUTOMATIONS.md](AUTOMATIONS.md) para ideas

---

## ✨ Checklist de Desarrollo

Si quieres modificar el código:

- [ ] Entender estructura de `server.js`
- [ ] Conocer endpoints disponibles
- [ ] Saber dónde están los estilos (`public/styles.css`)
- [ ] Saber dónde está la lógica frontend (`public/app.js`)
- [ ] Usar `npm run dev` para hot-reload

---

## 🚀 Próximos Pasos

Cuando todo funciona:

1. [ ] Personalizar nombres de presets
2. [ ] Añadir más automatizaciones
3. [ ] Integrar con otras aplicaciones
4. [ ] Configurar en múltiples dispositivos

---

## 📝 Notas Personales

Aquí puedes escribir tus notas:

```
IP del Bridge: _______________
Username: ____________________
Número de luces: _____________
Número de grupos: ____________
Notas adicionales:
___________________________
___________________________
```

---

**Si todo está marcado ✅, ¡tu Philips Hue Controller está listo para usar!** 🎉
