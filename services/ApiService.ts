
import { CLOUD_SYNC_URL } from '../constants';
import { WeeklyData, User, MENTORING_GROUPS } from '../types';

/**
 * ApiService - Simulating a real Backend API Client
 * Optimized for Public KV Workers using Simple Requests to avoid CORS issues.
 */
class ApiService {
  private url: string;

  constructor(endpoint: string) {
    this.url = endpoint;
  }

  // Helper to safely parse JSON
  private safeParse(text: string) {
    try {
      return text && text.trim() ? JSON.parse(text) : null;
    } catch (e) {
      return null;
    }
  }

  // GET: Fetch all data from the "Server"
  // Uses retry logic for stability
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    const fallbackData = { 
      users: JSON.parse(localStorage.getItem('nur_quest_users') || '[]'), 
      trackers: {}, 
      groups: JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS)) 
    };

    // Retry up to 3 times
    for (let i = 0; i < 3; i++) {
      try {
        // Standard GET request. We expect the public worker to handle CORS for GET correctly.
        const response = await fetch(this.url, { method: 'GET' });
        
        if (response.status === 404) {
          return { users: [], trackers: {}, groups: [] };
        }
        
        if (response.ok) {
          const text = await response.text();
          const data = this.safeParse(text);
          if (data) return data;
        }
      } catch (error) {
        console.warn(`[API] Fetch Attempt ${i+1} failed:`, error);
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
      }
    }

    console.warn("[API] All fetch attempts failed. Using local fallback.");
    return fallbackData;
  }

  // POST: Update the "Server" state
  // Implements a Fallback Strategy for CORS/Network issues
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    const body = JSON.stringify(payload);
    
    try {
      // Attempt 1: Standard Simple Request
      // We rely on the browser to send text/plain which avoids preflight
      const response = await fetch(this.url, {
        method: 'POST',
        body: body,
        keepalive: true // Helps with unstable connections
      });
      return response.ok;
    } catch (error) {
      console.warn("[API] Standard Push failed, trying no-cors fallback...", error);
      
      try {
        // Attempt 2: Fire-and-forget (no-cors)
        // If the server processes the request but fails to return proper CORS headers, 
        // the browser throws a 'Failed to fetch' error in standard mode.
        // 'no-cors' allows sending the data even if we can't read the response.
        await fetch(this.url, {
          method: 'POST',
          mode: 'no-cors',
          body: body,
          keepalive: true
        });
        
        // We assume success if no network error occurred
        return true; 
      } catch (finalError) {
        console.error("[API] All Push attempts failed:", finalError);
        return false;
      }
    }
  }

  /**
   * Smart Sync Logic:
   * 1. Fetches latest Cloud Data.
   * 2. Merges Local Data into Cloud Data.
   * 3. Pushes merged result back to Cloud.
   * This reduces Race Conditions (overwriting other people's data).
   */
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData,
    success: boolean
  }> {
    try {
      // 1. READ (Latest state from server)
      const db = await this.fetchDatabase();
      
      // Initialize if empty
      const cloudTrackers = db.trackers || {};
      const cloudUsers = db.users || [];
      const cloudGroups = (db.groups && db.groups.length > 0) ? db.groups : localGroups;

      let hasChanges = false;

      // 2. MERGE: Local Users -> Cloud Users
      // If we registered offline, our user might be missing from cloud. Add it.
      const localUsers = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
      localUsers.forEach((lUser: User) => {
        if (!cloudUsers.some(cUser => cUser.username === lUser.username)) {
          cloudUsers.push(lUser);
          hasChanges = true;
        }
      });

      // 3. MERGE: Local Tracker -> Cloud Tracker
      let updatedLocalData: WeeklyData | undefined = undefined;
      
      if (currentUser) {
        const cloudTracker = cloudTrackers[currentUser.username];
        
        // Strategy: Last Write Wins based on 'lastUpdated' timestamp
        const cloudTime = cloudTracker?.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
        const localTime = localData?.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

        if (cloudTime > localTime) {
          // Cloud is newer, pull it down
          updatedLocalData = cloudTracker;
        } else if (localTime > cloudTime || !cloudTracker) {
          // Local is newer (or cloud is empty), push it up
          cloudTrackers[currentUser.username] = localData;
          hasChanges = true;
        }
      } else {
        // If not logged in but just syncing (e.g. initial load), check if we need to init structure
        if (!db.users) hasChanges = true; 
      }

      // 4. WRITE (If changes detected)
      if (hasChanges) {
         const pushSuccess = await this.updateDatabase({ 
           users: cloudUsers, 
           trackers: cloudTrackers, 
           groups: cloudGroups 
         });
         
         if (!pushSuccess) {
           return { users: cloudUsers, trackers: cloudTrackers, groups: cloudGroups, updatedLocalData, success: false };
         }
      }

      return { users: cloudUsers, trackers: cloudTrackers, groups: cloudGroups, updatedLocalData, success: true };
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
