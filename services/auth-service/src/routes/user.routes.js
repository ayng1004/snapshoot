const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

const router = express.Router();

// Toutes les routes utilisateur nécessitent l'authentification
router.use(authMiddleware);

// Obtenir le profil de l'utilisateur connecté
router.get('/me', userController.getCurrentUser);

// Mettre à jour le profil de l'utilisateur connecté
router.put(
   '/me',
   validationMiddleware.validateProfileUpdate,
   userController.updateCurrentUser
);

// Rechercher des utilisateurs par email ou username (cette route doit venir AVANT la route paramétrée)
router.get('/search', validationMiddleware.validateUserSearch, userController.searchUsers);

// Obtenir le profil d'un utilisateur spécifique
router.get('/:userId', userController.getUserById);

// Obtenir le profil et les détails d'un utilisateur spécifique
router.get('/:userId/profile', userController.getUserProfile);

module.exports = router;