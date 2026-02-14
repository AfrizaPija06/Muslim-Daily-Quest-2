
import { supabase } from '../lib/supabaseClient';
import { WeeklyData, User } from '../types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from '../constants';

class ApiService {
  
  // --- AUTHENTICATION ---

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; data?: WeeklyData; error?: string }> {
    try {
      // 0. CEK ADMIN HARDCODED (Supaya Admin bisa login walau belum insert DB atau DB mati)
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        
        let trackerData = null;
        try {
          const { data: tracker } = await supabase
            .from('trackers')
            .select('data')
            .eq('username', username)
            .maybeSingle();
          trackerData = tracker?.data;
        } catch (dbError) {
          console.warn("Admin login: DB unreachable, using local data.");
        }

        return {
          success: true,
          user: {
            username: ADMIN_CREDENTIALS.username,
            fullName: ADMIN_CREDENTIALS.fullName,
            password: ADMIN_CREDENTIALS.password,
            role: ADMIN_CREDENTIALS.role,
            group: ADMIN_CREDENTIALS.group,
            status: ADMIN_CREDENTIALS.status,
            avatarSeed: ADMIN_CREDENTIALS.avatarSeed,
            characterId: ADMIN_CREDENTIALS.characterId
          },
          data: trackerData || INITIAL_DATA
        };
      }

      // 1. Fetch User Normal dari Database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle(); 

      if (error) {
        console.error("Login Query Error:", error);
        if (error.code === '402') return { success: false, error: 'Server Penuh (Quota Exceeded).' };
        if (error.code === '42P01') return { success: false, error: 'Tabel database hilang. Hubungi Admin.' }; // Table missing
        return { success: false, error: `Login Error: ${error.message}` };
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

      if (trackerError) {
         if (trackerError.code === '402') return { success: false, error: 'Server Penuh (Quota Exceeded).' };
         console.warn("Tracker Error:", trackerError);
      }

      // Mapping Database snake_case to App camelCase
      const appUser: User = {
        username: user.username,
        fullName: user.full_name,
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
         if (checkError.code === '402') return { success: false, error: "Server Penuh (Quota Exceeded)." };
         // Error 42P01 = Table not found
         if (checkError.code === '42P01') return { success: false, error: "Tabel belum dibuat! Jalankan script SQL di Supabase." };
         
         console.error("Check User Error:", checkError);
         return { success: false, error: `DB Error: ${checkError.message}` };
      }

      if (existing) {
        return { success: false, error: "Username sudah digunakan." };
      }

      // 2. Insert User (Strict Mapping)
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

      if (insertError) {
        if (insertError.code === '402') return { success: false, error: "Gagal: Kuota Server Penuh." };
        if (insertError.code === '42P01') return { success: false, error: "Gagal: Tabel 'users' tidak ditemukan." };
        
        console.error("Insert User Error details:", insertError);
        return { success: false, error: `Gagal save user: ${insertError.message}` };
      }

      // 3. Initialize Tracker
      const newTracker = { ...INITIAL_DATA, lastUpdated: new Date().toISOString() };
      const { error: trackerError } = await supabase.from('trackers').insert([{
        username: newUser.username,
        data: newTracker
      }]);

      if (trackerError) {
         console.error("Tracker Init Error:", trackerError);
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

      if (error) {
        if (error.code === '402') console.warn("Sync skipped: Quota Exceeded");
        throw error;
      }

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

      if (error) {
        if (error.code === '42P01') console.warn("Fetch users failed: Tables missing");
        if (error.code === '402') console.warn("Fetch users skipped: Quota Exceeded");
        throw error;
      }

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
      // Don't log full error on every fetch to avoid console spam, unless critical
      return [];
    }
  }

  async deleteUser(username: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('username', username);
    return !error;
  }

  async updateUserProfile(user: User): Promise<boolean> {
    try {
      if (user.username === ADMIN_CREDENTIALS.username) {
         const { data: exists } = await supabase.from('users').select('username').eq('username', user.username).maybeSingle();
         if (!exists) {
            await this.registerUserSafe(user);
         }
      }

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
