
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// GANTI DENGAN URL & KEY DARI DASHBOARD SUPABASE KAMU
// (Project Settings -> API)
const SUPABASE_URL = https://fymoxcdhskimzxpljjgi.supabase.co;
const SUPABASE_ANON_KEY = sb_publishable_vpQxLyLUf2Vj8HL1XilpuQ_y7Qwpf4u;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
