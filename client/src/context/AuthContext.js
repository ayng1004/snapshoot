// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext,useCallback  } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// URL de base de l'API Gateway
const API_BASE_URL = 'http://192.168.1.50:8080'; // À changer avec votre adresse IP

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Vérifier si l'utilisateur est connecté au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userJson = await AsyncStorage.getItem('user');
        const profileJson = await AsyncStorage.getItem('user_profile');
        
        if (token && userJson) {
          const parsedUser = JSON.parse(userJson);
          setUser(parsedUser);
          
          // Charger le profil s'il existe en local
          if (profileJson) {
            setUserProfile(JSON.parse(profileJson));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadUser();
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      if (!user?.id) {
        // Créer un profil par défaut si l'utilisateur n'est pas connecté
        const defaultProfile = {
          display_name: 'Utilisateur',
          bio: '',
          profile_image: null,
          location: ''
        };
        setUserProfile(defaultProfile);
        return { success: false, error: 'Utilisateur non connecté' };
      }
      
      setLoading(true);
      console.log('Rafraîchissement du profil pour', user.id);
      
      const token = await AsyncStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      console.log('Réponse du profil:', JSON.stringify(response.data, null, 2));
      
      // Analyser la structure de la réponse
      let profileData;
      
      if (response.data.user && response.data.user.profile) {
        profileData = response.data.user.profile;
      } else if (response.data.user) {
        profileData = {
          display_name: response.data.user.display_name || user.email.split('@')[0],
          bio: response.data.user.bio || '',
          profile_image: response.data.user.profile_image || null,
          location: response.data.user.location || ''
        };
      } else if (response.data.profile) {
        profileData = response.data.profile;
      } else {
        profileData = {
          display_name: response.data.display_name || user.email.split('@')[0],
          bio: response.data.bio || '',
          profile_image: response.data.profile_image || null,
          location: response.data.location || ''
        };
      }
      
      setUserProfile(profileData);
      await AsyncStorage.setItem('user_profile', JSON.stringify(profileData));
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
      
      // Créer un profil par défaut en cas d'erreur
      const defaultProfile = {
        display_name: user?.email?.split('@')[0] || 'Utilisateur',
        bio: '',
        profile_image: null,
        location: ''
      };
      setUserProfile(defaultProfile);
      await AsyncStorage.setItem('user_profile', JSON.stringify(defaultProfile));
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur lors du chargement du profil'
      };
    } finally {
      setLoading(false);
    }
  }, [user]);
  const updateProfile = async (profileData) => {
  try {
    setLoading(true);
    
    // Assurez-vous que les noms de propriétés correspondent à ce que votre API attend
    // Conversion des noms de propriétés si nécessaire
    const apiProfileData = {
      display_name: profileData.display_name,
      bio: profileData.bio,
      profile_image: profileData.profile_image,
      location: profileData.location
    };
    
    const token = await AsyncStorage.getItem('auth_token');
    const response = await axios.put(`${API_BASE_URL}/api/users/me`, apiProfileData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Manipuler la réponse selon la structure de votre API
    if (response.data && (response.data.profile || response.data.user)) {
      const updatedProfile = response.data.profile || response.data.user.profile || apiProfileData;
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Erreur lors de la mise à jour du profil'
    };
  } finally {
    setLoading(false);
  }
};
  // Fonction de connexion
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      const { token, user, profile } = response.data;

      // Stocker le token et les infos utilisateur
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Stocker le profil s'il existe
      if (profile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
        setUserProfile(profile);
      }

      setUser(user);
      await refreshProfile();

      return user;
    } catch (error) {
      console.error('Erreur de connexion:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const signUp = async (email, password, displayName) => {
    setLoading(true);
    try {
      console.log('Données envoyées au serveur:', { email, password, displayName });
      
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/auth/register`,
        data: {
          email,
          password,
          displayName
        },
        validateStatus: function (status) {
          return true; 
        }
      });
      
      console.log('Réponse complète:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });

      if (response.status >= 400) {
        throw new Error(response.data?.message || `Erreur ${response.status}`);
      }

      const { token, user } = response.data;

      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return user;
    } catch (error) {
      console.error('Erreur détaillée:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    setLoading(true);
    try {
      // Appel optionnel à l'API pour invalider le token
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer les données locales dans tous les cas
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('user_profile');
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };
// Dans votre fichier de démarrage ou dans AuthContext.js
const checkApiConnection = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('API Gateway status:', response.data);
    return true;
  } catch (error) {
    console.error('Impossible de se connecter à l\'API Gateway:', error);
    // Afficher une alerte ou un toast pour informer l'utilisateur
    Alert.alert(
      'Erreur de connexion',
      'Impossible de se connecter au serveur. Vérifiez votre connexion réseau ou réessayez plus tard.',
      [{ text: 'OK' }]
    );
    return false;
  }
};
  // Valeur du contexte
  const value = {
    user,
    userProfile,
    loading,
    initialized,
    checkApiConnection,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};