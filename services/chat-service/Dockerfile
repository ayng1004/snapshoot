# services/chat-service/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install pg pg-hstore sequelize

COPY . .

EXPOSE 3001
CMD ["npm", "start"]