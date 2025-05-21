const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const authMiddleware = require('../middleware/auth.middleware');
const mockHandlerMiddleware = require('../middleware/mock-handler.middleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Route pour créer une nouvelle conversation
router.post('/', conversationController.createConversation);

// Route pour récupérer toutes les conversations d'un utilisateur
router.get('/', conversationController.getUserConversations);

// Route pour récupérer une conversation spécifique
router.get('/:conversationId', mockHandlerMiddleware, conversationController.getConversationById);

// Route pour mettre à jour une conversation
router.put('/:conversationId', conversationController.updateConversation);

// Route pour marquer une conversation comme lue
router.put('/:conversationId/read', conversationController.markConversationAsRead);

// Route pour ajouter un participant à une conversation de groupe
router.post('/:conversationId/participants', conversationController.addParticipant);

// Route pour supprimer un participant d'une conversation de groupe
router.delete('/:conversationId/participants/:userId', conversationController.removeParticipant);

// Routes pour les messages associés à une conversation
// IMPORTANT: Ces routes sont critiques pour le bon fonctionnement du client mobile
router.get('/:conversationId/messages', mockHandlerMiddleware, (req, res) => {
  const messageController = require('../controllers/message.controller');
  req.query.conversation_id = req.params.conversationId;
  return messageController.getConversationMessages(req, res);
});

router.post('/:conversationId/messages', mockHandlerMiddleware, (req, res) => {
  const messageController = require('../controllers/message.controller');
  req.body.conversation_id = req.params.conversationId;
  return messageController.sendMessage(req, res);
});

module.exports = router;