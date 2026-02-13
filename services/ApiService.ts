
import { supabase } from '../lib/supabaseClient';
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
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
        .eq('password', password) // Simple auth for Game Style
        .single();

      if (error || !user) {
        return { success: false, error: 'Username atau Password salah.' };
      }

      // 2. Fetch Tracker Data
      const { data: tracker } = await supabase
        .from('trackers')
        .select('data')
        .eq('username', username)
        .single();

      return { 
        success: true, 
        user: user as User, 
        data: tracker ? tracker.data : INITIAL_DATA 
      };

    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async registerUserSafe(newUser: User): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', newUser.username)
        .single();

      if (existing) {
        return { success: false, error: "Username sudah digunakan." };
      }

      // 2. Insert User
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          username: newUser.username,
          full_name: newUser.fullName,
          password: newUser.password,
          role: newUser.role,
          group: newUser.group,
          status: newUser.status,
          avatar_seed: newUser.avatarSeed,
          character_id: newUser.characterId
        }]);

      if (insertError) throw insertError;

      // 3. Initialize Tracker
      const newTracker = { ...INITIAL_DATA, lastUpdated: new Date().toISOString() };
      await supabase.from('trackers').insert([{
        username: newUser.username,
        data: newTracker
      }]);

      return { success: true };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || "Gagal mendaftar ke server." };
    }
  }

  // --- SYNC / DATA MANAGEMENT ---

  // Debounce sync to prevent server spamming
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<any> {
    if (!currentUser) return { success: false };

    try {
      // Upsert Tracker Data (Save Game)
      // We store the WHOLE JSON object. Supabase handles JSONB very efficiently.
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
      // Join users and trackers
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          trackers ( data )
        `);

      if (error) throw error;

      // Transform for frontend
      return data.map((u: any) => ({
        ...u,
        avatarSeed: u.avatar_seed, // mapping snake_case db to camelCase js
        characterId: u.character_id,
        fullName: u.full_name,
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
