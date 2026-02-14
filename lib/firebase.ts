
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper: Membersihkan tanda kutip jika user tidak sengaja memasukkannya di Cloudflare ENV
const cleanEnv = (val: string | undefined) => {
  if (!val) return undefined;
  return val.replace(/^"|"$/g, '').replace(/^'|'$/g, ''); 
};

// NOTE: We must access import.meta.env.VITE_XXX explicitly for Vite to perform static replacement.
const firebaseConfig = {
  apiKey: cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID)
};

// Initialize Firebase with error handling
let app;
let auth: any;
let db: any;

try {
  // Check if critical config is present
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-key') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config missing or invalid", firebaseConfig);
  }
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

export { auth, db };

export const isFirebaseConfigured = () => {
  return !!app && !!auth && !!db;
};
