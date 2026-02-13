
export type PrayerState = 0 | 1 | 2; // 0: None, 1: Home, 2: Mosque
export type Role = 'mentee' | 'mentor';
export type AppTheme = 'ramadhan'; // Locked to Ramadhan
export type UserStatus = 'active' | 'pending' | 'rejected';

export interface User {
  fullName: string;
  username: string;
  password?: string;
  group: string;
  role: Role;
  status?: UserStatus;
  avatarSeed?: string; 
  characterId?: string; // New field to track selected character ID
}

export interface Character {
  id: string;
  name: string;
  role: string; // e.g., 'Vanguard', 'Scholar'
  description: string;
  abilities: string[]; // Fluff text for RPG feel
  imageUrl: string;
  color: string; // Tailwind color class for borders/glows
}

export interface DayData {
  id: number; // 0 = 1 Ramadhan, 1 = 2 Ramadhan, dst
  dayName: string; // Will store "1 Ramadhan", "2 Ramadhan"
  prayers: {
    subuh: PrayerState;
    zuhur: PrayerState;
    asar: PrayerState;
    magrib: PrayerState;
    isya: PrayerState;
  };
  tilawah: number;
  shaum?: boolean;
  tarawih?: boolean;
  dateStr?: string; // Gregorian date string for syncing
}

export interface WeeklyData {
  days: DayData[];
  lastUpdated: string;
}

export type AttendanceStatus = 'H' | 'S' | 'A';
export type AttendanceRecord = Record<string, Record<string, AttendanceStatus>>;

export type GlobalAssets = Record<string, string>;
export interface ArchivedData { id: string; timestamp: string; records: any[]; }

// HIJRI CONFIGURATION
export const HIJRI_YEAR = "1447 H";
export const TOTAL_RAMADHAN_DAYS = 30; 

// MENTORING GROUPS - LOCKED TO SPECIFIC GROUP
export const MENTORING_GROUPS = [
  'Mentoring Legends #kelas7ikhwan'
];

export const PRAYER_KEYS = ['subuh', 'zuhur', 'asar', 'magrib', 'isya'] as const;
export type PrayerKey = typeof PRAYER_KEYS[number];

export const POINTS = {
  HOME: 1,
  MOSQUE: 27,
  TILAWAH_PER_LINE: 1,
  SHAUM: 100, 
  TARAWIH: 50
};

// RANK SYSTEM (Updated to MLBB Style)
// MASUKKAN LINK ICON MANUAL DI SINI (Property: assetKey)
// Bisa menggunakan link gambar full (https://...) atau nama file di Supabase Storage
export const RANK_TIERS = [
  { 
    name: 'Mythical Immortal', 
    min: 9000, 
    color: 'text-red-500', 
    bg: 'bg-red-500/20 border-red-500', 
    assetKey: 'rank_immortal.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Mythical Glory', 
    min: 8200, 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/20 border-rose-500', 
    assetKey: 'rank_glory.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Mythical Honor', 
    min: 7500, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20 border-blue-500', 
    assetKey: 'rank_honor.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Mythic', 
    min: 6000, 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20 border-purple-500', 
    assetKey: 'rank_mythic.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Legend', 
    min: 4500, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/20 border-amber-500', 
    assetKey: 'rank_legend.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Epic', 
    min: 3000, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20 border-emerald-500', 
    assetKey: 'rank_epic.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Grandmaster', 
    min: 2000, 
    color: 'text-red-400', 
    bg: 'bg-red-500/20 border-red-500', 
    assetKey: 'rank_gm.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Master', 
    min: 1200, 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/20 border-yellow-500', 
    assetKey: 'rank_master.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Elite', 
    min: 500, 
    color: 'text-slate-300', 
    bg: 'bg-slate-500/20 border-slate-500', 
    assetKey: 'rank_elite.png' // GANTI DENGAN LINK ICON ANDA
  },
  { 
    name: 'Warrior', 
    min: 0, 
    color: 'text-slate-500', 
    bg: 'bg-slate-700/20 border-slate-700', 
    assetKey: 'rank_warrior.png' // GANTI DENGAN LINK ICON ANDA
  },
];

export const getRankInfo = (points: number) => {
  return RANK_TIERS.find(r => points >= r.min) || RANK_TIERS[RANK_TIERS.length - 1];
};
