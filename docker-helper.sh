#!/bin/bash

# Script para gestionar Philips Hue Controller con Docker
# Uso: ./docker-helper.sh [comando]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_NAME="philips-hue-controller"
CONTAINER_NAME="hue-controller"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones
show_help() {
    cat << EOF
${BLUE}Philips Hue Controller - Docker Helper${NC}

Uso: $(basename "$0") [comando] [opciones]

Comandos:
    ${GREEN}build${NC}           Construir imagen Docker
    ${GREEN}up${NC}              Iniciar contenedor (docker-compose)
    ${GREEN}down${NC}            Detener contenedor (docker-compose)
    ${GREEN}restart${NC}         Reiniciar contenedor
    ${GREEN}logs${NC}            Ver logs en tiempo real
    ${GREEN}status${NC}          Ver estado del contenedor
    ${GREEN}shell${NC}           Abrir shell en el contenedor
    ${GREEN}clean${NC}           Eliminar imagen y contenedor
    ${GREEN}reset${NC}           Reset completo (purgar todo)
    ${GREEN}help${NC}            Mostrar esta ayuda

Ejemplos:
    $(basename "$0") build
    $(basename "$0") up
    $(basename "$0") logs
    $(basename "$0") down

EOF
}

build_image() {
    echo -e "${BLUE}🔨 Construyendo imagen Docker...${NC}"
    docker build -t ${IMAGE_NAME}:latest .
    echo -e "${GREEN}✅ Imagen construida exitosamente${NC}"
}

up() {
    echo -e "${BLUE}🚀 Iniciando contenedor...${NC}"
    
    # Verificar si existe .env.docker
    if [ ! -f ".env.docker" ]; then
        echo -e "${YELLOW}⚠️  Archivo .env.docker no encontrado${NC}"
        echo -e "${YELLOW}Creando desde .env.docker.example...${NC}"
        cp .env.docker.example .env.docker
        echo -e "${YELLOW}⚠️  Por favor edita .env.docker con tus valores${NC}"
        return 1
    fi
    
    docker-compose up -d
    echo -e "${GREEN}✅ Contenedor iniciado${NC}"
    echo -e "${BLUE}🌐 URL: http://localhost:3000${NC}"
}

down() {
    echo -e "${BLUE}⬇️  Deteniendo contenedor...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Contenedor detenido${NC}"
}

restart() {
    echo -e "${BLUE}🔄 Reiniciando contenedor...${NC}"
    docker-compose restart hue-controller
    echo -e "${GREEN}✅ Contenedor reiniciado${NC}"
}

show_logs() {
    echo -e "${BLUE}📋 Mostrando logs...${NC}"
    docker-compose logs -f hue-controller
}

show_status() {
    echo -e "${BLUE}📊 Estado del contenedor:${NC}"
    
    if docker ps | grep -q ${CONTAINER_NAME}; then
        echo -e "${GREEN}✅ Contenedor está corriendo${NC}"
        docker ps --filter name=${CONTAINER_NAME} --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo -e "${RED}❌ Contenedor no está corriendo${NC}"
    fi
    
    echo -e "\n${BLUE}Health Status:${NC}"
    docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null || echo "N/A"
}

open_shell() {
    echo -e "${BLUE}🐚 Abriendo shell en el contenedor...${NC}"
    docker exec -it ${CONTAINER_NAME} /bin/sh
}

clean() {
    echo -e "${YELLOW}🗑️  Limpiando imagen y contenedor...${NC}"
    docker-compose down
    docker rmi ${IMAGE_NAME}:latest 2>/dev/null || true
    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

reset() {
    echo -e "${RED}⚠️  RESET COMPLETO - Se eliminará todo${NC}"
    read -p "¿Estás seguro? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        docker-compose down -v
        docker rmi ${IMAGE_NAME}:latest 2>/dev/null || true
        echo -e "${GREEN}✅ Reset completado${NC}"
    else
        echo -e "${YELLOW}Cancelado${NC}"
    fi
}

# Main
case "${1:-help}" in
    build)
        build_image
        ;;
    up)
        build_image
        up
        ;;
    down)
        down
        ;;
    restart)
        restart
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    shell)
        open_shell
        ;;
    clean)
        clean
        ;;
    reset)
        reset
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando desconocido: $1${NC}"
        show_help
        exit 1
        ;;
esac
