
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { supabase } from '../lib/supabaseClient';

// ID unik untuk menyimpan semua data JSON dalam satu baris database
const DB_ROW_ID = 'global_store_v7';

class ApiService {
  
  // --- LOCAL STORAGE HELPERS (Offline Support) ---
  
  private getLocalData() {
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const groups = JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS));
    
    const trackers: Record<string, WeeklyData> = {};
    if (typeof localStorage !== 'undefined') {
       for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith('ibadah_tracker_')) {
           const username = key.replace('ibadah_tracker_', '');
           try {
              trackers[username] = JSON.parse(localStorage.getItem(key)!);
           } catch(e){}
         }
       }
    }
    return { users, trackers, groups };
  }

  private saveLocalData(users: User[], trackers: Record<string, WeeklyData>, groups: string[]) {
    localStorage.setItem('nur_quest_users', JSON.stringify(users));
    localStorage.setItem('nur_quest_groups', JSON.stringify(groups));
    Object.entries(trackers).forEach(([username, data]) => {
      localStorage.setItem(`ibadah_tracker_${username}`, JSON.stringify(data));
    });
  }

  // --- SUPABASE METHODS ---

  // Fetch data: Try Supabase -> Fail? -> Read LocalStorage
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      // Mengambil data dari tabel 'app_sync'
      const { data, error } = await supabase
        .from('app_sync')
        .select('json_data')
        .eq('id', DB_ROW_ID)
        .single();

      if (error) throw error;
      
      // Jika data kosong (pertama kali), kembalikan default
      if (!data) {
        return {
          users: [],
          trackers: {},
          groups: JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS))
        };
      }

      return {
        users: data.json_data.users || [],
        trackers: data.json_data.trackers || {},
        groups: data.json_data.groups || JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS))
      };

    } catch (error: any) {
      console.warn("[SUPABASE] Fetch failed, using local:", error.message);
      // Jika error karena tabel belum dibuat, lempar error agar UI memberi tahu user
      if (error.message && error.message.includes('relation')) {
        throw error; 
      }
      return this.getLocalData();
    }
  }

  // Update: Try Supabase -> Fail? -> Write LocalStorage
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_sync')
        .upsert({ 
          id: DB_ROW_ID, 
          json_data: payload,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;

    } catch (error: any) {
      console.warn("[SUPABASE] Update failed, saving locally:", error.message);
      this.saveLocalData(payload.users, payload.trackers, payload.groups);
      
      // Jika error tabel hilang, return false agar UI tahu ada masalah serius
      if (error.message && error.message.includes('relation')) {
        return false;
      }
      
      return true; // Return true jika hanya masalah koneksi (karena sudah save local)
    }
  }

  async updateUserProfile(user: User): Promise<{ success: boolean; error?: string; warning?: string }> {
    try {
      const db = await this.fetchDatabase();
      const index = db.users.findIndex((u: any) => u.username === user.username);
      
      if (index !== -1) {
        db.users[index] = user;
      } else {
        db.users.push(user);
      }

      const success = await this.updateDatabase(db);
      if (!success) throw new Error("Database Write Failed");
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Unknown Error" };
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      const newUsers = db.users.filter((u: any) => u.username !== username);
      const newTrackers = { ...db.trackers };
      delete newTrackers[username];
      
      localStorage.removeItem(`ibadah_tracker_${username}`);
      return await this.updateDatabase({ ...db, users: newUsers, trackers: newTrackers });
    } catch (error) {
      return false;
    }
  }

  // --- SYNC LOGIC ---
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData,
    success: boolean,
    errorMessage?: string
  }> {
    let db;
    let isOnline = false;
    let syncError = "";

    // 1. Fetch Cloud Data
    try {
      const { data, error } = await supabase
        .from('app_sync')
        .select('json_data')
        .eq('id', DB_ROW_ID)
        .single();

      if (error) {
        // Abaikan error "Row not found" (PGRST116), itu artinya DB bersih tapi koneksi OK
        if (error.code === 'PGRST116') {
           db = { users: [], trackers: {}, groups: [] };
           isOnline = true;
        } else {
           throw error;
        }
      } else {
        db = data?.json_data || { users: [], trackers: {}, groups: [] };
        isOnline = true;
      }

      // Sanitize
      if (!db.users) db.users = [];
      if (!db.trackers) db.trackers = {};
      if (!db.groups) db.groups = [];

    } catch (e: any) {
      // Fallback to local
      db = this.getLocalData();
      isOnline = false;
      syncError = e.message || "Connection Error";
    }

    // 2. Merge Logic
    let hasChanges = false;

    if (currentUser) {
      // Update User
      const userIndex = db.users.findIndex((u: any) => u.username === currentUser.username);
      if (userIndex !== -1) {
        if (JSON.stringify(db.users[userIndex]) !== JSON.stringify(currentUser)) {
           db.users[userIndex] = currentUser;
           hasChanges = true;
        }
      } else {
        db.users.push(currentUser);
        hasChanges = true;
      }

      // Update Tracker (Last Write Wins)
      const cloudTracker = db.trackers[currentUser.username];
      const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
      const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

      if (localTime > cloudTime) {
        db.trackers[currentUser.username] = localData;
        hasChanges = true;
      }
    }

    // 3. Push to Cloud (Only if Online & Changed)
    if (isOnline && hasChanges) {
      await this.updateDatabase(db);
    } 
    else if (!isOnline && hasChanges) {
      this.saveLocalData(db.users, db.trackers, db.groups);
    }

    // 4. Return Data
    let updatedLocalData: WeeklyData | undefined = undefined;
    if (currentUser && db.trackers[currentUser.username]) {
      const cloudTracker = db.trackers[currentUser.username];
      const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
      const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

      if (isOnline && cloudTime > localTime) {
        updatedLocalData = cloudTracker;
      }
    }

    return { 
      users: db.users, 
      trackers: db.trackers, 
      groups: db.groups.length > localGroups.length ? db.groups : localGroups, 
      updatedLocalData, 
      success: isOnline,
      errorMessage: isOnline ? undefined : (syncError.includes('relation') ? syncError : "Offline Mode")
    };
  }
}

export const api = new ApiService();
