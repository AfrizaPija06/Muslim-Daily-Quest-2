
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
  Pastikan Anda telah membuat folder "avatars" di dalam folder "public".
  Struktur folder harus seperti ini:
  
  /public
    /avatars
       Black Boys.png
       Blue Cool.png
       ...dst
*/

export const AVAILABLE_AVATARS = [
  { 
    id: 'char_1', 
    name: 'Adventurer', 
    // PERBAIKAN: Gunakan path relatif root '/' bukan 'https://'
    url: '/avatars/Black Boys.png' 
  },
  { 
    id: 'char_2', 
    name: 'Warrior', 
    url: '/avatars/Blue Cool.png' 
  },
  { 
    id: 'char_3', 
    name: 'Mage', 
    url: '/avatars/Greenew.png' 
  },
  { 
    id: 'char_4', 
    name: 'Rogue', 
    url: '/avatars/Red Fire.png' 
  },
  { 
    id: 'char_5', 
    name: 'Paladin', 
    url: '/avatars/The Orange.png' 
  },
  { 
    id: 'char_6', 
    name: 'Cleric', 
    url: '/avatars/White Bros.png' 
  },
  
];

export const getAvatarSrc = (seedOrId?: string) => {
  if (!seedOrId) return AVAILABLE_AVATARS[0].url;
  
  // Cek apakah seed adalah ID dari preset kita
  const found = AVAILABLE_AVATARS.find(a => a.id === seedOrId);
  if (found) return found.url;

  // Fallback untuk user lama (backward compatibility) atau jika seed acak
  // Jika seed diawali '/', asumsikan itu path lokal custom yang mungkin disimpan manual
  if (seedOrId.startsWith('/')) return seedOrId;

  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedOrId}`;
};
