
import React from 'react';
import { Home, Church } from 'lucide-react';
import { PrayerState } from '../types';

interface PrayerCellProps {
  state: PrayerState;
  isLocked: boolean;
  onClick: () => void;
  themeStyles: any;
  currentTheme: string;
}

const PrayerCell: React.FC<PrayerCellProps> = ({ state, isLocked, onClick, themeStyles, currentTheme }) => {
  const bgClass = isLocked 
    ? `${themeStyles.inputBg} opacity-40` 
    : state === 1 
      ? (currentTheme === 'legends' ? 'bg-[#3a080e] border-[#d4af37]/50' : 'bg-emerald-950 border-emerald-500/50') 
      : state === 2 
        ? (currentTheme === 'legends' ? 'bg-[#590d0d] border-[#f0e6d2]' : 'bg-yellow-950 border-yellow-500/50') 
        : `${themeStyles.inputBg} ${themeStyles.border}`;

  return (
    <button onClick={onClick} className={`w-12 h-12 mx-auto rounded-xl border flex items-center justify-center transition-all relative overflow-hidden group ${bgClass}`}>
      {state === 1 ? <Home className={`w-5 h-5 ${themeStyles.icons.home}`} /> : state === 2 ? <Church className={`w-5 h-5 ${themeStyles.icons.mosque}`} /> : <div className="w-2 h-2 rounded-full bg-slate-700/50" />}
      
      {/* Shine effect for Legends theme */}
      {currentTheme === 'legends' && state > 0 && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </button>
  );
};

export default PrayerCell;
