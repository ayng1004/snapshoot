const Story = require('../models/story.model');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const geoService = require('../services/geo.service');
const notificationService = require('../services/notification.service');

// Créer une nouvelle story
const createStory = async (req, res) => {
  try {
    const { media_url, thumbnail_url, media_type, caption, latitude, longitude, is_public } = req.body;
    
    // Valider les données
    if (!media_url || !media_type) {
      return res.status(400).json({ message: 'URL du média et type de média requis' });
    }
    
    if (!['image', 'video'].includes(media_type)) {
      return res.status(400).json({ message: 'Type de média invalide. Doit être "image" ou "video"' });
    }
    
    // Créer l'objet story
    const story = new Story({
      user_id: req.user.id,
      media_url,
      thumbnail_url: thumbnail_url || null,
      media_type,
      caption: caption || '',
      is_public: is_public !== undefined ? is_public : true
    });
    
    // Ajouter les coordonnées si disponibles
    if (latitude !== undefined && longitude !== undefined) {
      story.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }
    
    // Sauvegarder la story
    await story.save();
    
    // Si des coordonnées ont été fournies, enregistrer la localisation
    if (latitude !== undefined && longitude !== undefined) {
      try {
        await geoService.registerStoryLocation(
          story._id.toString(),
          req.user.id,
          parseFloat(latitude),
          parseFloat(longitude)
        );
      } catch (geoError) {
        logger.error(`Erreur lors de l'enregistrement de la localisation: ${geoError.message}`);
        // On continue malgré l'erreur, car la story a été créée
      }
    }
    
    // Notifier les amis de l'utilisateur (asynchrone)
    notificationService.sendNewStoryNotification(req.user.id, story._id.toString())
      .catch(err => logger.error(`Erreur lors de l'envoi des notifications: ${err.message}`));
    
    return res.status(201).json({
      message: 'Story créée avec succès',
      story: {
        id: story._id,
        user_id: story.user_id,
        media_url: story.media_url,
        thumbnail_url: story.thumbnail_url,
        media_type: story.media_type,
        caption: story.caption,
        location: story.location.coordinates.length ? {
          latitude: story.location.coordinates[1],
          longitude: story.location.coordinates[0]
        } : null,
        is_public: story.is_public,
        created_at: story.created_at,
        expires_at: story.expires_at,
        viewers_count: 0
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la création de la story: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la création de la story' });
  }
};

// Obtenir toutes les stories d'un utilisateur
const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier si l'utilisateur existe
    // Idéalement, vérifier auprès du service d'authentification
    
    // Récupérer les stories non expirées
    const stories = await Story.find({
      user_id: userId,
      expires_at: { $gt: new Date() }
    })
    .sort({ created_at: -1 });
    
    // Traiter les stories pour le client
    const processedStories = stories.map(story => ({
      id: story._id,
      user_id: story.user_id,
      media_url: story.media_url,
      thumbnail_url: story.thumbnail_url,
      media_type: story.media_type,
      caption: story.caption,
      location: story.location.coordinates.length ? {
        latitude: story.location.coordinates[1],
        longitude: story.location.coordinates[0]
      } : null,
      is_public: story.is_public,
      created_at: story.created_at,
      expires_at: story.expires_at,
      viewers_count: story.viewers.length,
      viewed: story.viewers.some(viewer => viewer.user_id === req.user.id)
    }));
    
    return res.status(200).json({
      stories: processedStories,
      count: processedStories.length
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des stories: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des stories' });
  }
};

// Obtenir les stories de l'utilisateur connecté
const getCurrentUserStories = async (req, res) => {
  try {
    // Récupérer les stories non expirées de l'utilisateur connecté
    const stories = await Story.find({
      user_id: req.user.id,
      expires_at: { $gt: new Date() }
    })
    .sort({ created_at: -1 });
    
    // Traiter les stories pour le client
    const processedStories = stories.map(story => ({
      id: story._id,
      user_id: story.user_id,
      media_url: story.media_url,
      thumbnail_url: story.thumbnail_url,
      media_type: story.media_type,
      caption: story.caption,
      location: story.location.coordinates.length ? {
        latitude: story.location.coordinates[1],
        longitude: story.location.coordinates[0]
      } : null,
      is_public: story.is_public,
      created_at: story.created_at,
      expires_at: story.expires_at,
      viewers_count: story.viewers.length,
      viewers: story.viewers
    }));
    
    return res.status(200).json({
      stories: processedStories,
      count: processedStories.length
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des stories: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des stories' });
  }
};

// Obtenir une story par son ID
const getStoryById = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'ID de story invalide' });
    }
    
    // Récupérer la story
    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story non trouvée' });
    }
    
    // Vérifier si la story est expirée
    if (story.isExpired) {
      return res.status(404).json({ message: 'Story expirée' });
    }
    
    // Vérifier si l'utilisateur a accès à la story
    if (!story.is_public && story.user_id !== req.user.id) {
      // Vérifier si l'utilisateur est ami avec le créateur de la story
      // Idéalement, vérifier auprès du service d'authentification
      return res.status(403).json({ message: 'Vous n\'avez pas accès à cette story' });
    }
    
    // Marquer automatiquement comme vue si ce n'est pas la story de l'utilisateur
    if (story.user_id !== req.user.id) {
      await story.markAsViewed(req.user.id);
    }
    
    return res.status(200).json({
      story: {
        id: story._id,
        user_id: story.user_id,
        media_url: story.media_url,
        thumbnail_url: story.thumbnail_url,
        media_type: story.media_type,
        caption: story.caption,
        location: story.location.coordinates.length ? {
          latitude: story.location.coordinates[1],
          longitude: story.location.coordinates[0]
        } : null,
        is_public: story.is_public,
        created_at: story.created_at,
        expires_at: story.expires_at,
        viewers_count: story.viewers.length,
        viewed: story.viewers.some(viewer => viewer.user_id === req.user.id)
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la story: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération de la story' });
  }
};

// Obtenir plusieurs stories par leurs IDs
const getBatchStories = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ message: 'IDs de stories requis' });
    }
    
    const storyIds = ids.split(',');
    
    // Vérifier si les IDs sont valides
    const validIds = storyIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'Aucun ID de story valide' });
    }
    
    // Récupérer les stories
    const stories = await Story.find({
      _id: { $in: validIds },
      expires_at: { $gt: new Date() }
    });
    
    // Filtrer les stories selon les droits d'accès
    const accessibleStories = stories.filter(story => 
      story.is_public || story.user_id === req.user.id
    );
    
    // Traiter les stories pour le client
    const processedStories = accessibleStories.map(story => ({
      id: story._id,
      user_id: story.user_id,
      media_url: story.media_url,
      thumbnail_url: story.thumbnail_url,
      media_type: story.media_type,
      caption: story.caption,
      location: story.location.coordinates.length ? {
        latitude: story.location.coordinates[1],
        longitude: story.location.coordinates[0]
      } : null,
      is_public: story.is_public,
      created_at: story.created_at,
      expires_at: story.expires_at,
      viewers_count: story.viewers.length,
      viewed: story.viewers.some(viewer => viewer.user_id === req.user.id)
    }));
    
    return res.status(200).json({
      stories: processedStories,
      count: processedStories.length
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des stories: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la récupération des stories' });
  }
};

