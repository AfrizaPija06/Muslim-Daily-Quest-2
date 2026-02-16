
import React, { useEffect } from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { ChevronsLeft, ChevronsRight, Shield, Sparkles } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  
  // Cari index karakter yang sedang dipilih
  const currentIndex = AVAILABLE_CHARACTERS.findIndex(c => c.id === selectedId);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const selectedChar = AVAILABLE_CHARACTERS[activeIndex];

  // Logic Navigasi
  const handleNext = () => {
    const nextIndex = (activeIndex + 1) % AVAILABLE_CHARACTERS.length;
    onSelect(AVAILABLE_CHARACTERS[nextIndex]);
  };

  const handlePrev = () => {
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
    <div className="flex items-center justify-center w-full h-full py-4 relative group select-none">
      
      {/* --- PREV BUTTON --- */}
      <button 
        type="button"
        onClick={handlePrev}
        className="absolute left-0 z-30 p-3 rounded-full bg-[#ea580c] text-white shadow-[0_0_15px_rgba(234,88,12,0.6)] hover:scale-110 hover:bg-[#c2410c] transition-all border-2 border-white/20 active:scale-95 md:relative md:mr-6"
      >
        <ChevronsLeft className="w-8 h-8" />
      </button>

      {/* --- MAIN CARD CONTAINER --- */}
      <div className="relative w-full max-w-[340px] aspect-[3/4.5] rounded-[2rem] overflow-hidden border-4 border-[#fbbf24] shadow-[0_0_40px_rgba(251,191,36,0.3)] bg-black">
        
        {/* --- CAROUSEL TRACK (The Smooth Slider) --- */}
        <div 
            className="flex h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
            {AVAILABLE_CHARACTERS.map((char, index) => {
                const isActive = index === activeIndex;
                return (
                    <div key={char.id} className="w-full h-full shrink-0 relative">
                        {/* Image Layer */}
                        <div className="w-full h-full relative">
                           <img 
                              src={char.imageUrl} 
                              alt={char.name}
                              className={`w-full h-full object-cover transition-transform duration-1000 ${isActive ? 'scale-110' : 'scale-100 grayscale'}`}
                              loading="lazy"
                           />
                           
                           {/* Cinematic Gradients */}
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                           <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#fbbf24]/20 to-transparent mix-blend-overlay"></div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* --- INFO OVERLAY (Static Position, Dynamic Content) --- */}
        {/* Menggunakan Key agar teks mereset animasinya saat index berubah */}
        <div key={selectedChar.id} className="absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end text-left pb-8 z-20 animate-in slide-in-from-bottom-4 fade-in duration-500">
           
           {/* Role Badge */}
           <div className="flex items-center gap-2 mb-2 opacity-0 animate-in fade-in slide-in-from-left-2 duration-700 delay-100 fill-mode-forwards">
              <div className={`p-1.5 rounded-lg bg-black/50 backdrop-blur border border-white/10 ${selectedChar.color.replace('text-', 'border-')}`}>
                 <Shield className={`w-3 h-3 ${selectedChar.color}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-[#fbbf24] drop-shadow-md`}>
                {selectedChar.role}
              </span>
           </div>

           {/* Hero Name */}
           <h2 className={`text-3xl ${themeStyles.fontDisplay} font-black text-white leading-none uppercase mb-2 drop-shadow-lg opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 fill-mode-forwards`}>
             {selectedChar.name}
           </h2>

           {/* Description */}
           <div className="opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-forwards">
               <p className="text-[10px] text-white/80 italic leading-relaxed mb-4 border-l-2 border-[#fbbf24]/50 pl-3 line-clamp-3">
                 "{selectedChar.description}"
               </p>
           </div>

           {/* Skills List (Compact) */}
           <div className="space-y-1 opacity-0 animate-in fade-in zoom-in-95 duration-700 delay-500 fill-mode-forwards">
              <p className="text-[9px] font-bold uppercase text-[#fbbf24]/80 mb-1 flex items-center gap-1">
                 <Sparkles className="w-3 h-3" /> Signature Skills
              </p>
              <div className="flex flex-wrap gap-2">
                  {selectedChar.abilities.slice(0, 3).map((ability, idx) => (
                    <div key={idx} className="px-2 py-1 rounded bg-white/10 backdrop-blur-sm border border-white/5 text-[9px] font-bold text-white/90">
                      {ability}
                    </div>
                  ))}
              </div>
           </div>

        </div>

        {/* Decorative Borders/Corners (UI HUD) */}
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#fbbf24] rounded-tr-xl pointer-events-none opacity-50 z-20"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#fbbf24] rounded-bl-xl pointer-events-none opacity-50 z-20"></div>

      </div>

      {/* --- NEXT BUTTON --- */}
      <button 
        type="button"
        onClick={handleNext}
        className="absolute right-0 z-30 p-3 rounded-full bg-[#ea580c] text-white shadow-[0_0_15px_rgba(234,88,12,0.6)] hover:scale-110 hover:bg-[#c2410c] transition-all border-2 border-white/20 active:scale-95 md:relative md:ml-6"
      >
        <ChevronsRight className="w-8 h-8" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute -bottom-6 flex gap-1.5">
         {AVAILABLE_CHARACTERS.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeIndex ? 'w-8 bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]' : 'w-1.5 bg-white/20'}`} 
            />
         ))}
      </div>

    </div>
  );
};

export default AvatarSelection;
