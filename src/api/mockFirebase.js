// src/api/mockFirebase.js
// Version simulée de Firebase pour contourner les problèmes d'initialisation

// Mock Auth
export const auth = {
  currentUser: {
    uid: 'mock-user-123',
    email: 'user@example.com',
    displayName: 'Utilisateur Simulé'
  }
};

// Mock des fonctions d'auth
export const createUserWithEmailAndPassword = async (auth, email, password) => {
  console.log('Mock: createUserWithEmailAndPassword', { email, password });
  return {
    user: {
      uid: 'mock-user-123',
      email,
      displayName: ''
    }
  };
};

export const signInWithEmailAndPassword = async (auth, email, password) => {
  console.log('Mock: signInWithEmailAndPassword', { email, password });
  return {
    user: {
      uid: 'mock-user-123',
      email,
      displayName: 'Utilisateur Simulé'
    }
  };
};

export const onAuthStateChanged = (auth, callback) => {
  console.log('Mock: onAuthStateChanged');
  // Simuler un utilisateur déjà connecté
  setTimeout(() => {
    callback({
      uid: 'mock-user-123',
      email: 'user@example.com',
      displayName: 'Utilisateur Simulé'
    });
  }, 500);
  
  // Fonction de nettoyage
  return () => {};
};

// Mock Firestore
export const db = {
  collection: (collectionName) => ({
    doc: (docId) => ({
      get: async () => ({
        exists: true,
        data: () => ({
          uid: docId,
          email: 'user@example.com',
          username: 'username',
          displayName: 'Nom Complet',
          createdAt: new Date(),
          bio: 'Bio simulée',
          profileImage: '',
          friends: [],
          pendingRequests: []
        })
      }),
      set: async (data) => {
        console.log(`Mock: Setting document ${docId} in ${collectionName}`, data);
        return true;
      },
      update: async (data) => {
        console.log(`Mock: Updating document ${docId} in ${collectionName}`, data);
        return true;
      }
    }),
    where: () => ({
      get: async () => ({
        docs: []
      }),
      onSnapshot: (callback) => {
        callback({ docs: [] });
        return () => {};
      }
    }),
    add: async (data) => {
      console.log(`Mock: Adding document to ${collectionName}`, data);
      return { id: 'mock-doc-123' };
    }
  })
};

// Mock des fonctions Firestore
export const doc = (db, collectionName, docId) => ({
  get: async () => ({
    exists: true,
    data: () => ({
      uid: docId,
      email: 'user@example.com',
      username: 'username',
      displayName: 'Nom Complet'
    })
  }),
  set: async (data) => {
    console.log(`Mock: Setting document ${docId} in ${collectionName}`, data);
    return true;
  },
  update: async (data) => {
    console.log(`Mock: Updating document ${docId} in ${collectionName}`, data);
    return true;
  }
});

export const setDoc = async (docRef, data) => {
  console.log('Mock: setDoc', data);
  return true;
};

export const getDoc = async (docRef) => {
  console.log('Mock: getDoc');
  return {
    exists: () => true,
    data: () => ({
      uid: 'mock-doc-123',
      username: 'username',
      displayName: 'Nom Complet'
    })
  };
};

// Mock Storage
export const storage = {
  ref: (path) => ({
    put: async (file) => {
      console.log(`Mock: Uploading file to ${path}`);
      return {
        ref: {
          getDownloadURL: async () => 'https://via.placeholder.com/150'
        }
      };
    },
    getDownloadURL: async () => 'https://via.placeholder.com/150'
  })
};

export default {
  app: {
    name: 'MockFirebaseApp'
  }
};