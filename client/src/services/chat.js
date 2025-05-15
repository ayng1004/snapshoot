import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Récupérer les conversations d'un utilisateur
// Récupérer les conversations d'un utilisateur
export const getUserConversations = async (userId) => {
  try {
    // Vérifier d'abord le cache
    const cachedConversations = await AsyncStorage.getItem('cached_conversations');
    let conversations = cachedConversations ? JSON.parse(cachedConversations) : [];
    
    try {
      // Cette route correspond à GET /api/conversations
      const response = await apiClient.get('/api/conversations');
      
      if (response && response.data && response.data.conversations) {
        conversations = response.data.conversations;
        
        // Mettre à jour le cache
        await AsyncStorage.setItem('cached_conversations', JSON.stringify(conversations));
      }
    } catch (apiError) {
      console.error('Erreur API, utilisation du cache:', apiError);
      
      // Si nous n'avons pas de cache et que nous sommes en développement, utiliser des données fictives
      if (conversations.length === 0 && __DEV__) {
        conversations = getMockConversations();
      }
    }
    
    return conversations;
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    
    // En développement, retourner des données fictives
    if (__DEV__) {
      return getMockConversations();
    }
    
    return [];
  }
};

export const getConversationById = async (conversationId) => {
  if (!conversationId) {
    console.error('ID de conversation manquant');
    return null;
  }
  
  try {
    // Vérifier d'abord le cache
    const cachedConversations = await AsyncStorage.getItem('cached_conversations');
    if (cachedConversations) {
      const conversations = JSON.parse(cachedConversations);
      const cachedConversation = conversations.find(c => c.id === conversationId);
      if (cachedConversation) {
        return cachedConversation;
      }
    }
    
    // Cette route correspond à GET /api/conversations/:conversationId
    const response = await apiClient.get(`/api/conversations/${conversationId}`);
    
    if (response && response.data && response.data.conversation) {
      return response.data.conversation;
    }
    
    throw new Error('Conversation non trouvée');
  } catch (error) {
    console.error(`Erreur lors de la récupération de la conversation ${conversationId}:`, error);
    
    // En développement, retourner une conversation fictive
    if (__DEV__) {
      return getMockConversation(conversationId);
    }
    
    return null;
  }
};


