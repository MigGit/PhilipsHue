# 📋 Índice del Proyecto - Philips Hue Controller

## 🎯 Resumen del Proyecto

Web app completa para controlar tu **Philips Hue de primera generación** desde el navegador.
- ✅ Control local (sin dependencias de servidores de Philips)
- ✅ Interfaz moderna y responsive
- ✅ API REST completa
- ✅ Ejemplos de automatizaciones
- ✅ Node.js 24 compatible

---

## 📚 Documentación

Lee estos archivos en este orden:

1. **[QUICKSTART.md](QUICKSTART.md)** ⭐ **EMPIEZA AQUÍ**
   - Primeros pasos en 3 comandos
   - Solución rápida de problemas comunes

2. **[INSTALL_WINDOWS.md](INSTALL_WINDOWS.md)**
   - Instalación paso a paso para Windows
   - Cómo encontrar la IP del bridge
   - Explicación detallada de cada paso

3. **[README.md](README.md)**
   - Descripción completa del proyecto
   - Características
   - Estructura de carpetas

4. **[API_REFERENCE.md](API_REFERENCE.md)**
   - Referencia completa de endpoints
   - Parámetros y valores
   - Ejemplos con curl, JavaScript, Python

5. **[AUTOMATIONS.md](AUTOMATIONS.md)**
   - 7 ejemplos de automatizaciones
   - Despertador simulado
   - Modo Pomodoro
   - Atmósferas dinámicas
   - Y mucho más...

6. **[ADVANCED_CONFIG.md](ADVANCED_CONFIG.md)**
   - Configuración avanzada
   - Integración con Home Assistant
   - Seguridad en producción
   - Performance

---

## ⚙️ Archivos del Proyecto

### Backend

```
server.js
├── Servidor Express principal
├── Rutas de API REST
├── Manejo de conexión HTTPS al bridge
└── CORS habilitado para desarrollo
```

### Frontend

```
public/
├── index.html          Interfaz web moderna
├── styles.css          Estilos oscuros y responsive
└── app.js              Lógica del cliente
```

### Configuración

```
package.json           Dependencias del proyecto
.env.example           Plantilla de configuración
.env                   Configuración (NO subir a Git)
.gitignore             Archivos ignorados por Git
```

### Scripts

```
get-key.js            Script para obtener API key del bridge
```

---

## 🚀 Primeros Pasos (Resumen)

```bash
# 1. Instalar dependencias
npm install

# 2. Obtener credenciales del bridge
npm run get-key
# (Presiona el botón LINK cuando se pida)

# 3. Iniciar servidor
npm start

# 4. Abre en navegador
# http://localhost:3000
```

---

## 📖 Guía por Casos de Uso

### "Quiero controlar mis luces desde el navegador"
→ Lee: [QUICKSTART.md](QUICKSTART.md)

### "Necesito instalar paso a paso en Windows"
→ Lee: [INSTALL_WINDOWS.md](INSTALL_WINDOWS.md)

### "¿Cuál es la función de cada archivo?"
→ Lee: [README.md](README.md)

### "Quiero hacer peticiones a la API"
→ Lee: [API_REFERENCE.md](API_REFERENCE.md)

### "¿Cómo puedo automatizar las luces?"
→ Lee: [AUTOMATIONS.md](AUTOMATIONS.md)

### "¿Cómo integro esto con Home Assistant?"
→ Lee: [ADVANCED_CONFIG.md](ADVANCED_CONFIG.md)

### "Quiero deployar en producción"
→ Lee: [ADVANCED_CONFIG.md](ADVANCED_CONFIG.md) - Sección "Seguridad"

---

## 🎯 Funcionalidades

### 🌈 Control de Luces
- ✅ Encender/apagar
- ✅ Ajustar brillo (0-254)
- ✅ Cambiar color (0-65535 hue)
- ✅ Ajustar saturación
- ✅ Modificar temperatura de color

### 👥 Grupos
- ✅ Controlar múltiples luces a la vez
- ✅ Ajuste de brillo y color por grupo
- ✅ Ver información del grupo

