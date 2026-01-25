
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
// Konfigurasi untuk 6 Avatar Style Solo Leveling
// Pastikan file gambar disimpan di folder: /public/avatars/
// Nama file: 1.png, 2.png, 3.png, 4.png, 5.png, 6.png

export const AVAILABLE_AVATARS = [
  { id: '1', name: 'The Strategist', url: '/avatars/1.png' }, // Kacamata (Hitam/Biru)
  { id: '2', name: 'The Prodigy', url: '/avatars/2.png' },    // Jaket Biru
  { id: '3', name: 'The Guardian', url: '/avatars/3.png' },   // Hoodie Hijau
  { id: '4', name: 'The Striker', url: '/avatars/4.png' },    // Aura Merah Api
  { id: '5', name: 'The Spirit', url: '/avatars/5.png' },     // Aura Emas/Oren
  { id: '6', name: 'The Saint', url: '/avatars/6.png' },      // Baju Putih/Tasbih
];

export const getAvatarSrc = (seedOrId?: string) => {
  // 1. Default fallback ke Avatar 1 (The Strategist)
  if (!seedOrId) return AVAILABLE_AVATARS[0].url;
  
  // 2. Cek jika seed adalah ID yang valid (1-6)
  const found = AVAILABLE_AVATARS.find(a => a.id === seedOrId);
  if (found) return found.url;

  // 3. Support input manual angka jika di masa depan menambah avatar (misal 7.png)
  if (!isNaN(Number(seedOrId))) {
    return `/avatars/${seedOrId}.png`;
  }

  // 4. Jika URL lengkap (http/https) atau path lokal (/)
  if (seedOrId.startsWith('http') || seedOrId.startsWith('/')) {
    return seedOrId;
  }

  // 5. Fallback Local: Hashing string (username lama) ke salah satu avatar 1-6
  let hash = 0;
  for (let i = 0; i < seedOrId.length; i++) {
    hash = seedOrId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = (Math.abs(hash) % AVAILABLE_AVATARS.length) + 1;
  return `/avatars/${index}.png`;
};
