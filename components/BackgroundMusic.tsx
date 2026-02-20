
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GAME_BGM_URL } from '../constants';

interface BackgroundMusicProps {
  themeStyles: any;
}

const BackgroundMusic: React.FC<BackgroundMusicProps> = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio(GAME_BGM_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5; // 50% Volume default

    // Check localStorage preference
    const savedState = localStorage.getItem('bgm_playing');
    if (savedState === 'true') {
      setIsPlaying(true);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Browser policy: Audio only works after user interaction.
      // We try to play, if it fails, we wait for interaction.
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          console.log("Autoplay prevented by browser. Waiting for interaction.");
          setIsPlaying(false); // Force UI to show Muted until interaction
        });
      }
    } else {
      audioRef.current.pause();
    }
    
    // Save state
    localStorage.setItem('bgm_playing', String(isPlaying));
  }, [isPlaying]);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60] animate-reveal">
      <button
        onClick={toggleMusic}
        className={`relative group flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-300 shadow-xl overflow-hidden
          ${isPlaying 
            ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]' 
            : `bg-black/50 border-white/10 text-white/40 hover:text-white`
          }
        `}
        title={isPlaying ? "Mute Music" : "Play Music"}
      >
        {/* Equalizer Animation Background */}
        {isPlaying && (
           <div className="absolute inset-0 flex items-end justify-center gap-1 pb-2 opacity-30">
              <div className="w-1 bg-[#fbbf24] animate-[pulse_0.8s_ease-in-out_infinite] h-4"></div>
              <div className="w-1 bg-[#fbbf24] animate-[pulse_1.2s_ease-in-out_infinite] h-6"></div>
              <div className="w-1 bg-[#fbbf24] animate-[pulse_1.0s_ease-in-out_infinite] h-3"></div>
           </div>
        )}

        <div className="relative z-10">
           {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </div>
        
        {/* Ripple Effect on Active */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[#fbbf24] opacity-20"></span>
        )}
      </button>

      {/* Label (Only visible on hover) */}
      <div className="absolute left-14 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 backdrop-blur-sm">
        {isPlaying ? 'BGM On' : 'BGM Off'}
      </div>
    </div>
  );
};

export default BackgroundMusic;
