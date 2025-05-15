const express = require('express');
const messageController = require('../controllers/message.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes de message nécessitent l'authentification
router.use(authMiddleware);

// Envoyer un nouveau message
router.post('/', messageController.sendMessage);

// Obtenir les messages d'une conversation
router.get('/', messageController.getConversationMessages);

// Supprimer un message
router.delete('/:messageId', messageController.deleteMessage);

// Marquer un message comme lu
router.put('/:messageId/read', messageController.markMessageAsRead);

module.exports = router;