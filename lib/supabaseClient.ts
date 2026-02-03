import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Configuration for 'Muslim-Daily-Quest' Supabase Project

// Use Environment Variables if available (Vite standard)
// Fallback to a valid URL structure to prevent "Failed to construct 'URL'" crash on startup
const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_KEY = "placeholder";

// Cast import.meta to any to avoid TS error: Property 'env' does not exist on type 'ImportMeta'.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);