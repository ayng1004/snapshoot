// src/services/chat.js
import supabase from '../api/supabase';

/**
 * Récupérer toutes les conversations de l'utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Liste des conversations
 */
export const getUserConversations = async (userId) => {
  // 1. Récupérer les IDs des conversations auxquelles l'utilisateur participe
  const { data: participations, error: participationsError } = await supabase
    .from('chat_participants')
    .select('chat_id')
    .eq('user_id', userId);
  
  if (participationsError) throw participationsError;
  if (!participations || participations.length === 0) return [];
  
  const chatIds = participations.map(p => p.chat_id);
  
  // 2. Récupérer les détails des conversations
  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select(`
      id, 
      name, 
      is_group, 
      created_at,
      created_by
    `)
    .in('id', chatIds)
    .order('created_at', { ascending: false });
  
  if (chatsError) throw chatsError;
  
  // 3. Pour chaque conversation, récupérer le dernier message
  const enrichedChats = await Promise.all(chats.map(async (chat) => {
    // Récupérer le dernier message
    const { data: lastMessages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        media_url,
        media_type
      `)
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (messagesError) throw messagesError;
    
    const lastMessage = lastMessages && lastMessages.length > 0 ? lastMessages[0] : null;
    
    // Si c'est une conversation individuelle, récupérer les infos de l'autre participant
    let otherParticipant = null;
    
    if (!chat.is_group) {
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          profiles:user_id (
            id,
            username,
            display_name,
            profile_image
          )
        `)
        .eq('chat_id', chat.id)
        .neq('user_id', userId);
      
      if (participantsError) throw participantsError;
      
      if (participants && participants.length > 0) {
        otherParticipant = participants[0].profiles;
      }
    }
    
    // Calculer le nombre de messages non lus (à implémenter)
    
    return {
      ...chat,
      lastMessage,
      otherParticipant,
      unreadCount: 0 // Remplacer par le vrai comptage
    };
  }));
  
  return enrichedChats;
};

/**
 * Récupérer les messages d'une conversation
 * @param {string} chatId - ID de la conversation
 * @returns {Promise<Array>} - Liste des messages
 */
export const getChatMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      user_id,
      media_url,
      media_type,
      profiles:user_id (
        id,
        username,
        display_name,
        profile_image
      )
    `)
    .eq('chat_id', chatId)
    .order('created_at');
  
  if (error) throw error;
  return data;
};

/**
 * Envoyer un message
 * @param {string} chatId - ID de la conversation
 * @param {string} userId - ID de l'utilisateur qui envoie le message
 * @param {string} content - Contenu du message
 * @param {string} mediaUrl - URL du média (optionnel)
 * @param {string} mediaType - Type du média (optionnel)
 * @returns {Promise<Object>} - Le message créé
 */
export const sendMessage = async (chatId, userId, content, mediaUrl = null, mediaType = null) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        chat_id: chatId,
        user_id: userId,
        content,
        media_url: mediaUrl,
        media_type: mediaType
      }
    ])
    .select();
  
  if (error) throw error;
  return data[0];
};

/**
 * Créer une nouvelle conversation
 * @param {string} createdBy - ID de l'utilisateur qui crée la conversation
 * @param {Array<string>} participantIds - IDs des participants
 * @param {boolean} isGroup - Si c'est une conversation de groupe
 * @param {string} name - Nom de la conversation (pour les groupes)
 * @returns {Promise<Object>} - La conversation créée
 */
export const createChat = async (createdBy, participantIds, isGroup = false, name = null) => {
  // 1. Créer la conversation
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert([
      {
        created_by: createdBy,
        is_group: isGroup,
        name: isGroup ? name : null
      }
    ])
    .select()
    .single();
  
  if (chatError) throw chatError;
  
  // 2. Ajouter les participants (y compris le créateur)
  const allParticipants = [createdBy, ...participantIds.filter(id => id !== createdBy)];
  
  const participants = allParticipants.map(userId => ({
    chat_id: chat.id,
    user_id: userId
  }));
  
  const { error: participantsError } = await supabase
    .from('chat_participants')
    .insert(participants);
  
  if (participantsError) throw participantsError;
  
  return chat;
};

/**
 * S'abonner aux nouveaux messages d'une conversation
 * @param {string} chatId - ID de la conversation
 * @param {Function} callback - Fonction appelée à chaque nouveau message
 * @returns {Object} - Objet de subscription (pour se désabonner)
 */
export const subscribeToChat = (chatId, callback) => {
  return supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
};