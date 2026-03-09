import React, { useState, useEffect } from 'react';
import { Megaphone, X, ShieldAlert, Sparkles, Moon } from 'lucide-react';

interface AnnouncementModalProps {
  themeStyles: any;
  currentUser: any;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ themeStyles, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ANNOUNCEMENT_VERSION = 'v1_phase3_updates';

  useEffect(() => {
    if (currentUser) {
      const hasSeen = localStorage.getItem(`announcement_${ANNOUNCEMENT_VERSION}_${currentUser.username}`);
      if (!hasSeen) {
        // Add a slight delay before showing to allow background to load
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const handleClose = () => {
    setIsOpen(false);
    if (currentUser) {
      localStorage.setItem(`announcement_${ANNOUNCEMENT_VERSION}_${currentUser.username}`, 'true');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md bg-zinc-950 border ${themeStyles.border} rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500`}>
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${themeStyles.gradientFrom} ${themeStyles.gradientTo} p-6 text-center relative`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <Megaphone className="w-10 h-10 text-white mx-auto mb-2 relative z-10 animate-bounce" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest relative z-10 drop-shadow-md">
            PENGUMUMAN PENTING
          </h2>
          <p className="text-white/90 text-sm font-medium relative z-10">
            Pembaruan Sistem & Fitur Baru
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Item 1 */}
          <div className="flex gap-4">
            <div className="bg-red-500/20 p-3 rounded-xl shrink-0 h-fit border border-red-500/30">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm mb-2">⚔️ RAID BOSS: MODE OVERTIME</h3>
              <div className="text-zinc-400 text-sm leading-relaxed space-y-2">
                <p>Kalau grup mentoring belum berhasil mengalahkan "The Great Nafsu" di Fase 2, Boss tidak akan hilang!</p>
                <p>Boss akan masuk Mode <strong className="text-red-300">OVERTIME</strong>.</p>
                <p>Ini jadi kesempatan terakhir sebelum Idul Fitri.<br/>Kalahkan Boss-nya dan klaim 1000 XP!</p>
              </div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl shrink-0 h-fit border border-emerald-500/30">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-2">🗡️ GUDANG SENJATA TERBUKA</h3>
              <div className="text-zinc-400 text-sm leading-relaxed space-y-2">
                <p>Sekarang ada misi tambahan (Sunnah & Sosial).</p>
                <p>Setiap misi yang kamu selesaikan akan memberi Bonus XP pasif.<br/>Semua poin akan langsung dihitung untuk:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Menaikkan Rank kamu</li>
                  <li>Mengurangi HP Raid Boss</li>
                </ul>
                <p>Artinya, makin banyak anggota grup mentoring yang ikut misi, Boss akan makin cepat kalah!</p>
              </div>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex gap-4">
            <div className="bg-indigo-500/20 p-3 rounded-xl shrink-0 h-fit border border-indigo-500/30">
              <Moon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-sm mb-2">🌙 MIDNIGHT FLASH QUEST</h3>
              <div className="text-zinc-400 text-sm leading-relaxed space-y-2">
                <p>Khusus di 10 malam terakhir (Fase 3).</p>
                <p>Akan ada misi rahasia tengah malam yang hanya aktif pada jam:<br/><strong className="text-indigo-300">02.00 – 04.00 pagi</strong></p>
                <p>Selesaikan quest-nya dan dapatkan XP tambahan besar untuk mengejar Lailatul Qadar!</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-2 border-t border-white/5 bg-zinc-950/50">
          <button
            onClick={handleClose}
            className={`w-full py-3 rounded-xl bg-gradient-to-r ${themeStyles.gradientFrom} ${themeStyles.gradientTo} text-white font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg`}
          >
            SIAP! LANJUTKAN MISI!
          </button>
        </div>

        {/* Close Button (Top Right) */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
};

export default AnnouncementModal;
