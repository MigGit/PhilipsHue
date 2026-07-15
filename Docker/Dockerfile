# Dockerfile para Philips Hue Controller
# Usa Node.js 24 como base

FROM node:24-alpine3.23

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm i --only=production

# Copiar archivos de la aplicación
COPY server.js .
COPY get-key.js .
COPY public/ ./public/
COPY .env .

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando para iniciar la aplicación
CMD ["npm", "start"]
