const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./config/database');
const redisClient = require('./config/redis');
const locationRoutes = require('./routes/location.routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/locations', locationRoutes);

// Health check
app.get('/health', (req, res) => {
  const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';
  const dbStatus = sequelize.authenticate()
    .then(() => 'connected')
    .catch(() => 'disconnected');
  
  Promise.resolve(dbStatus).then(dbConnectionStatus => {
    res.status(200).json({ 
      status: 'UP',
      service: 'geo-service',
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      database: dbConnectionStatus
    });
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

// Synchroniser la base de données et démarrer le serveur
sequelize.sync()
  .then(() => {
    logger.info('PostgreSQL connected successfully');
    
    app.listen(PORT, () => {
      logger.info(`Geo service running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Unable to connect to PostgreSQL database:', err);
    process.exit(1);
  });