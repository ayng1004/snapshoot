// src/api/geoApi.js
import supabase from './supabaseClient';

// Enregistrer la position d'un utilisateur
export const updateUserLocation = async (userId, latitude, longitude) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      latitude,
      longitude,
      last_location_update: new Date().toISOString()
    })
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data;
};

// Publier une story géolocalisée
export const postGeoStory = async (userId, content, latitude, longitude, mediaUrl, expiresAt) => {
  const { data, error } = await supabase
    .from('geo_stories')
    .insert({
      user_id: userId,
      content,
      latitude,
      longitude,
      media_url: mediaUrl,
      expires_at: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h par défaut
    })
    .select();

  if (error) throw error;
  return data;
};

// Récupérer les stories à proximité
export const getNearbyStories = async (latitude, longitude, radiusInKm = 5) => {
  // Cette requête nécessite généralement une fonction PostGIS côté serveur
  const { data, error } = await supabase
    .rpc('get_nearby_stories', { 
      lat: latitude,
      lng: longitude,
      radius_km: radiusInKm
    });

  if (error) throw error;
  return data;
};