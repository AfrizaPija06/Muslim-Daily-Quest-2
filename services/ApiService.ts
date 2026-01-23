
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { supabase } from '../lib/supabaseClient';

/**
 * ApiService - Real Backend Implementation using Supabase
 * Replaces the old KV-Worker logic with direct Database calls.
 */
class ApiService {
  
  // Fetch all data (Users & Trackers)
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      // 1. Get All Users
      const { data: usersData, error: userError } = await supabase
        .from('app_users')
        .select('*');

      if (userError) throw userError;

      // 2. Get All Trackers
      const { data: trackersData, error: trackerError } = await supabase
        .from('app_trackers')
        .select('*');

      if (trackerError) throw trackerError;

      // 3. Format Data to match app structure
      const formattedUsers: User[] = usersData.map((u: any) => ({
        fullName: u.full_name,
        username: u.username,
        password: u.password, // In real app, never send password back! But we keep logic for now.
        group: u.group_name,
        role: u.role as any,
        status: u.status as any
      }));

      const trackersMap: Record<string, WeeklyData> = {};
      trackersData.forEach((t: any) => {
        trackersMap[t.username] = t.weekly_data;
      });

      // We still use local storage for groups config for simplicity, 
      // or we could add a table 'app_config' later.
      const groups = JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS));

      return { users: formattedUsers, trackers: trackersMap, groups };

    } catch (error) {
      console.error("[SUPABASE] Fetch Error:", error);
      throw error; // Throw error so sync knows it failed
    }
  }

  // Update Database (Called during Register or Admin updates)
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      // We focus on syncing USERS here (for Registration / Approval)
      // Upsert Users
      for (const user of payload.users) {
        const { error } = await supabase
          .from('app_users')
          .upsert({
            username: user.username,
            password: user.password,
            full_name: user.fullName,
            group_name: user.group,
            role: user.role,
            status: user.status
          }, { onConflict: 'username' });
        
        if (error) console.error("Error upserting user:", user.username, error);
      }

      return true;
    } catch (error) {
      console.error("[SUPABASE] Update DB Error:", error);
      return false;
    }
  }

  // Sync Logic (Called periodically by App.tsx)
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<{ 
    users: User[], 
    trackers: Record<string, WeeklyData>,
    groups: string[],
    updatedLocalData?: WeeklyData,
    success: boolean,
    errorMessage?: string
  }> {
    try {
      // 1. PUSH: If we are logged in, save our latest tracker data to Supabase
      if (currentUser) {
        const { error } = await supabase
          .from('app_trackers')
          .upsert({
            username: currentUser.username,
            weekly_data: localData,
            last_updated: new Date().toISOString()
          });
        
        if (error) throw error;
      }

      // 2. PULL: Get latest world state
      const db = await this.fetchDatabase();
      
      // 3. CHECK: Do we have newer data from server for current user?
      let updatedLocalData: WeeklyData | undefined = undefined;
      if (currentUser && db.trackers[currentUser.username]) {
        const cloudTracker = db.trackers[currentUser.username];
        const cloudTime = cloudTracker.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
        const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;

        // If Cloud is significantly newer (avoid loop), use cloud
        if (cloudTime > localTime) {
          updatedLocalData = cloudTracker;
        }
      }

      return { 
        users: db.users, 
        trackers: db.trackers, 
        groups: db.groups, 
        updatedLocalData, 
        success: true 
      };

    } catch (error: any) {
      console.error("[SUPABASE] Sync Failed details:", error);
      return { 
        users: [], trackers: {}, groups: localGroups, success: false, errorMessage: error.message || "Unknown Connection Error"
      };
    }
  }
}

export const api = new ApiService();
