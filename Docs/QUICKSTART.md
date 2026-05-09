# 🚀 QUICKSTART - Primeros Pasos

## En 3 Pasos

### Paso 1: Preparar el Proyecto
```bash
npm install
```

### Paso 2: Obtener API Key
```bash
npm run get-key
```

**En la terminal:**
1. Ingresa la IP de tu bridge Hue (ej: 192.168.1.100)
2. Presiona el botón LINK (botón superior) en el bridge físico
3. El script generará automáticamente la configuración

### Paso 3: Iniciar la App
```bash
npm start
```

Abre en tu navegador: **http://localhost:3000**

---

## 🐛 Troubleshooting Rápido

### No puedo encontrar la IP del bridge
```bash
# En Windows PowerShell
Get-NetNeighbor | Where-Object {$_.State -eq "Reachable"} | Select-Object IPAddress, LinkLayerAddress
```

O accede a tu router y busca "Philips Hue Bridge"

### El script de get-key no funciona
- Asegúrate de que presiones el botón LINK **después** de ver el mensaje del script
- El botón está en la parte superior del bridge
- Tienes 30 segundos desde que presiones

### La web dice "Error al conectar"
- Verifica que la IP sea correcta: `ping 192.168.X.XXX`
- Vuelve a ejecutar `npm run get-key`
- Reinicia el bridge (desconecta durante 30 segundos)

---

## 📱 Usar desde otro dispositivo

Si quieres acceder desde otro defensa/móvil en tu red:

```
http://<IP_TU_COMPUTADORA>:3000
```

Ejemplo: `http://192.168.1.50:3000`

---

## 🎯 Próximos Pasos

- Explora la pestaña "Presets" para escenas rápidas
- Lee [API_REFERENCE.md](API_REFERENCE.md) para automatizaciones
- Personaliza los colores en [public/app.js](public/app.js)

---

¡Listo! Tu app de Hue está funcionando. 🎉
