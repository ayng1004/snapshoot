import { apiClient } from './apiClient';

// Créer une nouvelle story
export const createStory = async (mediaUrl, thumbnailUrl, mediaType, caption = '', latitude = null, longitude = null) => {
  try {
    const storyData = {
      media_url: mediaUrl,
      thumbnail_url: thumbnailUrl,
      media_type: mediaType,
      caption
    };
    
    // Ajouter les coordonnées si disponibles
    if (latitude !== null && longitude !== null) {
      storyData.latitude = latitude;
      storyData.longitude = longitude;
    }
    
    const response = await apiClient.post('/api/stories', storyData);
    return response.story;
  } catch (error) {
    console.error('Erreur lors de la création de la story:', error);
    throw error;
  }
};

// Récupérer les stories d'un utilisateur
export const getUserStories = async (userId) => {
  try {
    const response = await apiClient.get(`/api/stories/user/${userId}`);
    return response.stories || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des stories:', error);
    throw error;
  }
};

// Récupérer les stories de l'utilisateur connecté
export const getCurrentUserStories = async () => {
  try {
    const response = await apiClient.get('/api/stories/me');
    return response.stories || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des stories:', error);
    throw error;
  }
};

// Récupérer une story par son ID
export const getStoryById = async (storyId) => {
  try {
    const response = await apiClient.get(`/api/stories/${storyId}`);
    return response.story;
  } catch (error) {
    console.error('Erreur lors de la récupération de la story:', error);
    throw error;
  }
};

// Marquer une story comme vue
export const markStoryAsViewed = async (storyId) => {
  try {
    const response = await apiClient.post(`/api/stories/${storyId}/view`);
    return response;
  } catch (error) {
    console.error('Erreur lors du marquage de la story comme vue:', error);
    throw error;
  }
};

// Supprimer une story
export const deleteStory = async (storyId) => {
  try {
    const response = await apiClient.delete(`/api/stories/${storyId}`);
    return response;
  } catch (error) {
    console.error('Erreur lors de la suppression de la story:', error);
    throw error;
  }
};