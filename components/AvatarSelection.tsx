
import React from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { Shield, Sparkles, UserCircle2 } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  const selectedChar = AVAILABLE_CHARACTERS.find(c => c.id === selectedId) || AVAILABLE_CHARACTERS[0];

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 animate-reveal">
      
      {/* LEFT/TOP: CHARACTER LIST (CAROUSEL/GRID) */}
      <div className="flex-1 order-2 lg:order-1">
        <h3 className={`text-center lg:text-left text-sm font-bold uppercase tracking-widest mb-4 ${themeStyles.textSecondary}`}>
          Select Hero Class
        </h3>
        
        {/* Changed grid to 2 columns on mobile, 3 on tablet, 4 on desktop. Removed fixed height. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {AVAILABLE_CHARACTERS.map((char) => {
            const isSelected = selectedId === char.id;
            return (
              <div 
                key={char.id}
                onClick={() => onSelect(char)}
                className={`
                  relative aspect-[3/4] rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 group shadow-lg
                  ${isSelected ? `ring-4 ring-offset-4 ring-offset-[#020617] ${char.color.replace('text-', 'ring-')} scale-105 z-10 shadow-[0_0_20px_rgba(251,191,36,0.3)]` : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'}
                  ${themeStyles.card} border-0
                `}
              >
                {/* Image Placeholder/Real */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10`} />
                <img 
                  src={char.imageUrl} 
                  alt={char.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${char.name}&background=1e1b4b&color=fff&size=512`;
                  }}
                />
                
                {/* Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-center">
                  <p className={`text-xs md:text-sm font-black uppercase tracking-wider text-white drop-shadow-md`}>{char.name}</p>
                  {isSelected && <div className={`h-1 w-1/2 mx-auto mt-2 bg-current ${char.color}`} />}
                </div>

                {/* Selection Glow */}
                {isSelected && (
                   <div className={`absolute inset-0 bg-current opacity-20 mix-blend-overlay ${char.color}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT/BOTTOM: CHARACTER DETAILS (INFO PANEL) */}
      <div className={`w-full lg:w-80 shrink-0 flex flex-col order-1 lg:order-2`}>
         <div className={`h-full ${themeStyles.card} rounded-3xl p-6 relative overflow-hidden border-t-4 shadow-2xl ${selectedChar.color.replace('text-', 'border-')}`}>
            
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[80px] opacity-30 bg-current pointer-events-none ${selectedChar.color}`} />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Shield className={`w-5 h-5 ${selectedChar.color}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${selectedChar.color}`}>
                   {selectedChar.role}
                </span>
              </div>
              
              <h2 className={`text-3xl md:text-4xl ${themeStyles.fontDisplay} font-black text-white mb-4 leading-none`}>
                {selectedChar.name}
              </h2>
              
              <p className={`text-sm leading-relaxed text-white/80 mb-8 font-medium`}>
                {selectedChar.description}
              </p>

              <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                 <p className="text-[10px] font-bold uppercase opacity-50 border-b border-white/10 pb-2">Special Abilities</p>
                 <ul className="space-y-3">
                    {selectedChar.abilities.map((ability, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm font-bold text-white/90">
                        <Sparkles className={`w-4 h-4 ${selectedChar.color}`} />
                        <span>{ability}</span>
                      </li>
                    ))}
                 </ul>
              </div>
              
              {/* Visual filler */}
              <div className="mt-auto pt-8 flex justify-center opacity-10">
                 <UserCircle2 className="w-32 h-32" />
              </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default AvatarSelection;
