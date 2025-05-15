// src/api/supabaseClient.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Configuration Supabase
const SUPABASE_URL = 'https://mqtcpktrnzojscqrtiuy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdGNwa3RybnpvanNjcXJ0aXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjAwODUsImV4cCI6MjA2MjczNjA4NX0.VzHg-OemqFV6pFt832iXHfzagM40DWbebORtztAqh3U';

// Options pour les environnements React Native
const options = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // Désactiver le client realtime qui cause souvent des problèmes
  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },
};

// Création du client Supabase
const supabaseold = createClient(SUPABASE_URL, SUPABASE_KEY, options);

export default supabaseold;