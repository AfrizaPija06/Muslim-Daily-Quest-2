
export type PrayerState = 0 | 1 | 2; // 0: None, 1: Home, 2: Mosque
export type Role = 'mentee' | 'mentor';
export type AppTheme = 'ramadhan'; // Locked to Ramadhan
export type UserStatus = 'active' | 'pending' | 'rejected';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'emerald' | 'mythic';

export interface User {
  fullName: string;
  username: string;
  password?: string;
  group: string;
  role: Role;
  status?: UserStatus;
  avatarSeed?: string; 
  characterId?: string; // New field to track selected character ID
  unlockedBadges?: string[]; // Array of Badge IDs
  bonusPoints?: number; // Extra XP from badges/events
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

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any; // Lucide Icon Name or Component
  bonusXP: number;
  condition: (data: WeeklyData) => boolean;
  tier: BadgeTier;
  secret?: boolean; // If true, hidden from list until unlocked
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
// TUGAS ANDA: Ganti 'assetKey' dengan Link Cloudinary untuk setiap Rank.
export const RANK_TIERS = [
  { 
    name: 'Mythical Immortal', 
    min: 9000, 
    color: 'text-red-500', 
    bg: 'bg-red-500/20 border-red-500', 
    // Contoh: assetKey: 'https://res.cloudinary.com/.../ranks/immortal.png'
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126231/mythic_immortal_cjy711.png'
  },
  { 
    name: 'Mythical Glory', 
    min: 8200, 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/20 border-rose-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126230/mythic_glory_bxvmwl.png'
  },
  { 
    name: 'Mythical Honor', 
    min: 7500, 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/20 border-blue-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126230/mythic_honor_nd689h.png'
  },
  { 
    name: 'Mythic', 
    min: 6000, 
    color: 'text-purple-400', 
    bg: 'bg-purple-500/20 border-purple-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126230/mythic_afiq77.png'
  },
  { 
    name: 'Legend', 
    min: 4500, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/20 border-amber-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126229/legend_vxmcnz.png'
  },
  { 
    name: 'Epic', 
    min: 3000, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/20 border-emerald-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126229/epic_o0higy.png'
  },
  { 
    name: 'Grandmaster', 
    min: 2000, 
    color: 'text-red-400', 
    bg: 'bg-red-500/20 border-red-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126229/grandmaster_pqbd15.png'
  },
  { 
    name: 'Master', 
    min: 1200, 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-500/20 border-yellow-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126230/master_wrardk.png'
  },
  { 
    name: 'Elite', 
    min: 500, 
    color: 'text-slate-300', 
    bg: 'bg-slate-500/20 border-slate-500', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126229/elite_mssme6.png'
  },
  { 
    name: 'Warrior', 
    min: 0, 
    color: 'text-slate-500', 
    bg: 'bg-slate-700/20 border-slate-700', 
    assetKey: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126231/warrior_sz2fz5.png'
  },
];

export const getRankInfo = (points: number) => {
  return RANK_TIERS.find(r => points >= r.min) || RANK_TIERS[RANK_TIERS.length - 1];
};
