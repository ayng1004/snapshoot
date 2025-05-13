import { Ionicons } from '@expo/vector-icons';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MapScreen = () => {
  const nearbyStories = [
    {
      id: '1',
      title: 'Concert au parc',
      description: 'Un super concert en plein air !',
      distance: '0.5 km',
      image: 'https://source.unsplash.com/random/300x200/?concert',
      user: {
        name: 'Marie Dupont',
        avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      },
    },
    {
      id: '2',
      title: 'Café du coin',
      description: 'Le meilleur café de la ville',
      distance: '1.2 km',
      image: 'https://source.unsplash.com/random/300x200/?coffee',
      user: {
        name: 'Lucas Martin',
        avatar: 'https://randomuser.me/api/portraits/men/43.jpg',
      },
    },
    {
      id: '3',
      title: 'Exposition d\'art',
      description: 'Une magnifique exposition d\'art contemporain',
      distance: '2.1 km',
      image: 'https://source.unsplash.com/random/300x200/?art',
      user: {
        name: 'Sophie Lefèvre',
        avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      },
    },
    {
      id: '4',
      title: 'Match de foot',
      description: 'Match amical au stade municipal',
      distance: '3.8 km',
      image: 'https://source.unsplash.com/random/300x200/?soccer',
      user: {
        name: 'Thomas Dubois',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      },
    },
  ];

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity style={styles.storyCard}>
      <Image source={{ uri: item.image }} style={styles.storyImage} />
      <View style={styles.storyInfo}>
        <View style={styles.storyHeader}>
          <Text style={styles.storyTitle}>{item.title}</Text>
          <Text style={styles.storyDistance}>{item.distance}</Text>
        </View>
        <Text style={styles.storyDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
          <Text style={styles.userName}>{item.user.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>À proximité</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.locationText}>
        <Ionicons name="location" size={16} color="#6C13B3" /> Paris, France
      </Text>
      
      <FlatList
        data={nearbyStories}
        renderItem={renderStoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.storyList}
      />
      
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 20,
    marginBottom: 15,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  storyList: {
    padding: 15,
  },
  storyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: 180,
  },
  storyInfo: {
    padding: 15,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  storyDistance: {
    fontSize: 14,
    color: '#6C13B3',
    fontWeight: '500',
  },
  storyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  userName: {
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6C13B3',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default MapScreen;