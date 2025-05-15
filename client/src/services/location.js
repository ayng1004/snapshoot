import { apiClient } from './apiClient';

// Mettre à jour la position de l'utilisateur
export const updateUserLocation = async (latitude, longitude, accuracy = null) => {
  try {
    const response = await apiClient.post('/api/locations/update', {
      latitude,
      longitude,
      accuracy
    });
    return response;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la position:', error);
    throw error;
  }
};

// Récupérer les utilisateurs à proximité
export const getNearbyUsers = async (radius = 5000) => {
  try {
    const response = await apiClient.get('/api/locations/nearby/users', {
      params: { radius }
    });
    return response.users || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs à proximité:', error);
    throw error;
  }
};

// Récupérer les stories à proximité
export const getNearbyStories = async (radius = 10000, latitude = null, longitude = null) => {
  try {
    const params = { radius };
    
    if (latitude !== null && longitude !== null) {
      params.latitude = latitude;
      params.longitude = longitude;
    }
    
   const response = await apiClient.get('/api/locations/nearby/stories', {
      params
    });
    return response.stories || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des stories à proximité:', error);
    throw error;
  }
};