
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
  INSTRUKSI PENTING:
  1. Pastikan file ada di folder: public/avatars/
  2. Penulisan nama file di sini MENGGUNAKAN %20 sebagai pengganti spasi.
     Contoh: "Black Boys.png" ditulis "/avatars/Black%20Boys.png"
  3. Pastikan Besar/Kecil huruf nama file SAMA PERSIS dengan di folder.
*/

export const AVAILABLE_AVATARS = [
  { 
    id: 'char_1', 
    name: 'Adventurer', 
    url: '/avatars/Black%20Boys.png' 
  },
  { 
    id: 'char_2', 
    name: 'Warrior', 
    url: '/avatars/Blue%20Cool.png' 
  },
  { 
    id: 'char_3', 
    name: 'Mage', 
    url: '/avatars/Greenew.png' 
  },
  { 
    id: 'char_4', 
    name: 'Rogue', 
    url: '/avatars/Red%20Fire.png' 
  },
  { 
    id: 'char_5', 
    name: 'Paladin', 
    url: '/avatars/The%20Orange.png' 
  },
  { 
    id: 'char_6', 
    name: 'Cleric', 
    url: '/avatars/White%20Bros.png' 
  },
];

export const getAvatarSrc = (seedOrId?: string) => {
  // Default fallback jika kosong
  if (!seedOrId) return AVAILABLE_AVATARS[0].url;
  
  // 1. Cek jika seed adalah ID dari preset kita (char_1, char_2, dst)
  const found = AVAILABLE_AVATARS.find(a => a.id === seedOrId);
  if (found) return found.url;

  // 2. Jika seed adalah path file lokal (diawali /) atau URL online (http)
  if (seedOrId.startsWith('/') || seedOrId.startsWith('http')) {
    return seedOrId;
  }

  // 3. Fallback terakhir: Generator online (DiceBear)
  // Ini akan muncul jika file lokal tidak ditemukan sama sekali
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seedOrId}`;
};
