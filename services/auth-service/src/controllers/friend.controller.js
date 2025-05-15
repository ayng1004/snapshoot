const User = require('../models/user.model');
const Profile = require('../models/profile.model');
const Friendship = require('../models/friendship.model');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

// Obtenir la liste d'amis
const getFriends = async (req, res) => {
  try {
    // Trouver toutes les amitiés acceptées
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { requester_id: req.user.id },
          { addressee_id: req.user.id }
        ],
        status: 'accepted'
      }
    });
    
    // Extraire les IDs des amis
    const friendIds = friendships.map(friendship => 
      friendship.requester_id === req.user.id 
        ? friendship.addressee_id 
        : friendship.requester_id
    );
    
    // Récupérer les profils des amis
    const friends = await User.findAll({
      attributes: ['id', 'email'],
      include: {
        model: Profile,
        as: 'profile',
        attributes: ['display_name', 'username', 'profile_image']
      },
      where: {
        id: { [Op.in]: friendIds }
      }
    });
    
    return res.status(200).json({ friends });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des amis: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des amis' });
  }
};

// Envoyer une demande d'ami
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur n'essaie pas de s'ajouter lui-même
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous ajouter comme ami' });
    }
    
    // Vérifier que l'utilisateur cible existe
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si une demande existe déjà
    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requester_id: req.user.id, addressee_id: userId },
          { requester_id: userId, addressee_id: req.user.id }
        ]
      }
    });
    
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return res.status(400).json({ message: 'Vous êtes déjà amis' });
      } else if (existingFriendship.status === 'pending') {
        if (existingFriendship.requester_id === req.user.id) {
          return res.status(400).json({ message: 'Demande d\'ami déjà envoyée' });
        } else {
          return res.status(400).json({ 
            message: 'Cet utilisateur vous a déjà envoyé une demande d\'ami',
            requestId: existingFriendship.id
          });
        }
      } else if (existingFriendship.status === 'blocked') {
        return res.status(403).json({ message: 'Action impossible' });
      }
    }
    
    // Créer la demande d'ami
    const friendship = await Friendship.create({
      requester_id: req.user.id,
      addressee_id: userId,
      status: 'pending'
    });
    
    // Envoyer une notification (asynchrone)
    notificationService.sendFriendRequestNotification(req.user.id, userId)
      .catch(err => logger.error(`Erreur lors de l'envoi de la notification: ${err.message}`));
    
    return res.status(201).json({
      message: 'Demande d\'ami envoyée avec succès',
      friendship
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la demande d'ami: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi de la demande d\'ami' });
  }
};

// Accepter une demande d'ami
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Vérifier que la demande existe et est adressée à l'utilisateur
    const friendship = await Friendship.findOne({
      where: {
        id: requestId,
        addressee_id: req.user.id,
        status: 'pending'
      }
    });
    
    if (!friendship) {
      return res.status(404).json({ message: 'Demande d\'ami non trouvée ou déjà traitée' });
    }
    
    // Accepter la demande
    await friendship.update({ status: 'accepted' });
    
    // Envoyer une notification (asynchrone)
    notificationService.sendFriendRequestAcceptedNotification(req.user.id, friendship.requester_id)
      .catch(err => logger.error(`Erreur lors de l'envoi de la notification: ${err.message}`));
    
    return res.status(200).json({
      message: 'Demande d\'ami acceptée',
      friendship
    });
  } catch (error) {
    logger.error(`Erreur lors de l'acceptation de la demande d'ami: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'acceptation de la demande d\'ami' });
  }
};

// Rejeter une demande d'ami
const rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Vérifier que la demande existe et est adressée à l'utilisateur
    const friendship = await Friendship.findOne({
      where: {
        id: requestId,
        addressee_id: req.user.id,
        status: 'pending'
      }
    });
    
    if (!friendship) {
      return res.status(404).json({ message: 'Demande d\'ami non trouvée ou déjà traitée' });
    }
    
    // Rejeter la demande
    await friendship.update({ status: 'rejected' });
    
    return res.status(200).json({
      message: 'Demande d\'ami rejetée',
      friendship
    });
  } catch (error) {
    logger.error(`Erreur lors du rejet de la demande d'ami: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors du rejet de la demande d\'ami' });
  }
};

// Supprimer un ami
const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    
    // Trouver l'amitié
    const friendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { requester_id: req.user.id, addressee_id: friendId },
          { requester_id: friendId, addressee_id: req.user.id }
        ],
        status: 'accepted'
      }
    });
    
    if (!friendship) {
      return res.status(404).json({ message: 'Relation d\'amitié non trouvée' });
    }
    
    // Supprimer l'amitié (ou marquer comme rejetée)
    await friendship.destroy();
    
    return res.status(200).json({
      message: 'Ami supprimé avec succès'
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'ami: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la suppression de l\'ami' });
  }
};

// Obtenir les demandes d'ami en attente
const getPendingFriendRequests = async (req, res) => {
  try {
    // Trouver toutes les demandes d'ami en attente adressées à l'utilisateur
    const pendingRequests = await Friendship.findAll({
      where: {
        addressee_id: req.user.id,
        status: 'pending'
      },
      include: {
        model: User,
        as: 'requester',
        attributes: ['id', 'email'],
        include: {
          model: Profile,
          as: 'profile',
          attributes: ['display_name', 'username', 'profile_image']
        }
      }
    });
    
    return res.status(200).json({ pendingRequests });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des demandes d'ami: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des demandes d\'ami' });
  }
};

module.exports = {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingFriendRequests
};