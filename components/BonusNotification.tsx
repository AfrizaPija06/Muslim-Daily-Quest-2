import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface BonusNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

const BonusNotification: React.FC<BonusNotificationProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-24 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-950/95 to-black/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-start gap-4 relative overflow-hidden">
        
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent animate-pulse-slow pointer-events-none"></div>

        <div className="bg-emerald-500/20 p-2.5 rounded-xl shrink-0 border border-emerald-500/30">
           <Sparkles className="w-6 h-6 text-emerald-400" />
        </div>
        
        <div className="flex-1 relative z-10">
           <h4 className="text-emerald-100 font-black uppercase tracking-widest text-xs mb-1 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
             BONUS XP TERSEDIA!
           </h4>
           <p className="text-[11px] text-white/80 leading-relaxed font-medium">
             <strong className="text-yellow-400">GUDANG SENJATA RAHASIA TERBUKA!</strong> Misi tambahan (Sunnah & Sosial) kini tersedia. Panen ribuan XP tambahan untuk membantu tim mengalahkan Raid Boss!
           </p>
        </div>
        
        <button 
          onClick={onClose} 
          className="text-white/40 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors shrink-0"
        >
           <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BonusNotification;
