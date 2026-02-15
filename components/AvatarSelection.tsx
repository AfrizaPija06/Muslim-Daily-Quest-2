
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
    <div className="w-full flex flex-col xl:flex-row gap-8 animate-reveal min-h-[500px]">
      
      {/* LEFT: CARD DECK (Grid of Cards) */}
      <div className="flex-1 order-2 xl:order-1">
        <div className="flex justify-between items-end mb-6 px-2">
            <h3 className={`text-sm font-black uppercase tracking-widest ${themeStyles.textSecondary}`}>
              <Swords className="w-4 h-4 inline-block mr-2 text-[#fbbf24]" />
              Select Hero
            </h3>
            <span className="text-[10px] opacity-50 font-mono">{AVAILABLE_CHARACTERS.length} AVAILABLE</span>
        </div>
        
        {/* MODIFIED GRID: Fewer columns = Bigger Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-12">
          {AVAILABLE_CHARACTERS.map((char) => {
            const isSelected = selectedId === char.id;
            
            // Extract pure color name for border/ring logic
            const colorName = char.color.replace('text-', ''); 
            
            return (
              <button
                key={char.id}
                onClick={() => onSelect(char)}
                className={`
                  group relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-500 outline-none
                  ${isSelected 
                    ? `transform -translate-y-2 z-10 scale-[1.05] shadow-[0_0_40px_rgba(0,0,0,0.6)] ring-4 ring-offset-4 ring-offset-[#020617] ring-${colorName}` 
                    : 'opacity-70 hover:opacity-100 hover:-translate-y-1 hover:shadow-2xl hover:z-10 grayscale-[0.5] hover:grayscale-0'
                  }
                `}
              >
                {/* Card Frame/Border */}
                <div className={`absolute inset-0 border-[3px] z-20 pointer-events-none rounded-2xl transition-colors duration-300 ${isSelected ? `border-${colorName}` : 'border-white/10 group-hover:border-white/40'}`}></div>

                {/* Background Image */}
                <div className="absolute inset-0 bg-slate-900">
                   <img 
                      src={char.imageUrl} 
                      alt={char.name}
                      // ADDED: object-top to focus on faces
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${char.name}&background=1e1b4b&color=fff&size=512`;
                      }}
                    />
                </div>

                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>

                {/* Content Overlay */}
                <div className="absolute inset-0 p-5 flex flex-col justify-end z-20 text-left">
                  {isSelected && (
                     <div className="absolute top-3 right-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse bg-${colorName} shadow-[0_0_15px_currentColor]`} />
                     </div>
                  )}
                  
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${char.color}`}>
                      {char.role.split(' ')[0]}
                    </p>
                    <p className={`text-lg md:text-xl ${themeStyles.fontDisplay} font-black text-white leading-none drop-shadow-md`}>
                      {char.name}
                    </p>
                  </div>
                </div>

                {/* Shine Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine z-30 pointer-events-none"></div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: HERO DETAILS PANEL (Sticky on Desktop) */}
      <div className={`w-full xl:w-96 shrink-0 flex flex-col order-1 xl:order-2`}>
         <div className="xl:sticky xl:top-24">
            <div className={`
                relative overflow-hidden rounded-[2rem] p-8 border-2 shadow-2xl backdrop-blur-3xl bg-[#0f0518]/90
                ${selectedChar.color.replace('text-', 'border-')}/30
            `}>
                
                {/* Decorative BG Glow */}
                <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[120px] opacity-25 pointer-events-none ${selectedChar.color.replace('text-', 'bg-')}`} />

                {/* Header Info */}
                <div className="relative z-10 text-center mb-8">
                   <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4`}>
                      <Shield className={`w-3.5 h-3.5 ${selectedChar.color}`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-white`}>
                        Class: {selectedChar.role}
                      </span>
                   </div>
                   
                   <h2 className={`text-3xl md:text-4xl ${themeStyles.fontDisplay} font-black text-white leading-none mb-4`}>
                     {selectedChar.name}
                   </h2>
                   <div className={`h-1.5 w-24 mx-auto rounded-full ${selectedChar.color.replace('text-', 'bg-')}`} />
                </div>

                {/* Stats / Description */}
                <div className="relative z-10 space-y-6">
                   <div className="p-6 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-sm">
                      <p className="text-sm leading-relaxed text-slate-300 font-medium italic text-center">
                        "{selectedChar.description}"
                      </p>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1 mb-2">Signature Abilities</p>
                      <div className="grid grid-cols-1 gap-3">
                          {selectedChar.abilities.map((ability, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                <div className={`p-2 rounded-lg bg-black/50 group-hover:scale-110 transition-transform ${selectedChar.color}`}>
                                   <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-bold text-white/90">{ability}</span>
                            </div>
                          ))}
                      </div>
                   </div>
                </div>

                {/* Footer Fluff */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-xs opacity-40 font-mono">
                   <Info className="w-4 h-4" />
                   <span>DIFFICULTY: HARDCORE</span>
                </div>

            </div>
         </div>
      </div>

    </div>
  );
};

export default AvatarSelection;
