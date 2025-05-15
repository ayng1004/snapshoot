const express = require('express');
const mediaController = require('../controllers/media.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { upload, handleUploadError } = require('../middleware/upload.middleware');

const router = express.Router();

// Toutes les routes média nécessitent l'authentification
router.use(authMiddleware);

// Upload d'une image de profil
router.post(
  '/profile',
  upload.single('file'),
  handleUploadError,
  mediaController.uploadProfileImage
);

// Upload d'un média pour un message
router.post(
  '/message',
  upload.single('file'),
  handleUploadError,
  mediaController.uploadMessageMedia
);

// Upload d'un média pour une story
router.post(
  '/story',
  upload.single('file'),
  handleUploadError,
  mediaController.uploadStoryMedia
);

// Récupérer un média
router.get('/:mediaId', mediaController.getMedia);

// Supprimer un média
router.delete('/:mediaId', mediaController.deleteMedia);

module.exports = router;