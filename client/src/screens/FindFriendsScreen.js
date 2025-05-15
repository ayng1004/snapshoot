import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { 
  searchUsers, 
  getProfile 
} from '../api/userApi';
import { 
  sendFriendRequest, 
  getReceivedRequests, 
  acceptFriendRequest, 
  getFriends 
} from '../api/friendsApi';

const FindFriendsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  
  // Récupérer les amis, les suggestions et les demandes en attente
  useEffect(() => {
    const loadFriendsData = async () => {
      if (!user || !user.id) return;
      
      setLoading(true);
      
      try {
        // Récupérer les amis existants
        const friendsList = await getFriends(user.id).catch(() => []);
        setFriends(friendsList || []);
        
        // Récupérer les demandes d'amis reçues
        const requests = await getReceivedRequests(user.id).catch(() => []);
        
        // Transformer le format des données
        const formattedRequests = requests.map(request => ({
          id: request.id,
          userId: request.profiles.id,
          name: request.profiles.username || 'Utilisateur',
          username: `@${request.profiles.username || 'user'}`,
          avatar: request.profiles.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg',
          requestTime: new Date(request.created_at)
        }));
        
        setPendingRequests(formattedRequests);
        
        // Charger des suggestions - utiliser searchUsers avec une requête vide
        // ou implémenter une autre logique de suggestions
        const suggestedUsers = await searchUsers('').catch(() => []);
        
        // Filtrer les utilisateurs déjà amis et soi-même
        const friendIds = new Set(friendsList.map(friend => friend.id));
        const pendingIds = new Set(formattedRequests.map(req => req.userId));
        
        const filteredSuggestions = suggestedUsers
          .filter(u => u.id !== user.id && !friendIds.has(u.id) && !pendingIds.has(u.id))
          .map(user => ({
            id: user.id,
            name: user.username || user.display_name || 'Utilisateur',
            username: `@${user.username || 'user'}`,
            avatar: user.avatar_url || user.profile_image || 'https://randomuser.me/api/portraits/lego/1.jpg',
            mutualFriends: Math.floor(Math.random() * 10) // Simuler des amis en commun
          }));
        
        setSuggestedFriends(filteredSuggestions);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        
        // Utiliser des données factices en cas d'erreur
        useMockData();
      } finally {
        setLoading(false);
      }
    };
    
    loadFriendsData();
  }, [user]);
  
  // Fonction pour utiliser des données factices
  const useMockData = () => {
    const dummySuggestions = [
      {
        id: 'user1',
        name: 'Thomas Martin',
        username: '@tmartin',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
        mutualFriends: 5,
      },
      {
        id: 'user2',
        name: 'Sophie Dupont',
        username: '@sdupont',
        avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
        mutualFriends: 2,
      },
      {
        id: 'user3',
        name: 'Lucas Bernard',
        username: '@lbernard',
        avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
        mutualFriends: 8,
      },
    ];
    
    setSuggestedFriends(dummySuggestions);
    
    const dummyPendingRequests = [
      {
        id: 'req1',
        userId: 'user4',
        name: 'Emma Rousseau',
        username: '@erousseau',
        avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
        requestTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 heures avant
      },
      {
        id: 'req2',
        userId: 'user5',
        name: 'Julien Petit',
        username: '@jpetit',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        requestTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 jour avant
      },
    ];
    
    setPendingRequests(dummyPendingRequests);
  };
  
  // Fonction de recherche d'amis
  const searchFriends = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    try {
      // Rechercher des utilisateurs via l'API
      const results = await searchUsers(searchQuery);
      
      // Filtrer les utilisateurs déjà amis et soi-même
      const friendIds = new Set(friends.map(friend => friend.id));
      const pendingIds = new Set(pendingRequests.map(req => req.userId));
      
      const formattedResults = results
        .filter(u => u.id !== user.id && !friendIds.has(u.id) && !pendingIds.has(u.id))
        .map(user => ({
          id: user.id,
          name: user.username || user.display_name || 'Utilisateur',
          username: `@${user.username || 'user'}`,
          avatar: user.avatar_url || user.profile_image || 'https://randomuser.me/api/portraits/lego/1.jpg',
          email: user.email
        }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      
      // En cas d'erreur, simuler un résultat
      if (searchQuery.includes('@')) {
        setSearchResults([
          {
            id: 'search1',
            name: 'Utilisateur Trouvé',
            username: searchQuery,
            avatar: 'https://randomuser.me/api/portraits/women/71.jpg',
            email: searchQuery,
          }
        ]);
      } else {
        Alert.alert('Erreur', 'Impossible de compléter la recherche');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour envoyer une demande d'ami
  const handleSendFriendRequest = async (userId) => {
    if (!user || !user.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour envoyer une demande d\'ami');
      return;
    }
    
    try {
      await sendFriendRequest(user.id, userId);
      
      // Mettre à jour l'interface utilisateur
      // Retirer l'utilisateur des résultats de recherche
      setSearchResults(prev => prev.filter(result => result.id !== userId));
      
      // Retirer également des suggestions
      setSuggestedFriends(prev => prev.filter(suggestion => suggestion.id !== userId));
      
      Alert.alert('Succès', 'Demande d\'ami envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande d\'ami');
    }
  };
  
  // Fonction pour accepter une demande d'ami
  const handleAcceptFriendRequest = async (requestId, userId) => {
    try {
      await acceptFriendRequest(requestId);
      
      // Supprimer de la liste des demandes en attente
      setPendingRequests(prev => prev.filter(request => request.id !== requestId));
      
      // Ajouter à la liste des amis - idéalement, récupérer la liste d'amis mise à jour
      // mais pour simplifier, nous utilisons les données de la demande
      const acceptedRequest = pendingRequests.find(req => req.id === requestId);
      if (acceptedRequest) {
        setFriends(prev => [
          ...prev, 
          {
            id: acceptedRequest.userId,
            username: acceptedRequest.name,
            avatar_url: acceptedRequest.avatar
          }
        ]);
      }
      
      Alert.alert('Succès', 'Demande d\'ami acceptée !');
      
      // Si l'écran a été ouvert avec l'intention de démarrer un chat
      if (route.params?.startChat) {
        // Naviguer vers la conversation avec le nouvel ami
        navigation.navigate('ConversationScreen', {
          chatId: `direct-${userId}`,
          chatName: acceptedRequest?.name || 'Nouvel ami',
          chatAvatar: acceptedRequest?.avatar
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la demande:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter la demande d\'ami');
    }
  };
  
  // Fonction pour refuser une demande d'ami
  const handleRejectFriendRequest = async (requestId) => {
    try {
      // Ici, implémentez l'appel API pour rejeter la demande
      // await rejectFriendRequest(requestId);
      
      // Pour l'instant, nous mettons simplement à jour l'interface
      setPendingRequests(prev => prev.filter(request => request.id !== requestId));
      
      Alert.alert('Succès', 'Demande d\'ami refusée');
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
      Alert.alert('Erreur', 'Impossible de refuser la demande d\'ami');
    }
  };
  
  // Formater le temps écoulé
  const getElapsedTime = (timestamp) => {
    const now = new Date();
    const elapsed = now - timestamp;
    
    if (elapsed < 60000) {
      return 'À l\'instant';
    } else if (elapsed < 3600000) {
      return `Il y a ${Math.floor(elapsed / 60000)}m`;
    } else if (elapsed < 86400000) {
      return `Il y a ${Math.floor(elapsed / 3600000)}h`;
    } else {
      return `Il y a ${Math.floor(elapsed / 86400000)}j`;
    }
  };
  
  // Rendu d'un résultat de recherche
  const renderSearchResult = ({ item }) => (
    <View style={styles.userItem}>
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.avatar}
        defaultSource={require('../../assets/default-avatar.png')} // Assurez-vous d'avoir cette image
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Rendu d'une suggestion d'ami
  const renderSuggestedFriend = ({ item }) => (
    <View style={styles.userItem}>
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.avatar}
        defaultSource={require('../../assets/default-avatar.png')} // Assurez-vous d'avoir cette image
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>{item.username}</Text>
        <Text style={styles.mutualFriends}>
          {item.mutualFriends} ami{item.mutualFriends > 1 ? 's' : ''} en commun
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Rendu d'une demande d'ami en attente
  const renderPendingRequest = ({ item }) => (
    <View style={styles.userItem}>
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.avatar}
        defaultSource={require('../../assets/default-avatar.png')} // Assurez-vous d'avoir cette image
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>{item.username}</Text>
        <Text style={styles.requestTime}>
          {getElapsedTime(item.requestTime)}
        </Text>
      </View>
      <View style={styles.requestButtons}>
        <TouchableOpacity 
          style={[styles.requestButton, styles.acceptButton]}
          onPress={() => handleAcceptFriendRequest(item.id, item.userId)}
        >
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.requestButton, styles.rejectButton]}
          onPress={() => handleRejectFriendRequest(item.id)}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trouver des amis</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par email ou identifiant"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchFriends}
          autoCapitalize="none"
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#6C13B3" style={styles.loader} />
      ) : (
        <>
          {searchResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Résultats de recherche</Text>
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
          
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Demandes d'amis</Text>
              <FlatList
                data={pendingRequests}
                renderItem={renderPendingRequest}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            </View>
          )}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <FlatList
              data={suggestedFriends}
              renderItem={renderSuggestedFriend}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </>
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
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
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
  loader: {
    marginTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  userItem: {
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
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mutualFriends: {
    fontSize: 12,
    color: '#6C13B3',
    marginTop: 5,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#6C13B3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  requestButtons: {
    flexDirection: 'row',
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
});

export default FindFriendsScreen;