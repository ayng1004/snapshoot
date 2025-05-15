const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const mongoose = require('mongoose');
const redisClient = require('./config/redis');
const logger = require('./utils/logger');
const notificationRoutes = require('./routes/notification.routes');
const websocketServer = require('./websocket/websocket.server');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://notification-db:27017/notifications';

// Connexion à MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('Connecté à MongoDB');
})
.catch(err => {
  logger.error('Erreur de connexion à MongoDB:', err);
  // Ne pas quitter car Redis peut fonctionner sans MongoDB
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    status: 'UP',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    redis: redisStatus,
    mongodb: dbStatus
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Une erreur interne est survenue'
    }
  });
});

// Créer un serveur HTTP
const server = http.createServer(app);

// Initialiser le serveur WebSocket
websocketServer.init(server);

// Démarrage du serveur HTTP
server.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);
});