// Récupérer les messages d'une conversation
export const getChatMessages = async (conversationId) => {
  if (!conversationId) {
    console.error('ID de conversation manquant');
    return [];
  }
  
  try {
    // Vérifier d'abord le cache
    const cacheKey = `messages_${conversationId}`;
    const cachedMessages = await AsyncStorage.getItem(cacheKey);
    let messages = cachedMessages ? JSON.parse(cachedMessages) : [];
    
    try {
      // Cette route correspond à GET /api/conversations/:conversationId/messages
      const response = await apiClient.get(`/api/conversations/${conversationId}/messages`);
      
      if (response && response.data && response.data.messages) {
        messages = response.data.messages;
        
        // Mettre à jour le cache
        await AsyncStorage.setItem(cacheKey, JSON.stringify(messages));
      }
    } catch (apiError) {
      console.error(`Erreur API pour les messages de ${conversationId}, utilisation du cache:`, apiError);
      
      // Si nous n'avons pas de cache et que nous sommes en développement, utiliser des données fictives
      if (messages.length === 0 && __DEV__) {
        messages = getMockMessages(conversationId);
      }
    }
    
    return messages;
  } catch (error) {
    console.error(`Erreur lors du chargement des messages de ${conversationId}:`, error);
    
    // En développement, retourner des messages fictifs
    if (__DEV__) {
      return getMockMessages(conversationId);
    }
    
    return [];
  }
};
// Envoyer un message
export const sendMessage = async (conversationId, userId, content, mediaUrl = null, mediaType = null) => {
  if (!conversationId) {
    console.error('ID de conversation manquant');
    throw new Error('ID de conversation requis');
  }
  
  try {
    const messageData = {
      content,
      media_url: mediaUrl,
      media_type: mediaType
    };
    
    console.log(`Envoi de message à la conversation ${conversationId}:`, messageData);
    
    // Cette route correspond à POST /api/conversations/:conversationId/messages
    const response = await apiClient.post(`/api/conversations/${conversationId}/messages`, messageData);
    
    if (response && response.data && response.data.message) {
      // Mettre à jour le cache des messages
      const cacheKey = `messages_${conversationId}`;
      const cachedMessages = await AsyncStorage.getItem(cacheKey);
      
      if (cachedMessages) {
        const messages = JSON.parse(cachedMessages);
        messages.push(response.data.message);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(messages));
      }
      
      return response.data.message;
    }
    
    throw new Error('Format de réponse inattendu');
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message à ${conversationId}:`, error);
    
    // En développement, simuler un message envoyé
    if (__DEV__) {
      const mockMessage = {
        id: 'mock-msg-' + Date.now(),
        conversation_id: conversationId,
        user_id: userId,
        content: content,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
        read_by: []
      };
      
      // Mettre à jour le cache des messages
      const cacheKey = `messages_${conversationId}`;
      const cachedMessages = await AsyncStorage.getItem(cacheKey);
      
      if (cachedMessages) {
        const messages = JSON.parse(cachedMessages);
        messages.push(mockMessage);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(messages));
      }
      
      return mockMessage;
    }
    
    throw error;
  }
};

// Créer une nouvelle conversation
export const createConversation = async (participants, isGroup = false, name = null, avatar = null) => {
  try {
    const conversationData = {
      participants,
      is_group: isGroup,
      name,
      avatar
    };
    
    // Cette route correspond à POST /api/conversations
    const response = await apiClient.post('/api/conversations', conversationData);
    
    if (response && response.data && response.data.conversation) {
      return response.data.conversation;
    }
    
    throw new Error('Format de réponse inattendu');
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    
    // En développement, retourner une conversation fictive
    if (__DEV__) {
      return {
        id: 'new-conversation-' + Date.now(),
        is_group: isGroup,
        name,
        avatar,
        participants
      };
    }
    
    throw error;
  }
};

// Mettre à jour une conversation (nom, avatar)
export const updateConversation = async (conversationId, name, avatar) => {
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    
    // Cette route correspond à PUT /api/conversations/:conversationId
    const response = await apiClient.put(`/api/conversations/${conversationId}`, updates);
    return response.conversation || {};
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Ajouter un participant à une conversation de groupe
export const addParticipant = async (conversationId, userId) => {
  try {
    // Cette route correspond à POST /api/conversations/:conversationId/participants
    const response = await apiClient.post(`/api/conversations/${conversationId}/participants`, { userId });
    return response || {};
  } catch (error) {
    console.error(`Erreur lors de l'ajout du participant à la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Supprimer un participant d'une conversation de groupe
export const removeParticipant = async (conversationId, userId) => {
  try {
    // Cette route correspond à DELETE /api/conversations/:conversationId/participants/:userId
    const response = await apiClient.delete(`/api/conversations/${conversationId}/participants/${userId}`);
    return response || {};
  } catch (error) {
    console.error(`Erreur lors de la suppression du participant de la conversation ${conversationId}:`, error);
    throw error;
  }
};
export const getMockConversations = () => {
  return [
    {
      id: 'mock-1',
      is_group: false,
      otherParticipant: {
        display_name: 'Alice Martin',
        profile_image: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      lastMessage: {
        content: 'Bonjour, comment ça va ?',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 min ago
      },
      unreadCount: 2
    },
    {
      id: 'mock-2',
      is_group: true,
      name: 'Projet Mobile',
      lastMessage: {
        content: 'On se retrouve demain pour la démo ?',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
      },
      unreadCount: 0
    },
    {
      id: 'mock-3',
      is_group: false,
      otherParticipant: {
        display_name: 'Marc Dubois',
        profile_image: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      lastMessage: {
        media_type: 'image',
        media_url: 'https://example.com/image.jpg',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
      },
      unreadCount: 1
    }
  ];
};

// This function provides mock messages for a conversation when API calls fail
export const getMockMessages = (conversationId) => {
  const messages = [
    {
      id: `${conversationId}-msg1`,
      conversation_id: conversationId,
      user_id: 'other-user',
      content: 'Salut, comment vas-tu aujourd\'hui ?',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read_by: ['other-user']
    },
    {
      id: `${conversationId}-msg2`,
      conversation_id: conversationId,
      user_id: 'current-user',
      content: 'Très bien, merci ! Et toi ?',
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      read_by: ['other-user', 'current-user']
    },
    {
      id: `${conversationId}-msg3`,
      conversation_id: conversationId,
      user_id: 'other-user',
      content: 'Bien aussi. Tu as avancé sur le projet ?',
      created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      read_by: ['other-user']
    },
    {
      id: `${conversationId}-msg4`,
      conversation_id: conversationId,
      user_id: 'current-user',
      content: 'Oui, j\'ai terminé la partie frontend. Il reste juste à connecter avec l\'API.',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read_by: ['other-user', 'current-user']
    }
  ];
  
  return messages;
};

// Helper function to get a mock conversation by ID
export const getMockConversation = (conversationId) => {
  const mockConversations = getMockConversations();
  const conversation = mockConversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    // Return a default conversation if not found
    return {
      id: conversationId,
      is_group: false,
      otherParticipant: {
        display_name: 'Utilisateur',
        profile_image: 'https://randomuser.me/api/portraits/lego/1.jpg'
      },
      lastMessage: {
        content: 'Conversation commencée',
        created_at: new Date().toISOString()
      },
      unreadCount: 0
    };
  }
  
  return conversation;
};
// Marquer une conversation comme lue
export const markConversationAsRead = async (conversationId) => {
  try {
    // Cette route correspond à PUT /api/conversations/:conversationId/read
    const response = await apiClient.put(`/api/conversations/${conversationId}/read`);
    return response || {};
  } catch (error) {
    console.error(`Erreur lors du marquage de la conversation ${conversationId} comme lue:`, error);
    throw error;
  }
};
export default {
  getUserConversations,
  getConversationById,
  getChatMessages,
  sendMessage,
  // Autres exports...
};