
import React, { useEffect, useState, useRef } from 'react';
import { WeeklyData, User } from '../types';
import { Star, BookOpen, Moon, Sun, Award, ArrowRight, Quote, Download } from 'lucide-react';
import { calculateDayPoints } from '../utils';
import html2canvas from 'html2canvas';
import { api } from '../services/ApiService';

interface AshraReportModalProps {
  data: WeeklyData;
  currentUser: User;
  onClose: () => void;
}

const AshraReportModal: React.FC<AshraReportModalProps> = ({ data, currentUser, onClose }) => {
  const [show, setShow] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
  }, []);

  // --- 1. ANALISIS DATA (HARI 1-10) ---
  const first10Days = data.days.slice(0, 10);
  
  let totalXP = 0;
  let totalJamaah = 0; // Max 50
  let totalPuasa = 0; // Max 10
  let totalTarawih = 0; // Max 10
  let totalTilawah = 0;
  let subuhJamaah = 0;

  first10Days.forEach(day => {
    totalXP += calculateDayPoints(day);
    const jamaahCount = Object.values(day.prayers).filter(p => p === 2).length;
    totalJamaah += jamaahCount;
    if (day.prayers.subuh === 2) subuhJamaah++;
    if (day.shaum) totalPuasa++;
    if (day.tarawih) totalTarawih++;
    totalTilawah += day.tilawah;
  });

  // --- 2. GENERATE TITLE KEREN (Berdasarkan Dominasi Amal) ---
  let title = 'The Rising Star';
  let subTitle = 'Cahaya Harapan Baru';
  let color = 'text-yellow-400';
  let bgGradient = 'from-slate-900 to-black';

  // Logika Title: Mana yang paling menonjol?
  if (totalPuasa >= 9 && totalTarawih >= 8 && totalJamaah >= 40) {
    title = 'The Legend of Ashra';
    subTitle = 'Pahlawan 10 Hari Pertama';
    color = 'text-purple-400';
    bgGradient = 'from-purple-900/80 to-black';
  } else if (totalTilawah >= 100) { // Misal 100 baris ~ 1 Juz (tergantung mushaf, anggap simbolis rajin baca)
    title = 'Quranic Soul';
    subTitle = 'Jiwa yang Terpaut Al-Qur\'an';
    color = 'text-emerald-400';
    bgGradient = 'from-emerald-900/80 to-black';
  } else if (subuhJamaah >= 8) {
    title = 'Guardian of Dawn';
    subTitle = 'Penjaga Waktu Subuh';
    color = 'text-blue-400';
    bgGradient = 'from-blue-900/80 to-black';
  } else if (totalJamaah >= 35) {
    title = 'Mosque Walker';
    subTitle = 'Langkah Kaki Menuju Masjid';
    color = 'text-amber-400';
    bgGradient = 'from-amber-900/80 to-black';
  } else if (totalPuasa >= 9) {
    title = 'Iron Will';
    subTitle = 'Tekad Baja Berpuasa';
    color = 'text-red-400';
    bgGradient = 'from-red-900/80 to-black';
  }

  // --- 3. REKOMENDASI POSITIF (GOOD VIBES) ---
  let recommendation = "";
  
  if (totalXP > 500) {
    recommendation = "Luar biasa! Semangatmu membara seperti api yang tak padam. Pertahankan momentum ini, karena 10 hari kedua (Maghfirah) menantimu dengan ampunan yang luas.";
  } else {
    recommendation = "Setiap langkah kecilmu dicatat oleh Malaikat. Jangan berkecil hati, Ramadhan masih panjang! Jadikan 10 hari kedua sebagai panggung kebangkitanmu.";
  }

  // --- 4. SAVE TITLE TO PROFILE ---
  useEffect(() => {
     if (currentUser.specialTitle !== title) {
        const updatedUser = { ...currentUser, specialTitle: title };
        api.updateUserProfile(updatedUser).catch(console.error);
     }
  }, [title]);

  // --- 5. DOWNLOAD FUNCTION ---
  const handleDownload = async () => {
    if (!reportRef.current) return;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#000000',
        scale: 2, // High resolution
        useCORS: true // Allow external images (avatar)
      });
      
      const link = document.createElement('a');
      link.download = `Ashra_Report_${currentUser.username}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to capture report:", err);
      alert("Gagal menyimpan gambar. Coba screenshot manual ya!");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 overflow-y-auto">
      <div 
         className={`absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}
      />
      
      <div className={`relative w-full max-w-lg transform transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-20 opacity-0'} my-8`}>
         
         {/* Card Container (Ref for Capture) */}
         <div ref={reportRef} className={`relative overflow-hidden rounded-[2.5rem] border-2 border-white/10 bg-gradient-to-br ${bgGradient} shadow-2xl`}>
            
            {/* Header Ornament */}
            <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
            
            <div className="p-8 relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-6">
                <Award className="w-3 h-3" /> Ashra Report • Phase 1
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-1">
                Pencapaian <span className={color}>10 Hari Pertama</span>
              </h2>
              <p className="text-white/60 text-xs font-mono mb-8 uppercase tracking-widest">{currentUser.fullName}</p>

              {/* TITLE DISPLAY (HERO) */}
              <div className="mb-10 relative py-4">
                 <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl`}></div>
                 <h1 className={`text-4xl md:text-5xl font-black uppercase leading-none ${color} drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] mb-2`}>
                    {title}
                 </h1>
                 <p className="text-sm text-white/80 font-serif italic tracking-wide">"{subTitle}"</p>
              </div>

              {/* STATS GRID (Simplified & Clean) */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                 <div className="p-4 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase font-bold">
                       <Sun className="w-3 h-3" /> Sholat Jamaah
                    </div>
                    <div className="text-2xl font-black text-white">{totalJamaah}<span className="text-sm text-white/30">/50</span></div>
                 </div>
                 <div className="p-4 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase font-bold">
                       <BookOpen className="w-3 h-3" /> Tilawah
                    </div>
                    <div className="text-2xl font-black text-white">{totalTilawah}<span className="text-sm text-white/30"> Baris</span></div>
                 </div>
                 <div className="p-4 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase font-bold">
                       <Moon className="w-3 h-3" /> Tarawih
                    </div>
                    <div className="text-2xl font-black text-white">{totalTarawih}<span className="text-sm text-white/30">/10</span></div>
                 </div>
                 <div className="p-4 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase font-bold">
                       <Star className="w-3 h-3" /> Total XP
                    </div>
                    <div className="text-2xl font-black text-yellow-400">{totalXP}</div>
                 </div>
              </div>

              {/* POSITIVE VIBES MESSAGE */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left relative mb-8">
                 <Quote className="absolute top-4 right-4 w-8 h-8 text-white/5 rotate-180" />
                 <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${color}`}>Pesan Semangat</p>
                 <p className="text-sm text-white/90 leading-relaxed font-medium italic">
                   "{recommendation}"
                 </p>
                 <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-white/20">
                       <img src="https://res.cloudinary.com/dauvrgbcp/image/upload/v1771130765/Avatar_Afriza_Mentor_1_b5sjcw.png" className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-white">Kak Afriza</p>
                       <p className="text-[8px] text-white/50 uppercase">Mentor</p>
                    </div>
                 </div>
              </div>
              
              {/* Footer Watermark for Capture */}
              <div className="text-[8px] text-white/20 font-mono uppercase tracking-widest mb-4">
                 Generated by Muslim Daily Quest • Ramadhan 1447 H
              </div>

            </div>
         </div>

         {/* ACTION BUTTONS (Outside Capture Area) */}
         <div className="mt-6 space-y-3">
            <button 
              onClick={handleDownload}
              disabled={isCapturing}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors flex items-center justify-center gap-2`}
            >
              {isCapturing ? 'Saving...' : <><Download className="w-4 h-4" /> Simpan Pencapaian</>}
            </button>

            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-black bg-white hover:bg-slate-200 transition-colors shadow-lg flex items-center justify-center gap-2 group`}
            >
              Lanjut ke Fase Maghfirah <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
         </div>

      </div>
    </div>
  );
};

export default AshraReportModal;
