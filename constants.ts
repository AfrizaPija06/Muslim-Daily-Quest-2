
import { Role, WeeklyData, TOTAL_RAMADHAN_DAYS, GlobalAssets, DayData, PrayerState, Character, UserStatus } from './types';

export { HIJRI_YEAR } from './types';

// Placeholder Assets (Supabase project lama sudah tidak aktif, gunakan ini agar tampilan tidak rusak)
export const GAME_LOGO_URL = "https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126254/ChatGPT_Image_Feb_13_2026_06_01_59_PM_euchno.png";
export const MENTOR_AVATAR_URL = "https://ui-avatars.com/api/?name=Mentor&background=fbbf24&color=000&size=256";

// SETTING TANGGAL 1 RAMADHAN 1447 H (ESTIMASI: 18 FEBRUARI 2026)
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
  status: 'active' as UserStatus
};

// --- CHARACTER ROSTER (7 HEROES) ---
// TUGAS ANDA: Ganti 'imageUrl' dengan link asli dari Cloudinary Anda.
export const AVAILABLE_CHARACTERS: Character[] = [
  {
    id: 'char_fatih',
    name: 'Muhammad Al-Fatih',
    role: 'The Conqueror',
    description: 'Visioner, strategis, berani ambil risiko. Fokus pada misi, bukan gengsi. Menyiapkan kemenangan dengan perencanaan matang.',
    abilities: ['Visionary Command', 'Strategic Strike', 'Iron Will'],
    // CONTOH: imageUrl: 'https://res.cloudinary.com/akunku/image/upload/v1/heroes/alfatih.jpg',
    imageUrl: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126218/alfatih_cnuanv.png', 
    color: 'text-red-500'
  },
  {
    id: 'char_salahuddin',
    name: 'Salahuddin Al-Ayyubi',
    role: 'The Noble Warrior',
    description: 'Ksatria, sabar, berintegritas tinggi. Menang tanpa kehilangan akhlak. Kuat tapi tetap rendah hati.',
    abilities: ['Noble Heart', 'Integrity', 'Resilience'],
    imageUrl: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126218/salahuddin_cm6pxd.png',
    color: 'text-amber-500'
  },
  {
    id: 'char_umar',
    name: 'Umar bin Khattab',
    role: 'The Justice Commander',
    description: 'Tegas, adil, berani terhadap kebenaran. Anti kompromi terhadap kezaliman. Kepemimpinan berbasis keadilan.',
    abilities: ['Absolute Justice', 'Unwavering Force', 'Discipline'],
    imageUrl: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126219/umar_kjbuhz.png',
    color: 'text-emerald-500'
  },
  {
    id: 'char_ali',
    name: 'Ali bin Abi Thalib',
    role: 'The Wise Knight',
    description: 'Cerdas, dalam ilmunya, berani di medan ujian. Ilmu sebelum aksi. Ketegasan dibarengi hikmah.',
    abilities: ['Blade of Wisdom', 'Knowledge Shield', 'Valor'],
    imageUrl: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126218/Ali_bin_Abi_Thalib_zcvauf.png',
    color: 'text-blue-500'
  },
  {
    id: 'char_syafii',
    name: "Imam Syafi'i",
    role: 'The Master Scholar',
    description: 'Tajam berpikir, sistematis, rendah hati. Kuat dalam dasar ilmu. Berpikir logis dan terstruktur.',
    abilities: ['Logical Flow', 'Scholar Mind', 'Argumentation'],
    imageUrl: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126218/syafii_wq4dmy.png',
    color: 'text-cyan-500'
  },
  {
    id: 'char_hasan',
    name: 'Hasan Al-Basri',
    role: 'The Spiritual Sage',
    description: 'Zuhud, reflektif, lembut namun tegas. Kekuatan lahir dari hati yang bersih. Dunia bukan tujuan akhir.',
    abilities: ['Inner Peace', 'Heart Purification', 'Reflection'],
    imageUrl: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126218/hasanbasri_nx4490.png',
    color: 'text-violet-400'
  },
  {
    id: 'char_khwarizmi',
    name: 'Al-Khwarizmi',
    role: 'The Innovation Architect',
    description: 'Analitis, solutif, pencipta sistem. Mengubah masalah jadi formula. Meninggalkan legacy keilmuan.',
    abilities: ['Algorithm', 'Problem Solving', 'System Design'],
    imageUrl: 'https://res.cloudinary.com/dauvrgbcp/image/upload/v1771126218/alkhwarizmi_quscvg.png',
    color: 'text-indigo-500'
  }
];

// Generate 30 Days of Quest
const generateRamadhanDays = (): DayData[] => {
  return Array.from({ length: TOTAL_RAMADHAN_DAYS }, (_, i) => {
    return {
      id: i,
      dayName: `${i + 1} Ramadhan`, 
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

// Helper Avatar
export const getAvatarSrc = (seedOrUrl?: string, assets?: any) => {
  if (!seedOrUrl) return `${DEFAULT_AVATAR_BASE}User`;
  
  // Jika path dimulai dengan 'http' (link Cloudinary/luar), gunakan langsung
  if (seedOrUrl.startsWith('http') || seedOrUrl.startsWith('/')) {
    return seedOrUrl;
  }
  return `${DEFAULT_AVATAR_BASE}${seedOrUrl}`;
};

// Helper Rank Icon
export const getRankIconUrl = (assetKey: string | undefined) => {
  if (!assetKey) return "";
  
  // Jika path dimulai dengan 'http' (link Cloudinary/luar), gunakan langsung
  if (assetKey.startsWith('http') || assetKey.startsWith('/')) {
    return assetKey;
  }
  
  // Fallback ke UI Avatar jika file tidak ditemukan
  return `https://ui-avatars.com/api/?name=${assetKey}&background=333&color=fbbf24&rounded=true`;
};
