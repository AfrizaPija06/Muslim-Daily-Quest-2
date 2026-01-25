
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { CLOUD_SYNC_URL } from '../constants';

/**
 * ApiService - Cloudflare KV Implementation (REST API)
 * with Offline-First Fallback.
 */
class ApiService {
  
  // Fetch data: Try Cloud -> Fail? -> Read LocalStorage
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      const response = await fetch(CLOUD_SYNC_URL);
      if (!response.ok) throw new Error("Failed to fetch from Cloudflare");
      
      const data = await response.json();
      
      return {
        users: data.users || [],
        trackers: data.trackers || {},
        groups: data.groups || JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS))
      };

    } catch (error) {
      console.warn("[CLOUDFLARE] Connection failed, switching to Offline Mode:", error);
      
      // --- OFFLINE FALLBACK: READ LOCAL STORAGE ---
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
  }

  // Generic Update: Try Cloud -> Fail? -> Write LocalStorage
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      const response = await fetch(CLOUD_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Cloudflare rejected update");
      return true;
    } catch (error) {
      console.warn("[CLOUDFLARE] Update failed, saving locally:", error);
      
      // --- OFFLINE FALLBACK: WRITE LOCAL STORAGE ---
      localStorage.setItem('nur_quest_users', JSON.stringify(payload.users));
      localStorage.setItem('nur_quest_groups', JSON.stringify(payload.groups));
      
      // Save all trackers from payload to ensure consistency
      Object.entries(payload.trackers).forEach(([username, data]) => {
        localStorage.setItem(`ibadah_tracker_${username}`, JSON.stringify(data));
      });

      return true; // Return true so the UI thinks it succeeded
    }
  }

  // --- SINGLE USER UPDATE (Read-Modify-Write Pattern) ---
  async updateUserProfile(user: User): Promise<{ success: boolean; error?: string; warning?: string }> {
    try {
      // 1. Fetch latest DB state (Cloud or Local)
      const db = await this.fetchDatabase();
      
      // 2. Find and Update User
      const index = db.users.findIndex((u: any) => u.username === user.username);
      
      if (index !== -1) {
        db.users[index] = user; // Update existing
      } else {
        db.users.push(user); // Add new
      }

      // 3. Save back (Cloud or Local)
      const success = await this.updateDatabase(db);
      
      if (success) {
        // Check if we are actually offline to give correct warning
        try {
           // Simple connectivity check
           const check = await fetch(CLOUD_SYNC_URL, { method: 'HEAD' });
           if (!check.ok) throw new Error("Offline");
           return { success: true };
        } catch {
           return { success: true, warning: "Saved to Offline Storage (Server Unreachable)" };
        }
      } else {
        return { success: false, error: "Database update failed completely" };
      }

    } catch (e: any) {
      console.error("Exception updating user:", e);
      return { success: false, error: e.message || "Unknown Error" };
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      
      // Filter out user and their tracker
      const newUsers = db.users.filter((u: any) => u.username !== username);
      const newTrackers = { ...db.trackers };
      delete newTrackers[username];
      
      // Also remove from local storage explicitly
      localStorage.removeItem(`ibadah_tracker_${username}`);

      return await this.updateDatabase({ ...db, users: newUsers, trackers: newTrackers });
    } catch (error) {
      console.error("[CLOUDFLARE] Delete User Error:", error);
      return false;
    }
  }

  // Sync Logic
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData,
    success: boolean,
    errorMessage?: string
  }> {
    try {
      // 1. Get Cloud Data (or Local if offline)
      const db = await this.fetchDatabase();
      let hasChanges = false;
      let isOffline = false;

      // Check connectivity explicitly to report status to UI
      try {
        await fetch(CLOUD_SYNC_URL, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
      } catch {
        isOffline = true;
      }

      // 2. Push Local Changes to DB Object
      if (currentUser) {
        // Update User Profile
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

        // Update Tracker
        const cloudTracker = db.trackers[currentUser.username];
        const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
        const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

        if (localTime > cloudTime) {
          db.trackers[currentUser.username] = localData;
          hasChanges = true;
        }
      }

      // 3. Commit if needed
      if (hasChanges) {
        await this.updateDatabase(db);
      }

      // 4. Return Data
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
        success: !isOffline, // Only true if actually online
        errorMessage: isOffline ? "Offline Mode" : undefined
      };

    } catch (error: any) {
      // If everything fails, return basic local fallback
      return { 
        users: [], trackers: {}, groups: localGroups, success: false, errorMessage: error.message 
      };
    }
  }
}

export const api = new ApiService();
