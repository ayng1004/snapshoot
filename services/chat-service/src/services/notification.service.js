const axios = require('axios');
const logger = require('../utils/logger');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';

// Envoyer une notification de nouveau message
const sendNewMessageNotification = async (senderId, recipientId, conversationId, groupName, messagePreview) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      user_id: recipientId,
      type: 'new_message',
      title: groupName ? `Nouveau message dans ${groupName}` : 'Nouveau message',
      message: messagePreview.length > 50 ? messagePreview.substring(0, 47) + '...' : messagePreview,
      data: {
        sender_id: senderId,
        conversation_id: conversationId,
        is_group: !!groupName,
        group_name: groupName
      }
    });
    
    logger.info(`Notification de nouveau message envoyée de ${senderId} à ${recipientId}`);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification de nouveau message: ${error.message}`);
    throw error;
  }
};

// Envoyer une notification de création de conversation de groupe
const sendGroupConversationCreatedNotification = async (creatorId, recipientId, conversationId, groupName) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      user_id: recipientId,
      type: 'group_created',
      title: 'Nouveau groupe créé',
      message: `Vous avez été ajouté à "${groupName}"`,
      data: {
        creator_id: creatorId,
        conversation_id: conversationId,
        group_name: groupName
      }
    });
    
    logger.info(`Notification de création de groupe envoyée de ${creatorId} à ${recipientId}`);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification de création de groupe: ${error.message}`);
    throw error;
  }
};

// Envoyer une notification d'invitation à un groupe
const sendGroupInviteNotification = async (inviterId, recipientId, conversationId, groupName) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      user_id: recipientId,
      type: 'group_invite',
      title: 'Invitation à un groupe',
      message: `Vous avez été invité à rejoindre "${groupName}"`,
      data: {
        inviter_id: inviterId,
        conversation_id: conversationId,
        group_name: groupName
      }
    });
    
    logger.info(`Notification d'invitation à un groupe envoyée de ${inviterId} à ${recipientId}`);
  } catch (error) {
    logger.error(`Erreur lors de l'envoi de la notification d'invitation à un groupe: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendNewMessageNotification,
  sendGroupConversationCreatedNotification,
  sendGroupInviteNotification
};