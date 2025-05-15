const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mediaRoutes = require('./routes/media.routes');
const logger = require('./utils/logger');
const minioClient = require('./config/minio');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Servir les fichiers statiques temporaires (pour les tests)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/media', mediaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    service: 'media-service',
    timestamp: new Date().toISOString()
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

// Initialisation des buckets MinIO
const initializeMinIO = async () => {
  try {
    // Vérifier la connexion à MinIO
    await minioClient.bucketExists('profile-images');
    logger.info('Connexion à MinIO établie avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la connexion à MinIO: ${error.message}`);
    // On ne quitte pas le processus car MinIO pourrait être en cours de démarrage
  }
};

// Démarrage du serveur
app.listen(PORT, async () => {
  logger.info(`Media service running on port ${PORT}`);
  await initializeMinIO();
});