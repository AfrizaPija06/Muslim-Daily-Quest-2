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

export const GAME_LOGO_URL = "https://fymoxcdhskimzxpljjgi.supabase.co/storage/v1/object/public/assets/gamelogo.png";
export const MENTOR_AVATAR_URL = "https://fymoxcdhskimzxpljjgi.supabase.co/storage/v1/object/public/assets/Mentor.png";

export const ADMIN_CREDENTIALS = {
  username: getEnv('VITE_ADMIN_USERNAME', 'mentor_admin'),
  password: getEnv('VITE_ADMIN_PASSWORD', 'istiqamah2026'),
  fullName: 'Kak Afriza',
  group: 'Mentoring Legends #kelas7ikhwan',
  role: 'mentor' as Role,
  avatarSeed: MENTOR_AVATAR_URL
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
  'Mentoring Legends #kelas7ikhwan'
];

// --- AVATAR SYSTEM CONFIGURATION ---

// Default Fallback jika gambar belum diset atau dihapus dari server
const DEFAULT_AVATAR_BASE = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=128&name=";

export const getAvatarSrc = (seedOrId?: string, globalAssets: GlobalAssets = {}) => {
  if (!seedOrId) return `${DEFAULT_AVATAR_BASE}User`;

  // 1. Cek Global Assets dari Server (Prioritas Utama)
  // Ini menangani 'user_{username}' (Mentor) dan 'preset_{id}' (Mentee)
  if (globalAssets && globalAssets[seedOrId]) {
    return globalAssets[seedOrId];
  }

  // 2. Legacy Support (Jika user lama masih pakai URL/Base64 langsung di field avatarSeed)
  if (seedOrId.startsWith('http') || seedOrId.startsWith('data:image')) {
    return seedOrId;
  }

  // 3. Fallback Terakhir (Inisial Nama)
  return `${DEFAULT_AVATAR_BASE}${seedOrId}`;
};

// Fungsi ini sudah tidak dipakai secara logika baru, tapi dibiarkan untuk mencegah error import di file lain jika ada sisa
export const getOnlineFallback = (seed: string) => {
   return `${DEFAULT_AVATAR_BASE}${seed}`;
};