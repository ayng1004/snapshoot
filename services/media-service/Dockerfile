FROM node:18-alpine

# Installation des dépendances pour le traitement d'images
RUN apk add --no-cache \
    libjpeg-turbo-dev \
    libpng-dev \
    giflib-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Créer le dossier uploads s'il n'existe pas
RUN mkdir -p uploads

EXPOSE 3002

CMD ["npm", "start"]