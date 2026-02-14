
import { supabase } from '../lib/supabaseClient';
import { WeeklyData, User } from '../types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from '../constants';

class ApiService {
  
  // --- AUTHENTICATION ---

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; data?: WeeklyData; error?: string }> {
    try {
      // 0. CEK ADMIN HARDCODED (Supaya Admin bisa login walau belum insert DB atau DB mati)
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        
        // Coba ambil data tracker admin dari DB (jika pernah save sebelumnya)
        // Kita bungkus try-catch extra di sini karena jika Quota habis, ini akan throw error
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

        // Return user admin dari constants
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
        // Deteksi Error Quota Habis (402 Payment Required) atau Network Error
        if (error.code === '402' || error.message?.includes('usage limit') || error.message?.includes('quota')) {
           return { success: false, error: 'Server Penuh (Quota Exceeded). Hubungi Admin.' };
        }
        return { success: false, error: 'Koneksi database bermasalah.' };
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

      if (trackerError && trackerError.code === '402') {
         return { success: false, error: 'Server Penuh (Quota Exceeded).' };
      }

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
         if (checkError.code === '402') return { success: false, error: "Server Penuh (Quota Exceeded)." };
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
        if (insertError.code === '402') return { success: false, error: "Gagal mendaftar: Kuota Server Penuh." };
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
      // Jika admin yang update profile (dan admin belum di DB), kita insert dulu
      if (user.username === ADMIN_CREDENTIALS.username) {
         const { data: exists } = await supabase.from('users').select('username').eq('username', user.username).maybeSingle();
         if (!exists) {
            // Register admin ke DB secara diam-diam agar bisa diupdate
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
