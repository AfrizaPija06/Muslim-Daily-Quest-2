import React, { useState } from 'react';
import { Trophy, BookOpen, UtensilsCrossed, Users, Star, X, Quote, Send, Activity, Moon } from 'lucide-react';
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
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!isOpen) return null;

  // Calculate Stats
  let totalTilawah = 0;
  let totalShaum = 0;
  let totalJamaah = 0;
  let totalSubuhJamaah = 0;
  let totalTarawih = 0;
  let emptyPrayers = 0;

  data.days.forEach(day => {
    totalTilawah += day.tilawah;
    if (day.shaum) totalShaum++;
    if (day.tarawih) totalTarawih++;
    
    if (day.prayers.subuh === 2) totalSubuhJamaah++;
    
    PRAYER_KEYS.forEach(key => {
      if (day.prayers[key] === 2) totalJamaah++;
      if (day.prayers[key] === 0) emptyPrayers++;
    });
  });

  const totalPoints = calculateTotalUserPoints(currentUser, data);
  const currentRank = getRankInfo(totalPoints).name;

  // Evaluation Logic
  const totalDays = 30;
  const subuhRate = totalSubuhJamaah / totalDays;
  const tarawihRate = totalTarawih / totalDays;
  const tilawahAvg = totalTilawah / totalDays;
  const emptyPrayerRate = emptyPrayers / (totalDays * 5);

  const evaluations: string[] = [];

  if (emptyPrayerRate > 0.3) {
    evaluations.push("Banyak waktu shalat wajib yang terlewat atau kosong. Ini menunjukkan perlunya meningkatkan kedisiplinan dan prioritas terhadap shalat lima waktu.");
  } else if (subuhRate < 0.5) {
    evaluations.push("Tantangan terbesarmu sepertinya ada di waktu Subuh. Disiplin bangun pagi dan melangkah ke masjid perlu ditingkatkan lagi untuk meraih keberkahan fajar.");
  }

  if (tarawihRate < 0.5) {
    evaluations.push("Ibadah malammu (Tarawih) masih sering terlewat. Jangan biarkan kelelahan siang hari mengalahkan semangat menghidupkan malam.");
  }

  if (tilawahAvg < 10) {
    evaluations.push("Interaksimu dengan Al-Quran masih tergolong minim. Jadikan membaca Al-Quran sebagai kebutuhan harian, walau hanya beberapa ayat.");
  }

  if (evaluations.length === 0) {
    evaluations.push("MasyaAllah! Disiplin, konsistensi, dan semangat ibadahmu sangat luar biasa. Pertahankan kebiasaan emas ini di 11 bulan berikutnya!");
  }

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    // In a real app, send to API here
    setFeedbackSent(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-zinc-950 border border-yellow-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.15)] animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`p-6 bg-gradient-to-br ${themeStyles.gradientFrom} ${themeStyles.gradientTo} relative overflow-hidden shrink-0`}>
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
        <div className="p-6 overflow-y-auto hide-scrollbar">
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
              
              {/* Profile Section */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.avatarSeed || currentUser.username}`} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full border-2 border-yellow-500 bg-black"
                />
                <div>
                  <h3 className="text-lg font-black text-white">{currentUser.fullName || currentUser.username}</h3>
                  <p className="text-xs text-yellow-400 uppercase tracking-widest font-bold">{currentRank}</p>
                </div>
              </div>

              {/* Quote Section */}
              <div className="relative bg-gradient-to-br from-emerald-900/40 to-teal-900/40 p-5 rounded-2xl border border-emerald-500/20 text-center">
                <Quote className="w-8 h-8 text-emerald-500/30 absolute top-2 left-2" />
                <p className="text-emerald-100/90 text-sm italic leading-relaxed relative z-10 font-medium">
                  "Kemenangan sejati bukanlah saat kita menaklukkan musuh, melainkan saat kita berhasil menaklukkan hawa nafsu kita sendiri."
                </p>
              </div>

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
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg"><Moon className="w-5 h-5 text-indigo-400" /></div>
                    <span className="text-sm font-bold text-zinc-300">Shalat Tarawih</span>
                  </div>
                  <span className="text-xl font-black text-white">{totalTarawih} <span className="text-xs text-zinc-500 font-normal">Malam</span></span>
                </div>
              </div>

              {/* Evaluation Section */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-yellow-500" />
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest">Evaluasi Perjalanan</h4>
                </div>
                <div className="space-y-3">
                  {evaluations.map((evalText, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 shrink-0"></div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-medium">{evalText}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Congrats & Prayers */}
              <div className="text-center space-y-2 py-2">
                <h4 className="text-yellow-400 font-black uppercase tracking-widest text-sm">Taqabbalallahu Minna Wa Minkum</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Selamat! Kamu telah menyelesaikan perjalanan Ramadhan ini. Semoga Allah menerima amal ibadah kita dan mempertemukan kita kembali dengan Ramadhan tahun depan. Aamiin.
                </p>
              </div>

              {/* Feedback Form */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 className="text-white font-bold text-sm">Kesan, Pesan & Saran</h4>
                {feedbackSent ? (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl text-center font-medium">
                    Terima kasih atas masukannya! Jazakallahu khairan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Apa saranmu untuk event selanjutnya?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 resize-none h-24"
                    />
                    <button 
                      onClick={handleSendFeedback}
                      disabled={!feedback.trim()}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Kirim Masukan
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={onClose}
                className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-sm transition-all active:scale-95 mt-4"
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
