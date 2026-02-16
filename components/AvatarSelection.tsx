import React, { useEffect, useRef } from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { Shield, Sparkles, Zap, Swords } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  
  // Cari index karakter yang sedang dipilih
  const currentIndex = AVAILABLE_CHARACTERS.findIndex(c => c.id === selectedId);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  
  // Ref untuk container agar bisa scroll center
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto Scroll ke tengah saat index berubah
  useEffect(() => {
    if (itemRefs.current[activeIndex] && containerRef.current) {
      const container = containerRef.current;
      const item = itemRefs.current[activeIndex];
      
      if (item) {
        // Hitung posisi tengah: (ContainerWidth / 2) - (ItemWidth / 2)
        const scrollLeft = item.offsetLeft - (container.clientWidth / 2) + (item.clientWidth / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex]);

  return (
    <div className="relative w-full h-[500px] flex flex-col justify-center overflow-hidden py-4 select-none">
      
      {/* --- BACKGROUND GLOW EFFECT BEHIND ACTIVE --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] bg-[#fbbf24]/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* --- SCROLLABLE TRACK --- */}
      <div 
        ref={containerRef}
        className="flex items-center gap-4 md:gap-8 px-[50vw] overflow-x-auto no-scrollbar snap-x snap-mandatory py-10 perspective-1000"
        style={{ scrollPaddingLeft: '0px' }} // Hack untuk centering awal
      >
        {AVAILABLE_CHARACTERS.map((char, index) => {
            const isActive = index === activeIndex;
            // Jarak dari active index (untuk scaling)
            const distance = Math.abs(index - activeIndex);
            
            return (
                <div 
                    key={char.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    onClick={() => onSelect(char)}
                    className={`
                        relative shrink-0 rounded-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer snap-center
                        ${isActive ? 'w-[280px] h-[420px] z-20 scale-100 ring-2 ring-[#fbbf24] shadow-[0_0_50px_rgba(251,191,36,0.4)]' : 'w-[240px] h-[360px] z-10 scale-90 opacity-40 grayscale hover:opacity-80 hover:grayscale-0'}
                    `}
                    style={{
                        transform: isActive ? 'translateY(0)' : `translateY(0) scale(${1 - (distance * 0.05)})`,
                    }}
                >
                    {/* --- CHARACTER IMAGE --- */}
                    <div className="w-full h-full relative bg-black">
                       <img 
                          src={char.imageUrl} 
                          alt={char.name}
                          className={`w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-110' : 'scale-100'}`}
                          loading="lazy"
                       />
                       
                       {/* Overlay Gradient (Always Visible for consistency) */}
                       <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-90' : 'opacity-60'}`}></div>
                       
                       {/* Active Glow Overlay */}
                       {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-b from-[#fbbf24]/10 to-transparent mix-blend-overlay"></div>
                       )}
                    </div>

                    {/* --- INFO CONTENT (Only Visible on Active) --- */}
                    <div className={`absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end text-left pb-6 transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-10'}`}>
                        
                        {/* Role Badge */}
                        <div className="flex items-center gap-2 mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
                            <div className={`p-1 rounded bg-black/60 border border-white/20 backdrop-blur-md`}>
                                <Shield className={`w-3 h-3 ${char.color}`} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-[#fbbf24] drop-shadow-md`}>
                                {char.role}
                            </span>
                        </div>

                        {/* Name */}
                        <h2 
                            className={`text-2xl md:text-3xl ${themeStyles.fontDisplay} font-black text-white leading-none uppercase mb-2 drop-shadow-lg animate-slide-up`}
                            style={{ animationDelay: '200ms' }}
                        >
                            {char.name}
                        </h2>

                        {/* Description (Shortened) */}
                        <p className="text-[9px] text-white/70 italic leading-relaxed mb-3 line-clamp-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
                            "{char.description}"
                        </p>

                        {/* Skills Mini Display */}
                        <div className="flex gap-2 animate-slide-up" style={{ animationDelay: '400ms' }}>
                            {char.abilities.slice(0, 3).map((ability, idx) => (
                                <div key={idx} className="bg-white/10 border border-white/5 rounded px-1.5 py-1 backdrop-blur-sm" title={ability}>
                                    {idx === 0 && <Swords className="w-3 h-3 text-red-400" />}
                                    {idx === 1 && <Shield className="w-3 h-3 text-blue-400" />}
                                    {idx === 2 && <Zap className="w-3 h-3 text-yellow-400" />}
                                </div>
                            ))}
                            <div className="flex items-center gap-1 ml-auto text-[8px] uppercase font-bold text-[#fbbf24] bg-black/50 px-2 rounded-full border border-[#fbbf24]/30">
                                Select
                            </div>
                        </div>
                    </div>

                    {/* Locked/Inactive Overlay UI */}
                    {!isActive && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                                <span className="text-white/50 text-xs font-bold">#{index + 1}</span>
                            </div>
                        </div>
                    )}

                </div>
            );
        })}
      </div>

      {/* --- DECORATION: BOTTOM INDICATOR --- */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
         {AVAILABLE_CHARACTERS.map((_, idx) => (
             <div 
                key={idx}
                className={`h-1 transition-all duration-300 rounded-full ${idx === activeIndex ? 'w-8 bg-[#fbbf24]' : 'w-2 bg-white/10'}`}
             ></div>
         ))}
      </div>

    </div>
  );
};

export default AvatarSelection;