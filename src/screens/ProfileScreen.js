// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { uploadProfileImage } from '../services/storage';

const ProfileScreen = ({ navigation }) => {
  const { user, userProfile, signOut, updateProfile, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  
  // Charger les données du profil
  useEffect(() => {
    if (userProfile) {
      setProfileImage(userProfile.profile_image || '');
      setUsername(userProfile.display_name || '');
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || '');
    }
  }, [userProfile]);
  
 useEffect(() => {
  if (user?.id) {
    console.log('🔄 Rafraîchissement du profil pour', user.id);
    refreshProfile();
  }
}, [user?.id]);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre galerie.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        setLoading(true);
        const imageUrl = await uploadProfileImage(result.assets[0].uri, user.id);
        setProfileImage(imageUrl);
      } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image:', error);
        Alert.alert('Erreur', 'Impossible de mettre à jour votre photo de profil');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const saveProfile = async () => {
    try {
      setLoading(true);
      const { error } = await updateProfile({
        display_name: username,
        bio,
        profile_image: profileImage,
        location
      });
      
      if (error) {
        Alert.alert('Erreur', error.message || 'Impossible de mettre à jour votre profil');
      } else {
        setIsEditing(false);
        Alert.alert('Succès', 'Profil mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre profil');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      Alert.alert('Erreur', 'Impossible de se déconnecter');
    }
  };
  
  if (!userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6C13B3" />
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {isEditing ? (
          <View style={styles.editHeaderButtons}>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveProfile} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#6C13B3" size="small" />
              ) : (
                <Text style={styles.saveButton}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('SettingsScreen')}
            >
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={styles.profileImageContainer} 
          onPress={isEditing ? pickImage : null}
          disabled={loading}
        >
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={50} color="#aaa" />
            </View>
          )}
          
          {isEditing && (
            <View style={styles.editImageOverlay}>
              <Ionicons name="camera" size={24} color="white" />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.profileInfo}>
          {isEditing ? (
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Nom d'utilisateur"
            />
          ) : (
            <Text style={styles.username}>{username}</Text>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Amis</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Stories</Text>
            </View>
            </View>
        </View>
      </View>
      
      <View style={styles.bioSection}>
        {isEditing ? (
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="À propos de vous"
            multiline
            maxLength={150}
          />
        ) : (
          <Text style={styles.bioText}>{bio || "Aucune bio"}</Text>
        )}
        
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          {isEditing ? (
            <TextInput
              style={styles.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Votre localisation"
            />
          ) : (
            <Text style={styles.locationText}>{location || "Non spécifié"}</Text>
          )}
        </View>
      </View>
      
      {isEditing && (
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Paramètres de confidentialité</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#d3d3d3", true: "#6C13B3" }}
              thumbColor={notifications ? "#fff" : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="location-outline" size={24} color="#333" />
              <Text style={styles.settingLabel}>Partage de localisation</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: "#d3d3d3", true: "#6C13B3" }}
              thumbColor={locationSharing ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>
      )}
      
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('FindFriendsScreen')}
        >
          <Ionicons name="people-outline" size={24} color="#6C13B3" />
          <Text style={styles.actionButtonText}>Trouver des amis</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyStoriesScreen')}
        >
          <Ionicons name="play-circle-outline" size={24} color="#6C13B3" />
          <Text style={styles.actionButtonText}>Mes stories</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    marginRight: 15,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  editHeaderButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    color: '#6C13B3',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#6C13B3',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(108, 19, 179, 0.8)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  usernameInput: {
    fontSize: 20,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  stat: {
    marginRight: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  bioSection: {
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  bioText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
  },
  bioInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    height: 80,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 5,
    color: '#666',
  },
  locationInput: {
    flex: 1,
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  settingsSection: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    marginLeft: 15,
    fontSize: 16,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;