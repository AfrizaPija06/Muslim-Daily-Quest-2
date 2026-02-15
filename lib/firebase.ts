import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// DEBUG LOG: Pastikan file ini dimuat oleh browser
console.log("🔥 [SYSTEM] Firebase Module Loading...");

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

// Log Config Status (Tanpa menampilkan full key demi keamanan, tapi cukup untuk debug)
const keyStatus = firebaseConfig.apiKey 
  ? `Present (Starts with ${firebaseConfig.apiKey.substring(0, 4)}...)` 
  : "MISSING / UNDEFINED";

console.log(`🔑 [SYSTEM] API Key Status: ${keyStatus}`);

// Initialize Firebase with error handling
let app;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;

try {
  // Check if critical config is present
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-key') {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
    auth = firebase.auth();
    db = firebase.firestore();
    // Menggunakan console.info agar lebih menonjol (warna biru/putih terang di chrome)
    console.info("✅ [SYSTEM] Firebase initialized successfully");
  } else {
    // Menggunakan console.error agar muncul merah jika gagal
    console.error("❌ [SYSTEM] Firebase config missing or invalid. Check .env file.");
    console.log("Debug Config Object:", firebaseConfig);
  }
} catch (e) {
  console.error("❌ [SYSTEM] Firebase Initialization Error:", e);
}

export { auth, db };

export const isFirebaseConfigured = () => {
  return !!app && !!auth && !!db;
};