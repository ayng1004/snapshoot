const axios = require('axios');
const logger = require('../utils/logger');

const STORY_SERVICE_URL = process.env.STORY_SERVICE_URL || 'http://story-service:3004';

// Obtenir les détails des stories
const getStoriesDetails = async (storyIds) => {
  try {
    const response = await axios.get(`${STORY_SERVICE_URL}/api/stories/batch`, {
      params: {
        ids: storyIds.join(',')
      }
    });
    
    return response.data.stories || [];
  } catch (error) {
    logger.error(`Erreur lors de la récupération des détails des stories: ${error.message}`);
    return [];
  }
};

// Enregistrer la localisation d'une story
const registerStoryLocation = async (storyId, userId, latitude, longitude) => {
  try {
    const response = await axios.post(`${STORY_SERVICE_URL}/api/stories/${storyId}/location`, {
      latitude,
      longitude,
      user_id: userId
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Erreur lors de l'enregistrement de la localisation de la story: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getStoriesDetails,
  registerStoryLocation
};