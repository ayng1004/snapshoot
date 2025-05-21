// services/localChat.js - VERSION MODIFIÉE
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';

// Constantes pour les clés de stockage
const STORAGE_KEYS = {
  CONVERSATIONS: 'local_conversations',
  MESSAGES_PREFIX: 'local_messages_',
  CURRENT_USER_ID: 'local_user_id',
  CONTACTS: 'local_contacts',
  MEDIA_DIRECTORY: FileSystem.documentDirectory + 'local_media/',
  // Nouvelle clé pour stocker l'ID de la conversation par destinataire
  CONVERSATION_BY_RECIPIENT: 'local_conversation_by_recipient_'
};

// FONCTION MODIFIÉE: S'assurer que l'utilisateur actuel a un ID
export const ensureCurrentUserId = async (forcedUserId = null) => {
  try {
    let userId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    
    // Si un ID est forcé, l'utiliser
    if (forcedUserId) {
      if (userId !== forcedUserId) {
        userId = forcedUserId;
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
        console.log('ID utilisateur mis à jour forcément:', userId);
      }
      return userId;
    }
    
    // Sinon, utiliser ou générer un ID
    if (!userId) {
      userId = uuidv4();
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    }
    return userId;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'ID utilisateur:', error);
    throw error;
  }
};

// Initialiser le répertoire pour les médias
export const initializeMediaDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_KEYS.MEDIA_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(STORAGE_KEYS.MEDIA_DIRECTORY, { intermediates: true });
      console.log('Répertoire médias créé:', STORAGE_KEYS.MEDIA_DIRECTORY);
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du répertoire médias:', error);
  }
};

// Vérifier si une chaîne est un UUID valide
export const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

// Récupérer les conversations d'un utilisateur
export const getUserConversations = async () => {
  try {
    // Récupérer depuis AsyncStorage
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let conversations = conversationsString ? JSON.parse(conversationsString) : [];
    
    // Trier par date de mise à jour, la plus récente en premier
    conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    return conversations;
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
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
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const conversations = conversationsString ? JSON.parse(conversationsString) : [];
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      return conversation;
    }
    
    console.error(`Conversation ${conversationId} non trouvée`);
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la conversation ${conversationId}:`, error);
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
    const messagesKey = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    const messagesString = await AsyncStorage.getItem(messagesKey);
    const messages = messagesString ? JSON.parse(messagesString) : [];
    
    // Trier par date de création
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    return messages;
  } catch (error) {
    console.error(`Erreur lors de la récupération des messages pour ${conversationId}:`, error);
    return [];
  }
};

// Sauvegarder un fichier média localement et retourner son URI
export const saveMediaFile = async (uri, type) => {
  try {
    await initializeMediaDirectory();
    
    const fileName = `${uuidv4()}.${type === 'video' ? 'mp4' : 'jpg'}`;
    const destinationUri = `${STORAGE_KEYS.MEDIA_DIRECTORY}${fileName}`;
    
    // Copier le fichier
    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri
    });
    
    return destinationUri;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du média:', error);
    throw error;
  }
};

// Envoyer un message
export const sendMessage = async (conversationId, content, mediaUri = null, mediaType = null) => {
  if (!conversationId) {
    console.error('ID de conversation manquant');
    throw new Error('ID de conversation requis');
  }
  
  try {
    // Récupérer l'ID utilisateur actuel
    const userId = await ensureCurrentUserId();
    
    // Sauvegarder les médias localement si présents
    let localMediaUri = null;
    if (mediaUri) {
      localMediaUri = await saveMediaFile(mediaUri, mediaType);
    }
    
    // Créer le nouveau message
    const newMessage = {
      id: uuidv4(),
      conversation_id: conversationId,
      user_id: userId,
      content: content,
      media_url: localMediaUri,
      media_type: mediaType,
      created_at: new Date().toISOString(),
      is_deleted: false
    };
    
    // Récupérer les messages existants pour cette conversation
    const messagesKey = `${STORAGE_KEYS.MESSAGES_PREFIX}${conversationId}`;
    const messagesString = await AsyncStorage.getItem(messagesKey);
    const messages = messagesString ? JSON.parse(messagesString) : [];
    
    // Ajouter le nouveau message
    messages.push(newMessage);
    
    // Sauvegarder les messages
    await AsyncStorage.setItem(messagesKey, JSON.stringify(messages));
    
    // Mettre à jour la dernière activité de la conversation
    await updateConversationLastActivity(conversationId, content, localMediaUri, mediaType);
    
    return newMessage;
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message à ${conversationId}:`, error);
    throw error;
  }
};

// Mettre à jour la dernière activité d'une conversation
const updateConversationLastActivity = async (conversationId, content, mediaUrl, mediaType) => {
  try {
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let conversations = conversationsString ? JSON.parse(conversationsString) : [];
    
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex !== -1) {
      const now = new Date().toISOString();
      
      // Mettre à jour la conversation
      conversations[conversationIndex] = {
        ...conversations[conversationIndex],
        lastMessage: {
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: now
        },
        updated_at: now
      };
      
      // Sauvegarder les conversations mises à jour
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la conversation:', error);
  }
};

