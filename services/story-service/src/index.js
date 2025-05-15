// services/story-service/src/index.js (modified to use PostgreSQL)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const storyRoutes = require('./routes/story.routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3004;

// Create PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Test the connection
pool.connect()
  .then(client => {
    logger.info(`Connected to PostgreSQL at ${process.env.DB_HOST}`);
    client.release();
  })
  .catch(err => {
    logger.error(`Error connecting to PostgreSQL: ${err.message}`, { error: err });
  });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api/stories', storyRoutes);

// Health check
app.get('/health', (req, res) => {
  pool.query('SELECT NOW()')
    .then(() => {
      res.status(200).json({
        status: 'UP',
        service: 'story-service',
        timestamp: new Date().toISOString(),
        database: 'connected'
      });
    })
    .catch(err => {
      logger.error(`Health check failed: ${err.message}`);
      res.status(503).json({
        status: 'DOWN',
        service: 'story-service',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: err.message
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

// Start server
app.listen(PORT, () => {
  logger.info(`Story service running on port ${PORT}`);
});