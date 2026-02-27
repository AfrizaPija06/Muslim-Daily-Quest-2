
import React from 'react';
import { User, getRankInfo } from '../types';
import { getAvatarSrc } from '../constants';
import { Trophy, WifiOff, RotateCw, Scroll, FileText } from 'lucide-react';

interface GameHUDProps {
  currentUser: User;
  totalPoints: number;
  themeStyles: any;
  currentTheme: string;
  isOnline: boolean;
  isSyncing: boolean;
  performSync: () => void;
  openProfile: () => void;
  openQuestBoard: () => void;
  openAshraReport: () => void;
  hasNewAshraReport?: boolean;
}

const GameHUD: React.FC<GameHUDProps> = ({ 
  currentUser, totalPoints, themeStyles, 
  isOnline, isSyncing, performSync, openProfile, openQuestBoard, openAshraReport,
  hasNewAshraReport
}) => {
  // Logic Leveling: Misal 1 Level setiap 1000 poin
  const currentLevel = Math.floor(totalPoints / 1000) + 1;
  const currentLevelExp = totalPoints % 1000;
  const progressPercent = (currentLevelExp / 1000) * 100;
  
  const rank = getRankInfo(totalPoints);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 pt-3 pb-2 transition-all duration-300 bg-gradient-to-b from-[#0f0518] to-transparent`}>
      <div className="flex items-center justify-between gap-3">
        
        {/* AVATAR & LEVEL */}
        <div className="flex items-center gap-3" onClick={openProfile}>
          <div className="relative group cursor-pointer">
             <div className={`w-12 h-12 rounded-xl overflow-hidden border-2 border-[#fbbf24] shadow-[0_0_10px_#fbbf24] relative z-10 bg-black`}>
               <img src={getAvatarSrc(currentUser.avatarSeed || currentUser.username)} className="w-full h-full object-cover" />
             </div>
             {/* Level Badge */}
             <div className={`absolute -bottom-2 -right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border bg-[#4c1d95] border-[#fbbf24] text-[#fbbf24]`}>
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
                 <div className={`h-full bg-gradient-to-r from-[#7c3aed] to-[#fbbf24]`} style={{ width: `${progressPercent}%` }}></div>
              </div>
           </div>

           {/* QUEST BOARD BUTTON */}
           <button 
             onClick={openQuestBoard}
             className={`p-2 rounded-full border bg-black/40 backdrop-blur-md ${themeStyles.border} ${themeStyles.textAccent} hover:bg-white/10 transition-colors`}
             title="Quest Board"
           >
             <Scroll className="w-4 h-4" />
           </button>

           {/* ASHRA REPORT BUTTON (DEBUG/MANUAL) */}
           <button 
             onClick={openAshraReport}
             className={`relative p-2 rounded-full border bg-black/40 backdrop-blur-md ${themeStyles.border} text-emerald-400 hover:bg-white/10 transition-colors`}
             title="Ashra Report (Evaluasi)"
           >
             <FileText className="w-4 h-4" />
             {hasNewAshraReport && (
               <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] border border-black"></span>
             )}
           </button>

           {/* SYNC BUTTON */}
           <button 
             onClick={performSync}
             className={`p-2 rounded-full border bg-black/40 backdrop-blur-md ${isSyncing ? 'animate-spin' : ''} ${!isOnline ? 'border-purple-500 text-purple-400' : `${themeStyles.border} ${themeStyles.textSecondary}`}`}
           >
             {isSyncing ? <RotateCw className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
           </button>
        </div>

      </div>
    </div>
  );
};

export default GameHUD;