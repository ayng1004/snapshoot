// src/services/storage.js
import supabase from './apiClient';

/**
 * Upload d'une image de profil
 * @param {string} uri - URI locale de l'image
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<string>} - URL publique de l'image uploadée
 */
export const uploadProfileImage = async (uri, userId) => {
  try {
    // Convertir URI en blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload vers le bucket "avatars"
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob);
    
    if (uploadError) throw uploadError;
    
    // Récupérer l'URL publique
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    throw error;
  }
};

/**
 * Upload d'un média (image ou vidéo) pour un message ou une story
 * @param {string} uri - URI locale du média
 * @param {string} type - Type de média ('message' ou 'story')
 * @param {string} userId - ID de l'utilisateur
 * @param {string} [chatId] - ID de la conversation (optionnel)
 * @returns {Promise<string>} - URL publique du média uploadé
 */
export const uploadMedia = async (uri, type, userId, chatId = null) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // Définir le chemin selon le type de média
    let filePath;
    if (type === 'message' && chatId) {
      filePath = `messages/${chatId}/${userId}/${fileName}`;
    } else if (type === 'story') {
      filePath = `stories/${userId}/${fileName}`;
    } else {
      filePath = `other/${userId}/${fileName}`;
    }
    
    // Upload vers le bucket "media"
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, blob);
    
    if (uploadError) throw uploadError;
    
    // Récupérer l'URL publique
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload du média:', error);
    throw error;
  }
};