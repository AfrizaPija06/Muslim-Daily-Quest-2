
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Mengambil config dari .env
// Gunakan fallback string kosong agar tidak crash saat build/dev awal
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

export const isFirebaseConfigured = () => {
  return (import.meta as any).env.VITE_FIREBASE_API_KEY && 
         (import.meta as any).env.VITE_FIREBASE_API_KEY !== 'AIzaSy...';
};
