
import { Role, WeeklyData, TOTAL_RAMADHAN_DAYS, GlobalAssets, DayData, PrayerState, Character, UserStatus } from './types';

export { HIJRI_YEAR } from './types';

// Placeholder Assets (Supabase project lama sudah tidak aktif, gunakan ini agar tampilan tidak rusak)
export const GAME_LOGO_URL = "https://ui-avatars.com/api/?name=MQ&background=1e1b4b&color=fbbf24&size=512&font-size=0.33&length=2&rounded=true&bold=true";
export const MENTOR_AVATAR_URL = "https://ui-avatars.com/api/?name=Mentor&background=fbbf24&color=000&size=256";

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

// --- CHARACTER ROSTER (7 HEROES) ---
const ASSET_BASE_URL = ""; 

export const AVAILABLE_CHARACTERS: Character[] = [
  {
    id: 'char_fatih',
    name: 'Muhammad Al-Fatih',
    role: 'The Conqueror Leader',
    description: 'Visioner, strategis, berani ambil risiko. Fokus pada misi, bukan gengsi. Menyiapkan kemenangan dengan perencanaan matang.',
    abilities: ['Visionary Command', 'Strategic Strike', 'Iron Will'],
    // MASUKKAN LINK ICON DI SINI (Ganti string kosong atau URL default di bawah)
    imageUrl: `https://ui-avatars.com/api/?name=Al+Fatih&background=ef4444&color=fff&size=256`, 
    color: 'text-red-500'
  },
  {
    id: 'char_salahuddin',
    name: 'Salahuddin Al-Ayyubi',
    role: 'The Noble Warrior',
    description: 'Ksatria, sabar, berintegritas tinggi. Menang tanpa kehilangan akhlak. Kuat tapi tetap rendah hati.',
    abilities: ['Noble Heart', 'Integrity', 'Resilience'],
    // MASUKKAN LINK ICON DI SINI
    imageUrl: `https://ui-avatars.com/api/?name=Salahuddin&background=f59e0b&color=fff&size=256`,
    color: 'text-amber-500'
  },
  {
    id: 'char_umar',
    name: 'Umar bin Khattab',
    role: 'The Justice Commander',
    description: 'Tegas, adil, berani terhadap kebenaran. Anti kompromi terhadap kezaliman. Kepemimpinan berbasis keadilan.',
    abilities: ['Absolute Justice', 'Unwavering Force', 'Discipline'],
    // MASUKKAN LINK ICON DI SINI
    imageUrl: `https://ui-avatars.com/api/?name=Umar&background=10b981&color=fff&size=256`,
    color: 'text-emerald-500'
  },
  {
    id: 'char_ali',
    name: 'Ali bin Abi Thalib',
    role: 'The Wise Knight',
    description: 'Cerdas, dalam ilmunya, berani di medan ujian. Ilmu sebelum aksi. Ketegasan dibarengi hikmah.',
    abilities: ['Blade of Wisdom', 'Knowledge Shield', 'Valor'],
    // MASUKKAN LINK ICON DI SINI
    imageUrl: `https://ui-avatars.com/api/?name=Ali&background=3b82f6&color=fff&size=256`,
    color: 'text-blue-500'
  },
  {
    id: 'char_syafii',
    name: "Imam Syafi'i",
    role: 'The Master Scholar',
    description: 'Tajam berpikir, sistematis, rendah hati. Kuat dalam dasar ilmu. Berpikir logis dan terstruktur.',
    abilities: ['Logical Flow', 'Scholar Mind', 'Argumentation'],
    // MASUKKAN LINK ICON DI SINI
    imageUrl: `https://ui-avatars.com/api/?name=Imam+Syafii&background=06b6d4&color=fff&size=256`,
    color: 'text-cyan-500'
  },
  {
    id: 'char_hasan',
    name: 'Hasan Al-Basri',
    role: 'The Spiritual Sage',
    description: 'Zuhud, reflektif, lembut namun tegas. Kekuatan lahir dari hati yang bersih. Dunia bukan tujuan akhir.',
    abilities: ['Inner Peace', 'Heart Purification', 'Reflection'],
    // MASUKKAN LINK ICON DI SINI
    imageUrl: `https://ui-avatars.com/api/?name=Hasan+Basri&background=8b5cf6&color=fff&size=256`,
    color: 'text-violet-400'
  },
  {
    id: 'char_khwarizmi',
    name: 'Al-Khwarizmi',
    role: 'The Innovation Architect',
    description: 'Analitis, solutif, pencipta sistem. Mengubah masalah jadi formula. Meninggalkan legacy keilmuan.',
    abilities: ['Algorithm', 'Problem Solving', 'System Design'],
    // MASUKKAN LINK ICON DI SINI
    imageUrl: `https://ui-avatars.com/api/?name=Al+Khwarizmi&background=6366f1&color=fff&size=256`,
    color: 'text-indigo-500'
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
  // Fallback if local asset is missing
  return `https://ui-avatars.com/api/?name=${assetKey.replace('.png','')}&background=333&color=fbbf24&rounded=true`;
};
