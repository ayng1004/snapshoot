const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

// Créer une nouvelle conversation
const createConversation = async (req, res) => {
  try {
    const { participants, is_group, name, avatar } = req.body;
    
    // Vérifier si les participants sont fournis
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Au moins un participant est requis' });
    }
    
    // S'assurer que l'utilisateur actuel est inclus dans les participants
    const allParticipants = [...new Set([...participants, req.user.id])];
    
    // Si ce n'est pas un groupe, vérifier si une conversation existe déjà
    if (!is_group && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOne({
        participants: { $all: allParticipants, $size: 2 },
        is_group: false
      });
      
      if (existingConversation) {
        return res.status(200).json({
          message: 'Conversation existante trouvée',
          conversation: existingConversation
        });
      }
    }
    
    // Créer une nouvelle conversation
    const conversation = new Conversation({
      participants: allParticipants,
      is_group: is_group || false,
      name: name || null,
      avatar: avatar || null,
      created_by: req.user.id
    });
    
    // Initialiser les compteurs de messages non lus
    allParticipants.forEach(userId => {
      conversation.unread_counts.set(userId, 0);
    });
    
    await conversation.save();
    
    // Envoyer des notifications aux participants (sauf à l'utilisateur actuel)
    if (is_group) {
      const otherParticipants = allParticipants.filter(id => id !== req.user.id);
      otherParticipants.forEach(async (userId) => {
        try {
          await notificationService.sendGroupConversationCreatedNotification(
            req.user.id,
            userId,
            conversation._id.toString(),
            name || 'Nouveau groupe'
          );
        } catch (err) {
          logger.error(`Erreur lors de l'envoi de notification à ${userId}: ${err.message}`);
        }
      });
    }
    
    return res.status(201).json({
      message: 'Conversation créée avec succès',
      conversation
    });
  } catch (error) {
    logger.error(`Erreur lors de la création de la conversation: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la création de la conversation' });
  }
};

// Obtenir toutes les conversations de l'utilisateur
const getUserConversations = async (req, res) => {
  try {
    // Trouver toutes les conversations où l'utilisateur est participant
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .sort({ updated_at: -1 })
    .lean();
    
    // Obtenir le dernier message pour chaque conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          conversation_id: conv._id,
          is_deleted: false
        })
        .sort({ created_at: -1 })
        .lean();
        
        // Calculer le nombre de messages non lus pour cet utilisateur
        const unreadCount = conv.unread_counts[req.user.id] || 0;
        
        // Pour les conversations non-groupe, déterminer l'autre participant
        let otherParticipant = null;
        if (!conv.is_group) {
          const otherParticipantId = conv.participants.find(id => id !== req.user.id);
          if (otherParticipantId) {
            // Idéalement, récupérer les infos du participant depuis le service d'authentification
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
    
    return res.status(200).json({ conversations: conversationsWithLastMessage });
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
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Trouver la conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier si l'utilisateur est participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette conversation' });
    }
    
    // Obtenir le dernier message
    const lastMessage = await Message.findOne({
      conversation_id: conversationId,
      is_deleted: false
    })
    .sort({ created_at: -1 })
    .lean();
    
    // Récupérer les informations complètes sur les participants
    // Idéalement, récupérer depuis le service d'authentification
    
    return res.status(200).json({
      conversation: {
        ...conversation.toObject(),
        lastMessage,
        unreadCount: conversation.unread_counts.get(req.user.id) || 0
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
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Trouver la conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier si l'utilisateur est participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette conversation' });
    }
    
    // Vérifier si c'est une conversation de groupe (seules les conversations de groupe peuvent être modifiées)
    if (!conversation.is_group) {
      return res.status(400).json({ message: 'Seules les conversations de groupe peuvent être modifiées' });
    }
    
    // Mettre à jour la conversation
    if (name) conversation.name = name;
    if (avatar) conversation.avatar = avatar;
    conversation.updated_at = new Date();
    
    await conversation.save();
    
    return res.status(200).json({
      message: 'Conversation mise à jour avec succès',
      conversation
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
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Trouver la conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier si l'utilisateur actuel est participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette conversation' });
    }
    
    // Vérifier si c'est une conversation de groupe
    if (!conversation.is_group) {
      return res.status(400).json({ message: 'Seules les conversations de groupe peuvent avoir des participants ajoutés' });
    }
    
    // Vérifier si l'utilisateur est déjà participant
    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ message: 'Cet utilisateur est déjà participant' });
    }
    
    // Ajouter le participant
    conversation.addParticipant(userId);
    conversation.updated_at = new Date();
    
    await conversation.save();
    
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
      conversation
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
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Trouver la conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier si l'utilisateur actuel est participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette conversation' });
    }
    
    // Vérifier si c'est une conversation de groupe
    if (!conversation.is_group) {
      return res.status(400).json({ message: 'Seules les conversations de groupe peuvent avoir des participants supprimés' });
    }
    
    // Deux cas : l'utilisateur se supprime lui-même, ou un utilisateur en supprime un autre
    if (userId === req.user.id || req.user.id === conversation.created_by) {
      // Supprimer le participant
      conversation.removeParticipant(userId);
      conversation.updated_at = new Date();
      
      await conversation.save();
      
      return res.status(200).json({
        message: 'Participant supprimé avec succès',
        conversation
      });
    } else {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce participant' });
    }
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
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Trouver la conversation
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier si l'utilisateur est participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette conversation' });
    }
    
    // Réinitialiser le compteur de messages non lus
    conversation.resetUnreadCount(req.user.id);
    await conversation.save();
    
    // Marquer tous les messages non lus comme lus
    await Message.updateMany(
      {
        conversation_id: conversationId,
        'read_by.user_id': { $ne: req.user.id }
      },
      {
        $push: {
          read_by: {
            user_id: req.user.id,
            read_at: new Date()
          }
        }
      }
    );
    
    return res.status(200).json({
      message: 'Conversation marquée comme lue'
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