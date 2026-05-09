# 🐳 Docker Quick Start

## En 3 Pasos

### Paso 1: Configurar Variables de Entorno

En Windows (PowerShell):
```powershell
Copy-Item .env.docker.example .env.docker
# Edita .env.docker con tu IP y username
notepad .env.docker
```

En Linux/Mac:
```bash
cp .env.docker.example .env.docker
# Edita con tu editor favorito
nano .env.docker
```

### Paso 2: Iniciar Contenedor

```bash
docker-compose up -d
```

### Paso 3: Acceder a la App

Abre en tu navegador:
```
http://localhost:3000
```

---

## ✅ Verificar que Funciona

```bash
# Ver logs
docker-compose logs -f

# Ver estado
docker-compose ps

# Verificar health
docker exec hue-controller curl http://localhost:3000/health
```

---

## 🛑 Detener

```bash
docker-compose down
```

---

## 📋 Contenido del .env.docker

```env
HUE_BRIDGE_IP=192.168.1.100    # IP de tu bridge
HUE_USERNAME=newdeveloper      # Username del API
PORT=3000                       # Puerto
NODE_ENV=production             # Ambiente
```

---

## 🐧 Usando Scripts Helper

### Windows PowerShell

```powershell
# Hacer ejecutable el script
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Usar
.\docker-helper.ps1 up       # Iniciar
.\docker-helper.ps1 logs     # Ver logs
.\docker-helper.ps1 down     # Detener
.\docker-helper.ps1 status   # Estado
.\docker-helper.ps1 help     # Ayuda
```

### Linux/Mac Bash

```bash
# Hacer ejecutable
chmod +x docker-helper.sh

# Usar
./docker-helper.sh up       # Iniciar
./docker-helper.sh logs     # Ver logs
./docker-helper.sh down     # Detener
./docker-helper.sh status   # Estado
./docker-helper.sh help     # Ayuda
```

---

## 📊 Información de la Imagen

- **Base:** Node.js 24 Alpine
- **Tamaño:** ~200-250 MB (sin comprimir)
- **Memory:** ~50-100 MB
- **CPU:** Minimal
- **Health Check:** Automático cada 30 segundos

---

## 🔗 Redes

El contenedor se conecta automáticamente a una red Docker llamada `hue-network`, lo que permite:

- Comunicación con otros contenedores
- Aislamiento de seguridad
- Fácil scaling en futuro

---

## 💾 Volúmenes

Por defecto, el contenedor **no almacena datos persistentes** (no es necesario para esta app). Si en futuro necesitas persistencia, añade a `docker-compose.yml`:

```yaml
volumes:
  - ./data:/app/data
```

---

## 🔐 Producción

Para producción, considera:

1. **Usar Docker Hub:** Push tu imagen a un registro
2. **HTTPS:** Usar reverse proxy (NGINX)
3. **Secrets:** No poner credenciales en docker-compose.yml
4. **Resource Limits:** Añadir limites de CPU/Memory

```yaml
resources:
  limits:
    cpus: '0.5'
    memory: 256M
  reservations:
    cpus: '0.25'
    memory: 128M
```

---

¡Listo! Tu app está dockerizada. 🚀
