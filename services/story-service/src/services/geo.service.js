const axios = require('axios');
const logger = require('../utils/logger');

const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL || 'http://geo-service:3003';

// Enregistrer la localisation d'une story
const registerStoryLocation = async (storyId, userId, latitude, longitude) => {
  try {
    const response = await axios.post(`${GEO_SERVICE_URL}/api/locations/update`, {
      reference_id: storyId,
      user_id: userId,
      latitude,
      longitude,
      location_type: 'story'
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Erreur lors de l'enregistrement de la localisation: ${error.message}`);
    throw error;
  }
};

// Supprimer la localisation d'une story
const deleteStoryLocation = async (storyId) => {
  try {
    const response = await axios.delete(`${GEO_SERVICE_URL}/api/locations/story/${storyId}`);
    return response.data;
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la localisation: ${error.message}`);
    throw error;
  }
};

module.exports = {
  registerStoryLocation,
  deleteStoryLocation
};