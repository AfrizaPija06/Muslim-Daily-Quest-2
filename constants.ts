
import { Role, WeeklyData, DAYS_OF_WEEK, GlobalAssets } from './types';

const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key];
      if (val !== undefined) return val;
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      const val = process.env[key];
      if (val !== undefined) return val;
    }
  } catch (e) {}
  return fallback;
};

export const ADMIN_CREDENTIALS = {
  username: getEnv('VITE_ADMIN_USERNAME', 'mentor_admin'),
  password: getEnv('VITE_ADMIN_PASSWORD', 'istiqamah2026'),
  fullName: 'Kak Afriza',
  group: 'Mentoring Legends #kelas7ikhwan',
  role: 'mentor' as Role
};

// PUBLIC CLOUD SYNC CONFIG
export const INITIAL_DATA: WeeklyData = {
  days: DAYS_OF_WEEK.map((day, idx) => ({
    id: idx,
    dayName: day,
    prayers: { subuh: 0, zuhur: 0, asar: 0, magrib: 0, isya: 0 },
    tilawah: 0
  })),
  lastUpdated: new Date().toISOString()
};

export const MENTORING_GROUPS = [
  'Mentoring Legends #kelas7ikhwan',
  'Al-Fatih', 
  'Salahuddin', 
  'Khalid bin Walid', 
  'Thariq bin Ziyad', 
  'Umar bin Khattab'
];

// --- AVATAR SYSTEM CONFIGURATION ---

export const AVAILABLE_AVATARS = [
  { id: '1', name: 'The Strategist', url: '/avatars/1.png' }, 
  { id: '2', name: 'The Prodigy', url: '/avatars/2.png' },    
  { id: '3', name: 'The Guardian', url: '/avatars/3.png' },   
  { id: '4', name: 'The Striker', url: '/avatars/4.png' },    
  { id: '5', name: 'The Spirit', url: '/avatars/5.png' },     
  { id: '6', name: 'The Saint', url: '/avatars/6.png' },      
];

const FALLBACK_BASE_URL = "https://api.dicebear.com/9.x/notionists/svg?backgroundColor=b6e3f4,c0aede,d1d4f9&seed=";

// Updated Signature: Accepts optional globalAssets from server
export const getAvatarSrc = (seedOrId?: string, globalAssets: GlobalAssets = {}) => {
  // 1. Default fallback
  if (!seedOrId) return AVAILABLE_AVATARS[0].url;

  // 2. [PRIORITY NEW] Cek Global Assets dari Server
  // Jika Mentor sudah upload, pakai ini agar muncul di semua device
  if (globalAssets && globalAssets[seedOrId]) {
    return globalAssets[seedOrId];
  }

  // 3. Cek Cache Lokal (Legacy/Fallback)
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`avatar_cache_${seedOrId}`);
    if (cached && cached.length > 50) return cached;
  }
  
  // 4. Cek apakah ID sesuai dengan preset 1-6 (Local Path)
  const found = AVAILABLE_AVATARS.find(a => a.id === seedOrId);
  if (found) return found.url;

  // 5. Jika input berupa URL lengkap/Data URI
  if (seedOrId.startsWith('http') || seedOrId.startsWith('data:image')) {
    return seedOrId;
  }

  // 6. Fallback path
  return `/avatars/${seedOrId}.png`;
};

export const getOnlineFallback = (seed: string) => {
  const seedMap: Record<string, string> = {
    '1': 'Felix',
    '2': 'Ryan', 
    '3': 'Mason',
    '4': 'Leo',
    '5': 'Caleb',
    '6': 'Omar',
  };
  const finalSeed = seedMap[seed] || seed;
  return `${FALLBACK_BASE_URL}${finalSeed}`;
};
