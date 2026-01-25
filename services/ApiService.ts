
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { supabase } from '../lib/supabaseClient';

/**
 * ApiService - Real Backend Implementation using Supabase
 */
class ApiService {
  
  // Fetch all data
  async fetchDatabase(): Promise<{ users: User[], trackers: Record<string, WeeklyData>, groups: string[] }> {
    try {
      const { data: usersData, error: userError } = await supabase.from('app_users').select('*');
      if (userError) throw userError;

      const { data: trackersData, error: trackerError } = await supabase.from('app_trackers').select('*');
      if (trackerError) throw trackerError;

      const formattedUsers: User[] = usersData.map((u: any) => ({
        fullName: u.full_name,
        username: u.username,
        password: u.password, 
        group: u.group_name,
        role: u.role as any,
        status: u.status as any,
        avatarSeed: u.avatar_seed || u.username 
      }));

      const trackersMap: Record<string, WeeklyData> = {};
      trackersData.forEach((t: any) => {
        trackersMap[t.username] = t.weekly_data;
      });

      const groups = JSON.parse(localStorage.getItem('nur_quest_groups') || JSON.stringify(MENTORING_GROUPS));
      return { users: formattedUsers, trackers: trackersMap, groups };

    } catch (error) {
      console.error("[SUPABASE] Fetch Error:", error);
      throw error;
    }
  }

  // --- EFFICIENT SINGLE USER UPDATE (Fixes Lag & Overwrite issues) ---
  async updateUserProfile(user: User): Promise<boolean> {
    try {
      const payload: any = {
        username: user.username,
        password: user.password,
        full_name: user.fullName,
        group_name: user.group,
        role: user.role,
        status: user.status,
        avatar_seed: user.avatarSeed 
      };

      const { error } = await supabase
        .from('app_users')
        .upsert(payload, { onConflict: 'username' });

      if (error) {
        console.error("Single user update failed:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception updating user:", e);
      return false;
    }
  }

  // Bulk Update (Legacy / Full Sync)
  async updateDatabase(payload: { users: User[], trackers: Record<string, WeeklyData>, groups: string[] }): Promise<boolean> {
    try {
      // Upsert Users
      for (const user of payload.users) {
        await this.updateUserProfile(user);
      }
      return true;
    } catch (error) {
      console.error("[SUPABASE] Bulk Update DB Error:", error);
      return false;
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    try {
      const { error: trackerError } = await supabase.from('app_trackers').delete().eq('username', username);
      if (trackerError) console.error("Error deleting tracker:", trackerError);

      const { error: userError } = await supabase.from('app_users').delete().eq('username', username);
      if (userError) throw userError;

      return true;
    } catch (error) {
      console.error("[SUPABASE] Delete User Error:", error);
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
      if (currentUser) {
        const trackerPayload = {
          username: currentUser.username,
          weekly_data: localData,
          last_updated: new Date().toISOString()
        };

        const { error } = await supabase.from('app_trackers').upsert(trackerPayload);
        
        if (error) {
          if (error.code === '23503') {
            console.warn("[SUPABASE] User missing (FK). Auto-healing...");
            await this.updateUserProfile(currentUser); 
            await supabase.from('app_trackers').upsert(trackerPayload);
          } else {
            throw error;
          }
        }
      }

      const db = await this.fetchDatabase();
      
      let updatedLocalData: WeeklyData | undefined = undefined;
      if (currentUser && db.trackers[currentUser.username]) {
        const cloudTracker = db.trackers[currentUser.username];
        const cloudTime = cloudTracker.lastUpdated ? new Date(cloudTracker.lastUpdated).getTime() : 0;
        const localTime = localData.lastUpdated ? new Date(localData.lastUpdated).getTime() : 0;
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
      // Quiet fail if network issue to prevent UI spam, relying on Status Bar
      const msg = error.message || "Connection failed";
      return { 
        users: [], trackers: {}, groups: localGroups, success: false, errorMessage: msg
      };
    }
  }
}

export const api = new ApiService();
