
import { Role, WeeklyData, DAYS_OF_WEEK } from './types';

export const ADMIN_CREDENTIALS = {
  username: 'mentor_admin',
  password: 'istiqamah2026',
  fullName: 'Ustadz Mentor',
  group: 'Pusat Mentoring',
  role: 'mentor' as Role
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

export const MOCK_MENTEES = [
  { fullName: 'Ahmad Al-Fatih', username: 'ahmad', group: 'Al-Fatih', points: 735, activeDays: 7 },
  { fullName: 'Siti Fatimah', username: 'fatimah', group: 'Salahuddin', points: 680, activeDays: 7 },
  { fullName: 'Ali Murtadha', username: 'ali', group: 'Al-Fatih', points: 412, activeDays: 5 },
  { fullName: 'Umar bin Khattab', username: 'umar', group: 'Khalid bin Walid', points: 300, activeDays: 4 },
  { fullName: 'Zaid bin Tsabit', username: 'zaid', group: 'Thariq bin Ziyad', points: 50, activeDays: 1 },
];
