
import React, { useRef, useEffect } from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { Shield, Sparkles, Swords, Info, ChevronsRight } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  const selectedChar = AVAILABLE_CHARACTERS.find(c => c.id === selectedId) || AVAILABLE_CHARACTERS[0];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto scroll ke hero yang dipilih saat pertama render
  useEffect(() => {
    if (selectedRef.current && scrollContainerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full animate-reveal">
      
      {/* --- TOP: HERO STRIP (HORIZONTAL SCROLL) --- */}
      <div className="w-full relative group/list">
        
        <div className="flex justify-between items-end mb-4 px-2">
            <h3 className={`text-sm font-black uppercase tracking-widest ${themeStyles.textSecondary}`}>
              <Swords className="w-4 h-4 inline-block mr-2 text-[#fbbf24]" />
              Select Hero
            </h3>
            <span className="text-[10px] opacity-50 font-mono">SCROLL TO BROWSE</span>
        </div>

        {/* Scroll Container */}
        <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-12 pt-4 px-4 gap-4 snap-x snap-mandatory no-scrollbar"
        >
          {AVAILABLE_CHARACTERS.map((char) => {
            const isSelected = selectedId === char.id;
            // Warna border: Abu-abu tua jika tidak dipilih, Emas/Warna Hero jika dipilih
            const borderColor = isSelected ? '#fbbf24' : '#334155'; 
            
            return (
              <button
                key={char.id}
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelect(char)}
                className={`
                  relative shrink-0 snap-center transition-all duration-500 ease-out outline-none
                  w-[160px] h-[240px] md:w-[180px] md:h-[280px]
                  ${isSelected 
                    ? 'z-20 scale-110 -translate-y-2' 
                    : 'z-0 scale-95 opacity-60 hover:opacity-100 hover:scale-100 grayscale hover:grayscale-0'
                  }
                `}
              >
                {/* 1. FRAME BORDER (Thick Card Style) */}
                <div 
                    className={`absolute inset-0 z-20 border-[6px] transition-colors duration-300 pointer-events-none rounded-lg`}
                    style={{ 
                        borderColor: borderColor,
                        boxShadow: isSelected ? `0 0 30px ${borderColor}80` : 'none' 
                    }}
                ></div>

                {/* 2. INNER SHADOW (Vignette) */}
                <div className="absolute inset-0 z-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] rounded-lg pointer-events-none"></div>

                {/* 3. IMAGE */}
                <div className="absolute inset-0 bg-slate-900 rounded-lg overflow-hidden">
                   <img 
                      src={char.imageUrl} 
                      alt={char.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${char.name}&background=1e1b4b&color=fff&size=512`;
                      }}
                    />
                </div>

                {/* 4. TEXT OVERLAY (Name at bottom) */}
                <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex flex-col justify-end p-3 text-center">
                    <p className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${isSelected ? 'text-[#fbbf24]' : 'text-slate-400'}`}>
                        {char.role.split(' ')[0]}
                    </p>
                    <p className={`text-sm ${themeStyles.fontDisplay} font-bold text-white leading-tight drop-shadow-md truncate`}>
                        {char.name}
                    </p>
                </div>

                {/* 5. CLASS ICON (Top Right Corner) */}
                <div className={`absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                     <Shield className={`w-3 h-3 ${char.color}`} />
                </div>

              </button>
            );
          })}
          
          {/* Spacer di akhir agar kartu terakhir bisa di tengah */}
          <div className="w-[20px] shrink-0"></div>
        </div>
      </div>

      {/* --- BOTTOM: HERO DETAILS PANEL --- */}
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className={`
            relative overflow-hidden rounded-[2rem] p-6 md:p-10 border-2 shadow-2xl backdrop-blur-3xl bg-[#0f0518]/90
            transition-colors duration-500
            ${selectedChar.color.replace('text-', 'border-')}/30
        `}>
            {/* Decorative BG Glow */}
            <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[150px] opacity-20 pointer-events-none ${selectedChar.color.replace('text-', 'bg-')}`} />

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
               
               {/* Detail Left: Name & Role */}
               <div className="text-center md:text-left flex-1">
                   <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4`}>
                      <Shield className={`w-3.5 h-3.5 ${selectedChar.color}`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white`}>
                        Class: {selectedChar.role}
                      </span>
                   </div>
                   
                   <h2 className={`text-3xl md:text-5xl ${themeStyles.fontDisplay} font-black text-white leading-none mb-4 uppercase drop-shadow-lg`}>
                     {selectedChar.name}
                   </h2>
                   
                   <div className="p-4 bg-black/40 rounded-xl border border-white/5 backdrop-blur-sm max-w-lg">
                      <p className="text-sm leading-relaxed text-slate-300 font-medium italic">
                        "{selectedChar.description}"
                      </p>
                   </div>
               </div>

               {/* Detail Right: Abilities */}
               <div className="w-full md:w-auto min-w-[280px]">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-3 text-center md:text-left">Hero Abilities</p>
                   <div className="space-y-3">
                      {selectedChar.abilities.map((ability, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group cursor-default">
                            <div className={`p-2 rounded-lg bg-black/50 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,0,0,0.5)] ${selectedChar.color}`}>
                               <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-bold text-white/90 block">{ability}</span>
                                <span className="text-[9px] text-white/30 uppercase font-mono">Passive / Active</span>
                            </div>
                        </div>
                      ))}
                   </div>
               </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default AvatarSelection;
