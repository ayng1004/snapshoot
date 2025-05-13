// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

const AuthScreen = () => {
 const { signIn, signUp, user } = useAuth(); // ✅ tout en une fois
const navigation = useNavigation();


  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signIn({ email, password });
      
      if (error) {
        Alert.alert('Erreur de connexion', error.message || 'Identifiants incorrects');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !username || !fullname) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signUp({ 
        email, 
        password, 
        username, 
        fullname 
      });
      
      if (error) {
        Alert.alert('Erreur d\'inscription', error.message || 'Impossible de créer le compte');
      } else {
        // En cas de succès, le contexte d'authentification va automatiquement nous rediriger
        // grâce à l'écouteur onAuthStateChange
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        Alert.alert('Erreur', error.message || 'Impossible d\'envoyer l\'email de réinitialisation');
      } else {
        Alert.alert('Email envoyé', 'Un email pour réinitialiser votre mot de passe a été envoyé à ' + email);
      }
    } catch (error) {
      console.error('Erreur de réinitialisation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          {/* Logo - remplacer par votre logo ou utiliser un placeholder */}
          <View style={[styles.logo, {backgroundColor: '#6C13B3', justifyContent: 'center', alignItems: 'center', borderRadius: 50}]}>
            <Text style={{color: 'white', fontSize: 40, fontWeight: 'bold'}}>S</Text>
          </View>
          <Text style={styles.appName}>SnapShoot</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isLogin ? 'Connexion' : 'Inscription'}
          </Text>
          
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom complet"
                  value={fullname}
                  onChangeText={setFullname}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="at" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </>
          )}
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          )}
          
          {isLogin && (
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.authButton}
            onPress={isLogin ? handleLogin : handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.authButtonText}>
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setUsername('');
              setFullname('');
            }}
          >
            <Text style={styles.toggleText}>
              {isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </Text>
          </TouchableOpacity>
          
          {/* Mode développement (facultatif) */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: '#888', marginTop: 20 }]}
              onPress={() => {
                setEmail('dev@example.com');
                setPassword('password123');
                handleLogin();
              }}
            >
              <Text style={styles.authButtonText}>Mode développement</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6C13B3',
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    height: 55,
  },
  inputIcon: {
    marginHorizontal: 15,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#6C13B3',
    fontSize: 14,
  },
  authButton: {
    backgroundColor: '#6C13B3',
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    alignSelf: 'center',
  },
  toggleText: {
    color: '#6C13B3',
    fontSize: 14,
  },
});

export default AuthScreen;