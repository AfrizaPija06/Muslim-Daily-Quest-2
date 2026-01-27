
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
  
  // NEW: Upload Asset to Server
  async uploadGlobalAsset(id: string, base64Data: string): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      if (!db.assets) db.assets = {};
      
      db.assets[id] = base64Data;
      
      const success = await this.updateDatabase(db);
      if (!success) throw new Error("Database Write Failed");
      
      // Update local storage immediately for UI feedback
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
      assets: db.assets, // Pass assets back
      updatedLocalData, 
      success: isOnline,
      errorMessage: isOnline ? undefined : (syncError.includes('relation') ? syncError : "Offline Mode")
    };
  }
}

export const api = new ApiService();
