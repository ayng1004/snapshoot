// src/screens/AuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp, loading } = useAuth();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    // Règles de validation du mot de passe
    if (password.includes(' ')) {
      return false;
    }
    return password.length >= 6;
  };

  const handleAuth = async () => {
    try {
      // Validation des champs
      if (!email || !password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }

      if (!validateEmail(email)) {
        Alert.alert('Erreur', 'Veuillez entrer un email valide');
        return;
      }

      if (!validatePassword(password)) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères et ne pas contenir d\'espaces');
        return;
      }

      // Validation additionnelle pour l'inscription
      if (!isLogin && !displayName) {
        Alert.alert('Erreur', 'Veuillez saisir un nom d\'utilisateur');
        return;
      }

      // Appel aux fonctions d'authentification
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
    } catch (error) {
      // Affichage de l'erreur
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur s\'est produite lors de l\'authentification'
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>SnapShoot</Text>
        <Text style={styles.subtitle}>{isLogin ? 'Connexion' : 'Inscription'}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Mot de passe (sans espaces)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />
        
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="none"
          />
        )}
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Se connecter' : 'S\'inscrire'}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#6C13B3',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#6C13B3',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    textAlign: 'center',
    color: '#6C13B3',
    marginTop: 10,
  },
});

export default AuthScreen;