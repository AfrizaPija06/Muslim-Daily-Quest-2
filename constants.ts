
import { Role, WeeklyData, DAYS_OF_WEEK, GlobalAssets } from './types';

export const GAME_LOGO_URL = "https://fymoxcdhskimzxpljjgi.supabase.co/storage/v1/object/public/assets/gamelogo.png";
export const MENTOR_AVATAR_URL = "https://fymoxcdhskimzxpljjgi.supabase.co/storage/v1/object/public/assets/Mentor.png";

export const ADMIN_CREDENTIALS = {
  username: 'mentor_admin',
  password: 'istiqamah2026',
  fullName: 'Kak Afriza',
  group: 'Mentoring Legends #kelas7ikhwan',
  role: 'mentor' as Role,
  avatarSeed: MENTOR_AVATAR_URL
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

export const MENTORING_GROUPS = [
  'Mentoring Legends #kelas7ikhwan'
];

const DEFAULT_AVATAR_BASE = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=128&name=";

// Simplified Logic: Jika URL valid, pakai. Jika tidak, pakai inisial.
export const getAvatarSrc = (seedOrUrl?: string, assets?: any) => {
  if (!seedOrUrl) return `${DEFAULT_AVATAR_BASE}User`;

  // Jika URL Supabase Storage atau Link external
  if (seedOrUrl.startsWith('http')) {
    return seedOrUrl;
  }
  
  return `${DEFAULT_AVATAR_BASE}${seedOrUrl}`;
};
