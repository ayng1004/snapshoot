// services/auth-service/src/middleware/validation.middleware.js
const logger = require('../utils/logger');

// Validation pour l'inscription
const validateRegistration = (req, res, next) => {
  const { username, email, password, full_name } = req.body;
  const errors = [];

  // Validation du nom d'utilisateur
  if (!username || username.length < 3 || username.length > 50) {
    errors.push('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères');
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Adresse email invalide');
  }

  // Validation du mot de passe
  if (!password || password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }

  // Validation du nom complet (optionnel)
  if (full_name && full_name.length > 100) {
    errors.push('Le nom complet ne peut pas dépasser 100 caractères');
  }

  if (errors.length > 0) {
    logger.warn(`Erreur de validation: ${errors.join(', ')}`);
    return res.status(400).json({ errors });
  }

  next();
};

// Validation pour la connexion
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email requis');
  }

  if (!password) {
    errors.push('Mot de passe requis');
  }

  if (errors.length > 0) {
    logger.warn(`Erreur de validation de connexion: ${errors.join(', ')}`);
    return res.status(400).json({ errors });
  }

  next();
};

// Validation pour la réinitialisation du mot de passe
const validatePasswordReset = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ errors: ['Email requis'] });
  }

  next();
};

// Validation pour la mise à jour du profil
const validateProfileUpdate = (req, res, next) => {
  const { username, full_name, bio } = req.body;
  const errors = [];

  if (username && (username.length < 3 || username.length > 50)) {
    errors.push('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères');
  }

  if (full_name && full_name.length > 100) {
    errors.push('Le nom complet ne peut pas dépasser 100 caractères');
  }

  if (bio && bio.length > 500) {
    errors.push('La biographie ne peut pas dépasser 500 caractères');
  }

  if (errors.length > 0) {
    logger.warn(`Erreur de validation de profil: ${errors.join(', ')}`);
    return res.status(400).json({ errors });
  }

  next();
};
const validateUserSearch = (req, res, next) => {
  const { query } = req.query;
  
  if (!query || query.length < 3) {
    return res.status(400).json({ 
      errors: ['Le terme de recherche doit contenir au moins 3 caractères'] 
    });
  }
  
  next();
};
module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateProfileUpdate,
  validateUserSearch
};