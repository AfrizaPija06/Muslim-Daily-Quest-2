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
    <div className={`relative overflow-hidden rounded-3xl border ${themeStyles.border} bg-black/40 backdrop-blur-md p-6 mb-8 group`}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-purple-900/20 to-black/40 animate-pulse-slow"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        
        {/* Boss Icon / Avatar */}
        <div className="relative shrink-0">
           <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-950 to-black border-2 ${isDefeated ? 'border-emerald-500' : 'border-red-500'} shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-hidden relative`}>
              {isDefeated ? (
                <Trophy className="w-10 h-10 md:w-12 md:h-12 text-emerald-400 animate-bounce" />
              ) : (
                <>
                  <img 
                    src={bossAvatarUrl} 
                    alt="Boss" 
                    className="w-full h-full object-cover"
                  />
                  {/* Fallback Icon Overlay if needed, or just rely on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </>
              )}
           </div>
           {!isDefeated && (
             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap border border-red-400">
               Raid Boss
             </div>
           )}
        </div>

        {/* Stats & Progress */}
        <div className="flex-grow w-full">
           <div className="flex justify-between items-end mb-2">
              <div>
                <h3 className={`text-xl md:text-2xl font-black uppercase tracking-widest ${isDefeated ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-2`}>
                   {isDefeated ? "RAID COMPLETE!" : `RAID: ${bossName}`}
                </h3>
                <p className="text-[10px] md:text-xs text-white/50 font-mono uppercase tracking-wider">
                   {isDefeated ? "The target has been destroyed!" : `HP: ${bossHP.toLocaleString()} XP REMAINING`}
                </p>
              </div>
              <div className="text-right">
                 <div className={`text-2xl md:text-3xl font-black ${themeStyles.fontDisplay} ${isDefeated ? 'text-emerald-400' : 'text-white'}`}>
                    {(progress).toFixed(1)}%
                 </div>
              </div>
           </div>

           {/* HP Bar Container */}
           <div className="relative h-6 md:h-8 bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-inner">
              {/* Progress Fill */}
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 ${isDefeated ? 'bg-emerald-600' : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-500'}`}
                style={{ width: `${progress}%` }}
              >
                 {/* Shimmer Effect */}
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-shimmer"></div>
              </div>
              
              {/* Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                 <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white drop-shadow-md">
                    {totalXP.toLocaleString()} / {RAID_TARGET.toLocaleString()} XP
                 </span>
              </div>
           </div>

           {/* Footer Stats */}
           <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <div className="flex items-center gap-1">
                 <Target className="w-3 h-3" /> Target: {RAID_TARGET.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                 <Zap className="w-3 h-3 text-yellow-500" /> Total Damage: {totalXP.toLocaleString()}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityRaid;
