const axios = require('axios');
const logger = require('../utils/logger');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3000';

// Envoyer une notification de nouvelle story
const sendNewStoryNotification = async (userId, storyId) => {
  try {
    // Récupérer la liste des amis de l'utilisateur
    const friendsResponse = await axios.get(`${AUTH_SERVICE_URL}/api/friends`, {
      headers: {
        'Authorization': `ServiceToken ${process.env.SERVICE_TOKEN}`
      },
      params: {
        user_id: userId
      }
    });
    
    const friends = friendsResponse.data.friends || [];
    
    // Envoyer une notification à chaque ami
    for (const friend of friends) {
      try {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
          user_id: friend.id,
          type: 'new_story',
          title: 'Nouvelle story',
          message: 'Un ami a publié une nouvelle story',
          data: {
            story_id: storyId,
            user_id: userId
          }
        });
        
        logger.info(`Notification de nouvelle story envoyée à ${friend.id}`);
      } catch (notifError) {
        logger.error(`Erreur lors de l'envoi de la notification à ${friend.id}: ${notifError.message}`);
        // Continuer malgré l'erreur pour les autres amis
      }
    }
  } catch (error) {
    logger.error(`Erreur lors de l'envoi des notifications: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendNewStoryNotification
};