import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

const StoriesScreen = ({ navigation }) => {
  const [stories, setStories] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [progress, setProgress] = useState(new Animated.Value(0));
  const progressAnimation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });
  
  // Simulation des données pour les stories
  useEffect(() => {
    // Ici, vous appelleriez normalement une fonction pour récupérer les stories depuis Firebase
    const dummyStories = [
      {
        id: '1',
        user: {
          id: 'user1',
          name: 'Alex Dubois',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        },
        items: [
          {
            id: 'story1',
            type: 'image',
            url: 'https://source.unsplash.com/random/800x1200/?city',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            caption: 'Belle soirée sur Paris 🗼',
          },
          {
            id: 'story2',
            type: 'video',
            url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            timestamp: new Date(Date.now() - 1000 * 60 * 20),
            caption: 'Concert incroyable !',
          }
        ],
      },
      {
        id: '2',
        user: {
          id: 'user2',
          name: 'Marie Laurent',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        },
        items: [
          {
            id: 'story3',
            type: 'image',
            url: 'https://source.unsplash.com/random/800x1200/?beach',
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
            caption: 'Vacances au soleil 🏖️',
          }
        ],
      },
      // Ajoutez plus de stories simulées
    ];
    
    setStories(dummyStories);
  }, []);
  
  // Gestion du temps d'affichage d'une story
  const storyTimeout = () => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000, // 5 secondes par story
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished) {
        // Passer à la story suivante ou revenir à la liste
        handleNextStory();
      }
    });
  };
  
  const handleStoryPress = (index) => {
    progress.setValue(0);
    setActiveStoryIndex(index);
    storyTimeout();
  };
  
  const handleNextStory = () => {
    if (activeStoryIndex !== null) {
      // Vérifier s'il y a d'autres stories dans le groupe actuel
      const currentStory = stories[activeStoryIndex];
      const currentItemIndex = currentStory.currentItem || 0;
      
      if (currentItemIndex + 1 < currentStory.items.length) {
        // Passer à l'item suivant dans le même groupe
        stories[activeStoryIndex].currentItem = currentItemIndex + 1;
        setStories([...stories]);
        progress.setValue(0);
        storyTimeout();
      } else {
        // Passer au groupe de stories suivant
        if (activeStoryIndex + 1 < stories.length) {
          stories[activeStoryIndex + 1].currentItem = 0;
          setStories([...stories]);
          progress.setValue(0);
          setActiveStoryIndex(activeStoryIndex + 1);
          storyTimeout();
        } else {
          // Revenir à la liste des stories
          setActiveStoryIndex(null);
        }
      }
    }
  };
  
  const handlePreviousStory = () => {
    if (activeStoryIndex !== null) {
      const currentStory = stories[activeStoryIndex];
      const currentItemIndex = currentStory.currentItem || 0;
      
      if (currentItemIndex > 0) {
        // Revenir à l'item précédent dans le même groupe
        stories[activeStoryIndex].currentItem = currentItemIndex - 1;
        setStories([...stories]);
        progress.setValue(0);
        storyTimeout();
      } else {
        // Revenir au groupe de stories précédent
        if (activeStoryIndex > 0) {
          const prevStoryIndex = activeStoryIndex - 1;
          const prevStory = stories[prevStoryIndex];
          stories[prevStoryIndex].currentItem = prevStory.items.length - 1;
          setStories([...stories]);
          progress.setValue(0);
          setActiveStoryIndex(prevStoryIndex);
          storyTimeout();
        }
      }
    }
  };
  
  // Gestion des gestes pour naviguer entre les stories
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gestureState) => {
        // Si le mouvement horizontal est significatif
        if (Math.abs(gestureState.dx) > 50) {
          if (gestureState.dx > 0) {
            // Swipe vers la droite - Story précédente
            handlePreviousStory();
          } else {
            // Swipe vers la gauche - Story suivante
            handleNextStory();
          }
        } else if (Math.abs(gestureState.dy) > 100) {
          // Swipe vertical significatif - Fermer les stories
          setActiveStoryIndex(null);
        } else {
          // Tap simple
          const x = evt.nativeEvent.locationX;
          const screenWidth = Dimensions.get('window').width;
          
          if (x < screenWidth / 3) {
            // Tap sur la partie gauche - Story précédente
            handlePreviousStory();
          } else if (x > (screenWidth * 2) / 3) {
            // Tap sur la partie droite - Story suivante
            handleNextStory();
          }
        }
      },
      onPanResponderTerminate: () => {
        // Animation interrompue
        progress.stopAnimation();
      }
    })
  ).current;
  
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
  
  // Rendu d'un aperçu de story dans la liste
  const renderStoryPreview = ({ item, index }) => {
    const hasUnseenStories = true; // À remplacer par la logique réelle
    
    return (
      <TouchableOpacity 
        style={styles.storyPreviewContainer}
        onPress={() => handleStoryPress(index)}
      >
        <View style={[styles.avatarContainer, hasUnseenStories ? styles.unseenStoryRing : null]}>
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        </View>
        <Text style={styles.username} numberOfLines={1}>
          {item.user.name}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Rendu de la story active
  const renderActiveStory = () => {
    if (activeStoryIndex === null) return null;
    
    const story = stories[activeStoryIndex];
    const itemIndex = story.currentItem || 0;
    const storyItem = story.items[itemIndex];
    
    return (
      <View style={styles.storyContainer} {...panResponder.panHandlers}>
        <StatusBar hidden />
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {story.items.map((item, i) => (
            <View key={i} style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.activeProgress,
                  i === itemIndex ? { width: progressAnimation } : i < itemIndex ? { width: '100%' } : { width: '0%' }
                ]}
              />
            </View>
          ))}
        </View>
        
        {/* Header */}
        <View style={styles.storyHeader}>
          <View style={styles.storyUser}>
            <Image source={{ uri: story.user.avatar }} style={styles.storyAvatar} />
            <View>
              <Text style={styles.storyUsername}>{story.user.name}</Text>
              <Text style={styles.storyTime}>
                {getElapsedTime(storyItem.timestamp)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => setActiveStoryIndex(null)}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        {storyItem.type === 'image' ? (
          <Image source={{ uri: storyItem.url }} style={styles.storyMedia} resizeMode="cover" />
        ) : (
          <Video
            source={{ uri: storyItem.url }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="cover"
            shouldPlay
            style={styles.storyMedia}
          />
        )}
        
        {/* Caption */}
        {storyItem.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{storyItem.caption}</Text>
          </View>
        )}
        
        {/* Navigation buttons - invisible but functional */}
        <TouchableOpacity 
          style={styles.prevButton} 
          onPress={handlePreviousStory}
        />
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNextStory}
        />
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {activeStoryIndex !== null ? (
        renderActiveStory()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Stories</Text>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={() => navigation.navigate('Camera')}
            >
              <Ionicons name="camera-outline" size={24} color="#6C13B3" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={stories}
            renderItem={renderStoryPreview}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          />
          
          <View style={styles.divider} />
          
          <Text style={styles.feedTitle}>Découvrir</Text>
          <FlatList
            data={stories}
            keyExtractor={item => `feed-${item.id}`}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              // Prendre la première story comme aperçu
              const previewStory = item.items[0];
              
              return (
                <TouchableOpacity 
                  style={styles.feedItem}
                  onPress={() => handleStoryPress(index)}
                >
                  <Image 
                    source={{ uri: previewStory.url }} 
                    style={styles.feedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.feedItemOverlay}>
                    <View style={styles.feedItemUser}>
                      <Image source={{ uri: item.user.avatar }} style={styles.feedItemAvatar} />
                      <Text style={styles.feedItemUsername}>{item.user.name}</Text>
                    </View>
                    {previewStory.caption && (
                      <Text style={styles.feedItemCaption} numberOfLines={2}>
                        {previewStory.caption}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesList: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 15,
  },
  storyPreviewContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  unseenStoryRing: {
    borderColor: '#6C13B3',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
// Suite des styles pour StoriesScreen
  username: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  feedItem: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    height: 200,
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedItemOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    padding: 15,
  },
  feedItemUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedItemAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  feedItemUsername: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  feedItemCaption: {
    color: 'white',
    fontSize: 13,
  },
  storyContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
    padding: 10,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
    borderRadius: 3,
  },
  activeProgress: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  storyHeader: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    zIndex: 10,
  },
  storyUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'white',
  },
  storyUsername: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  storyTime: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  storyMedia: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  caption: {
    color: 'white',
    fontSize: 16,
  },
  prevButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30%',
    height: '100%',
    zIndex: 9,
  },
  nextButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '30%',
    height: '100%',
    zIndex: 9,
  },
});

export default StoriesScreen;