
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper: Membersihkan tanda kutip jika user tidak sengaja memasukkannya di Cloudflare ENV
// Contoh: '"AIzaSy..."' menjadi 'AIzaSy...'
const cleanEnv = (val: string | undefined) => {
  if (!val) return undefined;
  return val.replace(/^"|"$/g, '').replace(/^'|'$/g, ''); // Hapus kutip ganda atau tunggal di awal/akhir
};

// Safe access to environment variables to prevent "Cannot read properties of undefined"
// This handles cases where import.meta.env might be undefined at runtime.
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const firebaseConfig = {
  apiKey: cleanEnv(env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(env.VITE_FIREBASE_APP_ID)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

export const isFirebaseConfigured = () => {
  const key = firebaseConfig.apiKey;
  // Basic validation: Check if key exists and is not the demo placeholder
  return key && key !== 'demo-key' && !key.includes('AIzaSyBhof_BW2uI8Ze0ywN');
};
