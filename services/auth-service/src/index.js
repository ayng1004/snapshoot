const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const friendRoutes = require('./routes/friend.routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    service: 'auth-service',
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

// Synchroniser la base de données et démarrer le serveur
sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Impossible de se connecter à la base de données:', err);
    process.exit(1);
  });