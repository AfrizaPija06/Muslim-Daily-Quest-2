
import { CLOUD_SYNC_URL } from '../constants';
import { WeeklyData, User } from '../types';

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
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData> }> {
    try {
      const response = await fetch(this.url);
      
      // If 404, the key hasn't been created yet. This is normal for a new app instance.
      if (response.status === 404) {
        return { users: [], trackers: {} };
      }
      
      if (!response.ok) {
        throw new Error(`Cloud storage returned status ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim() === "") {
        return { users: [], trackers: {} };
      }

      return JSON.parse(text);
    } catch (error) {
      console.warn("[API] Fetch Warning:", error);
      // Return local cache as a fallback so the app remains functional
      const localUsers = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
      return { users: localUsers, trackers: {} };
    }
  }

  // POST: Update the "Server" state
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData> }): Promise<boolean> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Removed custom headers to avoid CORS preflight failures on public endpoints
        },
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
  async sync(currentUser: User | null, localData: WeeklyData): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    updatedLocalData?: WeeklyData 
  }> {
    const db = await this.fetchDatabase();
    let trackers = db.trackers || {};
    let users = db.users || [];

    // If user is logged in, push their local data to trackers
    if (currentUser) {
      const cloudTracker = trackers[currentUser.username];
      
      // If cloud has newer data, suggest update to UI
      if (cloudTracker && cloudTracker.lastUpdated && new Date(cloudTracker.lastUpdated) > new Date(localData.lastUpdated)) {
        return { users, trackers, updatedLocalData: cloudTracker };
      } else {
        // Push local data to cloud (it's either newer or the first entry)
        trackers[currentUser.username] = localData;
        await this.updateDatabase({ users, trackers });
      }
    }

    return { users, trackers };
  }
}

export const api = new ApiService(CLOUD_SYNC_URL);
