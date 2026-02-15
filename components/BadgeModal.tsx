
import React, { useEffect, useState } from 'react';
import { Badge, BadgeTier } from '../types';
import { Sparkles, X, Star } from 'lucide-react';

interface BadgeModalProps {
  badge: Badge;
  onClose: () => void;
  themeStyles: any;
}

const TIER_STYLES: Record<BadgeTier, { color: string, bg: string, border: string, shadow: string, aura: string }> = {
  bronze: {
    color: 'text-orange-400',
    bg: 'bg-orange-950/80',
    border: 'border-orange-600',
    shadow: 'shadow-orange-900/50',
    aura: 'from-orange-600/20 via-orange-500/10 to-transparent'
  },
  silver: {
    color: 'text-slate-300',
    bg: 'bg-slate-900/90',
    border: 'border-slate-400',
    shadow: 'shadow-slate-500/50',
    aura: 'from-slate-400/20 via-slate-300/10 to-transparent'
  },
  gold: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/80',
    border: 'border-yellow-500',
    shadow: 'shadow-yellow-500/50',
    aura: 'from-yellow-500/30 via-yellow-400/20 to-transparent'
  },
  emerald: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-500',
    shadow: 'shadow-emerald-500/50',
    aura: 'from-emerald-500/30 via-emerald-400/20 to-transparent'
  },
  mythic: {
    color: 'text-purple-400',
    bg: 'bg-[#1a0b2e]/95',
    border: 'border-purple-500',
    shadow: 'shadow-purple-500/80',
    aura: 'from-purple-600/40 via-fuchsia-500/30 to-transparent'
  }
};

const BadgeModal: React.FC<BadgeModalProps> = ({ badge, onClose, themeStyles }) => {
  const [show, setShow] = useState(false);
  const Icon = badge.icon;
  const style = TIER_STYLES[badge.tier || 'bronze'];

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setShow(true), 50);
  }, []);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div 
         className={`absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
         onClick={onClose}
      />
      
      <div className={`relative w-full max-w-sm transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 translate-y-20 opacity-0'}`}>
         
         {/* Rotating Aura Effect for High Tiers */}
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial ${style.aura} blur-3xl rounded-full ${badge.tier === 'mythic' ? 'animate-spin-slow' : 'opacity-50'}`} />

         <div className={`${themeStyles.card} ${style.bg} p-8 rounded-[2rem] border-2 ${style.border} text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]`}>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
               <X className="w-6 h-6" />
            </button>

            <div className="flex justify-center mb-6 relative z-10">
               <div className={`w-32 h-32 rounded-full border-4 ${style.border} flex items-center justify-center bg-black/50 ${style.shadow} animate-float shadow-2xl relative`}>
                  {/* Particles for Mythic */}
                  {badge.tier === 'mythic' && (
                     <div className="absolute inset-0 rounded-full animate-pulse-glow border-2 border-purple-400/50"></div>
                  )}
                  <Icon className={`w-16 h-16 ${style.color} drop-shadow-[0_0_10px_currentColor]`} />
               </div>
            </div>

            <div className="mb-2 flex items-center justify-center gap-2">
               <Sparkles className={`w-4 h-4 ${style.color} animate-spin-slow`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${style.color}`}>{badge.tier} Badge Unlocked</span>
               <Sparkles className={`w-4 h-4 ${style.color} animate-spin-slow`} />
            </div>

            <h2 className={`text-2xl font-black uppercase mb-2 text-white drop-shadow-md`}>{badge.name}</h2>
            <p className="text-white/60 text-xs mb-6 px-4 leading-relaxed font-medium">{badge.description}</p>

            <div className={`bg-black/30 rounded-xl p-4 border border-white/10 mb-6 relative overflow-hidden`}>
               <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bg.replace('bg-', 'bg-gradient-to-b from-transparent via-')}`}></div>
               <p className="text-[10px] uppercase font-bold text-white/50 mb-1">Rewards Acquired</p>
               <div className="flex items-center justify-center gap-2">
                  <Star className={`w-5 h-5 ${style.color} fill-current`} />
                  <p className={`text-3xl font-black ${style.color}`}>+{badge.bonusXP}</p>
               </div>
            </div>

            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
              style={{ background: `linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` }}
            >
              Collect
            </button>
         </div>
      </div>
    </div>
  );
};

export default BadgeModal;
