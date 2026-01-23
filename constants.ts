
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
export const CLOUD_SYNC_URL = "https://keyvalue.immanent.workers.dev/nur_quest_prod_v7";

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
// Menggunakan Avatar Lokal (Custom User Collection)
// File harus ada di folder: /public/avatars/
// Penamaan file: 1.png, 2.png, 3.png, ... s/d 24.png

export const AVAILABLE_AVATARS = Array.from({ length: 24 }, (_, i) => {
  const id = String(i + 1);
  return {
    id,
    name: `Avatar ${id}`,
    url: `/avatars/${id}.png` // Path ke file lokal
  };
});

export const getAvatarSrc = (seedOrId?: string) => {
  // 1. Default fallback ke Avatar 1
  if (!seedOrId) return AVAILABLE_AVATARS[0].url;
  
  // 2. Cek jika seed adalah ID dari list preset (misal "1", "5")
  const found = AVAILABLE_AVATARS.find(a => a.id === seedOrId);
  if (found) return found.url;

  // 3. Support input manual angka (misal user punya 50 avatar, tapi list cuma tampil 24)
  if (!isNaN(Number(seedOrId))) {
    return `/avatars/${seedOrId}.png`;
  }

  // 4. Jika URL lengkap (http/https) atau path lokal (/)
  if (seedOrId.startsWith('http') || seedOrId.startsWith('/')) {
    return seedOrId;
  }

  // 5. Fallback Terakhir (DiceBear) 
  // Untuk user lama yang username-nya belum diganti ke ID angka, agar gambar tidak broken.
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seedOrId}`;
};
