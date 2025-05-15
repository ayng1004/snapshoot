const jwt = require('jsonwebtoken');
const axios = require('axios');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';

const authMiddleware = async (req, res, next) => {
  try {
    // Vérifier si le header Authorization existe
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès non autorisé - Token manquant' });
    }

    // Extraire le token du header
    const token = authHeader.split(' ')[1];

    // Tenter de vérifier le token localement
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      // Si la vérification locale échoue, vérifier auprès du service d'authentification
      try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify-token`, { token });
        
        if (response.data.valid) {
          req.user = response.data.user;
          return next();
        } else {
          return res.status(401).json({ message: 'Accès non autorisé - Token invalide' });
        }
      } catch (axiosError) {
        logger.error(`Erreur lors de la vérification du token auprès du service d'authentification: ${axiosError.message}`);
        return res.status(401).json({ message: 'Accès non autorisé - Impossible de vérifier le token' });
      }
    }
  } catch (error) {
    logger.error(`Erreur d'authentification: ${error.message}`);
    return res.status(401).json({ message: 'Accès non autorisé' });
  }
};

module.exports = authMiddleware;