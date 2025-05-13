// src/services/auth.js
import supabase from '../api/supabaseApi';


/**
 * Connexion utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise} - Objet contenant les données de session et utilisateur
 */
export const loginUser = async (email, password) => {
  return await supabase.auth.signIn({ email, password });
};

/**
 * Inscription utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @param {string} username - Nom d'utilisateur
 * @param {string} fullname - Nom complet
 * @returns {Promise} - Objet contenant les données d'utilisateur créé
 */
export const registerUser = async (email, password, username, fullname) => {
  // Vérifier si le nom d'utilisateur existe déjà
  const existingUsers = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase());
  
  if (existingUsers.length > 0) {
    throw new Error('Ce nom d\'utilisateur est déjà pris');
  }
  
  // Créer le compte utilisateur
  const authData = await supabase.auth.signUp({ 
    email, 
    password, 
    options: {
      data: { 
        username, 
        display_name: fullname 
      }
    }
  });
  
  // Créer le profil utilisateur
  if (authData?.user?.id) {
    await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          username: username.toLowerCase(),
          display_name: fullname,
          bio: '',
          profile_image: ''
        }
      ]);
  }
  
  return authData;
};
/**
 * Déconnexion
 * @returns {Promise} - Vide en cas de succès
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Récupérer le profil utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise} - Données du profil utilisateur
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Mettre à jour le profil utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} updates - Objet contenant les champs à mettre à jour
 * @returns {Promise} - Données du profil mis à jour
 */
export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select();
  
  if (error) throw error;
  return data;
};

/**
 * Réinitialisation du mot de passe
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise} - Vide en cas de succès
 */
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'snapshoot://reset-password',
  });
  
  if (error) throw error;
};