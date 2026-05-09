# 🐳 Docker - Referencia Rápida

## Instalación Rápida

### Windows
1. Descarga Docker Desktop desde https://www.docker.com/products/docker-desktop
2. Instala y reinicia su PC
3. Abre PowerShell y verifica:
   ```powershell
   docker --version
   docker-compose --version
   ```

### Linux
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Mac
Descarga Docker Desktop desde https://www.docker.com/products/docker-desktop

---

## Comandos Básicos

```bash
# Construir imagen
docker build -t mi-imagen .

# Iniciar con docker-compose (MÁS FÁCIL)
docker-compose up -d

# Ver contenedores corriendo
docker ps

# Ver todos los contenedores
docker ps -a

# Logs
docker logs -f nombre-contenedor

# Detener
docker-compose down

# Eliminar imagen
docker rmi mi-imagen
```

---

## Con Helper Scripts

### Windows PowerShell
```powershell
.\docker-helper.ps1 up      # Iniciar
.\docker-helper.ps1 logs    # Ver logs
.\docker-helper.ps1 status  # Estado
.\docker-helper.ps1 down    # Detener
```

### Linux/Mac
```bash
./docker-helper.sh up      # Iniciar
./docker-helper.sh logs    # Ver logs
./docker-helper.sh status  # Estado
./docker-helper.sh down    # Detener
```

---

## Archivos Incluidos

| Archivo | Descripción |
|---------|------------|
| `Dockerfile` | Dockerfile simple (desarrollo/producción) |
| `Dockerfile.prod` | Multi-stage optimizado (producción) |
| `docker-compose.yml` | Configuración docker-compose |
| `.dockerignore` | Archivos a excluir |
| `docker-helper.sh` | Helper script Linux/Mac |
| `docker-helper.ps1` | Helper script PowerShell |
| `.env.docker.example` | Plantilla de variables |

---

## Checklist Rápido

- [ ] Docker Desktop instalado
- [ ] Copiar `.env.docker.example` a `.env.docker`
- [ ] Editar `.env.docker` con IP del bridge
- [ ] Ejecutar `docker-compose up -d`
- [ ] Abrir `http://localhost:3000`
- [ ] Verificar logs: `docker-compose logs`

---

## Documentación Completa

Lee **DOCKER_GUIDE.md** para guía completa con ejemplos avanzados.

---

¡Listo para usar! 🚀
