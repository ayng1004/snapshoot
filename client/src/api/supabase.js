import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://mqtcpktrnzojscqrtiuy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdGNwa3RybnpvanNjcXJ0aXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjAwODUsImV4cCI6MjA2MjczNjA4NX0.VzHg-OemqFV6pFt832iXHfzagM40DWbebORtztAqh3U';
const SESSION_KEY = 'supabase.session';

// Gestion de la session locale
const loadSessionFromStorage = async () => {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

const saveSession = async (session) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Requête vers Supabase REST API
export const fetchApi = async (endpoint, options = {}) => {
  const session = await loadSessionFromStorage();

  // On force le header apikey quoiqu'il arrive
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'apikey': SUPABASE_KEY,  // Assurez-vous que c'est au bon format
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    console.log('📡 fetchApi', {
      url: `${SUPABASE_URL}${endpoint}`,
      method: config.method,
      headers: config.headers,
      body: config.body,
    });

    const response = await fetch(`${SUPABASE_URL}${endpoint}`, config);
    
    // Ajoutez cette ligne pour déboguer la réponse
    console.log('Response status:', response.status);
    
    const data = await response.json();

    if (!response.ok) {
      throw {
        message: data?.message || 'Une erreur est survenue',
        response: data,
        status: response.status,
        url: endpoint,
        body: config.body,
      };
    }

    return data;
  } catch (error) {
    console.error('❌ Supabase error:', error);
    throw error;
  }
};
// Auth
const auth = {
  signUp: async ({ email, password, options }) => {
    const response = await fetchApi('/auth/v1/signup', {
      method: 'POST',
      body: { email, password, data: options?.data }
    });

    if (response.user) await saveSession(response);

    return {
      data: {
        session: response,
        user: response.user
      },
      error: null
    };
  },

 // Dans src/api/supabaseMixed.js, modifiez la fonction signIn dans l'objet auth
signIn: async ({ email, password }) => {
  const response = await fetchApi('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password }
  });

  if (response.access_token) {
    // Assurez-vous que la réponse contient un objet user
    if (!response.user) {
      // Si user n'est pas fourni, créez un objet user minimal
      response.user = {
        id: response.user_id || response.sub || 'unknown_id',
        email: email,
        // Ajoutez d'autres propriétés au besoin
      };
    }
    
    await saveSession(response);
  }

  // Ajouter des logs pour débogage
  console.log('Session après connexion:', response);

  return {
    data: {
      session: response,
      user: response.user
    },
    error: null
  };
},

  signOut: async () => {
    await fetchApi('/auth/v1/logout', { method: 'POST' });
    await clearSession();
    return { error: null };
  },

  getSession: async () => {
    const session = await loadSessionFromStorage();
    return {
      data: {
        session,
        user: session?.user
      }
    };
  },

  onAuthStateChange: (callback) => {
    const checkSession = async () => {
      const session = await loadSessionFromStorage();
      callback('SIGNED_IN', { session });
    };
    checkSession();
    return {
      subscription: { unsubscribe: () => {} }
    };
  },

  resetPasswordForEmail: async (email) => {
    return await fetchApi('/auth/v1/recover', {
      method: 'POST',
      body: { email }
    });
  }
};

// Query
// Query
const createQueryBuilder = (table) => {
  let url = `/rest/v1/${table}`;
  let method = 'GET';
  let body = null;
  const headers = {};
  let queryParams = new URLSearchParams();

  const builder = {
    select: (columns) => {
      queryParams.set('select', columns);
      return builder;
    },
    eq: (column, value) => {
      queryParams.set(`${column}`, `eq.${value}`);
      return builder;
    },
    insert: (data) => {
      method = 'POST';
      body = Array.isArray(data) ? data : [data];
      headers['Prefer'] = 'return=representation';
      return builder;
    },
    update: (data) => {
      method = 'PATCH';
      body = data;
      headers['Prefer'] = 'return=representation';
      return builder;
    },
    delete: () => {
      method = 'DELETE';
      headers['Prefer'] = 'return=representation';
      return builder;
    },
    single: () => {
      headers['Accept'] = 'application/vnd.pgrst.object+json';
      return builder;
    },
    then: async (callback) => {
      const queryString = queryParams.toString();
      const fullUrl = `${url}${queryString ? `?${queryString}` : ''}`;
      
      // Veuillez noter que nous ne passons que les headers spécifiques à cette requête
      // Les headers communs comme apikey seront ajoutés par fetchApi
      const result = await fetchApi(fullUrl, {
        method,
        body,
        headers  // Ces headers sont enrichis automatiquement dans fetchApi avec apikey + auth
      });
      
      return callback ? callback(result) : result;
    }
  };

  return builder;
};
// Storage
const storage = {
  from: (bucket) => ({
    upload: async (path, fileData) => {
      const response = await fetchApi(`/storage/v1/object/${bucket}/${path}`, {
        method: 'POST',
        body: fileData,
        headers: { 'Content-Type': 'application/octet-stream' }
      });

      return { data: response, error: null };
    },
    getPublicUrl: (path) => ({
      publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
    })
  })
};

// Réaltime simple (version simplifiée qui ne cause pas d'erreurs)
const realtime = {
  channel: (channelName) => {
    const callbacks = [];
    let isSubscribed = false;

    const fakeSub = {
      on: (event, table, filter, callback) => {
        console.log(`Realtime: would subscribe to ${event} on ${table} with filter ${filter}`);
        callbacks.push(callback);
        return fakeSub;
      },
      subscribe: () => {
        isSubscribed = true;
        console.log(`Realtime: subscribed to channel ${channelName}`);
        return {
          unsubscribe: () => {
            isSubscribed = false;
            callbacks.length = 0;
            console.log(`Realtime: unsubscribed from channel ${channelName}`);
          }
        };
      }
    };

    return fakeSub;
  }
};


const supabase = {
  auth,
  from: (table) => createQueryBuilder(table),
  storage,
  channel: realtime.channel
};

export default supabase;