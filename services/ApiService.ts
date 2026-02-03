
import { WeeklyData, User, MENTORING_GROUPS, DayData, PrayerState } from '../types';
import { supabase } from '../lib/supabaseClient';
import { INITIAL_DATA } from '../constants';

class ApiService {
  
  // --- HELPER: LOCAL STORAGE ---
  private getLocalUser(): User | null {
    const s = localStorage.getItem('nur_quest_session');
    return s ? JSON.parse(s) : null;
  }

  // --- SQL: REGISTER ---
  async registerUserSafe(newUser: User): Promise<{ success: boolean; isOffline: boolean; error?: string }> {
    try {
      // Cek apakah username sudah ada
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', newUser.username)
        .single();

      if (existing) {
        return { success: false, isOffline: false, error: "Username sudah digunakan." };
      }

      // Insert ke tabel users
      const { error } = await supabase.from('users').insert({
        username: newUser.username,
        full_name: newUser.fullName,
        password: newUser.password,
        role: newUser.role,
        "group": newUser.group,
        status: newUser.status,
        avatar_url: newUser.avatarSeed
      });

      if (error) throw error;

      return { success: true, isOffline: false };
    } catch (e: any) {
      console.error(e);
      return { success: false, isOffline: false, error: e.message || "Gagal mendaftar." };
    }
  }

  // --- SQL: SYNC & LEADERBOARD FETCH ---
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<any> {
    if (!currentUser) return { success: false };

    try {
      // 1. PUSH LOCAL DATA TO SERVER (Upsert Daily Logs)
      const updates = localData.days.map(day => {
         const today = new Date();
         return {
            username: currentUser.username,
            date_id: `week_current_day_${day.id}`, 
            prayers: day.prayers,
            tilawah: day.tilawah,
            updated_at: new Date().toISOString()
         };
      });

      await supabase.from('daily_logs').upsert(updates, { onConflict: 'username, date_id' });

      await supabase.from('users').update({
        full_name: currentUser.fullName,
        avatar_url: currentUser.avatarSeed
      }).eq('username', currentUser.username);

      // 2. FETCH LEADERBOARD DATA
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .neq('status', 'rejected');

      if (userError) throw userError;

      const { data: logs, error: logError } = await supabase
        .from('daily_logs')
        .select('*');
        
      if (logError) throw logError;

      // 3. CONSTRUCT LOCAL STRUCTURE
      const trackers: Record<string, WeeklyData> = {};
      
      users.forEach((u: any) => {
        const userLogs = logs.filter((l: any) => l.username === u.username);
        
        const days = INITIAL_DATA.days.map(d => {
           const foundLog = userLogs.find((l: any) => l.date_id === `week_current_day_${d.id}`);
           if (foundLog) {
             return {
               ...d,
               prayers: foundLog.prayers,
               tilawah: foundLog.tilawah
             };
           }
           return d;
        });

        trackers[u.username] = {
           days,
           lastUpdated: new Date().toISOString()
        };
      });
      
      const formattedUsers = users.map((u: any) => ({
         username: u.username,
         fullName: u.full_name,
         role: u.role,
         group: u.group,
         status: u.status,
         avatarSeed: u.avatar_url,
         password: u.password 
      }));

      return {
        success: true,
        users: formattedUsers,
        trackers: trackers,
        groups: MENTORING_GROUPS, 
        assets: {}, 
        archives: [],
        attendance: {}
      };

    } catch (e: any) {
      console.error("Sync Error:", e);
      return { success: false, errorMessage: e.message };
    }
  }

  // --- SQL: STORAGE UPLOAD ---
  async uploadAvatar(file: File, username: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${username}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (e) {
      console.error("Upload failed:", e);
      return null;
    }
  }

  // --- ADMIN METHODS ---
  async updateUserStatus(username: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('username', username);
      return !error;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('username', username);
    return !error;
  }
  
  async saveAttendance(date: string, records: any): Promise<boolean> {
     return true; 
  }

  // Helper backward compatibility
  async fetchDatabase() {
     return { users: [], trackers: {}, groups: [], assets: {}, archives: [], attendance: {} };
  }
  
  async updateDatabase(db: any) { return true; }
  async uploadGlobalAsset(id: string, data: string) { return true; } 
  async deleteGlobalAsset(id: string) { return true; }
}

export const api = new ApiService();
