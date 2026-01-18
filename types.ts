
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
  'Al-Fatih', 'Salahuddin', 'Khalid bin Walid', 'Thariq bin Ziyad', 'Umar bin Khattab'
];

export const PRAYER_KEYS = ['subuh', 'zuhur', 'asar', 'magrib', 'isya'] as const;
export type PrayerKey = typeof PRAYER_KEYS[number];

export const POINTS = {
  HOME: 1,
  MOSQUE: 27,
  TILAWAH_PER_LINE: 1
};
