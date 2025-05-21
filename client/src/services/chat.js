import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid'; // Utiliser uuid directement plutôt que la fonction personnalisée

// Vérifier si une chaîne est un UUID valide
export const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

// Récupérer les conversations d'un utilisateur
export const getUserConversations = async () => {
  try {
    // Vérifier d'abord le cache
    const cachedConversations = await AsyncStorage.getItem('cached_conversations');
    let conversations = cachedConversations ? JSON.parse(cachedConversations) : [];
    
    try {
      // Récupérer depuis l'API
      const response = await apiClient.get('/conversations');
      
      if (response && response.data && response.data.conversations) {
        conversations = response.data.conversations;
        
        // Mettre à jour le cache
        await AsyncStorage.setItem('cached_conversations', JSON.stringify(conversations));
      }
    } catch (apiError) {
      console.log('Erreur API, utilisation du cache:', apiError.message);
      // En cas d'erreur, on continue avec les données du cache
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

// Récupérer une conversation par son ID
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
    
    // Récupérer depuis l'API
    const response = await apiClient.get(`/conversations/${conversationId}`);
    
    if (response && response.data && response.data.conversation) {
      return response.data.conversation;
    }
    
    throw new Error('Conversation non trouvée');
  } catch (error) {
    console.error(`Erreur lors de la récupération de la conversation ${conversationId}:`, error.message);
    
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
  
  console.log(`Récupération des messages. ConversationID: ${conversationId}, UUID valide: ${isValidUUID(conversationId)}`);
  
  // Vérifier le cache d'abord
  const cacheKey = `messages_${conversationId}`;
  const cachedMessagesStr = await AsyncStorage.getItem(cacheKey);
  let cachedMessages = cachedMessagesStr ? JSON.parse(cachedMessagesStr) : [];
  
  if (cachedMessages.length > 0) {
    console.log(`${cachedMessages.length} messages trouvés dans le cache`);
  }
  
  try {
    // Essayer de récupérer depuis l'API
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    
    if (response && response.data && response.data.messages) {
      console.log(`${response.data.messages.length} messages récupérés depuis l'API`);
      
      // Mettre en cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data.messages));
      
      return response.data.messages;
    }
    
    // Si aucun message n'a été trouvé dans l'API mais qu'on a le cache
    if (cachedMessages.length > 0) {
      return cachedMessages;
    }
    
    // Sinon, retourner un tableau vide ou des messages fictifs en dev
    return __DEV__ ? getMockMessages(conversationId) : [];
  } catch (error) {
    console.error(`Erreur API pour les messages: ${error.message}`);
    
    // En cas d'erreur, utiliser le cache si disponible
    if (cachedMessages.length > 0) {
      return cachedMessages;
    }
    
    // Sinon, en dev, retourner des messages fictifs
    if (__DEV__) {
      const mockMessages = getMockMessages(conversationId);
      
      // Mettre en cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(mockMessages));
      
      return mockMessages;
    }
    
    return [];
  }
};

// Envoyer un message
export const sendMessage = async (conversationId, content, mediaUrl = null, mediaType = null) => {
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
    
    console.log(`Envoi de message à la conversation ${conversationId}`);
    
    // Envoyer via l'API
    const response = await apiClient.post(`/conversations/${conversationId}/messages`, messageData);
    
    if (response && response.data) {
      const newMessage = response.data.data || response.data.message;
      
      if (newMessage) {
        // Mettre à jour le cache des messages
        const cacheKey = `messages_${conversationId}`;
        const cachedMessages = await AsyncStorage.getItem(cacheKey);
        
        if (cachedMessages) {
          const messages = JSON.parse(cachedMessages);
          messages.push(newMessage);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(messages));
        }
        
        return newMessage;
      }
    }
    
    throw new Error('Format de réponse inattendu');
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message à ${conversationId}:`, error.message);
    
    // En développement, simuler un message envoyé localement
    if (__DEV__) {
      const mockMessage = {
        id: uuidv4(),
        conversation_id: conversationId,
        sender_id: await AsyncStorage.getItem('userId') || 'current-user',
        content: content,
        media_url: mediaUrl,
        media_type: mediaType,
        created_at: new Date().toISOString(),
        is_deleted: false
      };
      
      // Mettre à jour le cache des messages
      const cacheKey = `messages_${conversationId}`;
      const cachedMessagesStr = await AsyncStorage.getItem(cacheKey);
      const cachedMessages = cachedMessagesStr ? JSON.parse(cachedMessagesStr) : [];
      
      cachedMessages.push(mockMessage);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedMessages));
      
      return mockMessage;
    }
    
    throw error;
  }
};

// Créer une nouvelle conversation
export const createConversation = async (participants, isGroup = false, name = null, avatar = null) => {
  try {
    console.log('Tentative de création de conversation avec participants:', participants);
    
    // Créer une conversation locale d'abord, pour assurer une bonne expérience utilisateur
    const localConversationId = uuidv4();
    const localConversation = {
      id: localConversationId,
      is_group: isGroup,
      name,
      avatar,
      participants,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Sauvegarder localement immédiatement
    const cachedConversationsStr = await AsyncStorage.getItem('cached_conversations');
    const cachedConversations = cachedConversationsStr ? JSON.parse(cachedConversationsStr) : [];
    cachedConversations.push(localConversation);
    await AsyncStorage.setItem('cached_conversations', JSON.stringify(cachedConversations));
    
    // Maintenant, tenter de synchro avec le serveur (en arrière-plan)
    apiClient.post('/api/conversations', {
      participants,
      is_group: isGroup,
      name,
      avatar,
      id: localConversationId // Envoyer l'ID local pour que le serveur l'utilise
    }).then(response => {
      console.log('Conversation synchronisée avec le serveur:', response);
    }).catch(error => {
      console.log('Échec de la synchronisation avec le serveur:', error);
      // La conversation locale est déjà enregistrée, pas besoin d'action supplémentaire
    });
    
    return localConversation;
  } catch (error) {
    console.error('Erreur lors de la création de conversation:', error.message);
    throw error;
  }
};

// Mettre à jour une conversation
export const updateConversation = async (conversationId, name, avatar) => {
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    
    const response = await apiClient.put(`/conversations/${conversationId}`, updates);
    
    if (response && response.data && response.data.conversation) {
      return response.data.conversation;
    }
    
    return {};
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la conversation ${conversationId}:`, error.message);
    throw error;
  }
};

