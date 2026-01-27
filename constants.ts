
import { Role, WeeklyData, DAYS_OF_WEEK } from './types';

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

// --- AVATAR SYSTEM CONFIGURATION (ONLINE FIX) ---
// Menggunakan Dicebear API (Adventurer Style) agar gambar selalu muncul di device manapun
// tanpa perlu file lokal.
const AVATAR_BASE_URL = "https://api.dicebear.com/9.x/adventurer/svg?seed=";

export const AVAILABLE_AVATARS = [
  { id: '1', name: 'The Strategist', url: `${AVATAR_BASE_URL}Alexander` }, 
  { id: '2', name: 'The Prodigy', url: `${AVATAR_BASE_URL}Sarah` },    
  { id: '3', name: 'The Guardian', url: `${AVATAR_BASE_URL}Darius` },   
  { id: '4', name: 'The Striker', url: `${AVATAR_BASE_URL}Leo` },    
  { id: '5', name: 'The Spirit', url: `${AVATAR_BASE_URL}Amara` },     
  { id: '6', name: 'The Saint', url: `${AVATAR_BASE_URL}Omar` },      
];

export const getAvatarSrc = (seedOrId?: string) => {
  // 1. Default fallback
  if (!seedOrId) return AVAILABLE_AVATARS[0].url;

  // 2. Cek Cache Lokal (Untuk Upload Custom Mentor)
  // Hanya bekerja di browser yang sama tempat upload dilakukan
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`avatar_cache_${seedOrId}`);
    if (cached && cached.length > 50) return cached;
  }
  
  // 3. Cek apakah ID sesuai dengan preset 1-6
  const found = AVAILABLE_AVATARS.find(a => a.id === seedOrId);
  if (found) return found.url;

  // 4. Jika input berupa URL lengkap (https://...)
  if (seedOrId.startsWith('http') || seedOrId.startsWith('data:image')) {
    return seedOrId;
  }

  // 5. FALLBACK PINTAR (Fix Broken Images):
  // Jika gambar custom tidak ditemukan (misal ganti HP),
  // Generate avatar unik berdasarkan username/seed tersebut.
  // Ini mencegah gambar "pecah/hilang".
  return `${AVATAR_BASE_URL}${seedOrId}`;
};
