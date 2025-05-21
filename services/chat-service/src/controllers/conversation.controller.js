const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');
const db = require('../config/database');

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

// Créer une nouvelle conversation
const createConversation = async (req, res) => {
  try {
    logger.info(`Tentative de création d'une conversation: ${JSON.stringify(req.body)}`);
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    const { participants, is_group, name, avatar } = req.body;
    
    // Vérifier si les participants sont fournis
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Au moins un participant est requis' });
    }
    
    // S'assurer que l'utilisateur actuel est inclus dans les participants
    const allParticipants = [...new Set([...participants, req.user.id])];
    
    // Utiliser une transaction pour garantir l'intégrité
    return await db.transaction(async (client) => {
      // Si ce n'est pas un groupe, vérifier si une conversation existe déjà
      if (!is_group && allParticipants.length === 2) {
        const existingConversationQuery = await client.query(
          `SELECT c.* FROM conversations c
           JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = $1
           JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = $2
           WHERE c.is_group = false
           AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2`,
          [allParticipants[0], allParticipants[1]]
        );
        
        if (existingConversationQuery.rows.length > 0) {
          logger.info(`Conversation existante trouvée: ${existingConversationQuery.rows[0].id}`);
          return res.status(200).json({
            message: 'Conversation existante trouvée',
            conversation: existingConversationQuery.rows[0]
          });
        }
      }
      
      // Créer une nouvelle conversation
      const conversationId = uuidv4();
      const now = new Date();
      
      logger.info(`Création d'une nouvelle conversation avec ID: ${conversationId}`);
      
      await client.query(
        `INSERT INTO conversations (id, is_group, name, avatar, created_by, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [conversationId, is_group || false, name, avatar, req.user.id, now, now]
      );
      
      // Ajouter les participants
      for (const participantId of allParticipants) {
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, joined_at, is_active, unread_count) 
           VALUES ($1, $2, $3, $4, $5)`,
          [conversationId, participantId, now, true, 0]
        );
      }
      
      // Récupérer la conversation créée
      const conversationResult = await client.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      const conversation = conversationResult.rows[0];
      
      // Envoyer des notifications aux participants (sauf à l'utilisateur actuel)
      if (is_group) {
        const otherParticipants = allParticipants.filter(id => id !== req.user.id);
        for (const participantId of otherParticipants) {
          try {
            await notificationService.sendGroupConversationCreatedNotification(
              req.user.id,
              participantId,
              conversationId,
              name || 'Nouveau groupe'
            );
          } catch (err) {
            logger.error(`Erreur lors de l'envoi de notification à ${participantId}: ${err.message}`);
          }
        }
      }
      
      logger.info(`Conversation créée avec succès: ${conversationId}`);
      
      return res.status(201).json({
        message: 'Conversation créée avec succès',
        conversation
      });
    });
  } catch (error) {
    logger.error(`Erreur lors de la création de la conversation: ${error.message}`);
    logger.error(error.stack);
    return res.status(500).json({ message: 'Erreur lors de la création de la conversation' });
  }
};

// Obtenir toutes les conversations de l'utilisateur
const getUserConversations = async (req, res) => {
  try {
    // Trouver toutes les conversations où l'utilisateur est participant actif
    const conversationsQuery = await db.query(
      `SELECT c.* FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE cp.user_id = $1 AND cp.is_active = true
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    
    const conversations = conversationsQuery.rows;
    
    // Obtenir le dernier message et les infos complémentaires pour chaque conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Récupérer le dernier message
        const lastMessageQuery = await db.query(
          `SELECT * FROM messages 
           WHERE conversation_id = $1 AND is_deleted = false 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [conv.id]
        );
        
        const lastMessage = lastMessageQuery.rows.length > 0 ? lastMessageQuery.rows[0] : null;
        
        // Récupérer le nombre de messages non lus
        const unreadCountQuery = await db.query(
          `SELECT unread_count FROM conversation_participants 
           WHERE conversation_id = $1 AND user_id = $2`,
          [conv.id, req.user.id]
        );
        
        const unreadCount = unreadCountQuery.rows.length > 0 ? unreadCountQuery.rows[0].unread_count : 0;
        
        // Pour les conversations non-groupe, récupérer l'autre participant
        let otherParticipant = null;
        if (!conv.is_group) {
          const otherParticipantQuery = await db.query(
            `SELECT user_id FROM conversation_participants 
             WHERE conversation_id = $1 AND user_id != $2 AND is_active = true`,
            [conv.id, req.user.id]
          );
          
          if (otherParticipantQuery.rows.length > 0) {
            const otherParticipantId = otherParticipantQuery.rows[0].user_id;
            // Pour l'exemple, on utilise un placeholder
            otherParticipant = {
              id: otherParticipantId,
              username: `user_${otherParticipantId.substring(0, 5)}`
            };
          }
        }
        
        return {
          ...conv,
          lastMessage,
          unreadCount,
          otherParticipant
        };
      })
    );
    
    return res.status(200).json({ conversations: conversationsWithDetails });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des conversations: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des conversations' });
  }
};

