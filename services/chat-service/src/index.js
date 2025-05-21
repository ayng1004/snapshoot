const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./config/database'); // Import de notre module database.js mis à jour
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const logger = require('./utils/logger');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3001;

// Test de connexion à PostgreSQL
db.testConnection()
  .then(connected => {
    if (connected) {
      logger.info('Connexion à PostgreSQL établie avec succès');
    } else {
      logger.error('Impossible de se connecter à PostgreSQL');
    }
  })
  .catch(err => {
    logger.error(`Erreur lors du test de connexion: ${err.message}`);
  });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Middleware pour rendre le pool de connexion disponible dans les requêtes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    
    res.status(200).json({
      status: 'UP',
      service: 'chat-service',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      service: 'chat-service',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  }
});

// Middleware pour les routes non trouvées
app.use((req, res, next) => {
  logger.warn(`Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: {
      message: 'Route non trouvée'
    }
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Une erreur interne est survenue'
    }
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`Chat service running on port ${PORT}`);
});