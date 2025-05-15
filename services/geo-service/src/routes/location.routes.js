const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const authMiddleware = require('../middleware/auth.middleware');  

// Utiliser authMiddleware directement au lieu de authMiddleware.verifyToken
router.post('/update', authMiddleware, locationController.updateUserLocation);
router.get('/nearby-users', authMiddleware, locationController.getNearbyUsers);
router.get('/nearby-stories', authMiddleware, locationController.getNearbyStories);

module.exports = router;