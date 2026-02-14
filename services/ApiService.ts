
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  deleteDoc
} from "firebase/firestore";
import { WeeklyData, User } from '../types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from '../constants';

// Domain dummy untuk mengubah username menjadi format email
const AUTH_DOMAIN = "@muslimquest.app";

class ApiService {
  
  // Helper: Convert username to fake email
  private toEmail(username: string): string {
    return `${username.toLowerCase().replace(/\s/g, '')}${AUTH_DOMAIN}`;
  }

  // --- HELPER FETCH USER ---
  async getUserProfile(uid: string): Promise<{ user: User; data: WeeklyData } | null> {
    if (!db) return null;
    try {
      // 1. Fetch User Profile
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) return null;
      const userData = userDoc.data() as any;

      // 2. Fetch Tracker Data
      const trackerDocRef = doc(db, "trackers", uid);
      const trackerDoc = await getDoc(trackerDocRef);
      
      let trackerData = INITIAL_DATA;
      if (trackerDoc.exists()) {
        const tData = trackerDoc.data() as any;
        trackerData = tData.data as WeeklyData;
      }

      const appUser: User = {
        username: userData.username,
        fullName: userData.fullName,
        password: '***', // Password tidak disimpan di client state demi keamanan
        role: userData.role,
        group: userData.group,
        status: userData.status,
        avatarSeed: userData.avatarSeed,
        characterId: userData.characterId
      };

      return { user: appUser, data: trackerData };
    } catch (e) {
      console.error("Get Profile Error:", e);
      return null;
    }
  }

  // --- AUTHENTICATION ---

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; data?: WeeklyData; error?: string }> {
    if (!auth) return { success: false, error: "Firebase belum terhubung. Cek koneksi/konfigurasi." };

    try {
      // 0. CEK ADMIN HARDCODED (Backdoor)
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        return {
          success: true,
          user: { ...ADMIN_CREDENTIALS },
          data: INITIAL_DATA 
        };
      }

      // 1. Firebase Auth Login
      const email = this.toEmail(username);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Fetch Data via Helper
      const profile = await this.getUserProfile(userCredential.user.uid);
      
      if (!profile) {
        // Jika login auth sukses tapi data firestore tidak ada (misal deleted user)
        // Kita logout kan saja
        await signOut(auth);
        return { success: false, error: 'Data user tidak ditemukan di database.' };
      }

      return { 
        success: true, 
        user: profile.user, 
        data: profile.data 
      };

    } catch (e: any) {
      console.error("Login Exception:", e);
      let errMsg = `Login gagal: ${e.message || e}`;
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        errMsg = "Username atau Password salah.";
      } else if (e.code === 'auth/too-many-requests') {
        errMsg = "Terlalu banyak percobaan. Tunggu sebentar.";
      } else if (e.code === 'auth/network-request-failed') {
        errMsg = "Gagal menghubungi server. Cek koneksi internet.";
      }
      return { success: false, error: errMsg };
    }
  }

  async registerUserSafe(newUser: User): Promise<{ success: boolean; error?: string }> {
    if (!auth || !db) return { success: false, error: "Firebase belum terhubung. Cek koneksi/konfigurasi." };

    try {
      const email = this.toEmail(newUser.username);

      // NOTE: Kita menghapus pengecekan manual Firestore di sini karena 
      // bisa menyebabkan error 'Permission Denied' jika Rules Firestore memblokir unauthenticated read.
      // Kita andalkan error 'auth/email-already-in-use' dari Firebase Auth saja.

      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, newUser.password || '123456');
      const firebaseUser = userCredential.user;

      // 2. Simpan Profile ke Firestore
      // Kita menggunakan Promise.all untuk mempercepat
      await Promise.all([
        setDoc(doc(db, "users", firebaseUser.uid), {
          username: newUser.username,
          fullName: newUser.fullName,
          role: newUser.role,
          group: newUser.group,
          status: newUser.status,
          avatarSeed: newUser.avatarSeed,
          characterId: newUser.characterId,
          createdAt: new Date().toISOString()
        }),
        setDoc(doc(db, "trackers", firebaseUser.uid), {
          username: newUser.username,
          data: { ...INITIAL_DATA, lastUpdated: new Date().toISOString() },
          lastUpdated: new Date().toISOString()
        }),
        updateProfile(firebaseUser, { displayName: newUser.fullName })
      ]);

      return { success: true };
    } catch (e: any) {
      console.error("Registration Exception:", e);
      let errMsg = `Gagal mendaftar: ${e.message}`;
      
      if (e.code === 'auth/email-already-in-use') errMsg = "Username sudah terdaftar. Coba yang lain.";
      if (e.code === 'auth/weak-password') errMsg = "Password terlalu lemah (min 6 karakter).";
      if (e.code === 'auth/network-request-failed') errMsg = "Masalah koneksi internet.";
      
      return { success: false, error: errMsg };
    }
  }

  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<any> {
    if (!currentUser) return { success: false };
    if (!db || !auth) return { success: false };
    
    // Khusus Admin Backdoor, tidak sync ke DB
    if (currentUser.username === ADMIN_CREDENTIALS.username) return { success: true };

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
         console.warn("Sync skipped: No Auth Session");
         return { success: false };
      }

      await setDoc(doc(db, "trackers", firebaseUser.uid), {
          data: localData,
          lastUpdated: new Date().toISOString(),
          username: currentUser.username
      }, { merge: true });

      return { success: true };
    } catch (e) {
      console.error("Sync Error:", e);
      return { success: false };
    }
  }

  async getAllUsersWithPoints(): Promise<any[]> {
    if (!db) return [];
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => ({ uid: d.id, ...(d.data() as any) } as any));

      const trackersSnap = await getDocs(collection(db, "trackers"));
      const trackersMap: Record<string, any> = {};
      trackersSnap.forEach(d => {
        trackersMap[d.id] = d.data();
      });

      return users.map(u => ({
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        group: u.group,
        status: u.status,
        avatarSeed: u.avatarSeed,
        characterId: u.characterId,
        trackerData: trackersMap[u.uid]?.data || null
      }));

    } catch (e) {
      console.error("Fetch Users Error:", e);
      return [];
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    if (!db) return false;
    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return false;
      const uid = snapshot.docs[0].id;

      await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "trackers", uid));
      return true;
    } catch (e) {
      return false;
    }
  }

  async updateUserProfile(user: User): Promise<boolean> {
    if (!db || !auth) return false;
    try {
       let uid = auth.currentUser?.uid;
       if (!uid) return false;

       await setDoc(doc(db, "users", uid), {
          fullName: user.fullName,
          avatarSeed: user.avatarSeed,
          characterId: user.characterId
       }, { merge: true });
      
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const api = new ApiService();
