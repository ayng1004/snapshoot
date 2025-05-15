// services/chat-service/src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sequelize = require('./config/database'); // remplace mongoose
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Connexion à PostgreSQL
sequelize.authenticate()
  .then(() => {
    logger.info('Connecté à PostgreSQL');
  })
  .catch(err => {
    logger.error('Erreur de connexion à PostgreSQL:', err);
    process.exit(1);
  });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    service: 'chat-service',
    timestamp: new Date().toISOString(),
    database: 'connected'
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

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`Chat service running on port ${PORT}`);
});