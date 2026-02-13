
import React from 'react';
import { Home } from 'lucide-react';
import { PrayerState } from '../types';

interface PrayerCellProps {
  state: PrayerState;
  isLocked: boolean;
  onClick: () => void;
  themeStyles: any;
  currentTheme: string;
  label?: string; // e.g. "SUB"
}

// Custom Qubah Mosque Icon
const MosqueIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Base */}
    <path d="M2 19h20" /> 
    <path d="M4 19v-6" />
    <path d="M20 19v-6" />
    
    {/* Dome (Qubah) */}
    <path d="M4 13c0-5 3-9 8-9s8 4 8 9" />
    
    {/* Crescent/Spire on top */}
    <path d="M12 4V2" />
    <path d="M10 2a2 2 0 1 0 4 0" />
    
    {/* Door/Archway */}
    <path d="M10 19v-4a2 2 0 1 1 4 0v4" />
    
    {/* Decorative details */}
    <path d="M6 13h12" opacity="0.5" />
  </svg>
);

const PrayerCell: React.FC<PrayerCellProps> = ({ state, isLocked, onClick, themeStyles, currentTheme, label }) => {

  let bgClass = `${themeStyles.inputBg} border-2 border-dashed ${themeStyles.border} opacity-50`;
  let icon = <div className="w-1.5 h-1.5 rounded-full bg-slate-500/50" />;
  let glowClass = "";
  let textClass = themeStyles.textSecondary;

  if (state === 1) { // Home
    bgClass = 'bg-[#2e1065] border-[#c4b5fd] text-[#c4b5fd]';
    icon = <Home className="w-4 h-4" />;
    glowClass = 'shadow-[0_0_10px_rgba(196,181,253,0.4)]';
    textClass = 'text-[#c4b5fd]';
  } else if (state === 2) { // Mosque
    bgClass = 'bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] border-[#fbbf24] text-[#fbbf24]';
    icon = <MosqueIcon className="w-5 h-5" />;
    glowClass = 'shadow-[0_0_15px_rgba(251,191,36,0.6)]';
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
