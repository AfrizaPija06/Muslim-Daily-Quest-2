
import React, { useEffect, useState } from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { ChevronsLeft, ChevronsRight, Shield, Sparkles } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  // Cari index karakter yang sedang dipilih
  const currentIndex = AVAILABLE_CHARACTERS.findIndex(c => c.id === selectedId);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const selectedChar = AVAILABLE_CHARACTERS[activeIndex];

  // Logic Navigasi
  const handleNext = () => {
    setDirection('right');
    const nextIndex = (activeIndex + 1) % AVAILABLE_CHARACTERS.length;
    onSelect(AVAILABLE_CHARACTERS[nextIndex]);
  };

  const handlePrev = () => {
    setDirection('left');
    const prevIndex = (activeIndex - 1 + AVAILABLE_CHARACTERS.length) % AVAILABLE_CHARACTERS.length;
    onSelect(AVAILABLE_CHARACTERS[prevIndex]);
  };

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  return (
    <div className="flex items-center justify-center w-full h-full py-4 relative group">
      
      {/* --- PREV BUTTON --- */}
      <button 
        onClick={handlePrev}
        className="absolute left-0 z-20 p-3 rounded-full bg-[#ea580c] text-white shadow-[0_0_15px_rgba(234,88,12,0.6)] hover:scale-110 hover:bg-[#c2410c] transition-all border-2 border-white/20 active:scale-95 md:relative md:mr-6"
      >
        <ChevronsLeft className="w-8 h-8" />
      </button>

      {/* --- MAIN CARD --- */}
      <div className="relative w-full max-w-[320px] aspect-[3/4.5] rounded-3xl overflow-hidden border-4 border-[#fbbf24] shadow-[0_0_40px_rgba(251,191,36,0.3)] bg-black">
        
        {/* Animated Image Container */}
        <div key={selectedChar.id} className={`w-full h-full relative animate-in fade-in duration-500 ${direction === 'right' ? 'slide-in-from-right-10' : direction === 'left' ? 'slide-in-from-left-10' : ''}`}>
           <img 
              src={selectedChar.imageUrl} 
              alt={selectedChar.name}
              className="w-full h-full object-cover transform scale-105"
           />
           
           {/* Cinematic Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
           
           {/* Top Sparkle Effect */}
           <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#fbbf24]/20 to-transparent mix-blend-overlay"></div>
        </div>

        {/* --- TEXT CONTENT (OVERLAY) --- */}
        <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end text-left pb-8">
           
           {/* Role Badge */}
           <div className="flex items-center gap-2 mb-1 opacity-90">
              <Shield className={`w-3 h-3 ${selectedChar.color}`} />
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-[#fbbf24]`}>
                {selectedChar.role}
              </span>
           </div>

           {/* Hero Name */}
           <h2 className={`text-2xl ${themeStyles.fontDisplay} font-black text-white leading-tight uppercase mb-2 drop-shadow-md`}>
             {selectedChar.name}
           </h2>

           {/* Description */}
           <p className="text-[10px] text-white/80 italic leading-relaxed mb-4 border-l-2 border-[#fbbf24]/50 pl-2">
             "{selectedChar.description}"
           </p>

           {/* Skills List (Compact) */}
           <div className="space-y-1">
              <p className="text-[9px] font-bold uppercase text-[#fbbf24]/80 mb-1 flex items-center gap-1">
                 <Sparkles className="w-3 h-3" /> Unique Skills
              </p>
              {selectedChar.abilities.slice(0, 3).map((ability, idx) => (
                <div key={idx} className="text-[10px] font-bold text-white/90 flex items-center gap-2">
                   <div className={`w-1 h-1 rounded-full ${selectedChar.color.replace('text-', 'bg-')}`}></div>
                   {ability}
                </div>
              ))}
           </div>

        </div>

        {/* Decorative Borders/Corners */}
        <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-[#fbbf24]/50 rounded-tr-xl pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-[#fbbf24]/50 rounded-bl-xl pointer-events-none"></div>

      </div>

      {/* --- NEXT BUTTON --- */}
      <button 
        onClick={handleNext}
        className="absolute right-0 z-20 p-3 rounded-full bg-[#ea580c] text-white shadow-[0_0_15px_rgba(234,88,12,0.6)] hover:scale-110 hover:bg-[#c2410c] transition-all border-2 border-white/20 active:scale-95 md:relative md:ml-6"
      >
        <ChevronsRight className="w-8 h-8" />
      </button>

      {/* Indicator Dots (Optional visually, helps user know there are more) */}
      <div className="absolute -bottom-6 flex gap-1.5">
         {AVAILABLE_CHARACTERS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-6 bg-[#fbbf24]' : 'w-1.5 bg-white/20'}`} 
            />
         ))}
      </div>

    </div>
  );
};

export default AvatarSelection;
