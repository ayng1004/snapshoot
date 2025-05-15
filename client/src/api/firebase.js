// src/api/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Utilisez simplement getAuth pour l'instant
import { getFirestore } from 'firebase/firestore';

// Votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDBeQKSkA4GvpL6WzJxPOcbX_fo9V6z9NY",
  authDomain: "snapshoot-c0cf9.firebaseapp.com",
  projectId: "snapshoot-c0cf9",
  storageBucket: "snapshoot-c0cf9.firebasestorage.app",
  messagingSenderId: "980625565298",
  appId: "1:980625565298:web:09585b25a926618a5344eb",
  measurementId: "G-DDR6ECT00V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Auth - simplement avec getAuth pour éviter les erreurs
const auth = getAuth(app);

// Initialisation de Firestore
const db = getFirestore(app);

// Mock pour Storage
const storage = {
  ref: (path) => ({
    put: async (file) => ({
      ref: {
        getDownloadURL: async () => 'https://via.placeholder.com/150'
      }
    }),
    getDownloadURL: async () => 'https://via.placeholder.com/150'
  })
};

// Exporter les services
export { auth, db, storage };
export default app;