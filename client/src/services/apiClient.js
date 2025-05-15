import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base de l'API Gateway
// Remplacez cette URL par l'adresse IP ou le nom d'hôte de votre machine
// où tourne l'API Gateway via Docker
const API_BASE_URL = 'http://192.168.1.27:8080'; // À ajuster selon votre configuration

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 secondes
    });
    
    // Intercepteur pour ajouter le token à chaque requête
    this.client.interceptors.request.use(
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
    
    // Intercepteur pour gérer les erreurs globalement
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Gérer les erreurs 401 (non autorisé)
        if (error.response && error.response.status === 401) {
          // Supprimer le token et rediriger vers la page de connexion
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user');
          
          // Vous devriez implémenter un mécanisme pour notifier l'application
          // de rediriger vers l'écran de connexion
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Méthodes HTTP
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }
  
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }
  
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }
  
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }
  
  // Upload de fichiers
  async uploadFile(url, file, onProgress, additionalData = {}) {
    try {
      const formData = new FormData();
      
      // Ajouter le fichier
      formData.append('file', {
        uri: file.uri,
        name: file.name || `file-${Date.now()}${file.uri.substring(file.uri.lastIndexOf('.'))}`,
        type: file.type || 'application/octet-stream'
      });
      
      // Ajouter les données supplémentaires
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
      
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      
      return response.data;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }
  
  // Gestion d'erreur
  _handleError(error) {
    // On peut ajouter ici une logique de journalisation des erreurs
    console.error('API Error:', error.response?.data || error.message);
  }
  
  // Fonctions d'authentification
  async login(email, password) {
    try {
      const response = await this.post('/api/auth/login', { email, password });
      
      if (response.token && response.user) {
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }
  
  async register(email, password, displayName) {
    try {
      const response = await this.post('/api/auth/register', { email, password, displayName });
      
      if (response.token && response.user) {
        await AsyncStorage.setItem('auth_token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }
  
  async logout() {
    try {
      await this.post('/api/auth/logout');
      
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      // Même en cas d'erreur, on supprime les données locales
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      
      this._handleError(error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();