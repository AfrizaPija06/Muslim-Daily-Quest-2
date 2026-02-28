import React from 'react';
import { Target, Zap, Trophy } from 'lucide-react';

interface CommunityRaidProps {
  totalXP: number;
  themeStyles: any;
}

const CommunityRaid: React.FC<CommunityRaidProps> = ({ totalXP, themeStyles }) => {
  // Config Target (Bisa dibuat dinamis nanti)
  const RAID_TARGET = 500000; // 500k XP Target
  const progress = Math.min(100, (totalXP / RAID_TARGET) * 100);
  
  // Boss Info
  const bossName = "THE GREAT NAFSU";
  const bossAvatarUrl = "https://res.cloudinary.com/dauvrgbcp/image/upload/v1772177051/Raid_Boss_fmf0o7.png"; // Placeholder Avatar
  const bossHP = Math.max(0, RAID_TARGET - totalXP);
  const isDefeated = totalXP >= RAID_TARGET;

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${themeStyles.border} bg-black/80 backdrop-blur-md mb-8 group shadow-2xl`}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-purple-900/20 to-black animate-pulse-slow pointer-events-none"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center">
        
        {/* Boss Visual - LARGE & PROMINENT */}
        <div className="relative w-full md:w-48 aspect-square md:aspect-auto md:h-full shrink-0 overflow-hidden group">
           {isDefeated ? (
             <div className="w-full h-full flex items-center justify-center bg-emerald-950/50 min-h-[200px]">
                <Trophy className="w-24 h-24 text-emerald-400 animate-bounce drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]" />
             </div>
           ) : (
             <>
               <img 
                 src={bossAvatarUrl} 
                 alt="Boss" 
                 className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
               />
               {/* Gradient Overlay for Text Readability */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/80"></div>
               
               {/* Boss Badge */}
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse">
                 RAID BOSS
               </div>
             </>
           )}
        </div>

        {/* Stats & Progress */}
        <div className="flex-grow w-full p-6 md:p-8 relative">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-2">
              <div>
                <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-widest ${isDefeated ? 'text-emerald-400' : 'text-red-500'} drop-shadow-md leading-none mb-1`}>
                   {isDefeated ? "RAID COMPLETE!" : `RAID: ${bossName}`}
                </h3>
                <p className="text-xs md:text-sm text-white/60 font-mono uppercase tracking-widest">
                   {isDefeated ? "The target has been destroyed!" : `HP: ${bossHP.toLocaleString()} XP REMAINING`}
                </p>
              </div>
              <div className="text-right self-end">
                 <div className={`text-4xl md:text-5xl font-black ${themeStyles.fontDisplay} ${isDefeated ? 'text-emerald-400' : 'text-white'} drop-shadow-lg`}>
                    {(progress).toFixed(1)}%
                 </div>
              </div>
           </div>

           {/* HP Bar Container */}
           <div className="relative h-8 md:h-10 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-inner mb-4">
              {/* Progress Fill */}
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 ${isDefeated ? 'bg-emerald-600' : 'bg-gradient-to-r from-red-600 via-orange-600 to-red-500'}`}
                style={{ width: `${progress}%` }}
              >
                 {/* Shimmer Effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-shimmer"></div>
              </div>
              
              {/* Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                 <span className="text-xs md:text-sm font-black uppercase tracking-widest text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    {totalXP.toLocaleString()} / {RAID_TARGET.toLocaleString()} XP
                 </span>
              </div>
           </div>

           {/* Footer Stats */}
           <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/40">
              <div className="flex items-center gap-2">
                 <Target className="w-4 h-4" /> TARGET: {RAID_TARGET.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-yellow-500/80">
                 <Zap className="w-4 h-4" /> TOTAL DAMAGE: {totalXP.toLocaleString()}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityRaid;