// Ajouter un participant
export const addParticipant = async (conversationId, userId) => {
  try {
    const response = await apiClient.post(`/conversations/${conversationId}/participants`, { userId });
    
    if (response && response.data && response.data.conversation) {
      return response.data.conversation;
    }
    
    return {};
  } catch (error) {
    console.error(`Erreur lors de l'ajout du participant à la conversation ${conversationId}:`, error.message);
    throw error;
  }
};

// Supprimer un participant
export const removeParticipant = async (conversationId, userId) => {
  try {
    const response = await apiClient.delete(`/conversations/${conversationId}/participants/${userId}`);
    
    if (response && response.data && response.data.conversation) {
      return response.data.conversation;
    }
    
    return {};
  } catch (error) {
    console.error(`Erreur lors de la suppression du participant de la conversation ${conversationId}:`, error.message);
    throw error;
  }
};

// Marquer une conversation comme lue
export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await apiClient.put(`/conversations/${conversationId}/read`);
    
    if (response && response.data) {
      return response.data;
    }
    
    return {};
  } catch (error) {
    console.error(`Erreur lors du marquage de la conversation ${conversationId} comme lue:`, error.message);
    throw error;
  }
};

// === FONCTIONS MOCK POUR LE DÉVELOPPEMENT ===

// Données de conversation fictives
export const getMockConversations = () => {
  return [
    {
      id: uuidv4(),
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
      id: uuidv4(),
      is_group: true,
      name: 'Projet Mobile',
      lastMessage: {
        content: 'On se retrouve demain pour la démo ?',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
      },
      unreadCount: 0
    },
    {
      id: uuidv4(),
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

// Messages fictifs pour le développement
export const getMockMessages = (conversationId) => {
  const userId = 'current-user-' + Math.floor(Math.random() * 1000);
  const otherId = 'other-user-' + Math.floor(Math.random() * 1000);
  
  return [
    {
      id: uuidv4(),
      conversation_id: conversationId,
      sender_id: otherId,
      content: 'Salut, comment vas-tu aujourd\'hui ?',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      is_deleted: false
    },
    {
      id: uuidv4(),
      conversation_id: conversationId,
      sender_id: userId,
      content: 'Très bien, merci ! Et toi ?',
      created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      is_deleted: false
    },
    {
      id: uuidv4(),
      conversation_id: conversationId,
      sender_id: otherId,
      content: 'Bien aussi. Tu as avancé sur le projet ?',
      created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      is_deleted: false
    },
    {
      id: uuidv4(),
      conversation_id: conversationId,
      sender_id: userId,
      content: 'Oui, j\'ai terminé la partie frontend. Il reste juste à connecter avec l\'API.',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      is_deleted: false
    }
  ];
};

// Conversation fictive par ID
export const getMockConversation = (conversationId) => {
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
};

export default {
  getUserConversations,
  getConversationById,
  getChatMessages,
  sendMessage,
  createConversation,
  updateConversation,
  addParticipant,
  removeParticipant,
  markConversationAsRead
};