
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
    <div className="w-full flex flex-col md:flex-row gap-6 animate-reveal">
      
      {/* LEFT/TOP: CHARACTER LIST (CAROUSEL/GRID) */}
      <div className="flex-1">
        <h3 className={`text-center md:text-left text-sm font-bold uppercase tracking-widest mb-4 ${themeStyles.textSecondary}`}>
          Select Hero
        </h3>
        
        <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {AVAILABLE_CHARACTERS.map((char) => {
            const isSelected = selectedId === char.id;
            return (
              <div 
                key={char.id}
                onClick={() => onSelect(char)}
                className={`
                  relative aspect-[3/4] rounded-xl cursor-pointer overflow-hidden transition-all duration-300 group
                  ${isSelected ? `ring-2 ring-offset-2 ring-offset-black ${char.color.replace('text-', 'ring-')} scale-105 z-10` : 'opacity-60 hover:opacity-100 hover:scale-105'}
                  ${themeStyles.card} border-0
                `}
              >
                {/* Image Placeholder/Real */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-80`} />
                <img 
                  src={char.imageUrl} 
                  alt={char.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback if image load fails
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${char.name}&background=1e1b4b&color=fff`;
                  }}
                />
                
                {/* Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2 z-20 text-center">
                  <p className={`text-[10px] font-black uppercase tracking-wider text-white`}>{char.name}</p>
                  {isSelected && <div className={`h-0.5 w-1/2 mx-auto mt-1 bg-current ${char.color}`} />}
                </div>

                {/* Selection Glow */}
                {isSelected && (
                   <div className={`absolute inset-0 bg-current opacity-10 ${char.color}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT/BOTTOM: CHARACTER DETAILS (INFO PANEL) */}
      <div className={`w-full md:w-64 shrink-0 flex flex-col`}>
         <div className={`h-full ${themeStyles.card} rounded-2xl p-5 relative overflow-hidden border-t-2 ${selectedChar.color.replace('text-', 'border-')}`}>
            
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 bg-current pointer-events-none ${selectedChar.color}`} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`w-4 h-4 ${selectedChar.color}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedChar.color}`}>
                   {selectedChar.role}
                </span>
              </div>
              
              <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold text-white mb-2`}>
                {selectedChar.name}
              </h2>
              
              <p className={`text-xs leading-relaxed opacity-80 mb-6 font-light`}>
                {selectedChar.description}
              </p>

              <div className="space-y-3">
                 <p className="text-[10px] font-bold uppercase opacity-50 border-b border-white/10 pb-1">Special Abilities</p>
                 <ul className="space-y-2">
                    {selectedChar.abilities.map((ability, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <Sparkles className={`w-3 h-3 ${selectedChar.color}`} />
                        <span>{ability}</span>
                      </li>
                    ))}
                 </ul>
              </div>
            </div>

            {/* Placeholder Visual if no image selected */}
            <div className="mt-auto pt-8 flex justify-center opacity-10">
               <UserCircle2 className="w-24 h-24" />
            </div>
         </div>
      </div>

    </div>
  );
};

export default AvatarSelection;
