import React from 'react';
import { X, Flame, Swords, Star, Palette } from 'lucide-react';

interface PhaseAnnouncementModalProps {
  onClose: () => void;
}

const PhaseAnnouncementModal: React.FC<PhaseAnnouncementModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-[#1a0500] border border-orange-500/30 rounded-3xl p-1 overflow-hidden shadow-[0_0_50px_rgba(234,88,12,0.3)] relative">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-600/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-black/40 rounded-[20px] p-6 md:p-8 relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,88,12,0.5)] animate-pulse-slow">
                    <Flame className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
                    Incoming Update
                </h2>
                <p className="text-sm font-bold uppercase tracking-widest text-orange-200/50">
                    Phase 2: The Maghfirah Expansion
                </p>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-950/20 border border-orange-500/10">
                    <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
                        <Palette className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-orange-100 text-sm uppercase mb-1">New Theme: Maghfirah</h4>
                        <p className="text-xs text-white/50">Tampilan aplikasi akan berubah menjadi nuansa Amber & Emas yang hangat mulai besok (Hari 11).</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-950/20 border border-orange-500/10">
                    <div className="p-2 rounded-lg bg-red-500/10 shrink-0">
                        <Swords className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-red-100 text-sm uppercase mb-1">Community Raid</h4>
                        <p className="text-xs text-white/50">Fitur Boss Battle terbuka! Kumpulkan XP bersama seluruh user untuk mengalahkan "The Great Nafsu".</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-950/20 border border-orange-500/10">
                    <div className="p-2 rounded-lg bg-yellow-500/10 shrink-0">
                        <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-yellow-100 text-sm uppercase mb-1">Mythical Immortal Stars</h4>
                        <p className="text-xs text-white/50">Sistem Rank diperbarui. Kumpulkan Bintang untuk setiap 1000 XP di atas rank tertinggi.</p>
                    </div>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                Siap Menanti!
            </button>
            <p className="text-[10px] text-center mt-4 text-white/20 uppercase tracking-widest">
                Update unlocks automatically on Day 11
            </p>
        </div>
      </div>
    </div>
  );
};

export default PhaseAnnouncementModal;
