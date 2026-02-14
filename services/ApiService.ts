
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
        return { success: false, error: 'Data user tidak ditemukan di database.' };
      }

      return { 
        success: true, 
        user: profile.user, 
        data: profile.data 
      };

    } catch (e: any) {
      console.error("Login Exception:", e);
      let errMsg = "Login gagal.";
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        errMsg = "Username atau Password salah.";
      } else if (e.code === 'auth/too-many-requests') {
        errMsg = "Terlalu banyak percobaan. Tunggu sebentar.";
      }
      return { success: false, error: errMsg };
    }
  }

  async registerUserSafe(newUser: User): Promise<{ success: boolean; error?: string }> {
    try {
      const email = this.toEmail(newUser.username);

      // 1. Check if username exists using Firestore Query
      const q = query(collection(db, "users"), where("username", "==", newUser.username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { success: false, error: "Username sudah digunakan." };
      }

      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, newUser.password || '123456');
      const firebaseUser = userCredential.user;

      // 3. Simpan Profile ke Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        group: newUser.group,
        status: newUser.status,
        avatarSeed: newUser.avatarSeed,
        characterId: newUser.characterId,
        createdAt: new Date().toISOString()
      });

      // 4. Initialize Tracker
      const newTracker = { ...INITIAL_DATA, lastUpdated: new Date().toISOString() };
      await setDoc(doc(db, "trackers", firebaseUser.uid), {
        username: newUser.username,
        data: newTracker,
        lastUpdated: new Date().toISOString()
      });

      await updateProfile(firebaseUser, { displayName: newUser.fullName });

      return { success: true };
    } catch (e: any) {
      console.error("Registration Exception:", e);
      let errMsg = "Gagal mendaftar.";
      if (e.code === 'auth/email-already-in-use') errMsg = "Username sudah terdaftar.";
      if (e.code === 'auth/weak-password') errMsg = "Password terlalu lemah (min 6 karakter).";
      return { success: false, error: errMsg };
    }
  }

  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<any> {
    if (!currentUser) return { success: false };
    
    // Khusus Admin Backdoor, tidak sync ke DB
    if (currentUser.username === ADMIN_CREDENTIALS.username) return { success: true };

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
         // Jika session auth hilang tapi app masih jalan, coba restore atau fail silently
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
