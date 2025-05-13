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


const FindFriendsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Simulation de données pour les amis suggérés
  useEffect(() => {
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
      // Ajoutez plus de suggestions simulées
    ];
    
    setSuggestedFriends(dummySuggestions);
    
    // Simulation de demandes d'amis en attente
    const dummyPendingRequests = [
      {
        id: 'user4',
        name: 'Emma Rousseau',
        username: '@erousseau',
        avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
        requestTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 heures avant
      },
      {
        id: 'user5',
        name: 'Julien Petit',
        username: '@jpetit',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        requestTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 jour avant
      },
    ];
    
    setPendingRequests(dummyPendingRequests);
  }, []);
  
  // Fonction de recherche d'amis
  const searchFriends = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    try {
      // Ici, vous implémenteriez la recherche réelle dans Firebase
      // Exemple:
      // const q = query(
      //   collection(db, 'users'),
      //   where('email', '==', searchQuery)
      // );
      // const querySnapshot = await getDocs(q);
      // const results = querySnapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // }));
      
      // Simulation de résultats de recherche
      setTimeout(() => {
        const results = [
          {
            id: 'search1',
            name: 'Claire Dubois',
            username: '@clairedubois',
            avatar: 'https://randomuser.me/api/portraits/women/71.jpg',
            email: searchQuery,
          }
        ];
        
        setSearchResults(results);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      Alert.alert('Erreur', 'Impossible de compléter la recherche');
      setLoading(false);
    }
  };
  
  // Fonction pour envoyer une demande d'ami
  const sendFriendRequest = async (userId) => {
    try {
      // Ici, vous implémenteriez l'envoi de demande d'ami dans Firebase
      // Exemple:
      // await updateDoc(doc(db, 'users', userId), {
      //   friendRequests: arrayUnion(auth.currentUser.uid)
      // });
      
      Alert.alert('Succès', 'Demande d\'ami envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande d\'ami');
    }
  };
  
  // Fonction pour accepter une demande d'ami
  const acceptFriendRequest = async (userId) => {
    try {
      // Ici, vous implémenteriez l'acceptation de demande d'ami dans Firebase
      // Exemple:
      // const userRef = doc(db, 'users', auth.currentUser.uid);
      // const friendRef = doc(db, 'users', userId);
      
      // // Ajouter l'utilisateur à la liste d'amis du demandeur
      // await updateDoc(friendRef, {
      //   friends: arrayUnion(auth.currentUser.uid),
      //   friendRequests: arrayRemove(auth.currentUser.uid)
      // });
      
      // // Ajouter le demandeur à la liste d'amis de l'utilisateur
      // await updateDoc(userRef, {
      //   friends: arrayUnion(userId),
      //   pendingRequests: arrayRemove(userId)
      // });
      
      // Supprimer de la liste des demandes en attente
      setPendingRequests(pendingRequests.filter(request => request.id !== userId));
      
      Alert.alert('Succès', 'Demande d\'ami acceptée !');
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la demande:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter la demande d\'ami');
    }
  };
  
  // Fonction pour refuser une demande d'ami
  const rejectFriendRequest = async (userId) => {
    try {
      // Ici, vous implémenteriez le rejet de demande d'ami dans Firebase
      // Exemple:
      // await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      //   pendingRequests: arrayRemove(userId)
      // });
      
      // Supprimer de la liste des demandes en attente
      setPendingRequests(pendingRequests.filter(request => request.id !== userId));
      
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
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Rendu d'une suggestion d'ami
  const renderSuggestedFriend = ({ item }) => (
    <View style={styles.userItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>{item.username}</Text>
        <Text style={styles.mutualFriends}>
          {item.mutualFriends} ami{item.mutualFriends > 1 ? 's' : ''} en commun
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Rendu d'une demande d'ami en attente
  const renderPendingRequest = ({ item }) => (
    <View style={styles.userItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
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
          onPress={() => acceptFriendRequest(item.id)}
        >
          <Ionicons name="checkmark" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.requestButton, styles.rejectButton]}
          onPress={() => rejectFriendRequest(item.id)}
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