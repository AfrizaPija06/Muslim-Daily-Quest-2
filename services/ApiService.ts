
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { CLOUD_SYNC_URL } from '../constants';

/**
 * ApiService - Cloudflare KV Implementation (REST API)
 * Schema-less, so adding Avatar/Status fields works instantly.
 */
class ApiService {
  
  // Fetch all data from Cloudflare KV
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      const response = await fetch(CLOUD_SYNC_URL);
      if (!response.ok) throw new Error("Failed to fetch from Cloudflare");
      
      const data = await response.json();
      
      // Ensure structure exists even if DB is empty
      return {
        users: data.users || [],
        trackers: data.trackers || {},
        groups: data.groups || JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS))
      };

    } catch (error) {
      console.error("[CLOUDFLARE] Fetch Error:", error);
      // Fallback for offline/init
      return { 
        users: [], 
        trackers: {}, 
        groups: JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS)) 
      };
    }
  }

  // Generic POST to overwrite KV Key
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      const response = await fetch(CLOUD_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("[CLOUDFLARE] Update Error:", error);
      return false;
    }
  }

  // --- SINGLE USER UPDATE (Read-Modify-Write Pattern) ---
  // Fixes Grant Access & Avatar Save by reading current DB, modifying 1 user, and saving back.
  async updateUserProfile(user: User): Promise<{ success: boolean; error?: string; warning?: string }> {
    try {
      // 1. Fetch latest DB state
      const db = await this.fetchDatabase();
      
      // 2. Find and Update User
      const index = db.users.findIndex((u: any) => u.username === user.username);
      
      if (index !== -1) {
        db.users[index] = user; // Update existing
      } else {
        db.users.push(user); // Add new
      }

      // 3. Save back to Cloudflare
      const success = await this.updateDatabase(db);
      
      if (success) {
        return { success: true };
      } else {
        return { success: false, error: "Cloudflare rejected the update" };
      }

    } catch (e: any) {
      console.error("Exception updating user:", e);
      return { success: false, error: e.message || "Network Exception" };
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    try {
      const db = await this.fetchDatabase();
      
      // Filter out user and their tracker
      const newUsers = db.users.filter((u: any) => u.username !== username);
      const newTrackers = { ...db.trackers };
      delete newTrackers[username];

      return await this.updateDatabase({ ...db, users: newUsers, trackers: newTrackers });
    } catch (error) {
      console.error("[CLOUDFLARE] Delete User Error:", error);
      return false;
    }
  }

  // Sync Logic (Merge Local -> Cloud)
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData,
    success: boolean,
    errorMessage?: string
  }> {
    try {
      // 1. Get Cloud Data
      const db = await this.fetchDatabase();
      let hasChanges = false;

      // 2. Push Local Changes to Cloud Object
      if (currentUser) {
        // Update User Profile if changed
        const userIndex = db.users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) {
          // If local session has newer/different data (like avatar), update cloud
          if (JSON.stringify(db.users[userIndex]) !== JSON.stringify(currentUser)) {
             db.users[userIndex] = currentUser;
             hasChanges = true;
          }
        } else {
          db.users.push(currentUser);
          hasChanges = true;
        }

        // Update Tracker Logic (Last Write Wins)
        const cloudTracker = db.trackers[currentUser.username];
        const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
        const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

        // If Local is newer, update Cloud
        if (localTime > cloudTime) {
          db.trackers[currentUser.username] = localData;
          hasChanges = true;
        }
      }

      // 3. Commit to Cloud if needed
      if (hasChanges) {
        await this.updateDatabase(db);
      }

      // 4. Return latest data to App
      let updatedLocalData: WeeklyData | undefined = undefined;
      if (currentUser && db.trackers[currentUser.username]) {
        const cloudTracker = db.trackers[currentUser.username];
        const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
        const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

        // If Cloud is newer, send back to App
        if (cloudTime > localTime) {
          updatedLocalData = cloudTracker;
        }
      }

      return { 
        users: db.users, 
        trackers: db.trackers, 
        groups: db.groups.length > localGroups.length ? db.groups : localGroups, 
        updatedLocalData, 
        success: true 
      };

    } catch (error: any) {
      return { 
        users: [], trackers: {}, groups: localGroups, success: false, errorMessage: error.message 
      };
    }
  }
}

export const api = new ApiService();
