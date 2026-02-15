
import React from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { Shield, Sparkles, Swords, Info } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  const selectedChar = AVAILABLE_CHARACTERS.find(c => c.id === selectedId) || AVAILABLE_CHARACTERS[0];

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 animate-reveal min-h-[500px]">
      
      {/* LEFT: CARD DECK (Grid of Cards) */}
      <div className="flex-1 order-2 xl:order-1">
        <div className="flex justify-between items-end mb-4 px-2">
            <h3 className={`text-sm font-black uppercase tracking-widest ${themeStyles.textSecondary}`}>
              <Swords className="w-4 h-4 inline-block mr-2 text-[#fbbf24]" />
              Select Hero
            </h3>
            <span className="text-[10px] opacity-50 font-mono">{AVAILABLE_CHARACTERS.length} AVAILABLE</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
          {AVAILABLE_CHARACTERS.map((char) => {
            const isSelected = selectedId === char.id;
            
            // Extract pure color name for border/ring logic (e.g., 'text-red-500' -> 'red-500')
            const colorName = char.color.replace('text-', ''); 
            
            return (
              <button
                key={char.id}
                onClick={() => onSelect(char)}
                className={`
                  group relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-500 outline-none
                  ${isSelected 
                    ? `transform -translate-y-2 z-10 scale-105 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-2 ring-offset-2 ring-offset-[#020617] ring-${colorName}` 
                    : 'opacity-80 hover:opacity-100 hover:-translate-y-1 hover:shadow-xl hover:z-10 grayscale-[0.3] hover:grayscale-0'
                  }
                `}
              >
                {/* Card Frame/Border */}
                <div className={`absolute inset-0 border-2 z-20 pointer-events-none rounded-xl transition-colors duration-300 ${isSelected ? `border-${colorName}` : 'border-white/10 group-hover:border-white/30'}`}></div>

                {/* Background Image */}
                <div className="absolute inset-0 bg-slate-900">
                   <img 
                      src={char.imageUrl} 
                      alt={char.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        // Fallback UI Avatar jika Cloudinary belum diset
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${char.name}&background=1e1b4b&color=fff&size=512`;
                      }}
                    />
                </div>

                {/* Gradient Overlay for Text */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent z-10"></div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-3 flex flex-col justify-end z-20 text-left">
                  {isSelected && (
                     <div className="absolute top-2 right-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse bg-${colorName} shadow-[0_0_10px_currentColor]`} />
                     </div>
                  )}
                  
                  <p className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${char.color}`}>
                    {char.role.split(' ')[0]} {/* Show first word of role */}
                  </p>
                  <p className={`text-xs md:text-sm ${themeStyles.fontDisplay} font-bold text-white leading-tight drop-shadow-md`}>
                    {char.name}
                  </p>
                </div>

                {/* Shine Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine z-30 pointer-events-none"></div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: HERO DETAILS PANEL (Sticky on Desktop) */}
      <div className={`w-full xl:w-80 shrink-0 flex flex-col order-1 xl:order-2`}>
         <div className="xl:sticky xl:top-24">
            <div className={`
                relative overflow-hidden rounded-3xl p-6 border-2 shadow-2xl backdrop-blur-3xl bg-[#0f0518]/90
                ${selectedChar.color.replace('text-', 'border-')}/30
            `}>
                
                {/* Decorative BG Glow */}
                <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${selectedChar.color.replace('text-', 'bg-')}`} />

                {/* Header Info */}
                <div className="relative z-10 text-center mb-6">
                   <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3`}>
                      <Shield className={`w-3 h-3 ${selectedChar.color}`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white`}>
                        Class: {selectedChar.role}
                      </span>
                   </div>
                   
                   <h2 className={`text-2xl md:text-3xl ${themeStyles.fontDisplay} font-black text-white leading-none mb-2`}>
                     {selectedChar.name}
                   </h2>
                   <div className={`h-1 w-16 mx-auto rounded-full ${selectedChar.color.replace('text-', 'bg-')}`} />
                </div>

                {/* Stats / Description */}
                <div className="relative z-10 space-y-4">
                   <div className="p-4 bg-black/40 rounded-xl border border-white/5 backdrop-blur-sm">
                      <p className="text-xs leading-relaxed text-slate-300 font-medium italic text-center">
                        "{selectedChar.description}"
                      </p>
                   </div>

                   <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 px-1">Special Abilities</p>
                      <div className="grid grid-cols-1 gap-2">
                          {selectedChar.abilities.map((ability, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className={`p-1.5 rounded-md bg-black/50 ${selectedChar.color}`}>
                                   <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white/90">{ability}</span>
                            </div>
                          ))}
                      </div>
                   </div>
                </div>

                {/* Footer Fluff */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] opacity-30 font-mono">
                   <Info className="w-3 h-3" />
                   <span>DIFFICULTY: HARD</span>
                </div>

            </div>
         </div>
      </div>

    </div>
  );
};

export default AvatarSelection;
