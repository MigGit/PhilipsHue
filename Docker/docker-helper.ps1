# Script para gestionar Philips Hue Controller con Docker (PowerShell)
# Uso: .\docker-helper.ps1 [comando]

param(
    [string]$Command = "help"
)

# Configuración
$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptDir -Parent
$ComposeFile = Join-Path $ScriptDir "docker-compose.yml"
$DockerfilePath = Join-Path $ScriptDir "Dockerfile"
$ImageName = "philips-hue-controller"
$ContainerName = "hue-controller"

function Show-Help {
    Write-Host @"
╔════════════════════════════════════════════════════════════╗
║  Philips Hue Controller - Docker Helper (PowerShell)      ║
╚════════════════════════════════════════════════════════════╝

Uso: .\docker-helper.ps1 [comando]

Comandos:
    build           Construir imagen Docker
    up              Iniciar contenedor (docker-compose)
    down            Detener contenedor (docker-compose)
    restart         Reiniciar contenedor
    logs            Ver logs en tiempo real
    status          Ver estado del contenedor
    shell           Abrir shell en el contenedor
    clean           Eliminar imagen y contenedor
    reset           Reset completo (purgar todo)
    help            Mostrar esta ayuda

Ejemplos:
    .\docker-helper.ps1 build
    .\docker-helper.ps1 up
    .\docker-helper.ps1 logs
    .\docker-helper.ps1 down

"@
}

function Build-Image {
    Write-Host "🔨 Construyendo imagen Docker..." -ForegroundColor Cyan
    docker build -f $DockerfilePath -t $($ImageName):latest $ProjectRoot
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Imagen construida exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
        exit 1
    }
}

function Start-Container {
    Write-Host "🚀 Iniciando contenedor..." -ForegroundColor Cyan

    $EnvDockerPath = Join-Path $ProjectRoot ".env.docker"
    if (-not (Test-Path $EnvDockerPath)) {
        Write-Host "⚠️  Archivo .env.docker no encontrado" -ForegroundColor Yellow
        Write-Host "Creando desde .env.docker.example..." -ForegroundColor Yellow
        Copy-Item (Join-Path $ProjectRoot ".env.docker.example") $EnvDockerPath
        Write-Host "⚠️  Por favor edita .env.docker con tus valores" -ForegroundColor Yellow
        return
    }

    docker-compose -f $ComposeFile up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Contenedor iniciado" -ForegroundColor Green
        Write-Host "🌐 URL: http://localhost:3000" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Error al iniciar el contenedor" -ForegroundColor Red
    }
}

function Stop-Container {
    Write-Host "⬇️  Deteniendo contenedor..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile down
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Contenedor detenido" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al detener el contenedor" -ForegroundColor Red
    }
}

function Restart-Container {
    Write-Host "🔄 Reiniciando contenedor..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile restart hue-controller
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Contenedor reiniciado" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al reiniciar el contenedor" -ForegroundColor Red
    }
}

function Show-Logs {
    Write-Host "📋 Mostrando logs..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile logs -f hue-controller
}

function Show-Status {
    Write-Host "📊 Estado del contenedor:" -ForegroundColor Cyan
    
    $running = docker ps | Select-String $ContainerName
    if ($running) {
        Write-Host "✅ Contenedor está corriendo" -ForegroundColor Green
        docker ps --filter name=$ContainerName --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
    } else {
        Write-Host "❌ Contenedor no está corriendo" -ForegroundColor Red
    }
    
    Write-Host "`n📡 Health Status:" -ForegroundColor Cyan
    $health = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
    if ($health) {
        Write-Host $health -ForegroundColor Green
    } else {
        Write-Host "N/A" -ForegroundColor Gray
    }
}

function Open-Shell {
    Write-Host "🐚 Abriendo shell en el contenedor..." -ForegroundColor Cyan
    docker exec -it $ContainerName /bin/sh
}

function Clean-Docker {
    Write-Host "🗑️  Limpiando imagen y contenedor..." -ForegroundColor Yellow
    docker-compose -f $ComposeFile down
    docker rmi "$($ImageName):latest" -ErrorAction SilentlyContinue | out-null
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
}

function Reset-Docker {
    Write-Host "⚠️  RESET COMPLETO - Se eliminará todo" -ForegroundColor Red
    $response = Read-Host "¿Estás seguro? (s/n)"

    if ($response -eq 's' -or $response -eq 'S') {
        docker-compose -f $ComposeFile down -v
        docker rmi "$($ImageName):latest" -ErrorAction SilentlyContinue | out-null
        Write-Host "✅ Reset completado" -ForegroundColor Green
    } else {
        Write-Host "Cancelado" -ForegroundColor Yellow
    }
}

# Main
switch ($Command.ToLower()) {
    "build" {
        Build-Image
    }
    "up" {
        Build-Image
        Start-Container
    }
    "down" {
        Stop-Container
    }
    "restart" {
        Restart-Container
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "shell" {
        Open-Shell
    }
    "clean" {
        Clean-Docker
    }
    "reset" {
        Reset-Docker
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ Comando desconocido: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
