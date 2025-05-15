const express = require('express');
const friendController = require('../controllers/friend.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes d'ami nécessitent l'authentification
router.use(authMiddleware);

// Obtenir la liste d'amis de l'utilisateur connecté
router.get('/', friendController.getFriends);

// Envoyer une demande d'ami
router.post('/request/:userId', friendController.sendFriendRequest);

// Accepter une demande d'ami
router.put('/accept/:requestId', friendController.acceptFriendRequest);

// Rejeter une demande d'ami
router.put('/reject/:requestId', friendController.rejectFriendRequest);

// Supprimer un ami
router.delete('/:friendId', friendController.removeFriend);

// Obtenir les demandes d'ami en attente
router.get('/pending', friendController.getPendingFriendRequests);

module.exports = router;