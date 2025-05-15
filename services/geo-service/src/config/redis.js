// services/geo-service/src/config/redis.js
const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:6379`
});

redisClient.on('error', (err) => {
  logger.error('Erreur Redis:', err);
});

redisClient.on('connect', () => {
  logger.info('Connecté au serveur Redis');
});

// Connexion au serveur Redis
(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;