const express = require('express');
const conversationController = require('../controllers/conversation.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes de conversation nécessitent l'authentification
router.use(authMiddleware);

// Créer une nouvelle conversation
router.post('/', conversationController.createConversation);

// Obtenir toutes les conversations de l'utilisateur
router.get('/', conversationController.getUserConversations);

// Obtenir une conversation spécifique
router.get('/:conversationId', conversationController.getConversationById);

// Mettre à jour une conversation (nom, avatar)
router.put('/:conversationId', conversationController.updateConversation);

// Ajouter un participant à une conversation de groupe
router.post('/:conversationId/participants', conversationController.addParticipant);

// Supprimer un participant d'une conversation de groupe
router.delete('/:conversationId/participants/:userId', conversationController.removeParticipant);

// Marquer une conversation comme lue
router.put('/:conversationId/read', conversationController.markConversationAsRead);

module.exports = router;