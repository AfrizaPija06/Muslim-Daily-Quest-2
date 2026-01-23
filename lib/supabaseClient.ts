
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---

const SUPABASE_URL = "https://fymoxcdhskimzxpljjgi.supabase.co";

// PENTING: Key harus diawali dengan "eyJh..." (JWT Token).
// Copy dari: Project Settings > API > Project API Keys > anon public
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bW94Y2Roc2tpbXp4cGxqamdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjE5ODUsImV4cCI6MjA4NDczNzk4NX0.xToFicuRXwSH21iE0KM_UomxNFGx_2sPqgc55lHuwos";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
