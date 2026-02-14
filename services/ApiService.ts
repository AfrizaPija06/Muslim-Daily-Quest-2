
import { supabase } from '../lib/supabaseClient';
import { WeeklyData, User } from '../types';
import { INITIAL_DATA } from '../constants';

class ApiService {
  
  // --- AUTHENTICATION ---

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; data?: WeeklyData; error?: string }> {
    try {
      // 1. Fetch User
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle(); // Use maybeSingle to prevent error on no rows

      if (error) {
        console.error("Login Query Error:", error);
        return { success: false, error: 'Terjadi kesalahan koneksi database.' };
      }

      if (!user) {
        return { success: false, error: 'Username atau Password salah.' };
      }

      // 2. Fetch Tracker Data (Safely)
      const { data: tracker, error: trackerError } = await supabase
        .from('trackers')
        .select('data')
        .eq('username', username)
        .maybeSingle();

      // Mapping Database snake_case to App camelCase
      const appUser: User = {
        username: user.username,
        fullName: user.full_name, // Map full_name -> fullName
        password: user.password,
        role: user.role,
        group: user.group,
        status: user.status,
        avatarSeed: user.avatar_seed,
        characterId: user.character_id
      };

      return { 
        success: true, 
        user: appUser, 
        // If tracker is null (new user), use INITIAL_DATA
        data: tracker?.data || INITIAL_DATA 
      };

    } catch (e: any) {
      console.error("Login Exception:", e);
      return { success: false, error: e.message || 'Error tidak diketahui saat login.' };
    }
  }

  async registerUserSafe(newUser: User): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Check if user exists
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', newUser.username)
        .maybeSingle();

      if (checkError) {
         console.error("Check User Error:", checkError);
         return { success: false, error: "Gagal mengecek username database." };
      }

      if (existing) {
        return { success: false, error: "Username sudah digunakan." };
      }

      // 2. Insert User (Strict Mapping)
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          username: newUser.username,
          full_name: newUser.fullName, // Ensure mapping matches DB column
          password: newUser.password,
          role: newUser.role,
          group: newUser.group,
          status: newUser.status,
          avatar_seed: newUser.avatarSeed,
          character_id: newUser.characterId
        }]);

      if (insertError) {
        console.error("Insert User Error details:", insertError);
        return { success: false, error: `Gagal membuat user: ${insertError.message}` };
      }

      // 3. Initialize Tracker
      const newTracker = { ...INITIAL_DATA, lastUpdated: new Date().toISOString() };
      const { error: trackerError } = await supabase.from('trackers').insert([{
        username: newUser.username,
        data: newTracker
      }]);

      if (trackerError) {
         console.error("Tracker Init Error:", trackerError);
         // Not fatal, user can still login, tracker will be created on sync
      }

      return { success: true };
    } catch (e: any) {
      console.error("Registration Exception:", e);
      return { success: false, error: e.message || "Gagal mendaftar ke server." };
    }
  }

  // --- SYNC / DATA MANAGEMENT ---

  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<any> {
    if (!currentUser) return { success: false };

    try {
      const { error } = await supabase
        .from('trackers')
        .upsert({
          username: currentUser.username,
          data: localData,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true };
    } catch (e) {
      console.error("Sync Failed:", e);
      return { success: false };
    }
  }

  // --- LEADERBOARD & ADMIN ---

  async getAllUsersWithPoints(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          trackers ( data )
        `);

      if (error) throw error;

      return data.map((u: any) => ({
        username: u.username,
        fullName: u.full_name,
        role: u.role,
        group: u.group,
        status: u.status,
        avatarSeed: u.avatar_seed,
        characterId: u.character_id,
        trackerData: u.trackers ? u.trackers.data : null
      }));

    } catch (e) {
      console.error("Fetch Users Failed", e);
      return [];
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('username', username);
    return !error;
  }

  // --- PROFILE UPDATE ---
  async updateUserProfile(user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: user.fullName,
          avatar_seed: user.avatarSeed,
          character_id: user.characterId
        })
        .eq('username', user.username);
      
      return !error;
    } catch (e) {
      return false;
    }
  }
}

export const api = new ApiService();
