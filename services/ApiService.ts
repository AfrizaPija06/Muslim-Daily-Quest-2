
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { CLOUD_SYNC_URL } from '../constants';

/**
 * ApiService - Cloudflare KV Implementation (REST API)
 * Refactored to fix "Offline Mode" false positive by removing HEAD check.
 */
class ApiService {
  
  // Helper: Read Local Storage safely (Offline Data Source)
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

  // Helper: Save Local Storage safely
  private saveLocalData(users: User[], trackers: Record<string, WeeklyData>, groups: string[]) {
    localStorage.setItem('nur_quest_users', JSON.stringify(users));
    localStorage.setItem('nur_quest_groups', JSON.stringify(groups));
    Object.entries(trackers).forEach(([username, data]) => {
      localStorage.setItem(`ibadah_tracker_${username}`, JSON.stringify(data));
    });
  }

  // Public Fetch: Tries Cloud -> Falls back to Local (Never throws, safe for UI)
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const response = await fetch(CLOUD_SYNC_URL, { 
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store' // Ensure fresh data
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      return {
        users: data.users || [],
        trackers: data.trackers || {},
        groups: data.groups || JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS))
      };

    } catch (error) {
      // Silent fallback
      return this.getLocalData();
    }
  }

  // Update: Tries Cloud -> Falls back to Local (Returns true to indicate "Saved" either way)
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(CLOUD_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Cloudflare rejected update");
      return true;
    } catch (error) {
      console.warn("Update failed, saving locally:", error);
      this.saveLocalData(payload.users, payload.trackers, payload.groups);
      return true; // Still return true so UI doesn't panic
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

      await this.updateDatabase(db);
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

  // --- CORE SYNC LOGIC ---
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

    // 1. Explicitly try fetching Cloud Data to determine connectivity
    // We do NOT rely on fetchDatabase() here because we need to know if it FAILED.
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(CLOUD_SYNC_URL, { 
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        db = await response.json();
        // Sanitize cloud data structure
        if (!db.users) db.users = [];
        if (!db.trackers) db.trackers = {};
        if (!db.groups) db.groups = [];
        
        isOnline = true; // SUCCESS: We are connected!
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (e: any) {
      // FAIL: Fallback to local
      console.warn(`Sync: Network unavailable (${e.message}), using local data.`);
      db = this.getLocalData();
      isOnline = false;
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
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const pushResp = await fetch(CLOUD_SYNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!pushResp.ok) {
           console.warn("Sync: Read success but Write failed.");
           // We don't set isOnline=false here because we successfully read data, 
           // just the update failed. But we should probably save locally to be safe.
           this.saveLocalData(db.users, db.trackers, db.groups);
        }
      } catch (e) {
        console.warn("Sync: Write connection lost.");
        // If write fails, we are effectively offline for the purpose of saving data
        this.saveLocalData(db.users, db.trackers, db.groups);
      }
    } 
    else if (!isOnline && hasChanges) {
      // If offline but changed, ensure local storage is updated with the merged result
      this.saveLocalData(db.users, db.trackers, db.groups);
    }

    // 4. Return Data
    let updatedLocalData: WeeklyData | undefined = undefined;
    if (currentUser && db.trackers[currentUser.username]) {
      const cloudTracker = db.trackers[currentUser.username];
      const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
      const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

      // Only take from cloud if we are online and cloud is newer
      if (isOnline && cloudTime > localTime) {
        updatedLocalData = cloudTracker;
      }
    }

    return { 
      users: db.users, 
      trackers: db.trackers, 
      groups: db.groups.length > localGroups.length ? db.groups : localGroups, 
      updatedLocalData, 
      success: isOnline, // Determined solely by the GET request success
      errorMessage: isOnline ? undefined : "Offline Mode"
    };
  }
}

export const api = new ApiService();
