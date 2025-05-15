const redis = require('redis');
const logger = require('../utils/logger');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

redisClient.on('error', (err) => {
  logger.error(`Redis Client Error: ${err}`);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis server');
});

// Connecter au serveur Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
  }
})();

module.exports = redisClient;