// Marquer une story comme vue
// Marquer une story comme vue
const markStoryAsViewed = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'ID de story invalide' });
    }
    
    // Récupérer la story
    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story non trouvée' });
    }
    
    // Vérifier si la story est expirée
    if (story.isExpired) {
      return res.status(404).json({ message: 'Story expirée' });
    }
    
    // Vérifier si l'utilisateur a accès à la story
    if (!story.is_public && story.user_id !== req.user.id) {
      // Vérifier si l'utilisateur est ami avec le créateur de la story
      // Idéalement, vérifier auprès du service d'authentification
      return res.status(403).json({ message: 'Vous n\'avez pas accès à cette story' });
    }
    
    // Ne pas marquer comme vue si c'est la story de l'utilisateur
    if (story.user_id === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas marquer votre propre story comme vue' });
    }
    
    // Vérifier si la story a déjà été vue par l'utilisateur
    const alreadyViewed = story.viewers.some(viewer => viewer.user_id === req.user.id);
    
    if (alreadyViewed) {
      return res.status(200).json({
        message: 'Story déjà marquée comme vue',
        already_viewed: true
      });
    }
    
    // Marquer la story comme vue
    await story.markAsViewed(req.user.id);
    
    return res.status(200).json({
      message: 'Story marquée comme vue',
      viewers_count: story.viewers.length + 1 // +1 car la mise à jour n'est pas encore prise en compte
    });
  } catch (error) {
    logger.error(`Erreur lors du marquage de la story comme vue: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors du marquage de la story comme vue' });
  }
};

// Supprimer une story
const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'ID de story invalide' });
    }
    
    // Récupérer la story
    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story non trouvée' });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la story
    if (story.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer cette story' });
    }
    
    // Supprimer la story
    await story.deleteOne();
    
    // Essayer de supprimer la localisation associée
    try {
      await geoService.deleteStoryLocation(storyId);
    } catch (geoError) {
      logger.error(`Erreur lors de la suppression de la localisation: ${geoError.message}`);
      // On continue malgré l'erreur, car la story a été supprimée
    }
    
    return res.status(200).json({
      message: 'Story supprimée avec succès'
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la story: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la story' });
  }
};

// Mettre à jour la localisation d'une story
const updateStoryLocation = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { latitude, longitude } = req.body;
    
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({ message: 'ID de story invalide' });
    }
    
    // Valider les coordonnées
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Coordonnées de géolocalisation invalides' });
    }
    
    // Récupérer la story
    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story non trouvée' });
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la story
    if (story.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier cette story' });
    }
    
    // Mettre à jour la localisation
    story.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    
    await story.save();
    
    // Enregistrer la localisation dans le service de géolocalisation
    try {
      await geoService.registerStoryLocation(
        storyId,
        req.user.id,
        parseFloat(latitude),
        parseFloat(longitude)
      );
    } catch (geoError) {
      logger.error(`Erreur lors de l'enregistrement de la localisation: ${geoError.message}`);
      // On continue malgré l'erreur, car la story a été mise à jour
    }
    
    return res.status(200).json({
      message: 'Localisation de la story mise à jour avec succès',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la localisation: ${error.message}`);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la localisation' });
  }
};

module.exports = {
  createStory,
  getUserStories,
  getCurrentUserStories,
  getStoryById,
  getBatchStories,
  markStoryAsViewed,
  deleteStory,
  updateStoryLocation
};