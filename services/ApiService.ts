import { WeeklyData, User, MENTORING_GROUPS, GlobalAssets } from '../types';
import { supabase } from '../lib/supabaseClient';

const DB_ROW_ID = 'global_store_v7';

class ApiService {
  
  private getLocalData() {
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const groups = JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS));
    // Load cached assets if any
    const assets = JSON.parse(localStorage.getItem('nur_quest_assets') || '{}');
    
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
    return { users, trackers, groups, assets };
  }

  private saveLocalData(users: User[], trackers: Record<string, WeeklyData>, groups: string[], assets: GlobalAssets) {
    localStorage.setItem('nur_quest_users', JSON.stringify(users));
    localStorage.setItem('nur_quest_groups', JSON.stringify(groups));
    localStorage.setItem('nur_quest_assets', JSON.stringify(assets));
    Object.entries(trackers).forEach(([username, data]) => {
      localStorage.setItem(`ibadah_tracker_${username}`, JSON.stringify(data));
    });
  }

  // --- SUPABASE METHODS ---

  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[], assets: GlobalAssets }> {
    try {
      const { data, error } = await supabase
        .from('app_sync')
        .select('json_data')
        .eq('id', DB_ROW_ID)
        .single();

      if (error) throw error;
      
      if (!data) {
        return {
          users: [],
          trackers: {},
          groups: JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS)),
          assets: {}
        };
      }

      return {
        users: data.json_data.users || [],
        trackers: data.json_data.trackers || {},
        groups: data.json_data.groups || JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS)),
        assets: data.json_data.assets || {}
      };

    } catch (error: any) {
      console.warn("[SUPABASE] Fetch failed, using local:", error.message);
      if (error.message && error.message.includes('relation')) {
        throw error; 
      }
      return this.getLocalData();
    }
  }

  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[], assets: GlobalAssets }): Promise<boolean> {
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
      this.saveLocalData(payload.users, payload.trackers, payload.groups, payload.assets);
      
      if (error.message && error.message.includes('relation')) {
        return false;
      }
      return true; 
    }
  }

  // --- SAFE REGISTRATION (Prevents Race Conditions) ---
  async registerUserSafe(newUser: User): Promise<{ success: boolean; isOffline: boolean; error?: string }> {
    const MAX_RETRIES = 5;
    
    // Cek koneksi awal sederhana
    if (!navigator.onLine) {
       const local = this.getLocalData();
       if (!local.users.find(u => u.username === newUser.username)) {
          local.users.push(newUser);
          this.saveLocalData(local.users, local.trackers, local.groups, local.assets);
       }
       return { success: true, isOffline: true };
    }

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const delay = 200 + Math.random() * 1300;
        await new Promise(r => setTimeout(r, delay));

        const db = await this.fetchDatabase();
        
        if (db.users.some((u: any) => u.username === newUser.username)) {
          return { success: true, isOffline: false };
        }

        db.users.push(newUser);
        
        const { error } = await supabase
          .from('app_sync')
          .upsert({ 
            id: DB_ROW_ID, 
            json_data: db,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        this.saveLocalData(db.users, db.trackers, db.groups, db.assets);
        return { success: true, isOffline: false };

      } catch (e: any) {
        console.warn(`[REGISTER] Retry ${i + 1}/${MAX_RETRIES} failed:`, e.message);
        if (i === MAX_RETRIES - 1) {
           const local = this.getLocalData();
           if (!local.users.find(u => u.username === newUser.username)) {
              local.users.push(newUser);
              this.saveLocalData(local.users, local.trackers, local.groups, local.assets);
           }
           return { success: true, isOffline: true };
        }
      }
    }
    
    return { success: false, isOffline: false, error: "Traffic tinggi. Coba lagi." };
  }

  // UPDATED: SAFE PROFILE UPDATE (Fixes 'Balik Lagi' issue)
  async updateUserProfile(user: User): Promise<{ success: boolean; error?: string; warning?: string }> {
    const MAX_RETRIES = 3;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        // Jitter sedikit untuk menghindari tabrakan jika admin menekan tombol cepat
        if (i > 0) await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

        // 1. Ambil data cloud TERBARU
        const db = await this.fetchDatabase();
        const index = db.users.findIndex((u: any) => u.username === user.username);
        
        // 2. Modifikasi user
        if (index !== -1) {
          db.users[index] = { ...db.users[index], ...user }; // Merge agar tidak menimpa field lain tak terduga
        } else {
          db.users.push(user);
        }

        // 3. Simpan langsung via Supabase (bypass updateDatabase wrapper agar kita bisa catch error update)
        const { error } = await supabase
          .from('app_sync')
          .upsert({ 
            id: DB_ROW_ID, 
            json_data: db,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // 4. Update local data agar sinkron
        this.saveLocalData(db.users, db.trackers, db.groups, db.assets);
        
        return { success: true };

      } catch (e: any) {
        console.warn(`[UPDATE PROFILE] Retry ${i + 1}/${MAX_RETRIES} failed:`, e.message);
        // Jika ini retry terakhir, kita return error
        if (i === MAX_RETRIES - 1) {
          return { success: false, error: e.message || "Network Conflict" };
        }
      }
    }
    return { success: false, error: "Max retries exceeded" };
  }
  
  async uploadGlobalAsset(id: string, base64Data: string): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      if (!db.assets) db.assets = {};
      
      db.assets[id] = base64Data;
      
      const success = await this.updateDatabase(db);
      if (!success) throw new Error("Database Write Failed");
      
      localStorage.setItem('nur_quest_assets', JSON.stringify(db.assets));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async deleteGlobalAsset(id: string): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      if (!db.assets) return true;

      delete db.assets[id];

      const success = await this.updateDatabase(db);
      if (!success) throw new Error("Database Write Failed");

      localStorage.setItem('nur_quest_assets', JSON.stringify(db.assets));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      const newUsers = db.users.filter((u: any) => u.username !== username);
      const newTrackers = { ...db.trackers };
      delete newTrackers[username];
      
      localStorage.removeItem(`ibadah_tracker_${username}`);
      return await this.updateDatabase({ ...db, users: newUsers, trackers: newTrackers, assets: db.assets });
    } catch (error) {
      return false;
    }
  }

  // --- SYNC LOGIC ---
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    assets: GlobalAssets,
    updatedLocalData?: WeeklyData,
    success: boolean,
    errorMessage?: string
  }> {
    let db;
    let isOnline = false;
    let syncError = "";

    try {
      const { data, error } = await supabase
        .from('app_sync')
        .select('json_data')
        .eq('id', DB_ROW_ID)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
           db = { users: [], trackers: {}, groups: [], assets: {} };
           isOnline = true;
        } else {
           throw error;
        }
      } else {
        db = data?.json_data || { users: [], trackers: {}, groups: [], assets: {} };
        isOnline = true;
      }

      if (!db.users) db.users = [];
      if (!db.trackers) db.trackers = {};
      if (!db.groups) db.groups = [];
      if (!db.assets) db.assets = {};

    } catch (e: any) {
      db = this.getLocalData();
      isOnline = false;
      syncError = e.message || "Connection Error";
    }

    let hasChanges = false;

    if (currentUser) {
      // Logic Merging User: Prioritaskan data cloud jika kita tidak mengubah profile
      // Tapi update jika kita mengubah profile.
      // Untuk amannya di Tracker, kita hanya update Tracker data, bukan list User
      // KECUALI jika ini adalah Admin yang sedang melakukan operasi User.
      
      const userIndex = db.users.findIndex((u: any) => u.username === currentUser.username);
      if (userIndex !== -1) {
        // Cek apakah data user lokal kita lebih baru/beda? (Misal ganti avatar)
        // Tapi hati-hati menimpa status approval dari admin
        if (JSON.stringify(db.users[userIndex]) !== JSON.stringify(currentUser)) {
           // HANYA update jika role kita Admin atau data diri sendiri
           // Dan jangan menimpa status jika kita mentee
           if (currentUser.role === 'mentee') {
              const cloudStatus = db.users[userIndex].status;
              db.users[userIndex] = { ...currentUser, status: cloudStatus };
           } else {
              db.users[userIndex] = currentUser;
           }
           hasChanges = true;
        }
      } else {
        // Jika user tidak ada di cloud (kasus langka jika registerSafe berhasil)
        db.users.push(currentUser);
        hasChanges = true;
      }

      const cloudTracker = db.trackers[currentUser.username];
      const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
      const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

      if (localTime > cloudTime) {
        db.trackers[currentUser.username] = localData;
        hasChanges = true;
      }
    }

    if (isOnline && hasChanges) {
      await this.updateDatabase(db);
    } 
    else if (!isOnline && hasChanges) {
      this.saveLocalData(db.users, db.trackers, db.groups, db.assets);
    }

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
      assets: db.assets,
      updatedLocalData, 
      success: isOnline,
      errorMessage: isOnline ? undefined : (syncError.includes('relation') ? syncError : "Offline Mode")
    };
  }
}

export const api = new ApiService();