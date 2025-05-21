import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { getFriends, removeFriend } from '../api/friendsApi';
import { uuidv4 } from '../utils/uuid';

// Importer createConversation depuis services/chat
import { createConversation } from '../services/chat'; 
const FriendsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger la liste des amis
  const loadFriends = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const friendsList = await getFriends();
      console.log('Amis chargés:', friendsList);
      setFriends(friendsList || []);
    } catch (error) {
      console.error('Erreur lors du chargement des amis:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste d\'amis');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Charger au démarrage
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Rafraîchir la liste
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  }, [loadFriends]);

  // Envoyer un message à un ami
 // Dans FriendsListScreen.js

const handleSendMessage = async (friend) => {
  try {
    setLoading(true);
    
    console.log('Démarrage conversation avec:', friend.id);
    
    if (!friend || !friend.id) {
      Alert.alert('Erreur', 'Impossible de démarrer une conversation avec cet ami');
      setLoading(false);
      return;
    }
    
    // Utiliser directement la fonction createConversation
    const conversation = await createConversation([friend.id], false);
    
    console.log('Conversation créée:', conversation);
    
    if (conversation && conversation.id) {
      navigation.navigate('ConversationScreen', {
        chatId: conversation.id, // Utiliser l'ID de la conversation
        chatName: friend.username || friend.display_name || 'Ami',
        chatAvatar: friend.avatar_url || friend.profile_image,
        otherUserId: friend.id
      });
    } else {
      Alert.alert('Erreur', 'Impossible de créer la conversation');
    }
  } catch (error) {
    console.error('Erreur lors de la création de la conversation:', error);
    Alert.alert('Erreur', 'Impossible de démarrer la conversation');
  } finally {
    setLoading(false);
  }
};

  // Supprimer un ami
  const handleRemoveFriend = (friendId) => {
    Alert.alert(
      'Supprimer ami',
      'Êtes-vous sûr de vouloir supprimer cet ami ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
              // Mettre à jour la liste après suppression
              setFriends(prev => prev.filter(friend => friend.id !== friendId));
              Alert.alert('Succès', 'Ami supprimé avec succès');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer cet ami');
            }
          }
        }
      ]
    );
  };

  // Bloquer un ami (à implémenter)
  const handleBlockFriend = (friendId) => {
    Alert.alert(
      'Bloquer ami',
      'Êtes-vous sûr de vouloir bloquer cet ami ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          style: 'destructive',
          onPress: () => {
            // Implémenter la fonction de blocage ici
            Alert.alert('Information', 'Fonctionnalité de blocage à implémenter');
          }
        }
      ]
    );
  };

  // Afficher les options pour un ami
  const showFriendOptions = (friend) => {
    Alert.alert(
      friend.username || friend.display_name || 'Ami',
      'Que souhaitez-vous faire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Envoyer un message', 
          onPress: () => handleSendMessage(friend)
        },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => handleRemoveFriend(friend.id)
        },
        { 
          text: 'Bloquer', 
          style: 'destructive',
          onPress: () => handleBlockFriend(friend.id)
        }
      ]
    );
  };

  // Rendu d'un ami
  const renderFriend = ({ item }) => (
    <TouchableOpacity 
      style={styles.friendItem}
      onPress={() => showFriendOptions(item)}
    >
      <Image 
        source={{ uri: item.avatar_url || item.profile_image || 'https://randomuser.me/api/portraits/lego/1.jpg' }} 
        style={styles.avatar}
        defaultSource={require('../../assets/default-avatar.png')}
      />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username || item.display_name || 'Utilisateur'}</Text>
        <Text style={styles.friendStatus}>
          {item.status || (item.last_seen ? 'Dernière connexion: ' + new Date(item.last_seen).toLocaleDateString() : 'En ligne')}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.messageButton}
        onPress={() => handleSendMessage(item)}
      >
        <Ionicons name="chatbubble-outline" size={22} color="#6C13B3" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes amis</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('FindFriendsScreen')}
        >
          <Ionicons name="person-add" size={22} color="#6C13B3" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6C13B3" style={styles.loader} />
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriend}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6C13B3"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={50} color="#ccc" />
              <Text style={styles.emptyText}>Vous n'avez pas encore d'amis</Text>
              <TouchableOpacity 
                style={styles.findFriendsButton}
                onPress={() => navigation.navigate('FindFriendsScreen')}
              >
                <Text style={styles.findFriendsText}>Trouver des amis</Text>
              </TouchableOpacity>
            </View>
          }
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
    padding: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  loader: {
    marginTop: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 15,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  messageButton: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 10,
    marginBottom: 20,
    color: '#999',
    fontSize: 16,
  },
  findFriendsButton: {
    backgroundColor: '#6C13B3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  findFriendsText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default FriendsListScreen;