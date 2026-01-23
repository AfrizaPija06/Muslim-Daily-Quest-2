
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

/* 
  FIX: Menggunakan URL Online agar gambar langsung muncul & tidak hitam.
  
  Jika nanti ingin pakai gambar sendiri (Lokal):
  1. Masukkan file ke folder: public/avatars/
  2. Ganti url di bawah menjadi: '/avatars/namafile.png'
*/

export const AVAILABLE_AVATARS = [
  { 
    id: 'char_1', 
    name: 'Adventurer', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix' 
  },
  { 
    id: 'char_2', 
    name: 'Warrior', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka' 
  },
  { 
    id: 'char_3', 
    name: 'Mage', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Scooter' 
  },
  { 
    id: 'char_4', 
    name: 'Rogue', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Midnight' 
  },
  { 
    id: 'char_5', 
    name: 'Paladin', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Bandit' 
  },
  { 
    id: 'char_6', 
    name: 'Cleric', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ginger' 
  },
  { 
    id: 'char_7', 
    name: 'Archer', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Missy' 
  },
  { 
    id: 'char_8', 
    name: 'Knight', 
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Trouble' 
  },
];

export const getAvatarSrc = (seedOrId?: string) => {
  if (!seedOrId) return AVAILABLE_AVATARS[0].url;
  
  // 1. Cek jika seed adalah ID dari daftar AVAILABLE_AVATARS
  const found = AVAILABLE_AVATARS.find(a => a.id === seedOrId);
  if (found) return found.url;

  // 2. Support URL lengkap atau path lokal (jika user input manual via database)
  if (seedOrId.startsWith('/') || seedOrId.startsWith('http')) {
    return seedOrId;
  }

  // 3. Fallback ke generator online jika seed tidak dikenali
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seedOrId}`;
};
