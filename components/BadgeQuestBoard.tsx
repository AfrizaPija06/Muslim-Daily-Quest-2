
import React, { useState } from 'react';
import { BADGES } from '../constants';
import { BadgeTier } from '../types';
import { X, Lock, CheckCircle2, Star, Filter, HelpCircle } from 'lucide-react';

interface BadgeQuestBoardProps {
  unlockedBadges: string[];
  onClose: () => void;
  themeStyles: any;
}

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: 'text-orange-400 border-orange-500/50 bg-orange-950/20',
  silver: 'text-slate-300 border-slate-400/50 bg-slate-900/20',
  gold: 'text-yellow-400 border-yellow-500/50 bg-yellow-950/20',
  emerald: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/20',
  mythic: 'text-purple-400 border-purple-500/50 bg-purple-950/20'
};

const BadgeQuestBoard: React.FC<BadgeQuestBoardProps> = ({ unlockedBadges, onClose, themeStyles }) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filteredBadges = BADGES.filter(badge => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  // Sort: Unlocked first, then by Tier value (custom logic), then by ID
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    const aUnlocked = unlockedBadges.includes(a.id);
    const bUnlocked = unlockedBadges.includes(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className={`w-full max-w-4xl h-[85vh] ${themeStyles.card} rounded-[2rem] border border-white/10 flex flex-col overflow-hidden relative shadow-2xl animate-in zoom-in-95`}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
          <div>
            <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold uppercase tracking-wider text-white flex items-center gap-3`}>
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> 
              Quest Board
            </h2>
            <p className="text-xs text-white/50 font-mono mt-1">Complete achievements to earn Bonus XP</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/70" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 flex gap-2 overflow-x-auto border-b border-white/5 bg-black/20">
          <Filter className="w-4 h-4 text-white/30 mr-2" />
          {(['all', 'unlocked', 'locked'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-white text-black' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto text-xs font-mono text-white/30 self-center">
            {unlockedBadges.length} / {BADGES.length} Unlocked
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
          {sortedBadges.map(badge => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const style = TIER_COLORS[badge.tier || 'bronze'];
            const Icon = badge.icon;
            
            // Secret Logic: If locked AND secret, hide details
            const isHidden = !isUnlocked && badge.secret;

            return (
              <div 
                key={badge.id} 
                className={`relative group rounded-2xl p-4 border transition-all duration-300 flex gap-4 items-start ${
                  isUnlocked 
                    ? `${style} border-opacity-50 bg-opacity-30` 
                    : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Icon Box */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
                  isUnlocked 
                    ? `${style.split(' ')[1]} bg-black/40` 
                    : 'border-white/10 bg-black/40'
                }`}>
                  {isHidden ? (
                    <HelpCircle className="w-6 h-6 text-white/20" />
                  ) : (
                    <Icon className={`w-7 h-7 ${isUnlocked ? style.split(' ')[0] : 'text-white/30'}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold uppercase truncate pr-2 ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                      {isHidden ? '???' : badge.name}
                    </h3>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-white/20 shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-[10px] leading-tight text-white/60 mb-3 line-clamp-2 h-8">
                    {isHidden ? 'This achievement is hidden until unlocked.' : badge.description}
                  </p>

                  {/* Footer: Tier & XP */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-auto">
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/30 ${style.split(' ')[0]}`}>
                      {badge.tier}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className={`w-3 h-3 ${isUnlocked ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} />
                      <span className={`text-xs font-bold ${isUnlocked ? 'text-yellow-400' : 'text-white/40'}`}>
                        +{badge.bonusXP} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shine Effect for Unlocked */}
                {isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default BadgeQuestBoard;
