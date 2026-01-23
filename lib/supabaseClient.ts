
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Pastikan URL dan Key diapit tanda kutip ("") agar menjadi string yang valid.

const SUPABASE_URL = "https://fymoxcdhskimzxpljjgi.supabase.co";
// Note: Key biasanya dimulai dengan "eyJh..." (JWT Token). 
// Jika "sb_publishable..." ini gagal, cek lagi di Dashboard Supabase > Project Settings > API > anon public key.
const SUPABASE_ANON_KEY = "sb_publishable_vpQxLyLUf2Vj8HL1XilpuQ_y7Qwpf4u";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
