
import React, { useEffect } from 'react';
import { AVAILABLE_CHARACTERS } from '../constants';
import { Character } from '../types';
import { Shield, Sparkles, Zap, Swords } from 'lucide-react';

interface AvatarSelectionProps {
  selectedId: string | undefined;
  onSelect: (character: Character) => void;
  themeStyles: any;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ selectedId, onSelect, themeStyles }) => {
  
  // 1. Cari index aktif
  const currentIndex = AVAILABLE_CHARACTERS.findIndex(c => c.id === selectedId);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const count = AVAILABLE_CHARACTERS.length;

  // 2. Fungsi Keyboard Navigation (Optional UX improvement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        const nextIndex = (activeIndex + 1) % count;
        onSelect(AVAILABLE_CHARACTERS[nextIndex]);
      }
      if (e.key === 'ArrowLeft') {
        const prevIndex = (activeIndex - 1 + count) % count;
        onSelect(AVAILABLE_CHARACTERS[prevIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, count, onSelect]);

  /**
   * 3. LOGIC UTAMA: Circular Offset Calculation
   * Menghitung jarak visual relatif terhadap activeIndex dengan konsep lingkaran.
   * Contoh: Jika total 7 item. Kita di index 6. Index 0 dianggap jaraknya +1 (sebelah kanan), bukan -6.
   */
  const getOffset = (index: number) => {
    let diff = index - activeIndex;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden py-4 select-none perspective-1000">
      
      {/* --- BACKGROUND GLOW --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#fbbf24]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* --- CAROUSEL TRACK --- */}
      <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
        {AVAILABLE_CHARACTERS.map((char, index) => {
            const offset = getOffset(index); // -2, -1, 0, 1, 2...
            const isActive = offset === 0;
            const absOffset = Math.abs(offset);
            
            // Hanya render yang dekat agar performa ringan (Max jarak 3)
            const isVisible = absOffset <= 3;
            if (!isVisible) return null;

            // --- 3D TRANSFORM CALCULATION ---
            // Mengatur posisi X, Scale, dan Z-Index berdasarkan jarak dari tengah
            // Jarak antar kartu lebih rapat di mobile (160px) dibanding desktop (260px)
            const translateX = offset * (window.innerWidth < 768 ? 45 : 65); // dalam persen
            const scale = 1 - (absOffset * 0.15); // Mengecil 15% setiap langkah menjauh
            const zIndex = 50 - absOffset; // Layering: Tengah paling depan
            const opacity = isActive ? 1 : Math.max(0.3, 1 - (absOffset * 0.3)); // Semakin jauh semakin transparan
            const rotateY = offset * -15; // Rotasi sedikit agar terlihat melengkung

            return (
                <div 
                    key={char.id}
                    onClick={() => onSelect(char)}
                    className={`
                        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                        cursor-pointer
                        ${isActive ? 'w-[280px] h-[420px] ring-2 ring-[#fbbf24] shadow-[0_0_50px_rgba(251,191,36,0.4)]' : 'w-[260px] h-[380px] hover:brightness-110'}
                    `}
                    style={{
                        zIndex: zIndex,
                        opacity: opacity,
                        transform: `translate(-50%, -50%) translateX(${translateX}%) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
                        borderRadius: '1.5rem',
                        overflow: 'hidden'
                    }}
                >
                    {/* --- CHARACTER IMAGE --- */}
                    <div className="w-full h-full relative bg-black">
                       <img 
                          src={char.imageUrl} 
                          alt={char.name}
                          className={`w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-110' : 'scale-100 grayscale'}`}
                          loading="lazy"
                          draggable={false}
                       />
                       
                       {/* Overlay Gradient */}
                       <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-90' : 'opacity-70'}`}></div>
                       
                       {/* Active Glow Overlay */}
                       {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-b from-[#fbbf24]/10 to-transparent mix-blend-overlay"></div>
                       )}
                    </div>

                    {/* --- INFO CONTENT (Only Visible on Active) --- */}
                    {isActive && (
                      <div className={`absolute bottom-0 inset-x-0 p-6 flex flex-col justify-end text-left pb-6 z-20`}>
                          
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

                          {/* Description */}
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
                              <div className="flex items-center gap-1 ml-auto text-[8px] uppercase font-bold text-[#fbbf24] bg-black/50 px-3 rounded-full border border-[#fbbf24]/30 animate-pulse">
                                  Select
                              </div>
                          </div>
                      </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* --- BOTTOM INDICATOR (Dynamic Dots) --- */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-50">
         {AVAILABLE_CHARACTERS.map((_, idx) => (
             <div 
                key={idx}
                className={`h-1 rounded-full transition-all duration-500 shadow-lg ${idx === activeIndex ? 'w-8 bg-[#fbbf24] shadow-[0_0_8px_#fbbf24]' : 'w-1.5 bg-white/20'}`}
             ></div>
         ))}
      </div>

    </div>
  );
};

export default AvatarSelection;
