const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Obtenir l'utilisateur actuellement connecté
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'last_login', 'status', 'created_at'],
      include: {
        model: Profile,
        as: 'profile',
        attributes: ['display_name', 'username', 'bio', 'profile_image', 'location', 'preferences']
      }
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

// Mettre à jour l'utilisateur actuel
const updateCurrentUser = async (req, res) => {
  try {
    const { displayName, bio, location, preferences } = req.body;
    
    // Mise à jour du profil
    const [, [updatedProfile]] = await Profile.update(
      {
        display_name: displayName,
        bio,
        location,
        preferences: preferences ? JSON.stringify(preferences) : undefined
      },
      {
        where: { user_id: req.user.id },
        returning: true
      }
    );
    
    return res.status(200).json({
      message: 'Profil mis à jour avec succès',
      profile: updatedProfile
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du profil: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
};

// Obtenir un utilisateur par son ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'status', 'created_at'],
      include: {
        model: Profile,
        as: 'profile',
        attributes: ['display_name', 'username', 'bio', 'profile_image', 'location']
      }
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

// Obtenir le profil d'un utilisateur
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await Profile.findOne({
      where: { user_id: userId },
      attributes: ['display_name', 'username', 'bio', 'profile_image', 'location']
    });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }
    
    return res.status(200).json({ profile });
  } catch (error) {
    logger.error(`Erreur lors de la récupération du profil: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

// Rechercher des utilisateurs
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ message: 'Le terme de recherche doit contenir au moins 3 caractères' });
    }
    
    // Recherche par email ou username
    const users = await User.findAll({
      attributes: ['id', 'email'],
      include: {
        model: Profile,
        as: 'profile',
        attributes: ['display_name', 'username', 'profile_image']
      },
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: `%${query}%` } },
          { '$profile.username$': { [Op.iLike]: `%${query}%` } },
          { '$profile.display_name$': { [Op.iLike]: `%${query}%` } }
        ],
        id: { [Op.ne]: req.user.id }, // Exclure l'utilisateur actuel
        status: 'active' // Seulement les utilisateurs actifs
      },
      limit: 20
    });
    
    return res.status(200).json({ users });
  } catch (error) {
    logger.error(`Erreur lors de la recherche d'utilisateurs: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la recherche d\'utilisateurs' });
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  getUserById,
  getUserProfile,
  searchUsers
};