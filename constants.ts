
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

// Fallback image (Silhouette) if nothing found on server
const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User&size=128";

export const getAvatarSrc = (seedOrId?: string, globalAssets: GlobalAssets = {}) => {
  if (!seedOrId) return DEFAULT_AVATAR;

  // 1. Cek Global Assets (Prioritas Utama - Server Data)
  if (globalAssets && globalAssets[seedOrId]) {
    return globalAssets[seedOrId];
  }

  // 2. Jika seedOrId itu sendiri adalah Base64 atau URL (Legacy support)
  if (seedOrId.startsWith('http') || seedOrId.startsWith('data:image')) {
    return seedOrId;
  }

  // 3. Fallback terakhir
  return `https://ui-avatars.com/api/?background=10b981&color=fff&name=${seedOrId}&size=128`;
};

// No longer needed, strictly server assets or placeholder
export const getOnlineFallback = (seed: string) => {
   return `https://ui-avatars.com/api/?background=334155&color=fff&name=${seed}&size=128`;
};
