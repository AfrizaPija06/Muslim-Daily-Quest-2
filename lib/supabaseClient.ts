
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// STRICTLY OFFLINE MODE:
// Using dummy keys to initialize client, but it will not be used in ApiService.

const SUPABASE_URL = 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = 'placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
