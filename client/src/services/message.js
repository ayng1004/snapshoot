// src/services/message.js - Version corrigée
import { apiClient } from './apiClient';

// Envoyer un nouveau message
export const sendMessage = async (conversationId, senderId, content, mediaUrl = null, mediaType = null) => {
  try {
    const messageData = {
      conversation_id: conversationId,
      content,
      media_url: mediaUrl,
      media_type: mediaType
    };
    
    // Cette route correspond à POST /api/messages dans votre backend
    const response = await apiClient.post('/api/messages', messageData);
    return response.data || response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
};

// Obtenir les messages d'une conversation
export const getConversationMessages = async (conversationId, limit = 50, before = null) => {
  try {
    let params = { conversation_id: conversationId, limit };
    if (before) {
      params.before = before;
    }
    
    // Cette route correspond à GET /api/messages?conversation_id=XYZ dans votre backend
    const response = await apiClient.get('/api/messages', { params });
    return response.messages || [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des messages de la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Supprimer un message
export const deleteMessage = async (messageId) => {
  try {
    // Cette route correspond à DELETE /api/messages/:messageId
    const response = await apiClient.delete(`/api/messages/${messageId}`);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la suppression du message ${messageId}:`, error);
    throw error;
  }
};

// Marquer un message comme lu
export const markMessageAsRead = async (messageId) => {
  try {
    // Cette route correspond à PUT /api/messages/:messageId/read
    const response = await apiClient.put(`/api/messages/${messageId}/read`);
    return response;
  } catch (error) {
    console.error(`Erreur lors du marquage du message ${messageId} comme lu:`, error);
    throw error;
  }
};