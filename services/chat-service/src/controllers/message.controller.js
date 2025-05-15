const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

// Envoyer un nouveau message
const sendMessage = async (req, res) => {
  try {
    const { conversation_id, content, media_url, media_type } = req.body;
    
    // Vérifier si l'ID de conversation est valide
    if (!conversation_id || !mongoose.Types.ObjectId.isValid(conversation_id)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Vérifier si le contenu ou le média est fourni
    if (!content && !media_url) {
      return res.status(400).json({ message: 'Le message doit contenir du texte ou un média' });
    }
    
    // Trouver la conversation
    const conversation = await Conversation.findById(conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    // Vérifier si l'utilisateur est participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à envoyer des messages dans cette conversation' });
    }
    
    // Créer le message
    const message = new Message({
      conversation_id,
      sender_id: req.user.id,
      content,
      media_url,
      media_type,
      read_by: [{
        user_id: req.user.id,
        read_at: new Date()
      }]
    });
    
    await message.save();
    
    // Mettre à jour la conversation
    conversation.last_message = message._id;
    conversation.updated_at = new Date();
    
    // Incrémenter les compteurs de messages non lus pour tous les participants sauf l'expéditeur
    conversation.participants.forEach(participantId => {
      if (participantId !== req.user.id) {
        conversation.incrementUnreadCount(participantId);
      }
    });
    
    await conversation.save();
    
    // Envoyer des notifications aux autres participants
    const otherParticipants = conversation.participants.filter(id => id !== req.user.id);
    
    otherParticipants.forEach(async (userId) => {
      try {
        await notificationService.sendNewMessageNotification(
          req.user.id,
          userId,
          conversation_id,
          conversation.is_group ? (conversation.name || 'Groupe') : null,
          content || 'A envoyé un média'
        );
      } catch (err) {
        logger.error(`Erreur lors de l'envoi de notification à ${userId}: ${err.message}`);
      }
    });
    
    return res.status(201).json({
      message: 'Message envoyé avec succès',
      data: message
    });
  } catch (error) {
    logger.error(`Erreur lors de l'envoi du message: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
};

// Obtenir les messages d'une conversation
const getConversationMessages = async (req, res) => {
  try {
    const { conversation_id, limit = 50, before } = req.query;
    
    // Vérifier si l'ID de conversation est valide
    if (!conversation_id || !mongoose.Types.ObjectId.isValid(conversation_id)) {
      return res.status(400).json({ message: 'ID de conversation invalide' });
    }
    
    // Vérifier si l'utilisateur est participant de la conversation
    const conversation = await Conversation.findById(conversation_id);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette conversation' });
    }
    
    // Construire la requête pour pagination
    const query = { conversation_id };
    
    if (before && mongoose.Types.ObjectId.isValid(before)) {
      query._id = { $lt: mongoose.Types.ObjectId(before) };
    }
    
    // Récupérer les messages
    const messages = await Message.find(query)
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Marquer automatiquement les messages comme lus
    if (messages.length > 0) {
      const messageIds = messages.map(message => message._id);
      
     await Message.updateMany(
        {
          _id: { $in: messageIds },
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
      
      // Réinitialiser également le compteur de messages non lus
      conversation.resetUnreadCount(req.user.id);
      await conversation.save();
    }
    
    return res.status(200).json({
      messages: messages.reverse() // Inverser pour avoir l'ordre chronologique
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des messages: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
};

// Supprimer un message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Vérifier si l'ID de message est valide
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'ID de message invalide' });
    }
    
    // Trouver le message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    // Vérifier si l'utilisateur est l'expéditeur du message
    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce message' });
    }
    
    // Supprimer virtuellement le message
    message.deleteMessage();
    await message.save();
    
    return res.status(200).json({
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression du message: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la suppression du message' });
  }
};

// Marquer un message comme lu
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Vérifier si l'ID de message est valide
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'ID de message invalide' });
    }
    
    // Trouver le message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    // Vérifier si l'utilisateur est participant de la conversation
    const conversation = await Conversation.findById(message.conversation_id);
    
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à ce message' });
    }
    
    // Marquer le message comme lu
    message.markAsRead(req.user.id);
    await message.save();
    
    return res.status(200).json({
      message: 'Message marqué comme lu'
    });
  } catch (error) {
    logger.error(`Erreur lors du marquage du message comme lu: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors du marquage du message comme lu' });
  }
};

module.exports = {
  sendMessage,
  getConversationMessages,
  deleteMessage,
  markMessageAsRead
};