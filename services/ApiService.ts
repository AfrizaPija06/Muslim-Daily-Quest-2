
import { supabase } from '../lib/supabaseClient';
import { WeeklyData, User } from '../types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from '../constants';

class ApiService {
  
  // --- AUTHENTICATION ---

  async login(username: string, password: string): Promise<{ success: boolean; user?: User; data?: WeeklyData; error?: string }> {
    try {
      // 0. CEK ADMIN HARDCODED
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
        // Deteksi Project Lama yang Restricted
        if (error.message?.includes('restricted') || error.message?.includes('violations')) {
            return { success: false, error: '⛔ KRITIS: Kodingan masih connect ke Project Lama (Blocked). Ganti URL & Key di .env dengan Project Baru!' };
        }
        if (error.code === '402') return { success: false, error: 'Server Penuh (Quota Exceeded).' };
        if (error.code === '42P01') return { success: false, error: 'Tabel database belum dibuat. Jalankan SQL Script di Supabase.' };
        return { success: false, error: `Login Error: ${error.message}` };
      }

      if (!user) {
        return { success: false, error: 'Username atau Password salah.' };
      }

      // 2. Fetch Tracker Data
      const { data: tracker, error: trackerError } = await supabase
        .from('trackers')
        .select('data')
        .eq('username', username)
        .maybeSingle();

      if (trackerError) {
         console.warn("Tracker Error:", trackerError);
      }

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
         // Deteksi Project Lama saat Register
         if (checkError.message?.includes('restricted') || checkError.message?.includes('violations')) {
            return { success: false, error: '⛔ ERROR: Masih terhubung ke Project LAMA. Ganti URL di .env!' };
         }
         if (checkError.code === '402') return { success: false, error: "Server Penuh (Quota Exceeded)." };
         if (checkError.code === '42P01') return { success: false, error: "Tabel belum dibuat! Jalankan script SQL di Supabase." };
         
         console.error("Check User Error:", checkError);
         return { success: false, error: `DB Error: ${checkError.message}` };
      }

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

      if (insertError) {
        if (insertError.message?.includes('restricted')) return { success: false, error: "⛔ ERROR: Masih terhubung ke Project LAMA." };
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

      return { success: true };
    } catch (e: any) {
      console.error("Registration Exception:", e);
      return { success: false, error: e.message || "Gagal mendaftar ke server." };
    }
  }

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
        if (error.message?.includes('restricted')) console.error("SYNC FAILED: Project is restricted (Check .env)");
        throw error;
      }

      return { success: true };
    } catch (e) {
      return { success: false };
    }
  }

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
        if (error.message?.includes('restricted')) console.warn("Fetch users failed: Project Restricted");
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
         if (!exists) await this.registerUserSafe(user);
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
