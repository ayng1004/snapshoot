# services/auth-service/Dockerfile
FROM node:18-alpine

WORKDIR /app

# D'abord, copiez uniquement les fichiers de dépendances
COPY package*.json ./
RUN npm install

# Ensuite, copiez tous les fichiers du projet
COPY . .

# Vérifiez le contenu pour le débogage
RUN ls -la src/middleware/

EXPOSE 3000
CMD ["npm", "start"]