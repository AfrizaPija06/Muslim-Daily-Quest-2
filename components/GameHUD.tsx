
import React from 'react';
import { User, getRankInfo } from '../types';
import { getAvatarSrc } from '../constants';
import { Trophy, Zap, Bell, WifiOff, RotateCw } from 'lucide-react';

interface GameHUDProps {
  currentUser: User;
  totalPoints: number;
  themeStyles: any;
  currentTheme: string;
  isOnline: boolean;
  isSyncing: boolean;
  performSync: () => void;
  openProfile: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ 
  currentUser, totalPoints, themeStyles, currentTheme, 
  isOnline, isSyncing, performSync, openProfile 
}) => {
  // Logic Leveling: Misal 1 Level setiap 1000 poin
  const currentLevel = Math.floor(totalPoints / 1000) + 1;
  const nextLevelExp = currentLevel * 1000;
  const currentLevelExp = totalPoints % 1000;
  const progressPercent = (currentLevelExp / 1000) * 100;
  
  const rank = getRankInfo(totalPoints);
  const isLegends = currentTheme === 'legends';

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 pt-3 pb-2 transition-all duration-300 ${isLegends ? 'bg-gradient-to-b from-[#1a0505] to-transparent' : 'bg-gradient-to-b from-slate-950 to-transparent'}`}>
      <div className="flex items-center justify-between gap-3">
        
        {/* AVATAR & LEVEL */}
        <div className="flex items-center gap-3" onClick={openProfile}>
          <div className="relative group cursor-pointer">
             <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 ${isLegends ? 'border-[#d4af37] shadow-[0_0_10px_#d4af37]' : 'border-emerald-500 shadow-[0_0_10px_#10b981]'} relative z-10 bg-black`}>
               <img src={getAvatarSrc(currentUser.avatarSeed || currentUser.username)} className="w-full h-full object-cover" />
             </div>
             {/* Level Badge */}
             <div className={`absolute -bottom-2 -right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border ${isLegends ? 'bg-[#590d0d] border-[#d4af37] text-[#d4af37]' : 'bg-slate-800 border-emerald-500 text-emerald-400'}`}>
               {currentLevel}
             </div>
          </div>
          
          <div className="flex flex-col">
            <span className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textPrimary} drop-shadow-md`}>
              {currentUser.username}
            </span>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${rank.bg} ${rank.color} w-fit`}>
               <Trophy className="w-3 h-3" /> {rank.name}
            </div>
          </div>
        </div>

        {/* STATUS & CURRENCY */}
        <div className="flex items-center gap-3">
           {/* XP BAR COMPACT */}
           <div className="flex flex-col items-end w-24 md:w-32">
              <div className="flex justify-between w-full text-[9px] font-bold opacity-80 mb-1">
                 <span className={themeStyles.textAccent}>XP</span>
                 <span className={themeStyles.textSecondary}>{currentLevelExp}/{1000}</span>
              </div>
              <div className={`w-full h-1.5 rounded-full ${themeStyles.inputBg} overflow-hidden border ${themeStyles.border}`}>
                 <div className={`h-full ${isLegends ? 'bg-gradient-to-r from-[#8a1c1c] to-[#d4af37]' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`} style={{ width: `${progressPercent}%` }}></div>
              </div>
           </div>

           {/* SYNC BUTTON */}
           <button 
             onClick={performSync}
             className={`p-2 rounded-full border bg-black/40 backdrop-blur-md ${isSyncing ? 'animate-spin' : ''} ${!isOnline ? 'border-red-500 text-red-500' : `${themeStyles.border} ${themeStyles.textSecondary}`}`}
           >
             {isSyncing ? <RotateCw className="w-4 h-4" /> : !isOnline ? <WifiOff className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
           </button>
        </div>

      </div>
    </div>
  );
};

export default GameHUD;
