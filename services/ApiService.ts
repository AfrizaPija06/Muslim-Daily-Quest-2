
import { WeeklyData, User, MENTORING_GROUPS, GlobalAssets, ArchivedData, AttendanceRecord } from '../types';
import { supabase } from '../lib/supabaseClient';

const DB_ROW_ID = 'global_store_v7';

class ApiService {
  
  private getLocalData() {
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const groups = JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS));
    // Load cached assets if any
    const assets = JSON.parse(localStorage.getItem('nur_quest_assets') || '{}');
    const archives = JSON.parse(localStorage.getItem('nur_quest_archives') || '[]');
    const attendance = JSON.parse(localStorage.getItem('nur_quest_attendance') || '{}');
    
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
    return { users, trackers, groups, assets, archives, attendance };
  }

  private saveLocalData(users: User[], trackers: Record<string, WeeklyData>, groups: string[], assets: GlobalAssets, archives: ArchivedData[], attendance: AttendanceRecord) {
    localStorage.setItem('nur_quest_users', JSON.stringify(users));
    localStorage.setItem('nur_quest_groups', JSON.stringify(groups));
    localStorage.setItem('nur_quest_assets', JSON.stringify(assets));
    localStorage.setItem('nur_quest_archives', JSON.stringify(archives));
    localStorage.setItem('nur_quest_attendance', JSON.stringify(attendance));
    Object.entries(trackers).forEach(([username, data]) => {
      localStorage.setItem(`ibadah_tracker_${username}`, JSON.stringify(data));
    });
  }

  // --- SUPABASE METHODS ---

  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[], assets: GlobalAssets, archives: ArchivedData[], attendance: AttendanceRecord }> {
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
          assets: {},
          archives: [],
          attendance: {}
        };
      }

      return {
        users: data.json_data.users || [],
        trackers: data.json_data.trackers || {},
        groups: data.json_data.groups || JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS)),
        assets: data.json_data.assets || {},
        archives: data.json_data.archives || [],
        attendance: data.json_data.attendance || {}
      };

    } catch (error: any) {
      console.warn("[SUPABASE] Fetch failed, using local:", error.message);
      if (error.message && error.message.includes('relation')) {
        throw error; 
      }
      return this.getLocalData();
    }
  }

  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[], assets: GlobalAssets, archives: ArchivedData[], attendance: AttendanceRecord }): Promise<boolean> {
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
      this.saveLocalData(payload.users, payload.trackers, payload.groups, payload.assets, payload.archives, payload.attendance);
      
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
          this.saveLocalData(local.users, local.trackers, local.groups, local.assets, local.archives, local.attendance);
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

        this.saveLocalData(db.users, db.trackers, db.groups, db.assets, db.archives, db.attendance);
        return { success: true, isOffline: false };

      } catch (e: any) {
        console.warn(`[REGISTER] Retry ${i + 1}/${MAX_RETRIES} failed:`, e.message);
        if (i === MAX_RETRIES - 1) {
           const local = this.getLocalData();
           if (!local.users.find(u => u.username === newUser.username)) {
              local.users.push(newUser);
              this.saveLocalData(local.users, local.trackers, local.groups, local.assets, local.archives, local.attendance);
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
        if (i > 0) await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

        const db = await this.fetchDatabase();
        const index = db.users.findIndex((u: any) => u.username === user.username);
        
        if (index !== -1) {
          db.users[index] = { ...db.users[index], ...user }; 
        } else {
          db.users.push(user);
        }

        const { error } = await supabase
          .from('app_sync')
          .upsert({ 
            id: DB_ROW_ID, 
            json_data: db,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        this.saveLocalData(db.users, db.trackers, db.groups, db.assets, db.archives, db.attendance);
        
        return { success: true };

      } catch (e: any) {
        console.warn(`[UPDATE PROFILE] Retry ${i + 1}/${MAX_RETRIES} failed:`, e.message);
        if (i === MAX_RETRIES - 1) {
          return { success: false, error: e.message || "Network Conflict" };
        }
      }
    }
    return { success: false, error: "Max retries exceeded" };
  }

  // --- ARCHIVING ---
  async saveArchive(archive: ArchivedData): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      if (!db.archives) db.archives = [];
      
      // Remove existing archive with same ID if exists (overwrite)
      db.archives = db.archives.filter(a => a.id !== archive.id);
      db.archives.push(archive);

      const success = await this.updateDatabase(db);
      if (!success) throw new Error("Archive Save Failed");
      
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  
  async saveAttendance(date: string, records: Record<string, 'H' | 'S' | 'A'>): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      if (!db.attendance) db.attendance = {};
      
      db.attendance[date] = records;
      
      const success = await this.updateDatabase(db);
      if(!success) throw new Error("Attendance Save Failed");
      
      localStorage.setItem('nur_quest_attendance', JSON.stringify(db.attendance));
      return true;
    } catch (e) {
       console.error(e);
       return false;
    }
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
      return await this.updateDatabase({ ...db, users: newUsers, trackers: newTrackers, assets: db.assets, archives: db.archives, attendance: db.attendance });
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
    archives: ArchivedData[],
    attendance: AttendanceRecord,
    updatedLocalData?: WeeklyData,
    success: boolean,
    errorMessage?: string
  }> {
    let db;
    let isOnline = false;
    let syncError = "";

    try {
      // 1. FETCH FROM CLOUD FIRST
      const { data, error } = await supabase
        .from('app_sync')
        .select('json_data')
        .eq('id', DB_ROW_ID)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
           // Row not found - Cloud is empty
           db = { users: [], trackers: {}, groups: [], assets: {}, archives: [], attendance: {} };
           isOnline = true;
        } else {
           throw error;
        }
      } else {
        db = data?.json_data || { users: [], trackers: {}, groups: [], assets: {}, archives: [], attendance: {} };
        isOnline = true;
      }

      // Initialize defaults
      if (!db.users) db.users = [];
      if (!db.trackers) db.trackers = {};
      if (!db.groups) db.groups = [];
      if (!db.assets) db.assets = {};
      if (!db.archives) db.archives = [];
      if (!db.attendance) db.attendance = {};

    } catch (e: any) {
      db = this.getLocalData();
      isOnline = false;
      syncError = e.message || "Connection Error";
    }

    let hasChanges = false;
    
    // 2. MERGE LOGIC
    // Jika Cloud Kosong (db.users.length === 0) tapi Local ada isinya (localUsers.length > 0)
    // Maka FORCE PUSH local ke cloud.
    const localStore = this.getLocalData();
    if (isOnline && db.users.length === 0 && localStore.users.length > 0) {
       console.log("Cloud is empty. Pushing local backup to cloud...");
       db = localStore;
       hasChanges = true;
    }

    if (currentUser) {
      const userIndex = db.users.findIndex((u: any) => u.username === currentUser.username);
      if (userIndex !== -1) {
        // Jika data user di local berbeda dengan cloud (misal ganti role/status), update cloud
        if (JSON.stringify(db.users[userIndex]) !== JSON.stringify(currentUser)) {
           // Proteksi: Jangan overwrite status 'active' cloud dengan 'pending' local jika user login sebagai mentee
           if (currentUser.role === 'mentee') {
              const cloudStatus = db.users[userIndex].status;
              db.users[userIndex] = { ...currentUser, status: cloudStatus };
           } else {
              db.users[userIndex] = currentUser;
           }
           hasChanges = true;
        }
      } else {
        // User baru di device ini, push ke cloud
        db.users.push(currentUser);
        hasChanges = true;
      }

      const cloudTracker = db.trackers[currentUser.username];
      const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
      const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

      // Update cloud jika data local lebih baru
      if (localTime > cloudTime || (localTime > 0 && !cloudTracker)) {
        db.trackers[currentUser.username] = localData;
        hasChanges = true;
      }
    }

    if (isOnline && hasChanges) {
      await this.updateDatabase(db);
    } 
    else if (!isOnline && hasChanges) {
      this.saveLocalData(db.users, db.trackers, db.groups, db.assets, db.archives, db.attendance);
    }

    // 3. DETERMINE IF WE NEED TO UPDATE LOCAL UI
    let updatedLocalData: WeeklyData | undefined = undefined;
    if (currentUser && db.trackers[currentUser.username]) {
      const cloudTracker = db.trackers[currentUser.username];
      const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
      const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

      // Jika data cloud lebih baru, kirim balik untuk update UI
      if (isOnline && cloudTime > localTime) {
        updatedLocalData = cloudTracker;
      }
    }

    return { 
      users: db.users, 
      trackers: db.trackers, 
      groups: db.groups.length > localGroups.length ? db.groups : localGroups,
      assets: db.assets,
      archives: db.archives,
      attendance: db.attendance,
      updatedLocalData, 
      success: isOnline,
      errorMessage: isOnline ? undefined : (syncError.includes('relation') ? syncError : "Offline Mode")
    };
  }
}

export const api = new ApiService();
