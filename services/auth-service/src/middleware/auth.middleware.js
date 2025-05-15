const { verifyToken } = require('../config/jwt');
const User = require('../models/user.model');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    // Vérifier si le header Authorization existe
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Accès non autorisé - Token manquant' });
    }

    // Extraire le token du header
    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = verifyToken(token);

    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await User.findOne({ 
      where: { 
        id: decoded.id, 
        status: 'active' 
      } 
    });

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé ou inactif' });
    }

    // Attacher l'utilisateur à la requête
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Erreur d'authentification: ${error.message}`);
    return res.status(401).json({ message: 'Accès non autorisé - Token invalide' });
  }
};

module.exports = authMiddleware;