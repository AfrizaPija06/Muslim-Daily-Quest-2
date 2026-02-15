
import React, { useRef, useEffect } from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { Shield, Sparkles, Swords } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  const selectedChar = AVAILABLE_CHARACTERS.find(c => c.id === selectedId) || AVAILABLE_CHARACTERS[0];
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto scroll ke hero yang dipilih di list vertical
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full animate-reveal">
      
      {/* HEADER KECIL */}
      <div className="flex justify-between items-end mb-2 px-1">
          <h3 className={`text-xs font-black uppercase tracking-widest ${themeStyles.textSecondary}`}>
            <Swords className="w-3 h-3 inline-block mr-1 text-[#fbbf24]" />
            Select Hero
          </h3>
          <span className="text-[9px] opacity-50 font-mono">ROSTER: {AVAILABLE_CHARACTERS.length}</span>
      </div>

      {/* MAIN SPLIT VIEW CONTAINER */}
      {/* Menggunakan h-[60vh] atau min-h-[400px] agar pas di layar mobile tanpa scroll body */}
      <div className="flex flex-row gap-3 h-[55vh] min-h-[400px] max-h-[600px]">
        
        {/* --- LEFT COLUMN: VERTICAL ROSTER LIST --- */}
        <div className="w-20 md:w-32 shrink-0 flex flex-col gap-3 overflow-y-auto no-scrollbar pb-10 pr-1">
          {AVAILABLE_CHARACTERS.map((char) => {
            const isSelected = selectedId === char.id;
            const borderColor = isSelected ? '#fbbf24' : 'transparent'; 
            
            return (
              <button
                key={char.id}
                ref={isSelected ? selectedRef : null}
                onClick={() => onSelect(char)}
                className={`
                  relative shrink-0 w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300
                  ${isSelected 
                    ? 'border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.5)] scale-100 z-10 opacity-100' 
                    : 'border-white/10 opacity-50 hover:opacity-100 scale-95 grayscale'
                  }
                `}
              >
                <img 
                  src={char.imageUrl} 
                  alt={char.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Role Icon Overlay */}
                <div className="absolute bottom-0 right-0 p-1 bg-black/60 rounded-tl-lg backdrop-blur-sm">
                   <Shield className={`w-3 h-3 ${char.color}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* --- RIGHT COLUMN: DETAILS PANEL --- */}
        <div className={`
            flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0f0518]/80
            shadow-2xl flex flex-col
        `}>
            
            {/* BACKGROUND IMAGE (Blurred & Darkened) */}
            <div className="absolute inset-0 z-0">
               <img src={selectedChar.imageUrl} className="w-full h-full object-cover opacity-30 blur-sm" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0f0518] via-[#0f0518]/80 to-transparent"></div>
            </div>

            {/* CONTENT SCROLLABLE AREA */}
            <div className="relative z-10 flex flex-col h-full overflow-y-auto p-4 md:p-6 no-scrollbar">
               
               {/* Hero Header */}
               <div className="mt-auto mb-6">
                   <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 mb-2 backdrop-blur-md`}>
                      <Shield className={`w-3 h-3 ${selectedChar.color}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest text-white`}>
                        {selectedChar.role}
                      </span>
                   </div>

                   <h2 className={`text-2xl md:text-3xl ${themeStyles.fontDisplay} font-black text-white leading-none uppercase drop-shadow-lg mb-2`}>
                     {selectedChar.name}
                   </h2>

                   {/* Description Box */}
                   <div className="p-3 bg-black/40 rounded-lg border border-white/5 backdrop-blur-sm">
                      <p className="text-xs leading-relaxed text-slate-300 italic">
                        "{selectedChar.description}"
                      </p>
                   </div>
               </div>

               {/* Abilities List */}
               <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                   <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#fbbf24]" /> Unique Skills
                   </p>
                   <div className="space-y-2">
                      {selectedChar.abilities.map((ability, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedChar.color.replace('text-', 'bg-')}`}></div>
                            <span className="text-xs font-bold text-white/90">{ability}</span>
                        </div>
                      ))}
                   </div>
               </div>

            </div>

            {/* Decorative Top Right Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-40 pointer-events-none ${selectedChar.color.replace('text-', 'bg-')}`} />
        </div>

      </div>
    </div>
  );
};

export default AvatarSelection;
