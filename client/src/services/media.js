import { apiClient } from './apiClient';

// Upload d'image de profil
export const uploadProfileImage = async (imageUri, onProgress = null) => {
  try {
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: `profile-${Date.now()}.jpg`
    };
    
    const response = await apiClient.uploadFile('/api/media/profile', file, onProgress);
    return response.media.url;
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image de profil:', error);
    throw error;
  }
};

// Upload de média pour un message
export const uploadMessageMedia = async (mediaUri, mediaType, conversationId, onProgress = null) => {
  try {
    const isImage = mediaType === 'image';
    
    const file = {
      uri: mediaUri,
      type: isImage ? 'image/jpeg' : 'video/mp4',
      name: `message-${Date.now()}.${isImage ? 'jpg' : 'mp4'}`
    };
    
    const additionalData = {
      conversation_id: conversationId
    };
    
    const response = await apiClient.uploadFile('/api/media/message', file, onProgress, additionalData);
    return response.media.url;
  } catch (error) {
    console.error('Erreur lors de l\'upload du média:', error);
    throw error;
  }
};

// Upload de média pour une story
export const uploadStoryMedia = async (mediaUri, mediaType, latitude = null, longitude = null, onProgress = null) => {
  try {
    const isImage = mediaType === 'image';
    
    const file = {
      uri: mediaUri,
      type: isImage ? 'image/jpeg' : 'video/mp4',
      name: `story-${Date.now()}.${isImage ? 'jpg' : 'mp4'}`
    };
    
    const additionalData = {};
    
    if (latitude !== null && longitude !== null) {
      additionalData.latitude = latitude.toString();
      additionalData.longitude = longitude.toString();
    }
    
    const response = await apiClient.uploadFile('/api/media/story', file, onProgress, additionalData);
    return response.media;
  } catch (error) {
    console.error('Erreur lors de l\'upload du média pour la story:', error);
    throw error;
  }
};