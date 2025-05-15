const express = require('express');
const storyController = require('../controllers/story.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Toutes les routes de story nécessitent l'authentification
router.use(authMiddleware);

// Créer une nouvelle story
router.post('/', storyController.createStory);

// Obtenir toutes les stories d'un utilisateur
router.get('/user/:userId', storyController.getUserStories);

// Obtenir les stories de l'utilisateur connecté
router.get('/me', storyController.getCurrentUserStories);

// Obtenir une story par son ID
router.get('/:storyId', storyController.getStoryById);

// Obtenir plusieurs stories par leurs IDs
router.get('/batch', storyController.getBatchStories);

// Marquer une story comme vue
router.post('/:storyId/view', storyController.markStoryAsViewed);

// Supprimer une story
router.delete('/:storyId', storyController.deleteStory);

// Mettre à jour la localisation d'une story
router.post('/:storyId/location', storyController.updateStoryLocation);

module.exports = router;