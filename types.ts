
export type PrayerState = 0 | 1 | 2; // 0: None, 1: Home, 2: Mosque
export type Role = 'mentee' | 'mentor';
export type AppTheme = 'default' | 'legends';
export type UserStatus = 'active' | 'pending' | 'rejected';

export interface User {
  fullName: string;
  username: string;
  password?: string;
  group: string;
  role: Role;
  status?: UserStatus; // Optional for backward compatibility
  avatarSeed?: string; // New field for custom avatar
}

export interface DayData {
  id: number;
  dayName: string;
  prayers: {
    subuh: PrayerState;
    zuhur: PrayerState;
    asar: PrayerState;
    magrib: PrayerState;
    isya: PrayerState;
  };
  tilawah: number;
}

export interface WeeklyData {
  days: DayData[];
  lastUpdated: string;
}

export const DAYS_OF_WEEK = [
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
];

export const MENTORING_GROUPS = [
  'Mentoring Legends #kelas7ikhwan',
  'Al-Fatih', 
  'Salahuddin', 
  'Khalid bin Walid', 
  'Thariq bin Ziyad', 
  'Umar bin Khattab'
];

export const PRAYER_KEYS = ['subuh', 'zuhur', 'asar', 'magrib', 'isya'] as const;
export type PrayerKey = typeof PRAYER_KEYS[number];

export const POINTS = {
  HOME: 1,
  MOSQUE: 27,
  TILAWAH_PER_LINE: 1
};

// --- RANK SYSTEM ---

export const RANK_TIERS = [
  { name: 'Mythic Glory', min: 5250, color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500' },
  { name: 'Epic', min: 4200, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500' },
  { name: 'Grand Master', min: 3150, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500' },
  { name: 'Master', min: 2100, color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500' },
  { name: 'Elite', min: 1050, color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500' },
  { name: 'Warrior', min: 0, color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500' },
];

export const getRankInfo = (points: number) => {
  // Find the highest tier where points >= min
  const rank = RANK_TIERS.find(r => points >= r.min) || RANK_TIERS[RANK_TIERS.length - 1];
  return rank;
};
