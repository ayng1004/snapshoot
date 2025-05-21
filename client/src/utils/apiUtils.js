// src/utils/apiUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildUrl } from '../config/config';

/**
 * Fonction utilitaire pour faire des appels API avec fetch
 * @param {string} endpoint - Le point de terminaison de l'API (sans l'URL de base)
 * @param {string} method - La méthode HTTP (GET, POST, PUT, DELETE)
 * @param {Object} data - Les données à envoyer au serveur (pour POST, PUT)
 * @param {boolean} requiresAuth - Si l'appel nécessite une authentification
 * @returns {Promise<any>} - La réponse JSON de l'API
 */
export const apiCall = async (endpoint, method = 'GET', data = null, requiresAuth = true) => {
  try {
    // Construire l'URL complète
    const url = buildUrl(endpoint);
    
    // Construire les options
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Ajouter les données si nécessaire
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    // Ajouter le token d'authentification si nécessaire
    if (requiresAuth) {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        options.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log pour le débogage
    console.log(`API Call: ${method} ${url}`);
    if (data) {
      console.log('Données:', data);
    }
    
    // Faire l'appel API
    const response = await fetch(url, options);
    
    // Convertir la réponse en JSON (peut lancer une erreur si la réponse n'est pas du JSON)
    const responseData = await response.json();
    
    // Log de la réponse pour le débogage
    console.log(`API Response (${response.status}):`, responseData);
    
    // Gérer les erreurs basées sur le statut HTTP
    if (!response.ok) {
      throw new Error(responseData.message || `Erreur ${response.status}`);
    }
    
    // Retourner les données
    return responseData;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Fonctions d'aide pour les différentes méthodes HTTP
 */
export const api = {
  get: (endpoint, requiresAuth = true) => apiCall(endpoint, 'GET', null, requiresAuth),
  post: (endpoint, data, requiresAuth = true) => apiCall(endpoint, 'POST', data, requiresAuth),
  put: (endpoint, data, requiresAuth = true) => apiCall(endpoint, 'PUT', data, requiresAuth),
  delete: (endpoint, requiresAuth = true) => apiCall(endpoint, 'DELETE', null, requiresAuth),
};

/**
 * Fonctions d'authentification
 */
export const auth = {
  login: async (email, password) => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password }, false);
      
      // Stocker le token et les informations utilisateur
      if (response.token) {
        await AsyncStorage.setItem('auth_token', response.token);
      }
      
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      if (response.profile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(response.profile));
      }
      
      return response;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },
  
  register: async (email, password, displayName) => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, { 
        email, 
        password, 
        displayName 
      }, false);
      
      // Stocker le token et les informations utilisateur
      if (response.token) {
        await AsyncStorage.setItem('auth_token', response.token);
      }
      
      if (response.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      // Appeler l'API de déconnexion
      await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      // Supprimer les données locales dans tous les cas
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_profile');
    }
  },
  
  checkConnection: async () => {
    try {
      await api.get(API_CONFIG.ENDPOINTS.HEALTH, false);
      return true;
    } catch (error) {
      console.error('Erreur de connexion au serveur:', error);
      return false;
    }
  }
};

export default {
  api,
  auth
};