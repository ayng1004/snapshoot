const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mediaService = require('../services/media.service');
const fileTypeUtils = require('../utils/file-type.utils');
const logger = require('../utils/logger');

// Upload d'une image de profil
const uploadProfileImage = async (req, res) => {
  try {
    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Vérifier si c'est une image
    if (!fileTypeUtils.isImage(req.file.filename)) {
      fileTypeUtils.deleteFile(req.file.path);
      return res.status(400).json({ message: 'Le fichier doit être une image (JPG, PNG, GIF, etc.)' });
    }
    
    // Générer un ID unique
    const mediaId = uuidv4();
    const userId = req.user.id;
    
    // Chemin du fichier local
    const filePath = req.file.path;
    
    // Uploader l'image vers MinIO
    const result = await mediaService.uploadProfileImage(filePath, mediaId, userId);
    
    // Supprimer le fichier local après l'upload
    fileTypeUtils.deleteFile(filePath);
    
    if (!result.success) {
      return res.status(500).json({ message: 'Erreur lors du traitement de l\'image de profil' });
    }
    
    return res.status(201).json({
      message: 'Image de profil uploadée avec succès',
      media: {
        id: mediaId,
        url: result.url,
        thumbnail_url: result.thumbnailUrl,
        type: 'image'
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de l'upload de l'image de profil: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image de profil' });
  }
};

// Upload d'un média pour un message
const uploadMessageMedia = async (req, res) => {
  try {
    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Vérifier le type de fichier
    const isImage = fileTypeUtils.isImage(req.file.filename);
    const isVideo = fileTypeUtils.isVideo(req.file.filename);
    
    if (!isImage && !isVideo) {
      fileTypeUtils.deleteFile(req.file.path);
      return res.status(400).json({ message: 'Type de fichier non pris en charge. Seuls les images et vidéos sont autorisés.' });
    }
    
    // Générer un ID unique
    const mediaId = uuidv4();
    const userId = req.user.id;
    const conversationId = req.body.conversation_id;
    
    if (!conversationId) {
      fileTypeUtils.deleteFile(req.file.path);
      return res.status(400).json({ message: 'L\'ID de conversation est requis' });
    }
    
    // Chemin du fichier local
    const filePath = req.file.path;
    
    // Uploader le média vers MinIO
    let result;
    if (isImage) {
      result = await mediaService.uploadMessageImage(filePath, mediaId, userId, conversationId);
    } else if (isVideo) {
      result = await mediaService.uploadMessageVideo(filePath, mediaId, userId, conversationId);
    }
    
    // Supprimer le fichier local après l'upload
    fileTypeUtils.deleteFile(filePath);
    
    if (!result.success) {
      return res.status(500).json({ message: 'Erreur lors du traitement du média' });
    }
    
    return res.status(201).json({
      message: 'Média uploadé avec succès',
      media: {
        id: mediaId,
        url: result.url,
        thumbnail_url: result.thumbnailUrl,
        type: isImage ? 'image' : 'video'
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de l'upload du média: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'upload du média' });
  }
};

// Upload d'un média pour une story
const uploadStoryMedia = async (req, res) => {
  try {
    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé' });
    }
    
    // Vérifier le type de fichier
    const isImage = fileTypeUtils.isImage(req.file.filename);
    const isVideo = fileTypeUtils.isVideo(req.file.filename);
    
    if (!isImage && !isVideo) {
      fileTypeUtils.deleteFile(req.file.path);
      return res.status(400).json({ message: 'Type de fichier non pris en charge. Seuls les images et vidéos sont autorisés.' });
    }
    
    // Générer un ID unique
    const mediaId = uuidv4();
    const userId = req.user.id;
    
    // Extraire les coordonnées de localisation
    const latitude = parseFloat(req.body.latitude) || null;
    const longitude = parseFloat(req.body.longitude) || null;
    
    // Chemin du fichier local
    const filePath = req.file.path;
    
    // Uploader le média vers MinIO
    let result;
    if (isImage) {
      result = await mediaService.uploadStoryImage(filePath, mediaId, userId, { latitude, longitude });
    } else if (isVideo) {
      result = await mediaService.uploadStoryVideo(filePath, mediaId, userId, { latitude, longitude });
    }
    
    // Supprimer le fichier local après l'upload
    fileTypeUtils.deleteFile(filePath);
    
    if (!result.success) {
      return res.status(500).json({ message: 'Erreur lors du traitement du média' });
    }
    
    return res.status(201).json({
      message: 'Média uploadé avec succès',
      media: {
        id: mediaId,
        url: result.url,
        thumbnail_url: result.thumbnailUrl,
        type: isImage ? 'image' : 'video',
        location: (latitude && longitude) ? { latitude, longitude } : null
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de l'upload du média: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de l\'upload du média' });
  }
};

// Récupérer un média
const getMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { thumbnail } = req.query;
    
    // Récupérer le média
    const result = await mediaService.getMedia(mediaId, !!thumbnail);
    
    if (!result.success) {
      return res.status(404).json({ message: 'Média non trouvé' });
    }
    
    // Rediriger vers l'URL signée de MinIO
    return res.redirect(result.url);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du média: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération du média' });
  }
};

// Supprimer un média
const deleteMedia = async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    // Supprimer le média
    const result = await mediaService.deleteMedia(mediaId, req.user.id);
    
    if (!result.success) {
      return res.status(404).json({ message: 'Média non trouvé ou vous n\'êtes pas autorisé à le supprimer' });
    }
    
    return res.status(200).json({
      message: 'Média supprimé avec succès'
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression du média: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la suppression du média' });
  }
};

module.exports = {
  uploadProfileImage,
  uploadMessageMedia,
  uploadStoryMedia,
  getMedia,
  deleteMedia
};