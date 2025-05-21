const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');
const db = require('../config/database');

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// Obtenir les participants actifs d'une conversation
const getActiveParticipants = async (conversationId) => {
  try {
    const result = await db.query(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND is_active = true',
      [conversationId]
    );
    return result.rows.map(row => row.user_id);
  } catch (error) {
    logger.error(`Erreur lors de la récupération des participants: ${error.message}`);
    throw error;
  }
};

// Réinitialiser le compteur de messages non lus
const resetUnreadCount = async (conversationId, userId) => {
  try {
    await db.query(
      'UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
  } catch (error) {
    logger.error(`Erreur lors de la réinitialisation du compteur: ${error.message}`);
    throw error;
  }
};

// Envoyer un nouveau message
const sendMessage = async (req, res) => {
  logger.info(`Début sendMessage pour conversation ${req.body.conversation_id}`);
  
  try {
    const { conversation_id, content, media_url, media_type } = req.body;
    
    if (!isValidUUID(conversation_id)) {
      logger.warn(`UUID invalide: ${conversation_id}`);
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    if (!content && !media_url) {
      return res.status(400).json({ message: 'Le message doit contenir du texte ou un média' });
    }

    // Vérifier si la conversation existe
    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1',
      [conversation_id]
    );
    
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier si l'utilisateur est participant actif
    const participants = await getActiveParticipants(conversation_id);
    
    if (!participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Utiliser une transaction pour garantir l'intégrité des données
    return await db.transaction(async (client) => {
      // Créer le message
      const messageId = uuidv4();
      const now = new Date();
      
      const messageResult = await client.query(
        `INSERT INTO messages 
         (id, conversation_id, sender_id, content, media_url, media_type, created_at, updated_at, is_deleted) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [messageId, conversation_id, req.user.id, content, media_url, media_type, now, now, false]
      );
      
      const message = messageResult.rows[0];

      // Marquer le message comme lu par l'expéditeur
      await client.query(
        `INSERT INTO message_reads (message_id, user_id, read_at) 
         VALUES ($1, $2, $3)`,
        [messageId, req.user.id, now]
      );

      // Mettre à jour le compteur de messages non lus pour les autres participants
      await client.query(
        `UPDATE conversation_participants 
         SET unread_count = unread_count + 1 
         WHERE conversation_id = $1 AND user_id != $2 AND is_active = true`,
        [conversation_id, req.user.id]
      );

      // Mettre à jour la date de dernière activité de la conversation
      await client.query(
        'UPDATE conversations SET updated_at = $1 WHERE id = $2',
        [now, conversation_id]
      );

      // Envoyer des notifications
      const conversation = conversationResult.rows[0];
      const otherParticipants = participants.filter(p => p !== req.user.id);
      
      for (const userId of otherParticipants) {
        try {
          await notificationService.sendNewMessageNotification(
            req.user.id,
            userId,
            conversation_id,
            conversation.is_group ? (conversation.name || 'Groupe') : null,
            content || 'A envoyé un média'
          ).catch(err => logger.error(`Notification erreur: ${err.message}`));
        } catch (notifError) {
          logger.error(`Erreur d'envoi de notification: ${notifError.message}`);
          // Continuer même si l'envoi de notification échoue
        }
      }

      return res.status(201).json({ 
        message: 'Message envoyé avec succès', 
        data: message 
      });
    });
  } catch (error) {
    logger.error(`Erreur envoi message: ${error.message}`);
    return res.status(500).json({ message: 'Erreur envoi message' });
  }
};

// Récupérer les messages d'une conversation
const getConversationMessages = async (req, res) => {
  try {
    const { conversation_id, limit = 50, before } = req.query;
    
    if (!isValidUUID(conversation_id)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }

    // Vérifier si la conversation existe
    const conversationResult = await db.query(
      'SELECT * FROM conversations WHERE id = $1',
      [conversation_id]
    );
    
    if (conversationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier si l'utilisateur est participant actif
    const participants = await getActiveParticipants(conversation_id);
    
    if (!participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Récupérer les messages
    let messagesQuery;
    const limitValue = parseInt(limit);
    
    if (before && isValidUUID(before)) {
      messagesQuery = await db.query(
        `SELECT m.*, 
         EXISTS(SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = $3) AS is_read
         FROM messages m 
         WHERE m.conversation_id = $1 AND m.is_deleted = false AND m.id < $4
         ORDER BY m.created_at DESC 
         LIMIT $2`,
        [conversation_id, limitValue, req.user.id, before]
      );
    } else {
      messagesQuery = await db.query(
        `SELECT m.*, 
         EXISTS(SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = $3) AS is_read
         FROM messages m 
         WHERE m.conversation_id = $1 AND m.is_deleted = false
         ORDER BY m.created_at DESC 
         LIMIT $2`,
        [conversation_id, limitValue, req.user.id]
      );
    }
    
    const messages = messagesQuery.rows;

    // Mettre à jour les statuts de lecture
    await db.transaction(async (client) => {
      const now = new Date();
      
      for (const msg of messages) {
        if (!msg.is_read) {
          await client.query(
            `INSERT INTO message_reads (message_id, user_id, read_at) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (message_id, user_id) DO NOTHING`,
            [msg.id, req.user.id, now]
          );
        }
      }
      
      // Réinitialiser le compteur de messages non lus
      await client.query(
        'UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = $1 AND user_id = $2',
        [conversation_id, req.user.id]
      );
    });

    // Trier les messages par date croissante avant de les renvoyer
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.status(200).json({ messages });
  } catch (error) {
    logger.error(`Erreur récupération messages: ${error.message}`);
    return res.status(500).json({ message: 'Erreur récupération messages' });
  }
};

// Supprimer un message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!isValidUUID(messageId)) {
      return res.status(400).json({ message: 'ID de message invalide' });
    }

    // Vérifier si le message existe
    const messageResult = await db.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    const message = messageResult.rows[0];
    
    // Vérifier si l'utilisateur est l'expéditeur du message
    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce message' });
    }
    
    // Supprimer logiquement le message
    await db.transaction(async (client) => {
      await client.query(
        `UPDATE messages 
         SET is_deleted = true, content = NULL, media_url = NULL, updated_at = $1 
         WHERE id = $2`,
        [new Date(), messageId]
      );
    });

    return res.status(200).json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    logger.error(`Erreur suppression message: ${error.message}`);
    return res.status(500).json({ message: 'Erreur suppression message' });
  }
};

// Marquer un message comme lu
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!isValidUUID(messageId)) {
      return res.status(400).json({ message: 'ID de message invalide' });
    }

    // Vérifier si le message existe
    const messageResult = await db.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    const message = messageResult.rows[0];

    // Vérifier si l'utilisateur est participant à la conversation
    const participants = await getActiveParticipants(message.conversation_id);
    
    if (!participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Marquer le message comme lu
    await db.query(
      `INSERT INTO message_reads (message_id, user_id, read_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageId, req.user.id, new Date()]
    );

    return res.status(200).json({ message: 'Message marqué comme lu' });
  } catch (error) {
    logger.error(`Erreur lecture message: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lecture message' });
  }
};

module.exports = {
  sendMessage,
  getConversationMessages,
  deleteMessage,
  markMessageAsRead
};