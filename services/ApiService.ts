
import { CLOUD_SYNC_URL } from '../constants';
import { WeeklyData, User, MENTORING_GROUPS } from '../types';

/**
 * ApiService - Simulating a real Backend API Client
 * Used by professional engineers to separate UI from Data Logic.
 */
class ApiService {
  private url: string;

  constructor(endpoint: string) {
    this.url = endpoint;
  }

  // GET: Fetch all data from the "Server"
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      const response = await fetch(this.url);
      
      // If 404, the key hasn't been created yet. This is normal for a new app instance.
      if (response.status === 404) {
        return { users: [], trackers: {}, groups: [] };
      }
      
      if (!response.ok) {
        throw new Error(`Cloud storage returned status ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        return { users: [], trackers: {}, groups: [] };
      }

      return JSON.parse(text);
    } catch (error) {
      console.warn("[API] Fetch Warning:", error);
      // Return local cache as a fallback so the app remains functional
      const localUsers = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
      const localGroups = JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS));
      return { users: localUsers, trackers: {}, groups: localGroups };
    }
  }

  // POST: Update the "Server" state
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      // CRITICAL FIX: Removed 'Content-Type': 'application/json' header.
      // Setting that header triggers a CORS Preflight (OPTIONS) request which often fails on free public KV workers.
      // By sending plain text (JSON stringified), we treat it as a "Simple Request" which bypasses Preflight.
      const response = await fetch(this.url, {
        method: 'POST',
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
   * Compares local data with cloud data and merges them.
   */
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData 
  }> {
    const db = await this.fetchDatabase();
    let trackers = db.trackers || {};
    let users = db.users || [];
    // Prioritize cloud groups if they exist, otherwise use local/default
    let groups = (db.groups && db.groups.length > 0) ? db.groups : localGroups;

    // If user is logged in, push their local data to trackers
    if (currentUser) {
      const cloudTracker = trackers[currentUser.username];
      
      // If cloud has newer data, suggest update to UI
      if (cloudTracker && cloudTracker.lastUpdated && new Date(cloudTracker.lastUpdated) > new Date(localData.lastUpdated)) {
        return { users, trackers, groups, updatedLocalData: cloudTracker };
      } else {
        // Push local data to cloud (it's either newer or the first entry)
        trackers[currentUser.username] = localData;
        
        // Also ensure groups are synced if we are pushing
        await this.updateDatabase({ users, trackers, groups });
      }
    } else {
      // Even if not logged in (or just syncing in background), ensure DB structure exists
      if (!db.groups || db.groups.length === 0) {
        await this.updateDatabase({ users, trackers, groups: localGroups });
      }
    }

    return { users, trackers, groups };
  }
}

export const api = new ApiService(CLOUD_SYNC_URL);
