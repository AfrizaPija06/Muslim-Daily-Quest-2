
import { auth, db } from '../lib/firebase';
import { WeeklyData, User } from '../types';
import { INITIAL_DATA, ADMIN_CREDENTIALS, MENTOR_AVATAR_URL } from '../constants';

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
      // v8: db.collection("users").doc(uid).get()
      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists) return null;
      const userData = userDoc.data() as any;

      // 2. Fetch Tracker Data
      const trackerDoc = await db.collection("trackers").doc(uid).get();
      
      let trackerData = INITIAL_DATA;
      if (trackerDoc.exists) {
        const tData = trackerDoc.data() as any;
        trackerData = tData.data as WeeklyData;
      }
      
      // Override avatar admin with constant to ensure instant update
      let finalAvatar = userData.avatarSeed;
      if (userData.username === ADMIN_CREDENTIALS.username) {
         finalAvatar = MENTOR_AVATAR_URL;
      }

      const appUser: User = {
        username: userData.username,
        fullName: userData.fullName,
        password: '***', // Password tidak disimpan di client state demi keamanan
        role: userData.role,
        group: userData.group,
        status: userData.status,
        avatarSeed: finalAvatar,
        characterId: userData.characterId,
        unlockedBadges: userData.unlockedBadges || [], // Default empty
        bonusPoints: userData.bonusPoints || 0 // Default 0
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
      // 1. Firebase Auth Login (v8 style)
      const email = this.toEmail(username);
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      
      // [FIX] Self-Heal: Force update role for Admin to ensure Permissions work correctly
      // This handles cases where the admin account was created before roles were enforced
      if (username === ADMIN_CREDENTIALS.username) {
        await db.collection("users").doc(userCredential.user!.uid).set({
           role: 'mentor'
        }, { merge: true });
      }
      
      // 2. Fetch Data via Helper
      const profile = await this.getUserProfile(userCredential.user!.uid);
      
      if (!profile) {
        // Jika login auth sukses tapi data firestore tidak ada
        // (Mungkin admin baru yang belum diregister lewat app?)
        await auth.signOut();
        return { success: false, error: 'Akun ditemukan tapi Data Profile kosong. Silakan Register ulang.' };
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
        errMsg = "Username atau Password salah. Jika Admin, pastikan sudah Register.";
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
      
      // Override Role jika username adalah Admin yang ditentukan di config
      let finalRole = newUser.role;
      let finalAvatar = newUser.avatarSeed;
      
      if (newUser.username === ADMIN_CREDENTIALS.username) {
        finalRole = 'mentor';
        finalAvatar = MENTOR_AVATAR_URL;
      }

      // 1. Create Auth User (v8 style)
      const userCredential = await auth.createUserWithEmailAndPassword(email, newUser.password || '123456');
      const firebaseUser = userCredential.user!;

      // 2. Simpan Profile ke Firestore
      // Kita menggunakan Promise.all untuk mempercepat
      await Promise.all([
        db.collection("users").doc(firebaseUser.uid).set({
          username: newUser.username,
          fullName: newUser.fullName,
          role: finalRole, // Simpan role yang sudah divalidasi
          group: newUser.group,
          status: newUser.status,
          avatarSeed: finalAvatar,
          characterId: newUser.characterId,
          unlockedBadges: [],
          bonusPoints: 0,
          createdAt: new Date().toISOString()
        }),
        db.collection("trackers").doc(firebaseUser.uid).set({
          username: newUser.username,
          data: { ...INITIAL_DATA, lastUpdated: new Date().toISOString() },
          lastUpdated: new Date().toISOString()
        }),
        firebaseUser.updateProfile({ displayName: newUser.fullName })
      ]);

      return { success: true };
    } catch (e: any) {
      console.error("Registration Exception:", e);
      let errMsg = `Gagal mendaftar: ${e.message}`;
      
      if (e.code === 'auth/email-already-in-use') errMsg = "Username sudah terdaftar. Silakan Login.";
      if (e.code === 'auth/weak-password') errMsg = "Password terlalu lemah (min 6 karakter).";
      if (e.code === 'auth/network-request-failed') errMsg = "Masalah koneksi internet.";
      
      return { success: false, error: errMsg };
    }
  }

  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<any> {
    if (!currentUser) return { success: false };
    if (!db || !auth) return { success: false };
    
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
         console.warn("Sync skipped: No Auth Session");
         return { success: false };
      }

      await db.collection("trackers").doc(firebaseUser.uid).set({
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
      // Fetch users dan trackers secara paralel
      const [usersSnap, trackersSnap] = await Promise.all([
        db.collection("users").get(),
        db.collection("trackers").get()
      ]);

      const trackersMap: Record<string, any> = {};
      trackersSnap.forEach((d: any) => {
        // d.id adalah UID
        trackersMap[d.id] = d.data();
      });

      const users = usersSnap.docs.map((d: any) => {
        const userData = d.data();
        
        // Force override avatar admin in list
        let finalAvatar = userData.avatarSeed;
        if (userData.username === ADMIN_CREDENTIALS.username) {
           finalAvatar = MENTOR_AVATAR_URL;
        }

        return {
          uid: d.id,
          username: userData.username,
          fullName: userData.fullName,
          role: userData.role,
          group: userData.group,
          status: userData.status,
          avatarSeed: finalAvatar,
          characterId: userData.characterId,
          // Tambahkan points data agar admin bisa melihat
          unlockedBadges: userData.unlockedBadges || [],
          bonusPoints: userData.bonusPoints || 0,
          // Match data tracker berdasarkan UID
          trackerData: trackersMap[d.id]?.data || null
        };
      });

      return users;

    } catch (e) {
      console.error("Fetch Users Error:", e);
      return [];
    }
  }

  async deleteUser(username: string): Promise<{ success: boolean; error?: string }> {
    if (!db) return { success: false, error: "Database not initialized" };
    try {
      // 1. Find User by Username
      const snapshot = await db.collection("users").where("username", "==", username).get();
      
      if (snapshot.empty) return { success: false, error: "User not found in database" };
      const uid = snapshot.docs[0].id;

      // 2. Delete Profile & Tracker Data
      // Note: Auth User cannot be deleted by another user client-side, 
      // but deleting Firestore data effectively blocks them from logging in (getUserProfile returns null).
      await Promise.all([
         db.collection("users").doc(uid).delete(),
         db.collection("trackers").doc(uid).delete()
      ]);
      
      return { success: true };
    } catch (e: any) {
      console.error("Delete User Error:", e);
      let errMsg = e.message || "Delete failed";
      
      // Handle Permission Error explicitly with helpful hint
      if (e.code === 'permission-denied') {
         errMsg = "Permission Denied. Database menolak penghapusan. Coba LOGOUT dan LOGIN kembali sebagai Admin untuk memperbaiki status permission.";
      }
      
      return { success: false, error: errMsg };
    }
  }

  // Method to manually trigger repair if needed
  async repairAdminRole(): Promise<boolean> {
    if (!auth || !db) return false;
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
        const adminEmail = this.toEmail(ADMIN_CREDENTIALS.username);
        
        // Cek apakah email user saat ini adalah email admin
        if (user.email === adminEmail) {
            // Force create/update doc
            await db.collection("users").doc(user.uid).set({
                username: ADMIN_CREDENTIALS.username,
                role: 'mentor',
                status: 'active',
                fullName: ADMIN_CREDENTIALS.fullName,
                avatarSeed: MENTOR_AVATAR_URL
            }, { merge: true });
            
            console.log("Admin permissions repaired via Email match.");
            return true;
        }

        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists && doc.data()?.username === ADMIN_CREDENTIALS.username) {
           await db.collection("users").doc(user.uid).set({ role: 'mentor' }, { merge: true });
           console.log("Admin permissions repaired via Username match.");
           return true;
        }
        
        return false;
    } catch (e) {
        console.error("Repair failed", e);
        return false;
    }
  }

  async updateUserProfile(user: User): Promise<boolean> {
    if (!db || !auth) return false;
    try {
       let uid = auth.currentUser?.uid;
       if (!uid) return false;

       // Hanya update field yang perlu
       const updateData: any = {
          fullName: user.fullName,
          avatarSeed: user.avatarSeed,
          characterId: user.characterId,
          // Pastikan badge dan bonus points tersimpan saat ada update
          unlockedBadges: user.unlockedBadges || [],
          bonusPoints: user.bonusPoints || 0
       };

       await db.collection("users").doc(uid).set(updateData, { merge: true });
      
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const api = new ApiService();