### 🎨 Presets
- ☀️ Brillante - Blanco máximo
- 🔆 Cálido - Luz cálida (2700K)
- ❄️ Frío - Luz fría (5000K)
- 🎬 Película - Iluminación ambiental
- 📖 Lectura - Luz blanca perfecta
- 🌙 Noche - Luz tenue roja
- ⚫ Apagar todo

### 🤖 Automatizaciones (Ejemplos Incluidos)
- 🌅 Despertador por amanecer
- ⏱️ Modo Pomodoro
- 🎨 Atmósferas dinámicas
- 🎵 Sincronización con música
- 🎬 Modo cine (dimming progresivo)
- 🕐 Ciclo circadiano
- 🚨 Alarma inteligente

---

## 🔧 Tecnologías Utilizadas

- **Backend:** Node.js 24, Express.js
- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **HTTP:** Axios, HTTPS nativo
- **Utilidades:** dotenv, cors

**Sin dependencias de servicios externos - Todo funciona en local**

---

## 📊 Estructura del Servidor

```
GET/PUT /api/lights           - Control de luces individuales
GET/PUT /api/groups           - Control de grupos
GET     /api/config          - Información del bridge
GET     /health              - Estado de la conexión
```

---

## 🛠️ Comando Reference

```bash
npm install              # Instalar dependencias
npm start               # Iniciar servidor
npm run dev             # Modo desarrollo (hot-reload)
npm run get-key         # Obtener API key del bridge
```

---

## 🔐 Seguridad

### ✅ Implementado
- HTTPS ignorando certificados auto-firmados (del bridge)
- CORS habilitado para desarrollo
- Variables de entorno para credenciales

### ⚠️ Para Producción
- Añadir autenticación JWT
- Usar HTTPS real
- Limitar rate limiting
- No exponer en Internet sin firewall

Ver: [ADVANCED_CONFIG.md](ADVANCED_CONFIG.md) - Sección Seguridad

---

## 🆘 Soporte Rápido

| Problema | Solución |
|----------|----------|
| npm no funciona | Reinstala Node.js desde nodejs.org |
| No puedo obtener la API key | Presiona el botón LINK mientras el script espera |
| Las luces no responden | Verifica la IP del bridge con `ping` |
| Puerto 3000 en uso | Cambia PORT en .env o mata el proceso |
| Error SSL | Normal en bridges viejos, la app lo maneja |

---

## 📝 Notas Importantes

1. **Archivo `.env` es secreto** - No lo subas a Git
2. **API Key es personal** - Guárdalo seguro
3. **Funciona sin Internet** - Control completamente local
4. **Compatible Gen 1+** - Testado en Hue primera generación

---

## 🎓 Próximos Pasos

1. Completa la [GUÍA RÁPIDA](QUICKSTART.md)
2. Personaliza los presets en [public/app.js](public/app.js)
3. Añade automatizaciones con [AUTOMATIONS.md](AUTOMATIONS.md)
4. Configura seguridad en [ADVANCED_CONFIG.md](ADVANCED_CONFIG.md)

---

## 📞 Preguntas Frecuentes

**¿Funciona sin el bridge Hue?**
No, necesitas el bridge físico. Es lo que comunica con las luces.

**¿Puedo usar esto con otras marcas?**
Este servidor está específicamente para Hue. Otras marcas tienen APIs diferente

**¿Puedo acceder desde mi móvil?**
Sí, desde la misma red. Usa `http://<IP_TU_PC>:3000`

**¿Es seguro exponer en Internet?**
No sin autenticación. Úsalo localmente o detrás de VPN.

**¿Qué pasa si reinicio el bridge?**
Las credenciales se guardan en `.env`, no hay que obtenerlas de nuevo.

---

## 📄 Licencia

MIT - Libre para uso personal y comercial

---

**¡Comenzar ahora:** [QUICKSTART.md](QUICKSTART.md) ⭐

---

*Creado para usuarios con Philips Hue Legacy que quieren seguir usando sus luces sin depender del servicio oficial de Philips.*
