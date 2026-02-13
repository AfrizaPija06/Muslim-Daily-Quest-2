import { Role, WeeklyData, TOTAL_RAMADHAN_DAYS, GlobalAssets, DayData, PrayerState, Character, UserStatus } from './types';

export { HIJRI_YEAR } from './types';

export const GAME_LOGO_URL = "https://fymoxcdhskimzxpljjgi.supabase.co/storage/v1/object/public/assets/gamelogo.png";
export const MENTOR_AVATAR_URL = "https://fymoxcdhskimzxpljjgi.supabase.co/storage/v1/object/public/assets/Mentor.png";

// SETTING TANGGAL 1 RAMADHAN 1447 H (ESTIMASI: 18 FEBRUARI 2026)
// Ubah tanggal ini jika ada penetapan sidang isbat berbeda.
export const RAMADHAN_START_DATE = new Date('2026-02-18T00:00:00'); 

export const TARGET_TILAWAH_DAILY = 75; // Target Tilawah harian

export const ADMIN_CREDENTIALS = {
  username: 'mentor_admin',
  password: 'istiqamah2026',
  fullName: 'Kak Afriza',
  group: 'Mentoring Legends #kelas7ikhwan',
  role: 'mentor' as Role,
  avatarSeed: MENTOR_AVATAR_URL,
  characterId: 'mentor_prime',
  status: 'active' as UserStatus // Ensure admin is active for leaderboard
};

// --- CHARACTER ROSTER ---
// NOTE FOR USER: Upload images to your Supabase bucket 'assets' with these exact names.
// Or change these URLs to wherever you host your images.
const ASSET_BASE_URL = "https://fymoxcdhskimzxpljjgi.supabase.co/storage/v1/object/public/assets";

export const AVAILABLE_CHARACTERS: Character[] = [
  {
    id: 'char_1',
    name: 'Al-Fatih',
    role: 'Vanguard',
    description: 'Pemimpin tangguh yang membuka jalan kemenangan dengan keteguhan hati.',
    abilities: ['Iron Will', 'Strategic Mind', 'Leader Aura'],
    imageUrl: `${ASSET_BASE_URL}/hero_1.png`, 
    color: 'text-red-400'
  },
  {
    id: 'char_2',
    name: 'Ibnu Batuta',
    role: 'Explorer',
    description: 'Penjelajah ilmu yang tidak kenal lelah mencari hikmah di setiap langkah.',
    abilities: ['Swift Step', 'Map Reading', 'Endurance'],
    imageUrl: `${ASSET_BASE_URL}/hero_2.png`,
    color: 'text-emerald-400'
  },
  {
    id: 'char_3',
    name: 'Zaid bin Tsabit',
    role: 'Scribe',
    description: 'Penjaga wahyu yang teliti, menghafal dan mencatat kebaikan.',
    abilities: ['Focus', 'Memory Palace', 'Ink Flow'],
    imageUrl: `${ASSET_BASE_URL}/hero_3.png`,
    color: 'text-blue-400'
  },
  {
    id: 'char_4',
    name: 'Khalid',
    role: 'Warrior',
    description: 'Pedang Allah yang tak terkalahkan, maju paling depan dalam kebaikan.',
    abilities: ['Valor', 'Tactics', 'Speed'],
    imageUrl: `${ASSET_BASE_URL}/hero_4.png`,
    color: 'text-amber-400'
  },
  {
    id: 'char_5',
    name: 'Aisyah',
    role: 'Scholar',
    description: 'Cerdas dan berwawasan luas, menjadi rujukan bagi para pencari ilmu.',
    abilities: ['Wisdom', 'Teaching', 'Hadith Logic'],
    imageUrl: `${ASSET_BASE_URL}/hero_5.png`,
    color: 'text-purple-400'
  }
];

// Generate 30 Days of Quest
const generateRamadhanDays = (): DayData[] => {
  return Array.from({ length: TOTAL_RAMADHAN_DAYS }, (_, i) => {
    return {
      id: i,
      dayName: `${i + 1} Ramadhan`, // Generic name, styling handled in component
      prayers: { 
        subuh: 0 as PrayerState, 
        zuhur: 0 as PrayerState, 
        asar: 0 as PrayerState, 
        magrib: 0 as PrayerState, 
        isya: 0 as PrayerState 
      },
      tilawah: 0,
      shaum: false,
      tarawih: false
    };
  });
};

export const INITIAL_DATA: WeeklyData = {
  days: generateRamadhanDays(),
  lastUpdated: new Date().toISOString()
};

const DEFAULT_AVATAR_BASE = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&size=128&name=";

export const getAvatarSrc = (seedOrUrl?: string, assets?: any) => {
  if (!seedOrUrl) return `${DEFAULT_AVATAR_BASE}User`;
  if (seedOrUrl.startsWith('http')) {
    return seedOrUrl;
  }
  return `${DEFAULT_AVATAR_BASE}${seedOrUrl}`;
};

// Helper to get Rank Icon
// Supports full URLs (http...) or keys relative to ASSET_BASE_URL
export const getRankIconUrl = (assetKey: string | undefined) => {
  if (!assetKey) return "";
  if (assetKey.startsWith('http')) return assetKey;
  return `${ASSET_BASE_URL}/${assetKey}`;
};