// src/api/userApi.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base de l'API Gateway - Remplacez par l'adresse de votre API Gateway
const API_BASE_URL = 'http://192.168.1.27:8080'; // À changer avec votre adresse IP

// Client axios avec configuration de base
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Gestion des erreurs
const handleApiError = (error) => {
  console.error('API Error:', error.response?.data || error.message);
  if (error.response?.status === 401) {
    // Token expiré ou invalide
    AsyncStorage.removeItem('auth_token');
    AsyncStorage.removeItem('user');
    // Vous pourriez ajouter ici une logique pour rediriger vers la page de login
  }
  
  // Renvoyer un message d'erreur plus convivial
  const errorMessage = error.response?.data?.message || 'Une erreur s\'est produite';
  throw new Error(errorMessage);
};

// Dans src/api/userApi.js
export const getProfile = async (userId) => {
  try {
    // Si c'est pour l'utilisateur actuel, utilisez la route "me"
    if (!userId || userId === 'me') {
      const response = await apiClient.get('/api/users/me');
      console.log('Profile response:', response.data);
      
      // Adapter selon la structure de réponse API
      if (response.data.user && response.data.user.profile) {
        return response.data.user.profile;
      } else if (response.data.user) {
        return response.data.user;
      } else if (response.data.profile) {
        return response.data.profile;
      }
      
      return response.data;
    } else {
      // Sinon, utilisez la route avec l'ID spécifique
      const response = await apiClient.get(`/api/users/${userId}`);
      console.log('Profile response:', response.data);
      
      // Adapter selon la structure de réponse API
      if (response.data.user && response.data.user.profile) {
        return response.data.user.profile;
      } else if (response.data.user) {
        return response.data.user;
      } else if (response.data.profile) {
        return response.data.profile;
      }
      
      return response.data;
    }
  } catch (error) {
    console.error('Erreur dans getProfile:', error);
    
    // Profil par défaut en cas d'erreur
    return {
      id: userId || 'unknown',
      display_name: 'Utilisateur',
      bio: '',
      profile_image: null,
      location: ''
    };
  }
};
// Récupérer le profil de l'utilisateur actuel
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Mettre à jour le profil d'un utilisateur
export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/api/users/me', profileData);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Rechercher des utilisateurs
export const searchUsers = async (query) => {
  try {
    const response = await apiClient.get('/api/users/search', {
      params: { query }
    });
    return response.data.users || [];
  } catch (error) {
    console.error('Erreur dans searchUsers:', error);
    return [];
  }
};