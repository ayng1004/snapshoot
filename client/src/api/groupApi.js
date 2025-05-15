// src/api/groupApi.js
import supabase from './supabase';

// Créer un groupe
export const createGroup = async (creatorId, name, memberIds = []) => {
  // Créer le groupe
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      creator_id: creatorId,
      name
    })
    .select()
    .single();

  if (groupError) throw groupError;
  
  // Ajouter le créateur comme membre
  const { error: creatorMemberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: creatorId,
      role: 'admin'
    });

  if (creatorMemberError) throw creatorMemberError;
  
  // Ajouter les autres membres
  if (memberIds.length > 0) {
    const membersToAdd = memberIds.map(userId => ({
      group_id: group.id,
      user_id: userId,
      role: 'member'
    }));
    
    const { error: membersError } = await supabase
      .from('group_members')
      .insert(membersToAdd);

    if (membersError) throw membersError;
  }
  
  return group;
};

// Récupérer les groupes d'un utilisateur
export const getUserGroups = async (userId) => {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      groups (
        id,
        name,
        created_at,
        avatar_url
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(item => item.groups);
};

// Envoyer un message de groupe
export const sendGroupMessage = async (groupId, senderId, content, type = 'text', mediaUrl = null) => {
  const { data, error } = await supabase
    .from('group_messages')
    .insert({
      group_id: groupId,
      sender_id: senderId,
      content,
      type,
      media_url: mediaUrl
    })
    .select();

  if (error) throw error;
  return data;
};

// Récupérer les messages d'un groupe
export const getGroupMessages = async (groupId) => {
  const { data, error } = await supabase
    .from('group_messages')
    .select(`
      *,
      profiles:sender_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// S'abonner aux nouveaux messages d'un groupe
export const subscribeToGroupMessages = (groupId, callback) => {
  const subscription = supabase
    .channel('group_messages_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
  
  return subscription;
};