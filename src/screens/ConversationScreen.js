// src/screens/ConversationScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { getChatMessages, sendMessage } from '../services/chat';
import { uploadMedia } from '../services/storage';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ConversationScreen = ({ route, navigation }) => {
  const { chatId, chatName, chatAvatar } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [media, setMedia] = useState(null);
  const flatListRef = useRef(null);
  const messagePollingInterval = useRef(null);
  const [lastMessageId, setLastMessageId] = useState(null);

  // Configurer la navigation
  useEffect(() => {
    if (chatName) {
      navigation.setOptions({
        title: chatName,
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('ChatInfoScreen', { chatId })}
            >
              {chatAvatar && (
                <Image 
                  source={{ uri: chatAvatar }}
                  style={styles.headerAvatar}
                />
              )}
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, chatName, chatAvatar]);

  // Charger les messages
  const loadMessages = async () => {
    try {
      if (!chatId) return;
      
      const chatMessages = await getChatMessages(chatId);
      
      if (chatMessages && chatMessages.length > 0) {
        setMessages(chatMessages);
        
        // Mémoriser l'ID du dernier message pour vérifier les nouveaux messages
        if (chatMessages.length > 0) {
          const newestMessageId = chatMessages[chatMessages.length - 1].id;
          setLastMessageId(newestMessageId);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      // En développement, ne pas afficher d'alerte pour chaque erreur de chargement
      if (!__DEV__) {
        Alert.alert('Erreur', 'Impossible de charger les messages');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    
    // Configurer un intervalle de polling pour les nouveaux messages
    messagePollingInterval.current = setInterval(async () => {
      try {
        if (!chatId) return;
        
        const chatMessages = await getChatMessages(chatId);
        
        if (chatMessages && chatMessages.length > 0) {
          const newestMessageId = chatMessages[chatMessages.length - 1].id;
          
          // Si le dernier message est différent, mettre à jour la liste
          if (newestMessageId !== lastMessageId) {
            setMessages(chatMessages);
            setLastMessageId(newestMessageId);
            
            // Scroll en bas automatiquement pour les nouveaux messages
            if (flatListRef.current) {
              setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du polling des messages:', error);
      }
    }, 3000); // Vérifier toutes les 3 secondes
    
    // Nettoyage à la sortie
    return () => {
      if (messagePollingInterval.current) {
        clearInterval(messagePollingInterval.current);
      }
    };
  }, [chatId, lastMessageId]);

  // Sélectionner une image à envoyer
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre galerie.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMedia({
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du média:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le média');
    }
  };

  // Envoyer un message
  const handleSend = async () => {
    if ((!inputText || inputText.trim() === '') && !media) {
      return;
    }

    setSending(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Si on a un média, on l'upload d'abord
      if (media) {
        mediaUrl = await uploadMedia(media.uri, 'message', user.id, chatId);
        mediaType = media.type;
      }

      // Envoyer le message
      await sendMessage(
        chatId,
        user.id,
        inputText.trim(),
        mediaUrl,
        mediaType
      );

      // Réinitialiser les champs
      setInputText('');
      setMedia(null);
      
      // Recharger les messages immédiatement après l'envoi
      await loadMessages();
      
      // Scroll en bas automatiquement
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  // Formatter la date
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return format(date, 'HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };

  // Rendre un message
  const renderMessage = ({ item }) => {
    const isCurrentUser = item.user_id === user?.id;
    const profile = item.profiles || {};
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessageContainer : styles.otherUserMessageContainer
      ]}>
        {!isCurrentUser && (
          <Image 
            source={{ uri: profile.profile_image || 'https://via.placeholder.com/30' }} 
            style={styles.messageAvatar} 
          />
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          item.media_url ? styles.mediaBubble : null
        ]}>
          {item.media_url && (
            <View style={styles.mediaContainer}>
              <Image 
                source={{ uri: item.media_url }} 
                style={styles.mediaImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          {item.content && (
            <Text style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {item.content}
            </Text>
          )}
          
          <Text style={[
            styles.messageTime,
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
        
        {isCurrentUser && (
          <View style={styles.emptyAvatar} />
        )}
      </View>
    );
  };

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6C13B3" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }}
      />
      
      {media && (
        <View style={styles.mediaPreviewContainer}>
          <Image 
            source={{ uri: media.uri }} 
            style={styles.mediaPreview}
          />
          <TouchableOpacity 
            style={styles.removeMediaButton}
            onPress={() => setMedia(null)}
          >
            <Ionicons name="close-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton}
          onPress={pickImage}
        >
          <Ionicons name="image-outline" size={24} color="#6C13B3" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!inputText.trim() && !media) || sending ? styles.sendButtonDisabled : null
          ]}
          onPress={handleSend}
          disabled={(!inputText.trim() && !media) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  headerButton: {
    padding: 5,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messagesContainer: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  currentUserMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherUserMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  emptyAvatar: {
    width: 30,
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 18,
  },
  currentUserBubble: {
    backgroundColor: '#6C13B3',
    borderBottomRightRadius: 5,
  },
  otherUserBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 5,
  },
  mediaBubble: {
    padding: 3,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: 'white',
  },
  otherUserText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTime: {
    color: '#999',
  },
  mediaContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 5,
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
  },
  mediaPreviewContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'relative',
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attachButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C13B3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ConversationScreen;