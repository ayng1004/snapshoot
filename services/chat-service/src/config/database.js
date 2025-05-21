const { Pool } = require('pg');
const logger = require('../utils/logger');

// Configuration de la connexion à PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'chat-db',     // Important: hostname du conteneur, pas localhost
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chat_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // Options supplémentaires pour améliorer la stabilité
  max: 20, // Nombre maximal de clients dans le pool
  idleTimeoutMillis: 30000, // Délai d'inactivité avant de libérer un client
  connectionTimeoutMillis: 10000, // Délai de tentative de connexion
  // Log des erreurs de connexion
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Événements du pool pour le débogage
pool.on('connect', () => {
  logger.info('Nouvelle connexion établie avec PostgreSQL');
});

pool.on('error', (err) => {
  logger.error(`Erreur de connexion PostgreSQL: ${err.message}`);
  
  // Si l'erreur est liée à l'hôte, afficher un message plus clair
  if (err.code === 'ECONNREFUSED') {
    logger.error(`Impossible de se connecter à l'hôte PostgreSQL: ${process.env.DB_HOST || 'chat-db'}`);
    logger.error('Vérifiez que le conteneur de base de données est actif et accessible');
  }
});

/**
 * Fonction d'exécution de requête avec retry en cas d'échec
 */
const query = async (text, params, retries = 3) => {
  let lastError = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        const start = Date.now();
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        
        // Logger les requêtes longues (plus de 100ms)
        if (duration > 100) {
          logger.debug(`Requête lente (${duration}ms): ${text}`);
        }
        
        return result;
      } finally {
        client.release();
      }
    } catch (err) {
      lastError = err;
      logger.error(`Échec de requête (tentative ${attempt}/${retries}): ${err.message}`);
      
      // Attendre avant de réessayer
      if (attempt < retries) {
        const delay = 1000 * attempt; // Délai progressif
        logger.info(`Nouvelle tentative dans ${delay/1000} seconde(s)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Fonction pour exécuter une transaction
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Tester la connexion à la base de données
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    logger.info(`Connexion PostgreSQL établie: ${result.rows[0].now}`);
    return true;
  } catch (err) {
    logger.error(`Erreur de connexion PostgreSQL: ${err.message}`);
    return false;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};