# services/geo-service/Dockerfile
FROM node:18-alpine

# Installer les dépendances de build nécessaires
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install sequelize pg pg-hstore redis axios winston

# Copier les fichiers du projet
COPY . .

# Exposer le port
EXPOSE 3003

# Ajouter un healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

# Démarrer l'application
CMD ["npm", "start"]