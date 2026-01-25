
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { CLOUD_SYNC_URL } from '../constants';

/**
 * ApiService - Cloudflare KV Implementation (REST API)
 * with Robust Offline-First Fallback & Compatibility Fixes.
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

  // Fetch data with safe timeout (5s) and Silent Failure
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(CLOUD_SYNC_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      return {
        users: data.users || [],
        trackers: data.trackers || {},
        groups: data.groups || JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS))
      };

    } catch (error) {
      // Quietly fallback to offline mode without console noise
      // This fixes the "Failed to fetch" red error feeling critical
      return this.getLocalData();
    }
  }

  // Update with fallback (Write Cloud -> Fail -> Write Local)
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

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
      // Offline fallback: Write to LocalStorage
      localStorage.setItem('nur_quest_users', JSON.stringify(payload.users));
      localStorage.setItem('nur_quest_groups', JSON.stringify(payload.groups));
      
      Object.entries(payload.trackers).forEach(([username, data]) => {
        localStorage.setItem(`ibadah_tracker_${username}`, JSON.stringify(data as any));
      });

      return true; // Return true so UI implies "Saved (Locally)"
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

  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData,
    success: boolean,
    errorMessage?: string
  }> {
    try {
      // 1. Get Data (Cloud or Local)
      const db = await this.fetchDatabase();
      let hasChanges = false;

      // 2. Merge Logic
      if (currentUser) {
        const userIndex = db.users.findIndex(u => u.username === currentUser.username);
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

      // 3. Commit changes (to Cloud or Local via updateDatabase)
      if (hasChanges) {
        await this.updateDatabase(db);
      }

      // 4. Connectivity Check (HEAD Request)
      // Done separately so data logic still works even if this fails
      let isOnline = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(CLOUD_SYNC_URL, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        isOnline = res.ok;
      } catch {}

      // 5. Check for newer cloud data for current user
      let updatedLocalData: WeeklyData | undefined = undefined;
      if (currentUser && db.trackers[currentUser.username]) {
        const cloudTracker = db.trackers[currentUser.username];
        const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
        const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

        if (cloudTime > localTime) {
          updatedLocalData = cloudTracker;
        }
      }

      return { 
        users: db.users, 
        trackers: db.trackers, 
        groups: db.groups.length > localGroups.length ? db.groups : localGroups, 
        updatedLocalData, 
        success: isOnline,
        errorMessage: isOnline ? undefined : "Offline Mode"
      };

    } catch (error: any) {
      // If catastrophic failure, return empty safely
      return { 
        users: [], trackers: {}, groups: localGroups, success: false, errorMessage: error.message 
      };
    }
  }
}

export const api = new ApiService();
