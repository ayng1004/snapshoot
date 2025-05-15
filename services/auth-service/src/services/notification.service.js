const axios = require('axios');
const logger = require('../utils/logger');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';

// Envoyer une notification de bienvenue
const sendWelcomeNotification = async (userId) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      user_id: userId,
      type: 'welcome',
      title: 'Bienvenue sur Snapshoot!',
      message: 'Merci de vous être inscrit sur Snapshoot. Commencez à ajouter des amis et à partager des moments!',
      data: {}
    });
    
    logger.info(`Notification de bienvenue envoyée à l'utilisateur ${userId}`);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification de bienvenue: ${error.message}`);
    throw error;
  }
};

// Envoyer une notification de demande d'ami
const sendFriendRequestNotification = async (requesterId, addresseeId) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      user_id: addresseeId,
      type: 'friend_request',
      title: 'Nouvelle demande d\'ami',
      message: 'Vous avez reçu une nouvelle demande d\'ami',
      data: {
        requester_id: requesterId
      }
    });
    
    logger.info(`Notification de demande d'ami envoyée de ${requesterId} à ${addresseeId}`);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification de demande d'ami: ${error.message}`);
    throw error;
  }
};

// Envoyer une notification d'acceptation de demande d'ami
const sendFriendRequestAcceptedNotification = async (accepterId, requesterId) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      user_id: requesterId,
      type: 'friend_request_accepted',
      title: 'Demande d\'ami acceptée',
      message: 'Votre demande d\'ami a été acceptée',
      data: {
        accepter_id: accepterId
      }
    });
    
    logger.info(`Notification d'acceptation de demande d'ami envoyée de ${accepterId} à ${requesterId}`);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification d'acceptation de demande d'ami: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendWelcomeNotification,
  sendFriendRequestNotification,
  sendFriendRequestAcceptedNotification
};