// Obtenir une conversation spécifique
const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Vérifier si l'ID de conversation est valide
    if (!isValidUUID(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Trouver la conversation
    const conversationQuery = await db.query(
      'SELECT * FROM conversations WHERE id = $1',
      [conversationId]
    );
    
    if (conversationQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    const conversation = conversationQuery.rows[0];
    
    // Vérifier si l'utilisateur est participant actif
    const participantQuery = await db.query(
      `SELECT * FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
      [conversationId, req.user.id]
    );
    
    if (participantQuery.rows.length === 0) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette conversation' });
    }
    
    // Obtenir le dernier message
    const lastMessageQuery = await db.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 AND is_deleted = false 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [conversationId]
    );
    
    const lastMessage = lastMessageQuery.rows.length > 0 ? lastMessageQuery.rows[0] : null;
    
    // Obtenir le nombre de messages non lus
    const unreadCount = participantQuery.rows[0].unread_count;
    
    // Récupérer tous les participants
    const participantsQuery = await db.query(
      `SELECT cp.user_id, cp.joined_at, cp.is_active 
       FROM conversation_participants cp 
       WHERE cp.conversation_id = $1`,
      [conversationId]
    );
    
    const participants = participantsQuery.rows;
    
    return res.status(200).json({
      conversation: {
        ...conversation,
        lastMessage,
        unreadCount,
        participants
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la conversation: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération de la conversation' });
  }
};

// Mettre à jour une conversation
const updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name, avatar } = req.body;
    
    // Vérifier si l'ID de conversation est valide
    if (!isValidUUID(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    return await db.transaction(async (client) => {
      // Trouver la conversation
      const conversationQuery = await client.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      if (conversationQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Conversation non trouvée' });
      }
      
      const conversation = conversationQuery.rows[0];
      
      // Vérifier si l'utilisateur est participant actif
      const participantQuery = await client.query(
        `SELECT * FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
        [conversationId, req.user.id]
      );
      
      if (participantQuery.rows.length === 0) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette conversation' });
      }
      
      // Vérifier si c'est une conversation de groupe
      if (!conversation.is_group) {
        return res.status(400).json({ message: 'Seules les conversations de groupe peuvent être modifiées' });
      }
      
      // Mettre à jour la conversation
      const now = new Date();
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        updateValues.push(name);
        paramIndex++;
      }
      
      if (avatar !== undefined) {
        updateFields.push(`avatar = $${paramIndex}`);
        updateValues.push(avatar);
        paramIndex++;
      }
      
      updateFields.push(`updated_at = $${paramIndex}`);
      updateValues.push(now);
      paramIndex++;
      
      updateValues.push(conversationId);
      
      if (updateFields.length > 1) { // Au moins un champ à mettre à jour + updated_at
        await client.query(
          `UPDATE conversations SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }
      
      // Récupérer la conversation mise à jour
      const updatedConversationQuery = await client.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      return res.status(200).json({
        message: 'Conversation mise à jour avec succès',
        conversation: updatedConversationQuery.rows[0]
      });
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la conversation: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la conversation' });
  }
};

// Ajouter un participant à une conversation de groupe
const addParticipant = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID utilisateur requis' });
    }
    
    // Vérifier si l'ID de conversation est valide
    if (!isValidUUID(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    return await db.transaction(async (client) => {
      // Trouver la conversation
      const conversationQuery = await client.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      if (conversationQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Conversation non trouvée' });
      }
      
      const conversation = conversationQuery.rows[0];
      
      // Vérifier si l'utilisateur actuel est participant actif
      const participantQuery = await client.query(
        `SELECT * FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
        [conversationId, req.user.id]
      );
      
      if (participantQuery.rows.length === 0) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette conversation' });
      }
      
      // Vérifier si c'est une conversation de groupe
      if (!conversation.is_group) {
        return res.status(400).json({ message: 'Seules les conversations de groupe peuvent avoir des participants ajoutés' });
      }
      
      // Vérifier si l'utilisateur est déjà participant actif
      const existingParticipantQuery = await client.query(
        `SELECT * FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
        [conversationId, userId]
      );
      
      if (existingParticipantQuery.rows.length > 0) {
        return res.status(400).json({ message: 'Cet utilisateur est déjà participant' });
      }
      
      const now = new Date();
      
      // Vérifier si l'utilisateur était déjà participant mais inactif
      const inactiveParticipantQuery = await client.query(
        `SELECT * FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2 AND is_active = false`,
        [conversationId, userId]
      );
      
      if (inactiveParticipantQuery.rows.length > 0) {
        // Réactiver le participant
        await client.query(
          `UPDATE conversation_participants 
           SET is_active = true, joined_at = $1 
           WHERE conversation_id = $2 AND user_id = $3`,
          [now, conversationId, userId]
        );
      } else {
        // Ajouter le nouveau participant
        await client.query(
          `INSERT INTO conversation_participants (conversation_id, user_id, joined_at, is_active, unread_count) 
           VALUES ($1, $2, $3, $4, $5)`,
          [conversationId, userId, now, true, 0]
        );
      }
      
      // Mettre à jour la date de dernière activité de la conversation
      await client.query(
        'UPDATE conversations SET updated_at = $1 WHERE id = $2',
        [now, conversationId]
      );
      
      // Récupérer la conversation mise à jour
      const updatedConversationQuery = await client.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      // Envoyer une notification
      try {
        await notificationService.sendGroupInviteNotification(
          req.user.id,
          userId,
          conversationId,
          conversation.name || 'Groupe de discussion'
        );
      } catch (err) {
        logger.error(`Erreur lors de l'envoi de la notification d'invitation: ${err.message}`);
      }
      
      return res.status(200).json({
        message: 'Participant ajouté avec succès',
        conversation: updatedConversationQuery.rows[0]
      });
    });
  } catch (error) {
    logger.error(`Erreur lors de l'ajout d'un participant: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'ajout d\'un participant' });
  }
};

