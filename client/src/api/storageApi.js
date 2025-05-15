// src/api/storageApi.js
import supabase from './supabase';
import { updateProfile } from './userApi';

// Téléverser un fichier
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  return data;
};

// Téléverser une image de profil
export const uploadProfileImage = async (userId, file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `profiles/${fileName}`;
  
  // Téléverser le fichier
  await uploadFile('avatars', filePath, file);
  
  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(filePath);
  
  // Mettre à jour le profil avec la nouvelle URL
  await updateProfile(userId, { avatar_url: publicUrl });
  
  return publicUrl;
};

// Téléverser un média pour un message
export const uploadMessageMedia = async (senderId, file) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${senderId}-${Date.now()}.${fileExt}`;
  const filePath = `messages/${fileName}`;
  
  // Téléverser le fichier
  await uploadFile('media', filePath, file);
  
  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase
    .storage
    .from('media')
    .getPublicUrl(filePath);
  
  return publicUrl;
};