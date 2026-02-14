
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper: Membersihkan tanda kutip jika user tidak sengaja memasukkannya di Cloudflare ENV
// Contoh: '"AIzaSy..."' menjadi 'AIzaSy...'
const cleanEnv = (val: string | undefined) => {
  if (!val) return undefined;
  return val.replace(/^"|"$/g, '').replace(/^'|'$/g, ''); // Hapus kutip ganda atau tunggal di awal/akhir
};

const rawEnv = (import.meta as any).env;

const firebaseConfig = {
  apiKey: cleanEnv(rawEnv.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(rawEnv.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(rawEnv.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(rawEnv.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(rawEnv.VITE_FIREBASE_APP_ID)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

export const isFirebaseConfigured = () => {
  const key = firebaseConfig.apiKey;
  return key && key !== 'demo-key' && !key.includes('AIzaSyBhof_BW2uI8Ze0ywN'); // Basic validation
};
