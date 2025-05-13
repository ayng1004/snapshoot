// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../api/supabaseApi';


const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Récupérer le profil utilisateur
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  };

  useEffect(() => {
    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        setLoading(true);
const { data, error } = await supabase.auth.getSession();
if (error) throw error;
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          await fetchUserProfile(data.session.user.id);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Mettre en place un écouteur pour les changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Valeurs exposées par le contexte
  const value = {
    user,
    session,
    loading,
    userProfile,
    refreshProfile: () => user && fetchUserProfile(user.id),
    
    // Méthodes d'authentification
    signUp: async (data) => {
      try {
        const { email, password, username, fullname } = data;
        
        // Vérifier si le nom d'utilisateur existe déjà
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();
        
        if (existingUser) {
          return { error: { message: 'Ce nom d\'utilisateur est déjà pris' } };
        }
        
        // Créer le compte
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: fullname }
          }
        });
        
        // Créer le profil
        if (result.data?.user && !result.error) {
          await supabase.from('profiles').insert([
            {
              id: result.data.user.id,
              username: username.toLowerCase(),
              display_name: fullname,
              bio: '',
              profile_image: ''
            }
          ]);
        }
        
        return result;
      } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        return { error };
      }
    },
    
    signIn: async ({ email, password }) => {
  const result = await supabase.auth.signIn({ email, password });

  if (result?.data?.session && result?.data?.user) {
    // On met à jour manuellement le contexte ici ⬇️
    setSession(result.data.session);
    setUser(result.data.user);
    await fetchUserProfile(result.data.user.id);
  }

  return result;
},

    
    signOut: async () => {
      return await supabase.auth.signOut();
    },
    
    resetPassword: async (email) => {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'snapshoot://reset-password',
      });
    },
    
    updateProfile: async (updates) => {
      if (!user) return { error: { message: 'Utilisateur non connecté' } };
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        
        if (error) throw error;
        
        // Rafraîchir le profil
        await fetchUserProfile(user.id);
        
        return { data: userProfile, error: null };
      } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        return { error };
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};