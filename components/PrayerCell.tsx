
import React from 'react';
import { Home, MapPin } from 'lucide-react';
import { PrayerState } from '../types';

interface PrayerCellProps {
  state: PrayerState;
  isLocked: boolean;
  onClick: () => void;
  themeStyles: any;
  currentTheme: string;
  label?: string; // e.g. "SUB"
}

// Masjid Icon custom
const MosqueIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3a5 5 0 0 0-5 5v3H4v8h16v-8h-3V8a5 5 0 0 0-5-5z" />
    <path d="M12 2v1" />
  </svg>
);

const PrayerCell: React.FC<PrayerCellProps> = ({ state, isLocked, onClick, themeStyles, currentTheme, label }) => {
  const isLegends = currentTheme === 'legends';

  let bgClass = `${themeStyles.inputBg} border-2 border-dashed ${themeStyles.border} opacity-50`;
  let icon = <div className="w-1.5 h-1.5 rounded-full bg-slate-500/50" />;
  let glowClass = "";
  let textClass = themeStyles.textSecondary;

  if (state === 1) { // Home
    bgClass = isLegends 
      ? 'bg-[#3a080e] border-[#d4af37] text-[#d4af37]' 
      : 'bg-emerald-950/50 border-emerald-500 text-emerald-400';
    icon = <Home className="w-4 h-4" />;
    glowClass = isLegends ? 'shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'shadow-[0_0_10px_rgba(16,185,129,0.4)]';
    textClass = isLegends ? 'text-[#d4af37]' : 'text-emerald-400';
  } else if (state === 2) { // Mosque
    bgClass = isLegends 
      ? 'bg-gradient-to-br from-[#8a1c1c] to-[#590d0d] border-[#ffdb78] text-[#ffdb78]' 
      : 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-white text-white';
    icon = <MosqueIcon className="w-4 h-4" />;
    glowClass = isLegends ? 'shadow-[0_0_15px_rgba(255,219,120,0.6)]' : 'shadow-[0_0_15px_rgba(16,185,129,0.8)]';
    textClass = 'text-white';
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button 
        onClick={onClick}
        className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 group ${bgClass} ${glowClass}`}
      >
        {state > 0 && (
          <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity animate-pulse"></div>
        )}
        {icon}
      </button>
      {label && <span className={`text-[9px] font-black uppercase tracking-wider ${textClass}`}>{label}</span>}
    </div>
  );
};

export default PrayerCell;
