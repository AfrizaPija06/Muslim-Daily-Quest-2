
import React, { useEffect, useState } from 'react';
import { Badge } from '../types';
import { Sparkles, CheckCircle2, X } from 'lucide-react';

interface BadgeModalProps {
  badge: Badge;
  onClose: () => void;
  themeStyles: any;
}

const BadgeModal: React.FC<BadgeModalProps> = ({ badge, onClose, themeStyles }) => {
  const [show, setShow] = useState(false);
  const Icon = badge.icon;

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setShow(true), 50);
  }, []);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div 
         className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
         onClick={onClose}
      />
      
      <div className={`relative w-full max-w-sm transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 translate-y-20 opacity-0'}`}>
         
         {/* Glow Effect */}
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 ${badge.color.replace('text-', 'bg-').replace('border-', 'bg-')} opacity-30 blur-[80px] rounded-full animate-pulse`} />

         <div className={`${themeStyles.card} p-8 rounded-[2rem] border-2 ${badge.color.split(' ')[1]} text-center relative overflow-hidden shadow-2xl`}>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
               <X className="w-6 h-6" />
            </button>

            <div className="flex justify-center mb-6 relative z-10">
               <div className={`w-32 h-32 rounded-full border-4 ${badge.color} flex items-center justify-center bg-black/50 shadow-[0_0_30px_currentColor] animate-float`}>
                  <Icon className={`w-16 h-16 ${badge.color.split(' ')[0]}`} />
               </div>
            </div>

            <div className="mb-2 flex items-center justify-center gap-2">
               <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow" />
               <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Badge Unlocked</span>
               <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow" />
            </div>

            <h2 className={`text-2xl font-black uppercase mb-2 text-white`}>{badge.name}</h2>
            <p className="text-white/60 text-xs mb-6 px-4 leading-relaxed">{badge.description}</p>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
               <p className="text-[10px] uppercase font-bold text-white/50 mb-1">Rewards</p>
               <p className="text-2xl font-black text-emerald-400">+{badge.bonusXP} XP</p>
            </div>

            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest ${themeStyles.buttonPrimary} shadow-lg`}
            >
              Collect
            </button>
         </div>
      </div>
    </div>
  );
};

export default BadgeModal;
