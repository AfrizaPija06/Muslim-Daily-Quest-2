import React from 'react';
import { Target, Zap, Gift, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface CommunityRaidProps {
  totalXP: number;
  themeStyles: any;
  onClaimReward?: () => void;
  hasClaimedReward?: boolean;
  currentDayIndex: number;
}

const CommunityRaid: React.FC<CommunityRaidProps> = ({ totalXP, themeStyles, onClaimReward, hasClaimedReward, currentDayIndex }) => {
  // Config Target (Bisa dibuat dinamis nanti)
  const RAID_TARGET = 300000; // Adjusted from 500k based on community performance
  const progress = Math.min(100, (totalXP / RAID_TARGET) * 100);
  const hpPercent = 100 - progress;
  
  // Boss Info
  const bossName = "THE GREAT NAFSU";
  const bossHP = Math.max(0, RAID_TARGET - totalXP);
  const isDefeated = totalXP >= RAID_TARGET;

  // Deadline Calculation (Phase 2 ends on Day 20)
  const PHASE_2_END_DAY = 20;
  const currentDay = currentDayIndex + 1;
  const daysRemaining = Math.max(0, PHASE_2_END_DAY - currentDay);
  const isUrgent = daysRemaining <= 3;

  // Dynamic Boss Image Logic
  let bossAvatarUrl = "https://res.cloudinary.com/dauvrgbcp/image/upload/v1772177051/Raid_Boss_fmf0o7.png"; // Default (100-50%)
  let bossPhase = "PHASE 1";
  let imageStyle = "";

  if (hpPercent < 30 && !isDefeated) {
     bossAvatarUrl = "https://res.cloudinary.com/dauvrgbcp/image/upload/v1772436406/Boss_Raid_30_z0oucl.png"; 
     bossPhase = "FINAL PHASE";
     imageStyle = "animate-pulse sepia hue-rotate-[-50deg] saturate-200"; 
  } else if (hpPercent < 50 && !isDefeated) {
     bossAvatarUrl = "https://res.cloudinary.com/dauvrgbcp/image/upload/v1772436406/Boss_Raid_50_mtxc5c.png";
     bossPhase = "PHASE 2";
     imageStyle = "grayscale contrast-125";
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${themeStyles.border} bg-black/80 backdrop-blur-md mb-8 group shadow-2xl`}>
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDefeated ? 'from-emerald-900/40 via-blue-900/20' : 'from-red-900/40 via-purple-900/20'} to-black animate-pulse-slow pointer-events-none`}></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center">
        
        {/* Boss Visual - LARGE & PROMINENT */}
        <div className="relative w-full md:w-48 aspect-square md:aspect-auto md:h-full shrink-0 overflow-hidden group">
           {isDefeated ? (
             <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-950/80 min-h-[200px] p-4 text-center relative overflow-hidden">
                
                {/* Cool Background Effects */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Rotating Sunburst / Light Rays */}
                    <div className="absolute w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.3)_20deg,transparent_40deg,rgba(16,185,129,0.3)_60deg,transparent_80deg,rgba(16,185,129,0.3)_100deg,transparent_120deg,rgba(16,185,129,0.3)_140deg,transparent_160deg,rgba(16,185,129,0.3)_180deg,transparent_200deg,rgba(16,185,129,0.3)_220deg,transparent_240deg,rgba(16,185,129,0.3)_260deg,transparent_280deg,rgba(16,185,129,0.3)_300deg,transparent_320deg,rgba(16,185,129,0.3)_340deg,transparent_360deg)] animate-[spin_10s_linear_infinite] opacity-50"></div>
                    
                    {/* Glowing Core */}
                    <div className="absolute w-32 h-32 bg-emerald-400/40 blur-[60px] rounded-full animate-pulse"></div>
                    
                    {/* Floating Particles (CSS only simulation) */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
                </div>

                {/* Trophy Image Placeholder */}
                <div className="relative z-10 animate-[bounce_3s_infinite]">
                    <img 
                        src="https://res.cloudinary.com/dauvrgbcp/image/upload/v1772436414/Trophy_Boss_Raid_cbiscz.png" 
                        alt="Victory Trophy" 
                        className="w-28 h-28 object-contain drop-shadow-[0_0_25px_rgba(250,204,21,0.6)] filter brightness-110"
                    />
                </div>
                
                <p className="relative z-10 text-xs uppercase font-black tracking-[0.3em] text-emerald-100 mt-2 drop-shadow-lg bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm">
                    Victory!
                </p>
             </div>
           ) : (
             <>
               <img 
                 src={bossAvatarUrl} 
                 alt="Boss" 
                 className={`w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110 ${imageStyle}`}
               />
               {/* Gradient Overlay for Text Readability */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/80"></div>
               
               {/* Boss Badge */}
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse">
                 {bossPhase}
               </div>
             </>
           )}
        </div>

        {/* Stats & Progress */}
        <div className="flex-grow w-full p-6 md:p-8 relative">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-2">
              <div>
                <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-widest ${isDefeated ? 'text-emerald-400' : 'text-red-500'} drop-shadow-md leading-none mb-1`}>
                   {isDefeated ? "COMMUNITY VICTORY!" : `RAID: ${bossName}`}
                </h3>
                <div className="flex flex-col gap-1">
                    <p className="text-xs md:text-sm text-white/60 font-mono uppercase tracking-widest">
                    {isDefeated ? "The Great Nafsu has been defeated!" : `HP: ${bossHP.toLocaleString()} XP REMAINING`}
                    </p>
                    
                    {/* DEADLINE INDICATOR */}
                    {!isDefeated && (
                        <div className={`flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest ${isUrgent ? 'text-red-400 animate-pulse' : 'text-orange-400'}`}>
                            {isUrgent ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>Ends in: {daysRemaining} Days (Phase 2)</span>
                        </div>
                    )}
                </div>
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

           {/* Footer Stats OR Claim Button */}
           {isDefeated ? (
              <div className="mt-4 animate-in slide-in-from-bottom-2">
                 {hasClaimedReward ? (
                    <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
                       <CheckCircle className="w-4 h-4" /> Reward Claimed
                    </div>
                 ) : (
                    <button 
                      onClick={onClaimReward}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    >
                       <Gift className="w-4 h-4" /> Claim Victory Reward (+1000 XP)
                    </button>
                 )}
              </div>
           ) : (
             <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/40">
                <div className="flex items-center gap-2">
                   <Target className="w-4 h-4" /> TARGET: {RAID_TARGET.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-yellow-500/80">
                   <Zap className="w-4 h-4" /> TOTAL DAMAGE: {totalXP.toLocaleString()}
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default CommunityRaid;