// Supprimer un participant d'une conversation de groupe
const removeParticipant = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;
    
    // Vérifier si l'ID de conversation est valide
    if (!isValidUUID(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    return await db.transaction(async (client) => {
      // Trouver la conversation
      const conversationQuery = await client.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      if (conversationQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Conversation non trouvée' });
      }
      
      const conversation = conversationQuery.rows[0];
      
      // Vérifier si l'utilisateur actuel est participant actif
      const participantQuery = await client.query(
        `SELECT * FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
        [conversationId, req.user.id]
      );
      
      if (participantQuery.rows.length === 0) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette conversation' });
      }
      
      // Vérifier si c'est une conversation de groupe
      if (!conversation.is_group) {
        return res.status(400).json({ message: 'Seules les conversations de groupe peuvent avoir des participants supprimés' });
      }
      
      // Vérifier si l'utilisateur à supprimer existe et est actif
      const targetParticipantQuery = await client.query(
        `SELECT * FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
        [conversationId, userId]
      );
      
      if (targetParticipantQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Participant non trouvé dans cette conversation' });
      }
      
      // Deux cas : l'utilisateur se supprime lui-même, ou un utilisateur en supprime un autre
      if (userId === req.user.id || req.user.id === conversation.created_by) {
        // Supprimer le participant (mise à jour du statut à inactif)
        await client.query(
          `UPDATE conversation_participants 
           SET is_active = false 
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, userId]
        );
        
        // Mettre à jour la date de dernière activité de la conversation
        await client.query(
          'UPDATE conversations SET updated_at = $1 WHERE id = $2',
          [new Date(), conversationId]
        );
        
        // Récupérer la conversation mise à jour
        const updatedConversationQuery = await client.query(
          'SELECT * FROM conversations WHERE id = $1',
          [conversationId]
        );
        
        return res.status(200).json({
          message: 'Participant supprimé avec succès',
          conversation: updatedConversationQuery.rows[0]
        });
      } else {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce participant' });
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression d'un participant: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la suppression d\'un participant' });
  }
};

// Marquer une conversation comme lue
const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Vérifier si l'ID de conversation est valide
    if (!isValidUUID(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    return await db.transaction(async (client) => {
      // Trouver la conversation
      const conversationQuery = await client.query(
        'SELECT * FROM conversations WHERE id = $1',
        [conversationId]
      );
      
      if (conversationQuery.rows.length === 0) {
        return res.status(404).json({ message: 'Conversation non trouvée' });
      }
      
      // Vérifier si l'utilisateur est participant actif
      const participantQuery = await client.query(
        `SELECT * FROM conversation_participants 
         WHERE conversation_id = $1 AND user_id = $2 AND is_active = true`,
        [conversationId, req.user.id]
      );
      
      if (participantQuery.rows.length === 0) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette conversation' });
      }
      
      // Réinitialiser le compteur de messages non lus
      await client.query(
        `UPDATE conversation_participants 
         SET unread_count = 0 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, req.user.id]
      );
      
      // Marquer tous les messages non lus comme lus
      const now = new Date();
      
      // Récupérer tous les messages non lus par l'utilisateur
      const unreadMessagesQuery = await client.query(
        `SELECT m.id FROM messages m
         LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
         WHERE m.conversation_id = $2 AND m.is_deleted = false AND mr.message_id IS NULL`,
        [req.user.id, conversationId]
      );
      
      // Marquer chaque message comme lu
      for (const row of unreadMessagesQuery.rows) {
        await client.query(
          `INSERT INTO message_reads (message_id, user_id, read_at) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [row.id, req.user.id, now]
        );
      }
      
      return res.status(200).json({
        message: 'Conversation marquée comme lue'
      });
    });
  } catch (error) {
    logger.error(`Erreur lors du marquage de la conversation comme lue: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors du marquage de la conversation comme lue' });
  }
};

module.exports = {
  createConversation,
  getUserConversations,
  getConversationById,
  updateConversation,
  addParticipant,
  removeParticipant,
  markConversationAsRead
};