import React, { useState } from 'react';
import { Trophy, BookOpen, UtensilsCrossed, Users, Star, X } from 'lucide-react';
import { WeeklyData, User, PRAYER_KEYS, getRankInfo } from '../types';
import { calculateTotalUserPoints } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: WeeklyData;
  currentUser: User;
  themeStyles: any;
}

const RamadhanRecapModal: React.FC<Props> = ({ isOpen, onClose, data, currentUser, themeStyles }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  // Calculate Stats
  let totalTilawah = 0;
  let totalShaum = 0;
  let totalJamaah = 0;

  data.days.forEach(day => {
    totalTilawah += day.tilawah;
    if (day.shaum) totalShaum++;
    PRAYER_KEYS.forEach(key => {
      if (day.prayers[key] === 2) totalJamaah++;
    });
  });

  const totalPoints = calculateTotalUserPoints(currentUser, data);
  const currentRank = getRankInfo(totalPoints).name;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-zinc-950 border border-yellow-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.15)] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className={`p-6 bg-gradient-to-br ${themeStyles.gradientFrom} ${themeStyles.gradientTo} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-20 mix-blend-overlay"></div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="relative z-10 text-center">
            <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
            <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-md">
              {step === 0 ? 'Idul Fitri Telah Tiba!' : 'Pencapaian Ramadhan'}
            </h2>
            <p className="text-yellow-100/80 text-sm mt-2 font-medium">
              {step === 0 ? 'Waktunya melihat hasil perjuanganmu' : '1447 H / 2026 M'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 0 ? (
            <div className="text-center space-y-6">
              <p className="text-zinc-300 leading-relaxed">
                Ramadhan tahun ini telah berakhir. Sebelum melihat hasil akhir perjuanganmu, pastikan semua data ibadahmu sudah terisi dengan lengkap.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => setStep(1)}
                  className="w-full py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                >
                  Sudah Lengkap, Lihat Hasilnya!
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-sm transition-all active:scale-95 border border-white/10"
                >
                  Tunggu, Saya Mau Isi Dulu
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
                  <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{totalPoints}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Total XP</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                  <Trophy className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-lg font-black text-white truncate px-1">{currentRank}</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Final Rank</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg"><BookOpen className="w-5 h-5 text-cyan-400" /></div>
                    <span className="text-sm font-bold text-zinc-300">Total Tilawah</span>
                  </div>
                  <span className="text-xl font-black text-white">{totalTilawah} <span className="text-xs text-zinc-500 font-normal">Ayat</span></span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg"><UtensilsCrossed className="w-5 h-5 text-amber-400" /></div>
                    <span className="text-sm font-bold text-zinc-300">Total Puasa</span>
                  </div>
                  <span className="text-xl font-black text-white">{totalShaum} <span className="text-xs text-zinc-500 font-normal">Hari</span></span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg"><Users className="w-5 h-5 text-emerald-400" /></div>
                    <span className="text-sm font-bold text-zinc-300">Shalat Berjamaah</span>
                  </div>
                  <span className="text-xl font-black text-white">{totalJamaah} <span className="text-xs text-zinc-500 font-normal">Waktu</span></span>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-sm transition-all active:scale-95"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RamadhanRecapModal;
