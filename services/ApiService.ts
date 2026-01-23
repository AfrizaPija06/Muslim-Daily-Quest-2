
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
        status: u.status as any,
        avatarSeed: u.avatar_seed || u.username // Fallback to username if seed is missing
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
        // Prepare payload, carefully handling optional avatarSeed
        const userDbPayload: any = {
          username: user.username,
          password: user.password,
          full_name: user.fullName,
          group_name: user.group,
          role: user.role,
          status: user.status
        };

        if (user.avatarSeed) {
          userDbPayload.avatar_seed = user.avatarSeed;
        }

        const { error } = await supabase
          .from('app_users')
          .upsert(userDbPayload, { onConflict: 'username' });
        
        if (error) console.error("Error upserting user:", user.username, error);
      }

      return true;
    } catch (error) {
      console.error("[SUPABASE] Update DB Error:", error);
      return false;
    }
  }

  // PERMANENT DELETE USER
  async deleteUser(username: string): Promise<boolean> {
    try {
      console.log(`[SUPABASE] Permanently deleting user: ${username}`);
      
      // 1. Delete Tracker Data First (Child Table)
      const { error: trackerError } = await supabase
        .from('app_trackers')
        .delete()
        .eq('username', username);
      
      if (trackerError) {
        console.error("Error deleting tracker:", trackerError);
        // Continue anyway to try deleting user
      }

      // 2. Delete User Data (Parent Table)
      const { error: userError } = await supabase
        .from('app_users')
        .delete()
        .eq('username', username);

      if (userError) throw userError;

      return true;
    } catch (error) {
      console.error("[SUPABASE] Delete User Error:", error);
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
        const trackerPayload = {
          username: currentUser.username,
          weekly_data: localData,
          last_updated: new Date().toISOString()
        };

        const { error } = await supabase
          .from('app_trackers')
          .upsert(trackerPayload);
        
        if (error) {
          // CHECK FOR FOREIGN KEY VIOLATION (code 23503)
          if (error.code === '23503') {
            console.warn("[SUPABASE] User missing in DB (FK Violation). Auto-healing user record...");
            
            // 1b. Create the missing user record
            const { error: userError } = await supabase
              .from('app_users')
              .upsert({
                username: currentUser.username,
                password: currentUser.password || 'default123',
                full_name: currentUser.fullName,
                group_name: currentUser.group,
                role: currentUser.role,
                status: currentUser.status || 'active',
                avatar_seed: currentUser.avatarSeed || currentUser.username
              }, { onConflict: 'username' });

            if (userError) throw userError;

            // 1c. Retry the tracker update
            const { error: retryError } = await supabase
              .from('app_trackers')
              .upsert(trackerPayload);
            
            if (retryError) throw retryError;
            
            console.log("[SUPABASE] Auto-heal successful.");
          } else {
            // Real Error
            throw error;
          }
        }
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
      const msg = error.message || (error.code ? `Code: ${error.code}` : (typeof error === 'object' ? JSON.stringify(error) : String(error)));
      
      return { 
        users: [], trackers: {}, groups: localGroups, success: false, errorMessage: msg
      };
    }
  }
}

export const api = new ApiService();
