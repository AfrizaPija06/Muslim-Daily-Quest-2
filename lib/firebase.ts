
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// DEBUG LOG: Pastikan file ini dimuat oleh browser
console.log("🔥 [SYSTEM] Firebase Module Loading...");

// Helper: Membersihkan tanda kutip jika user tidak sengaja memasukkannya di Cloudflare ENV
const cleanEnv = (val: string | undefined) => {
  if (!val) return undefined;
  return val.replace(/^"|"$/g, '').replace(/^'|'$/g, ''); 
};

// SAFEGUARD: Ensure env object exists to prevent "Cannot read properties of undefined" error
const env = import.meta.env || {} as any;

// NOTE: We access properties off 'env' to avoid runtime crashes.
const firebaseConfig = {
  apiKey: cleanEnv(env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(env.VITE_FIREBASE_APP_ID)
};

// Log Config Status (Tanpa menampilkan full key demi keamanan, tapi cukup untuk debug)
const keyStatus = firebaseConfig.apiKey 
  ? `Present (Starts with ${firebaseConfig.apiKey.substring(0, 4)}...)` 
  : "MISSING / UNDEFINED";

console.log(`🔑 [SYSTEM] API Key Status: ${keyStatus}`);

// Initialize Firebase with error handling
let app: firebase.app.App | undefined;
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
    console.log("Debug: API Key is " + (firebaseConfig.apiKey ? "Present" : "Missing"));
  }
} catch (e) {
  console.error("❌ [SYSTEM] Firebase Initialization Error:", e);
}

export { auth, db };

export const isFirebaseConfigured = () => {
  return !!app && !!auth && !!db;
};
