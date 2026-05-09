# 💻 Instalación en Windows

## Requisitos Previos

- ✅ Windows 10/11
- ✅ Node.js 24+ (descarga desde https://nodejs.org/)
- ✅ Philips Hue Bridge Gen 1+
- ✅ Acceso a la red local

## Paso 1: Verificar Node.js

Abre PowerShell y verifica que node esté instalado:

```powershell
node --version
npm --version
```

Deberías ver versiones como `v24.x.x` y `10.x.x`

## Paso 2: Navegar al Proyecto

```powershell
cd d:\Desarrollo\IA\PhilipHug
```

## Paso 3: Instalar Dependencias

```powershell
npm install
```

Se instalarán automáticamente:
- `express` - Servidor web
- `axios` - Cliente HTTP
- `cors` - Permitir peticiones cruzadas
- `dotenv` - Variables de entorno

## Paso 4: Obtener las Credenciales del Bridge

```powershell
npm run get-key
```

**Instrucciones:**

1. El script te preguntará por la IP del bridge
2. Ingresa la IP (ej: `192.168.1.100`)
3. **Presiona el botón LINK en tu bridge Hue físico** (botón superior, junto a la antena)
4. El script generará automáticamente el archivo `.env`

> ⏱️ **Importante:** Presiona el botón cuando el script está en la pantalla de espera. Tienes 30 segundos.

## Paso 5: Iniciar la Aplicación

```powershell
npm start
```

Verás un mensaje como:
```
╔════════════════════════════════════════╗
║   🏠 Philips Hue Controller - v1.0     ║
║   Running on: http://localhost:3000    ║
║   Bridge IP: 192.168.X.XXX             ║
╚════════════════════════════════════════╝
```

## Paso 6: Acceder a la Web App

Abre en tu navegador:
```
http://localhost:3000
```

¡Listo! Deberías ver tu lista de luces.

---

## Encontrar la IP del Bridge

### Método 1: Router
1. Abre la configuración de tu router
2. Ve a "Dispositivos conectados"
3. Busca "Philips Hue Bridge"
4. Anota su IP

### Método 2: Descubrimiento Automático
Visita: https://discovery.meethue.com/
(Retorna JSON con IPs de bridges disponibles)

### Método 3: Comando Windows
```powershell
ipconfig /all
```
Busca el rango IP de tu red, luego haz ping:
```powershell
Test-Connection 192.168.1.* -Count 1
```

---

## Solución de Problemas

### "npm: No se reconoce como comando"
- **Solución:** Reinstala Node.js desde https://nodejs.org/
- Marca las opciones "Add to PATH"

### "No se puede obtener el API key"
- Verifica que presiones el botón LINK **mientras** el script está esperando
- El botón está en la parte superior del bridge
- Intenta de nuevo: `npm run get-key`

### "Error al conectar con el bridge"
```powershell
# Verifica que el bridge esté conectado
ping 192.168.1.100

# Si no responde:
# 1. Recarga el bridge (desconecta 30 segundos)
# 2. Verifica que esté en la misma red Wi-Fi
# 3. Abre http://192.168.1.100 en navegador para confirmar
```

### "Puerto 3000 ya está en uso"
```powershell
# Cambiar puerto en .env
# PORT=3001

# O matar el proceso en Windows:
Get-NetTCPConnection -LocalPort 3000 | Select-Object -First 1 | Stop-NetTCPConnection -Force
```

### "Certificado SSL/TLS inválido"
- Esto es normal en bridges Hue antiguos
- La app ya lo maneja automáticamente
- No afecta la funcionalidad

---

## Uso Avanzado

### Acceder desde otro dispositivo

Desde tu teléfono/tablet en la misma red:

1. Obtén la IP de tu PC:
```powershell
ipconfig
```

2. Busca "IPv4 Address" (ej: `192.168.1.50`)

3. En tu móvil, ve a:
```
http://192.168.1.50:3000
```

### Modo desarrollo (con hot-reload)

```powershell
npm run dev
```

Reinicia automáticamente al hacer cambios en `server.js`

### Ver logs del servidor

El servidor mostrará:
- Peticiones HTTP
- Errores de conexión
- Estado del bridge

---

## Archivos Importantes

```
.env                 ← Configuración (NO compartir)
server.js            ← Servidor backend
public/
  ├── index.html    ← Interfaz web
  ├── styles.css    ← Estilos
  └── app.js        ← Lógica del frontend
```

---

## Mantenimiento

### Actualizar dependencias
```powershell
npm update
```

### Verificar vulnerabilidades
```powershell
npm audit
```

### Limpiar caché
```powershell
npm cache clean --force
```

---

## Parar la Aplicación

En PowerShell: **Presiona `Ctrl + C`**

---

¡Disfruta controlando tu Philips Hue! 💡
