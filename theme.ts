
import { AppTheme } from './types';

export const THEMES = {
  default: {
    id: 'default',
    name: 'Cyber Faith',
    bg: 'bg-[#020617]',
    bgPatternColor: 'text-slate-800',
    fontMain: 'font-sans',
    fontDisplay: 'font-game',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-500',
    textAccent: 'text-emerald-500',
    textGold: 'text-yellow-500',
    card: 'glass-card border-emerald-500/20',
    border: 'border-emerald-500/20',
    buttonPrimary: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    inputBg: 'bg-slate-900/50',
    inputBorder: 'border-slate-700 focus:border-emerald-500',
    progressBar: 'from-emerald-600 via-emerald-400 to-yellow-500',
    activeTab: 'bg-emerald-500 text-slate-900',
    inactiveTab: 'text-slate-500 hover:text-slate-300',
    glow: 'glow-primary',
    icons: {
      trophy: 'text-yellow-500',
      home: 'text-emerald-400',
      mosque: 'text-yellow-400',
    }
  },
  legends: {
    id: 'legends',
    name: 'Mentoring Leveling',
    bg: 'bg-[#0f0404] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3a080e] via-[#1a0305] to-[#000000]',
    bgPatternColor: 'text-[#4a101d]',
    fontMain: 'font-sans',
    fontDisplay: 'font-legends',
    textPrimary: 'text-[#f0e6d2]',
    textSecondary: 'text-[#a68a6d]',
    textAccent: 'text-[#d4af37]',
    textGold: 'text-[#ffdb78]',
    card: 'glass-card border-[#d4af37]/50',
    border: 'border-[#d4af37]/30',
    buttonPrimary: 'bg-gradient-to-r from-[#8a1c1c] to-[#590d0d] border border-[#d4af37] hover:bg-[#a32222] shadow-[0_0_20px_rgba(212,175,55,0.2)] text-[#f0e6d2]',
    inputBg: 'bg-[#1a0505]/80',
    inputBorder: 'border-[#5c4033] focus:border-[#d4af37]',
    progressBar: 'from-[#8a1c1c] via-[#d4af37] to-[#f0e6d2]',
    activeTab: 'bg-gradient-to-b from-[#d4af37] to-[#8a6e3e] text-[#1a0505] border border-[#f0e6d2]',
    inactiveTab: 'text-[#8a6e3e] hover:text-[#d4af37]',
    glow: 'glow-primary',
    icons: {
      trophy: 'text-[#d4af37]',
      home: 'text-[#8a6e3e]',
      mosque: 'text-[#f0e6d2] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]',
    }
  }
};
