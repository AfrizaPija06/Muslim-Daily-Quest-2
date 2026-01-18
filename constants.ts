
import { Role, WeeklyData, DAYS_OF_WEEK } from './types';

// Helper to safely read Environment Variables
// Prioritizes Vite's import.meta.env, handles process.env purely as a fallback 
// but wrapped to avoid "process is not defined" runtime errors.
const getEnv = (key: string, fallback: string) => {
  // 1. Try Vite (Standard for this project structure)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key];
      if (val !== undefined) return val;
    }
  } catch (e) {}

  // 2. Try Process (Node/Webpack compatibility) - STRICTLY CHECKED
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      const val = process.env[key];
      if (val !== undefined) return val;
    }
  } catch (e) {}

  // 3. Return Fallback
  return fallback;
};

export const ADMIN_CREDENTIALS = {
  // Gunakan variabel ini di Netlify: VITE_ADMIN_USERNAME & VITE_ADMIN_PASSWORD
  username: getEnv('VITE_ADMIN_USERNAME', 'mentor_admin'),
  password: getEnv('VITE_ADMIN_PASSWORD', 'istiqamah2026'),
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
