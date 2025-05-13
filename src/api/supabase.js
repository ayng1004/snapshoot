// src/api/supabase.js
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Remplacez ces valeurs par celles de votre projet Supabase
const supabaseUrl = 'https://mqtcpktrnzojscqrtiuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdGNwa3RybnpvanNjcXJ0aXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjAwODUsImV4cCI6MjA2MjczNjA4NX0.VzHg-OemqFV6pFt832iXHfzagM40DWbebORtztAqh3U';

// Créez une configuration très basique sans fonctionnalités avancées
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  localStorage: AsyncStorage,
  detectSessionInUrl: false,
  autoRefreshToken: false,
  persistSession: true,
  // Désactivez realtime qui cause des problèmes
  realtime: {
    autoConnect: false
  }
});

export default supabase;