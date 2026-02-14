
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

  // --- AUTHENTICATION ---

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; data?: WeeklyData; error?: string }> {
    try {
      // 0. CEK ADMIN HARDCODED (Backdoor)
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Coba ambil data admin dari Firestore jika ada
        let trackerData = null;
        try {
          const email = this.toEmail(username);
          // Kita tidak login ke Auth Firebase utk admin backdoor, tapi coba fetch data by ID manual jika perlu
          // Untuk simplifikasi, admin backdoor pakai local data dulu, atau login normal jika akun admin didaftarkan
        } catch (e) {}

        return {
          success: true,
          user: {
            ...ADMIN_CREDENTIALS,
            username: ADMIN_CREDENTIALS.username // ensure type match
          },
          data: INITIAL_DATA // Admin pakai data dummy/reset
        };
      }

      // 1. Firebase Auth Login
      const email = this.toEmail(username);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Fetch User Profile from Firestore 'users' collection
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return { success: false, error: 'Data user tidak ditemukan di database.' };
      }

      const userData = userDoc.data();

      // 3. Fetch Tracker Data from Firestore 'trackers' collection
      const trackerDocRef = doc(db, "trackers", firebaseUser.uid);
      const trackerDoc = await getDoc(trackerDocRef);
      
      let trackerData = INITIAL_DATA;
      if (trackerDoc.exists()) {
        trackerData = trackerDoc.data().data as WeeklyData;
      }

      const appUser: User = {
        username: userData.username,
        fullName: userData.fullName,
        password: '***', // Dont expose
        role: userData.role,
        group: userData.group,
        status: userData.status,
        avatarSeed: userData.avatarSeed,
        characterId: userData.characterId
      };

      return { 
        success: true, 
        user: appUser, 
        data: trackerData 
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
      // (Meskipun Auth handle email unik, kita cek dulu biar pesan errornya enak)
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

      // Update display name di Auth (opsional, untuk kerapihan di console firebase)
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
      // Kita perlu UID. Di aplikasi real, kita simpan UID di state currentUser.
      // Tapi karena struktur User kita belum ada UID, kita cari manual via username query
      // ATAU: Karena Auth state dipertahankan Firebase, kita bisa pakai auth.currentUser
      
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        // Fallback: Login ulang background atau cari user by username di db (agak insicure tpi ok utk migrasi)
        // Cara aman: Cari doc ID berdasarkan username
        const q = query(collection(db, "users"), where("username", "==", currentUser.username));
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error("User not found for sync");
        
        const uid = snapshot.docs[0].id;
        await setDoc(doc(db, "trackers", uid), {
          data: localData,
          lastUpdated: new Date().toISOString(),
          username: currentUser.username
        }, { merge: true });

      } else {
        // Happy path
        await setDoc(doc(db, "trackers", firebaseUser.uid), {
          data: localData,
          lastUpdated: new Date().toISOString(),
          username: currentUser.username
        }, { merge: true });
      }

      return { success: true };
    } catch (e) {
      console.error("Sync Error:", e);
      return { success: false };
    }
  }

  async getAllUsersWithPoints(): Promise<any[]> {
    try {
      // 1. Get All Users
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as any));

      // 2. Get All Trackers
      // (Di aplikasi skala besar, ini tidak efisien. Tapi untuk <1000 user masih oke/gratis di Firestore)
      const trackersSnap = await getDocs(collection(db, "trackers"));
      const trackersMap: Record<string, any> = {};
      trackersSnap.forEach(d => {
        trackersMap[d.id] = d.data();
      });

      // 3. Join Data
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
      // Cari UID dulu
      const q = query(collection(db, "users"), where("username", "==", username));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return false;

      const uid = snapshot.docs[0].id;

      // Hapus data di Firestore
      await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "trackers", uid));

      // Note: Menghapus user dari Auth (Authentication) butuh Admin SDK (Backend Node.js).
      // Client SDK tidak bisa menghapus user lain selain dirinya sendiri.
      // Jadi untuk versi client-only ini, user hanya "hilang" dari database & leaderboard,
      // tapi login credentialnya masih ada (cuma pas login akan error karena data db tidak ditemukan).
      
      return true;
    } catch (e) {
      return false;
    }
  }

  async updateUserProfile(user: User): Promise<boolean> {
    try {
       // Cari UID
       let uid = auth.currentUser?.uid;

       if (!uid) {
         const q = query(collection(db, "users"), where("username", "==", user.username));
         const snapshot = await getDocs(q);
         if (!snapshot.empty) uid = snapshot.docs[0].id;
       }

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
