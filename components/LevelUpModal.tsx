
import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { getRankIconUrl } from '../constants';

interface LevelUpModalProps {
  newRank: any;
  onClose: () => void;
  themeStyles: any;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ newRank, onClose, themeStyles }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation frame
    setTimeout(() => setShow(true), 100);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
       {/* Backdrop Blur */}
       <div 
         className={`absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
         onClick={onClose}
       ></div>

       {/* Main Card */}
       <div className={`relative w-full max-w-sm transform transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 translate-y-20 opacity-0'}`}>
          
          {/* Burst Effect Behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#fbbf24]/0 via-[#fbbf24]/20 to-[#fbbf24]/0 animate-spin-slow rounded-full pointer-events-none blur-3xl"></div>
          
          <div className={`${themeStyles.card} p-8 rounded-[2rem] border-2 border-[#fbbf24] text-center relative overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.3)]`}>
              
              <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                <X className="w-6 h-6" />
              </button>

              <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/20 border border-[#fbbf24] text-[#fbbf24] text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Sparkles className="w-3 h-3" /> Rank Promoted
              </div>

              <div className="my-8 relative">
                 <div className="w-40 h-40 mx-auto drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-float">
                    <img 
                      src={getRankIconUrl(newRank.assetKey)} 
                      alt={newRank.name} 
                      className="w-full h-full object-contain"
                    />
                 </div>
              </div>

              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-md">
                {newRank.name}
              </h2>
              <p className={`${themeStyles.textSecondary} text-xs font-mono uppercase tracking-widest mb-6`}>
                Congratulations, Commander!
              </p>

              <button 
                onClick={onClose}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest ${themeStyles.buttonPrimary} shadow-lg hover:scale-105 transition-transform`}
              >
                Claim Rewards
              </button>
          </div>
       </div>
    </div>
  );
};

export default LevelUpModal;
