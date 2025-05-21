const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const { generateToken, verifyToken } = require('../config/jwt');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

// Inscription
const register = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { email, password, displayName } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }
    
    // Créer l'utilisateur
    const user = await User.create(
      { email, password },
      { transaction }
    );
    
    // Créer le profil
    await Profile.create(
      { 
        user_id: user.id,
        display_name: displayName || email.split('@')[0]
      },
      { transaction }
    );
    
    // Générer le token JWT
    const token = generateToken(user);
    
    // Valider la transaction
    await transaction.commit();
    
    // Envoyer la notification de bienvenue (asynchrone)
    notificationService.sendWelcomeNotification(user.id)
      .catch(err => logger.error(`Erreur lors de l'envoi de la notification de bienvenue: ${err.message}`));
    
    return res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: user.id,
        email: user.email
      },
      token
    });
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    
    logger.error(`Erreur lors de l'inscription: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

// Connexion
// Connexion
const login = async (req, res) => {
  try {
    console.log('Login function called with:', req.body);

    const { email, password } = req.body;
    
    // Rechercher l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier si l'utilisateur est actif
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ message: 'Compte désactivé. Contactez l\'administrateur.' });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // AJOUTEZ CETTE PARTIE QUI MANQUE :
    console.log('Authentification réussie pour:', email);
    
    // Générer un token JWT
    const token = generateToken(user);
    
    // Mettre à jour la date de dernière connexion
    await user.update({ last_login: new Date() });
    
    // Récupérer le profil utilisateur s'il existe
    const profile = await Profile.findOne({ where: { user_id: user.id } });
    
    // Renvoyer la réponse
    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      profile: profile ? {
        display_name: profile.display_name,
        bio: profile.bio,
        profile_image: profile.profile_image,
        location: profile.location
      } : null
    });
  } catch (error) {
    console.error('Erreur détaillée dans login:', error);
    logger.error(`Erreur lors de la connexion: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

// Déconnexion (surtout pour les statistiques/journalisation)
const logout = async (req, res) => {
  try {
    // Pour JWT, la déconnexion est principalement côté client
    // On pourrait implémenter une liste noire de tokens mais ce n'est pas nécessaire ici
    return res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    logger.error(`Erreur lors de la déconnexion: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
  }
};

// Vérification de token
const validateToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token requis' });
    }
    
    const decoded = verifyToken(token);
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const user = await User.findOne({ 
      where: { 
        id: decoded.id, 
        status: 'active' 
      } 
    });

    if (!user) {
      return res.status(401).json({ 
        valid: false,
        message: 'Utilisateur non trouvé ou inactif' 
      });
    }
    
    return res.status(200).json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(401).json({ 
      valid: false, 
      message: 'Token invalide ou expiré' 
    });
  }
};

// Rafraîchissement de token (optionnel)
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token requis' });
    }
    
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
    
    // Générer un nouveau token
    const newToken = generateToken(user);
    
    return res.status(200).json({
      message: 'Token rafraîchi avec succès',
      token: newToken
    });
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

// Demande de réinitialisation de mot de passe
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.status(200).json({ 
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation' 
      });
    }
    
    // Générer un token temporaire avec une courte durée de vie
    const resetToken = generateToken({
      id: user.id,
      purpose: 'password_reset'
    });
    
    // Dans un système réel, envoyer un email avec le lien de réinitialisation
    // Pour l'exemple, on retourne juste le token
    
    return res.status(200).json({ 
      message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation',
      // Note: en production, ne jamais retourner le token directement, l'envoyer par email
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    logger.error(`Erreur lors de la demande de réinitialisation: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation' });
  }
};

// Réinitialisation de mot de passe
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
    }
    
    const decoded = verifyToken(token);
    
    // Vérifier le but du token
    if (decoded.purpose !== 'password_reset') {
      return res.status(401).json({ message: 'Token invalide pour cette opération' });
    }
    
    // Mettre à jour le mot de passe
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    await user.update({ password: newPassword });
    
    return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    logger.error(`Erreur lors de la réinitialisation du mot de passe: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
};

// Ajouter au fichier auth.controller.js

// Vérification d'email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Vérifier le token
    const decoded = verifyToken(token);
    
    // Vérifier le but du token
    if (decoded.purpose !== 'email_verification') {
      return res.status(401).json({ message: 'Token invalide pour cette opération' });
    }
    
    // Marquer l'email comme vérifié
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    await user.update({ email_verified: true });
    
    return res.status(200).json({ message: 'Email vérifié avec succès' });
  } catch (error) {
    logger.error(`Erreur lors de la vérification d'email: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la vérification d\'email' });
  }
};

// Obtenir l'utilisateur courant
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer l'utilisateur avec son profil
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'status', 'created_at', 'last_login'],
      include: [{
        model: Profile,
        as: 'profile',
        attributes: ['display_name', 'username', 'bio', 'profile_image']
      }]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'utilisateur: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name, username, bio, profile_image } = req.body;
    
    // Récupérer le profil
    let profile = await Profile.findOne({ where: { user_id: userId } });
    
    if (!profile) {
      // Créer un profil s'il n'existe pas
      profile = await Profile.create({
        user_id: userId,
        display_name: display_name || req.user.email.split('@')[0],
        username: username || null,
        bio: bio || null,
        profile_image: profile_image || null
      });
    } else {
      // Mettre à jour le profil existant
      await profile.update({
        display_name: display_name !== undefined ? display_name : profile.display_name,
        username: username !== undefined ? username : profile.username,
        bio: bio !== undefined ? bio : profile.bio,
        profile_image: profile_image !== undefined ? profile_image : profile.profile_image
      });
    }
    
    return res.status(200).json({
      message: 'Profil mis à jour avec succès',
      profile
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du profil: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
};

// Ajouter ces fonctions à l'export
module.exports = {
  register,
  login,
  logout,
  validateToken,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getCurrentUser,
  updateProfile
};