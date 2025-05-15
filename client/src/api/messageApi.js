// src/api/messageApi.js pour Supabase v1
import supabase from './supabase';

// Envoyer un message
export const sendMessage = async (senderId, receiverId, content, type = 'text', mediaUrl = null) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      type,
      media_url: mediaUrl
    });

  if (error) throw error;
  return data;
};

// Récupérer les messages d'une conversation
export const getConversationMessages = async (userId, otherUserId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// S'abonner aux nouveaux messages d'une conversation
export const subscribeToConversation = (userId, otherUserId, callback) => {
  const subscription = supabase
    .from('messages')
    .on('INSERT', (payload) => {
      const newMessage = payload.new;
      if (
        (newMessage.sender_id === userId && newMessage.receiver_id === otherUserId) ||
        (newMessage.sender_id === otherUserId && newMessage.receiver_id === userId)
      ) {
        callback(newMessage);
      }
    })
    .subscribe();
  
  return subscription;
};