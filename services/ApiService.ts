
import { CLOUD_SYNC_URL } from '../constants';
import { WeeklyData, User, MENTORING_GROUPS } from '../types';

/**
 * ApiService - Simulating a real Backend API Client
 * Robust implementation with Error Handling for Public KV usage.
 */
class ApiService {
  private url: string;

  constructor(endpoint: string) {
    this.url = endpoint;
  }

  // GET: Fetch all data from the "Server"
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      // mode: 'cors' is crucial for cross-origin requests
      const response = await fetch(this.url, { 
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // If 404, the key hasn't been created yet. This is normal.
      if (response.status === 404) {
        return { users: [], trackers: {}, groups: [] };
      }
      
      if (!response.ok) {
        throw new Error(`Cloud storage status: ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        return { users: [], trackers: {}, groups: [] };
      }

      return JSON.parse(text);
    } catch (error) {
      console.warn("[API] Fetch Error (Offline Mode Active):", error);
      // Fallback: Read from LocalStorage if network fails
      const localUsers = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
      const localGroups = JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS));
      
      // Collect all local trackers
      const localTrackers: Record<string, WeeklyData> = {};
      localUsers.forEach((u: User) => {
        const t = localStorage.getItem(`ibadah_tracker_${u.username}`);
        if(t) localTrackers[u.username] = JSON.parse(t);
      });

      return { users: localUsers, trackers: localTrackers, groups: localGroups };
    }
  }

  // POST: Update the "Server" state
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      // Using 'no-cors' is tempting but prevents reading response status.
      // We use standard fetch but rely on text/plain body to avoid Preflight.
      const response = await fetch(this.url, {
        method: 'POST',
        mode: 'cors', 
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (error) {
      console.error("[API] Push Error:", error);
      return false;
    }
  }

  /**
   * Smart Sync Logic:
   * Merges Local and Cloud data intelligently.
   */
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData,
    success: boolean
  }> {
    try {
      const db = await this.fetchDatabase();
      let trackers = db.trackers || {};
      let users = db.users || [];
      // Use cloud groups if available, else fallback to local
      let groups = (db.groups && db.groups.length > 0) ? db.groups : localGroups;

      // MERGE LOGIC: Users
      // If we have local users not in cloud (registered offline), add them
      const localUsers = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
      let needsPush = false;

      localUsers.forEach((lUser: User) => {
        if (!users.some(cUser => cUser.username === lUser.username)) {
          users.push(lUser);
          needsPush = true;
        }
      });

      // If user is logged in, sync their tracker
      let updatedLocalData: WeeklyData | undefined = undefined;
      
      if (currentUser) {
        const cloudTracker = trackers[currentUser.username];
        
        // Conflict Resolution:
        // If Cloud is newer -> Update Local
        // If Local is newer -> Update Cloud
        if (cloudTracker && cloudTracker.lastUpdated && new Date(cloudTracker.lastUpdated) > new Date(localData.lastUpdated)) {
          updatedLocalData = cloudTracker;
        } else {
          // Local is newer (or Cloud is empty), push to cloud list
          // But only push if there's an actual difference or it's missing
          if (!cloudTracker || new Date(localData.lastUpdated) > new Date(cloudTracker.lastUpdated || 0)) {
            trackers[currentUser.username] = localData;
            needsPush = true;
          }
        }
      }

      // If we merged anything new into the objects, push back to server
      if (needsPush) {
         const pushSuccess = await this.updateDatabase({ users, trackers, groups });
         if (!pushSuccess) return { users, trackers, groups, updatedLocalData, success: false };
      }

      return { users, trackers, groups, updatedLocalData, success: true };
    } catch (e) {
      console.error("Sync Critical Fail", e);
      return { 
        users: JSON.parse(localStorage.getItem('nur_quest_users') || '[]'), 
        trackers: {}, 
        groups: localGroups, 
        success: false 
      };
    }
  }
}

export const api = new ApiService(CLOUD_SYNC_URL);
