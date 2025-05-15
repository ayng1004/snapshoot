// src/screens/ChatScreen.js
import React, { useState, useEffect } from 'react';
import {
   View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserConversations } from '../services/chat';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ChatScreen = ({ navigation }) => {
   const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
   useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        if (!user) return;
        
        console.log("Chargement des conversations pour l'utilisateur:", user.id);
        const conversations = await getUserConversations(user.id);
        
        // Vérifier si nous avons des données valides
        if (Array.isArray(conversations)) {
          setChats(conversations);
          console.log(`${conversations.length} conversations chargées`);
        } else {
          console.warn("Format de réponse inattendu:", conversations);
          setChats([]);
        }
        
        // En mode dev, ajouter des données fictives si aucune conversation n'est trouvée
        if (__DEV__ && (conversations.length === 0)) {
          const mockChats = [
            {
              id: '1',
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
              id: '2',
              is_group: true,
              name: 'Projet Mobile',
              lastMessage: {
                content: 'On se retrouve demain pour la démo ?',
                created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
              },
              unreadCount: 0
            },
            {
              id: '3',
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
          console.log("Ajout de conversations fictives pour le développement");
          setChats(mockChats);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
    
    // Charger les chats à chaque fois que l'écran est focalisé
    const unsubscribe = navigation.addListener('focus', loadChats);
    return unsubscribe;
  }, [user, navigation]);



  useEffect(() => {
    const loadChats = async () => {
      try {
        if (!user) return;
        
        const conversations = await getUserConversations(user.id);
        setChats(conversations);
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
    
    // Charger les chats à chaque fois que l'écran est focalisé
    const unsubscribe = navigation.addListener('focus', loadChats);
    return unsubscribe;
  }, [user, navigation]);
  
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  };
  
  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'Aucun message';
    
    if (chat.lastMessage.media_url) {
      if (chat.lastMessage.media_type === 'image') {
        return '📷 Photo';
      } else if (chat.lastMessage.media_type === 'video') {
        return '📹 Vidéo';
      }
    }
    
    return chat.lastMessage.content || '';
  };
  
  const getChatName = (chat) => {
    if (chat.is_group) return chat.name || 'Groupe sans nom';
    return chat.otherParticipant?.display_name || chat.otherParticipant?.username || 'Utilisateur inconnu';
  };
  
  const getChatAvatar = (chat) => {
    if (chat.is_group) {
      // Retourner un avatar de groupe (à implémenter)
      return 'https://via.placeholder.com/150';
    }
    
    return chat.otherParticipant?.profile_image || 'https://via.placeholder.com/150';
  };
  
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const chatName = getChatName(chat).toLowerCase();
    return chatName.includes(searchQuery.toLowerCase());
  });
  
  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => navigation.navigate('ConversationScreen', { 
        chatId: item.id,
        chatName: getChatName(item),
        chatAvatar: getChatAvatar(item)
      })}
    >
      <Image 
        source={{ uri: getChatAvatar(item) }} 
        style={styles.avatar}
        defaultSource={require('../../assets/default-avatar.png')} // Assurez-vous d'avoir cette image
      />
      
      <View style={styles.chatInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{getChatName(item)}</Text>
          <Text style={styles.time}>{item.lastMessage ? formatTime(item.lastMessage.created_at) : ''}</Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text 
            style={[styles.message, item.unreadCount > 0 && styles.unreadMessage]} 
            numberOfLines={1}
          >
            {getLastMessagePreview(item)}
          </Text>
          
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={80} color="#ddd" />
      <Text style={styles.emptyText}>Aucune conversation</Text>
      <Text style={styles.emptySubtext}>Commencez à discuter en appuyant sur le bouton "+" ci-dessus</Text>
    </View>
  );
  
 return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => navigation.navigate('FindFriendsScreen', { startChat: true })}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6C13B3" />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={chats.length === 0 ? { flex: 1 } : null}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C13B3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    margin: 15,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 14,
    color: '#999',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#6C13B3',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ChatScreen;