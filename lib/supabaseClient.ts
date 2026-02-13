import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari Environment Variables (Vite)
// Menggunakan fallback object kosong jika env undefined untuk mencegah crash
const env = (import.meta as any).env || {};

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials missing! Check your .env file.");
}

// Pastikan URL valid untuk createClient agar tidak throw error saat init
// Jika kosong, gunakan placeholder (akan gagal saat request, tapi app tidak blank screen)
const clientUrl = SUPABASE_URL && SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder.supabase.co';
const clientKey = SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(clientUrl, clientKey);