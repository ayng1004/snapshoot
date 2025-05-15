import { apiClient } from './apiClient';

// Récupérer les notifications de l'utilisateur
export const getUserNotifications = async (limit = 20, offset = 0, type = null) => {
  try {
    const params = { limit, offset };
    if (type) params.type = type;
    
    const response = await apiClient.get('/api/notifications', { params });
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

// Récupérer les notifications non lues
export const getUnreadNotifications = async (limit = 20) => {
  try {
    const response = await apiClient.get('/api/notifications/unread', {
      params: { limit }
    });
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications non lues:', error);
    throw error;
  }
};

// Marquer une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
    return response;
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    throw error;
  }
};

// Marquer toutes les notifications comme lues
export const markAllNotificationsAsRead = async (type = null) => {
  try {
    const params = {};
    if (type) params.type = type;
    
    const response = await apiClient.put('/api/notifications/read-all', null, {
      params
    });
    return response;
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    throw error;
  }
};

// Supprimer une notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
    return response;
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};