// FONCTION MODIFIÉE: Trouver ou créer une conversation avec un utilisateur
export const findOrCreateConversation = async (recipientId, recipientName = null, recipientAvatar = null) => {
  try {
    // Récupérer l'ID de l'utilisateur actuel
    const currentUserId = await ensureCurrentUserId();
    
    // Vérifier si une conversation existe déjà avec ce destinataire
    const convKeyForRecipient = `${STORAGE_KEYS.CONVERSATION_BY_RECIPIENT}${recipientId}`;
    let existingConversationId = await AsyncStorage.getItem(convKeyForRecipient);
    
    if (existingConversationId) {
      // Vérifier si la conversation existe encore
      const conversation = await getConversationById(existingConversationId);
      if (conversation) {
        console.log(`Conversation existante trouvée avec ${recipientId}: ${existingConversationId}`);
        return conversation;
      }
    }
    
    // Si aucune conversation n'existe, en créer une nouvelle
    console.log(`Création d'une nouvelle conversation avec ${recipientId}`);
    const newConversation = await createConversation(
      [currentUserId, recipientId],
      false, 
      recipientName,
      recipientAvatar
    );
    
    // Enregistrer l'ID de la conversation pour ce destinataire
    await AsyncStorage.setItem(convKeyForRecipient, newConversation.id);
    
    return newConversation;
  } catch (error) {
    console.error(`Erreur lors de la recherche/création de conversation avec ${recipientId}:`, error);
    throw error;
  }
};

// Créer une nouvelle conversation
export const createConversation = async (participants, isGroup = false, name = null, avatar = null) => {
  try {
    // Assurez-vous que l'utilisateur actuel a un ID
    const currentUserId = await ensureCurrentUserId();
    
    // Assurez-vous que l'utilisateur actuel est inclus dans les participants
    if (!participants.includes(currentUserId)) {
      participants.push(currentUserId);
    }
    
    // Créer une nouvelle conversation
    const newConversationId = uuidv4();
    const now = new Date().toISOString();
    
    const newConversation = {
      id: newConversationId,
      is_group: isGroup,
      name,
      avatar,
      participants,
      created_at: now,
      updated_at: now,
      lastMessage: {
        content: 'Conversation créée',
        created_at: now
      },
      unreadCount: 0
    };
    
    // Récupérer les conversations existantes
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const conversations = conversationsString ? JSON.parse(conversationsString) : [];
    
    // Ajouter la nouvelle conversation
    conversations.push(newConversation);
    
    // Sauvegarder les conversations
    await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    
    // Initialiser un tableau de messages vide pour cette conversation
    const messagesKey = `${STORAGE_KEYS.MESSAGES_PREFIX}${newConversationId}`;
    await AsyncStorage.setItem(messagesKey, JSON.stringify([]));
    
    // Enregistrer l'ID de la conversation pour chaque destinataire
    for (const participantId of participants) {
      if (participantId !== currentUserId) {
        await AsyncStorage.setItem(`${STORAGE_KEYS.CONVERSATION_BY_RECIPIENT}${participantId}`, newConversationId);
      }
    }
    
    return newConversation;
  } catch (error) {
    console.error('Erreur lors de la création de conversation:', error);
    throw error;
  }
};

