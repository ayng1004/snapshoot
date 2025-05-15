// src/api/friendsApi.js
import supabase from './supabase';

// Envoyer une demande d'ami
export const sendFriendRequest = async (senderId, receiverId) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending'
    })
    .select();

  if (error) throw error;
  return data;
};

// Récupérer les demandes d'ami reçues
export const getReceivedRequests = async (userId) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      created_at,
      status,
      profiles!friend_requests_sender_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  if (error) throw error;
  return data;
};

// Accepter une demande d'ami
export const acceptFriendRequest = async (requestId) => {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select();

  if (error) throw error;
  return data;
};

// Récupérer la liste d'amis
export const getFriends = async (userId) => {
  // Récupérer les amis où l'utilisateur est le destinataire
  const { data: receiverFriends, error: receiverError } = await supabase
    .from('friend_requests')
    .select(`
      profiles!friend_requests_sender_id_fkey (
        id,
        username,
        avatar_url,
        last_seen
      )
    `)
    .eq('receiver_id', userId)
    .eq('status', 'accepted');

  if (receiverError) throw receiverError;
  
  // Récupérer les amis où l'utilisateur est l'expéditeur
  const { data: senderFriends, error: senderError } = await supabase
    .from('friend_requests')
    .select(`
      profiles!friend_requests_receiver_id_fkey (
        id,
        username,
        avatar_url,
        last_seen
      )
    `)
    .eq('sender_id', userId)
    .eq('status', 'accepted');

  if (senderError) throw senderError;
  
  // Combiner les résultats
  const friends = [
    ...receiverFriends.map(item => item.profiles),
    ...senderFriends.map(item => item.profiles)
  ];
  
  return friends;
};