// Mettre à jour une conversation
export const updateConversation = async (conversationId, name, avatar) => {
  try {
    // Récupérer les conversations
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let conversations = conversationsString ? JSON.parse(conversationsString) : [];
    
    // Trouver la conversation à mettre à jour
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex !== -1) {
      // Mettre à jour les champs
      if (name !== undefined) conversations[conversationIndex].name = name;
      if (avatar !== undefined) conversations[conversationIndex].avatar = avatar;
      conversations[conversationIndex].updated_at = new Date().toISOString();
      
      // Sauvegarder les conversations mises à jour
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      return conversations[conversationIndex];
    }
    
    throw new Error('Conversation non trouvée');
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Ajouter un participant
export const addParticipant = async (conversationId, userId) => {
  try {
    // Récupérer les conversations
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let conversations = conversationsString ? JSON.parse(conversationsString) : [];
    
    // Trouver la conversation
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex !== -1) {
      // S'assurer que participants est un tableau
      if (!Array.isArray(conversations[conversationIndex].participants)) {
        conversations[conversationIndex].participants = [];
      }
      
      // Vérifier si l'utilisateur est déjà un participant
      if (!conversations[conversationIndex].participants.includes(userId)) {
        // Ajouter le participant
        conversations[conversationIndex].participants.push(userId);
        conversations[conversationIndex].updated_at = new Date().toISOString();
        
        // Sauvegarder les conversations mises à jour
        await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
        
        // Enregistrer l'association pour ce participant
        await AsyncStorage.setItem(`${STORAGE_KEYS.CONVERSATION_BY_RECIPIENT}${userId}`, conversationId);
      }
      
      return conversations[conversationIndex];
    }
    
    throw new Error('Conversation non trouvée');
  } catch (error) {
    console.error(`Erreur lors de l'ajout du participant à la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Supprimer un participant
export const removeParticipant = async (conversationId, userId) => {
  try {
    // Récupérer les conversations
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let conversations = conversationsString ? JSON.parse(conversationsString) : [];
    
    // Trouver la conversation
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex !== -1) {
      // S'assurer que participants est un tableau
      if (!Array.isArray(conversations[conversationIndex].participants)) {
        conversations[conversationIndex].participants = [];
      }
      
      // Filtrer le participant
      conversations[conversationIndex].participants = 
        conversations[conversationIndex].participants.filter(id => id !== userId);
      
      conversations[conversationIndex].updated_at = new Date().toISOString();
      
      // Sauvegarder les conversations mises à jour
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      // Supprimer l'association pour ce participant
      await AsyncStorage.removeItem(`${STORAGE_KEYS.CONVERSATION_BY_RECIPIENT}${userId}`);
      
      return conversations[conversationIndex];
    }
    
    throw new Error('Conversation non trouvée');
  } catch (error) {
    console.error(`Erreur lors de la suppression du participant de la conversation ${conversationId}:`, error);
    throw error;
  }
};

// Marquer une conversation comme lue
export const markConversationAsRead = async (conversationId) => {
  try {
    // Récupérer les conversations
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    let conversations = conversationsString ? JSON.parse(conversationsString) : [];
    
    // Trouver la conversation
    const conversationIndex = conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex !== -1) {
      // Mettre à jour le compteur de non lus
      conversations[conversationIndex].unreadCount = 0;
      
      // Sauvegarder les conversations mises à jour
      await AsyncStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      
      return conversations[conversationIndex];
    }
    
    throw new Error('Conversation non trouvée');
  } catch (error) {
    console.error(`Erreur lors du marquage de la conversation ${conversationId} comme lue:`, error);
    throw error;
  }
};

// Télécharger les médias - Version locale qui ne fait rien car les médias sont déjà locaux
export const uploadMedia = async (uri, type, userId, conversationId) => {
  // Simplement sauvegarder le fichier localement
  return await saveMediaFile(uri, type === 'video' ? 'video' : 'image');
};

// Fonction pour initialiser les données des contacts
export const initializeContacts = async () => {
  try {
    // Vérifier si les contacts existent déjà
    const contactsString = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!contactsString) {
      // Créer des contacts fictifs
      const mockContacts = [
        {
          id: uuidv4(),
          display_name: 'Alice Martin',
          profile_image: 'https://randomuser.me/api/portraits/women/44.jpg'
        },
        {
          id: uuidv4(),
          display_name: 'Marc Dubois',
          profile_image: 'https://randomuser.me/api/portraits/men/32.jpg'
        },
        {
          id: uuidv4(),
          display_name: 'Emma Laurent',
          profile_image: 'https://randomuser.me/api/portraits/women/22.jpg'
        }
      ];
      
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(mockContacts));
      return mockContacts;
    } else {
      return JSON.parse(contactsString);
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des contacts:', error);
    return [];
  }
};

// Récupérer les contacts
export const getContacts = async () => {
  try {
    const contactsString = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (contactsString) {
      return JSON.parse(contactsString);
    }
    return await initializeContacts();
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    return [];
  }
};

// Initialiser l'application
export const initializeApp = async () => {
  try {
    // S'assurer que l'utilisateur a un ID
    await ensureCurrentUserId();
    
    // Initialiser le répertoire des médias
    await initializeMediaDirectory();
    
    // Initialiser les contacts
    await initializeContacts();
    
    // Si pas de conversations, en créer quelques-unes
    const conversationsString = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!conversationsString || JSON.parse(conversationsString).length === 0) {
      const contacts = await getContacts();
      const currentUserId = await ensureCurrentUserId();
      
      // Créer des conversations avec chaque contact
      for (const contact of contacts) {
        const conversation = await createConversation(
          [currentUserId, contact.id], 
          false, 
          contact.display_name, 
          contact.profile_image
        );
        
        // Associer le contact à la conversation
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.CONVERSATION_BY_RECIPIENT}${contact.id}`, 
          conversation.id
        );
      }
      
      // Créer un groupe
      await createConversation(
        [currentUserId, ...contacts.map(c => c.id)],
        true,
        'Groupe Amis',
        'https://randomuser.me/api/portraits/lego/1.jpg'
      );
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'application:', error);
    return false;
  }
};

export default {
  getUserConversations,
  getConversationById,
  getChatMessages,
  sendMessage,
  createConversation,
  findOrCreateConversation, // Nouvelle fonction
  updateConversation,
  addParticipant,
  removeParticipant,
  markConversationAsRead,
  uploadMedia,
  getContacts,
  initializeApp,
  ensureCurrentUserId
};