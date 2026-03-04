import React, { useState, useEffect } from 'react';
import { Heart, Moon, Sun, HeartHandshake, Users, Shield, CheckCircle2, UtensilsCrossed, Sparkles } from 'lucide-react';
import { User } from '../types';

interface BonusDeedsPanelProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  themeStyles: any;
}

const BONUS_DEEDS = [
  { id: 'birrul_walidain', label: 'Birrul Walidain', desc: 'Berbakti pada ortu (pijat, bantu, senyum)', xp: 1000, icon: Heart, color: 'text-pink-500' },
  { id: 'tahajud', label: 'Qiyamul Lail', desc: 'Sholat malam (min. 2 rakaat)', xp: 800, icon: Moon, color: 'text-indigo-400' },
  { id: 'iftar', label: 'Beri Buka Puasa', desc: 'Traktir iftar (meski air/kurma)', xp: 700, icon: UtensilsCrossed, color: 'text-orange-400' },
  { id: 'sedekah_subuh', label: 'Sedekah Subuh', desc: 'Sedekah di waktu fajar', xp: 500, icon: HeartHandshake, color: 'text-emerald-400' },
  { id: 'dhuha', label: 'Sholat Dhuha', desc: 'Sholat pagi (min. 2 rakaat)', xp: 400, icon: Sun, color: 'text-yellow-400' },
  { id: 'help_others', label: 'Bantu Orang Lain', desc: 'Bantu teman, tetangga, atau orang asing', xp: 400, icon: Users, color: 'text-blue-400' },
  { id: 'patience', label: 'Sabar & Memaafkan', desc: 'Menahan marah atau memaafkan', xp: 300, icon: Shield, color: 'text-purple-400' },
  { id: 'rawatib', label: 'Sholat Rawatib', desc: 'Sunnah Qobliyah/Ba\'diyah', xp: 200, icon: CheckCircle2, color: 'text-teal-400', maxCount: 5 },
];

const BonusDeedsPanel: React.FC<BonusDeedsPanelProps> = ({ currentUser, onUpdateUser, themeStyles }) => {
  const [completedDeeds, setCompletedDeeds] = useState<Record<string, number>>({});
  const [showConfetti, setShowConfetti] = useState<string | null>(null);

  // Load daily progress
  useEffect(() => {
    const todayKey = new Date().toDateString();
    const saved = localStorage.getItem(`bonus_deeds_${currentUser.username}_${todayKey}`);
    if (saved) {
      setCompletedDeeds(JSON.parse(saved));
    } else {
      setCompletedDeeds({});
    }
  }, [currentUser]);

  const handleToggleDeed = (deedId: string) => {
    const deed = BONUS_DEEDS.find(d => d.id === deedId);
    if (!deed) return;
    
    const maxCount = deed.maxCount || 1;
    const currentCount = completedDeeds[deedId] || 0;

    let newCount = currentCount;
    let xpChange = 0;

    if (currentCount < maxCount) {
        // Increment
        newCount = currentCount + 1;
        xpChange = deed.xp;
        setShowConfetti(deedId);
        setTimeout(() => setShowConfetti(null), 2000);
    } else {
        // Reset if max reached
        newCount = 0;
        xpChange = -(deed.xp * maxCount);
    }

    // Update State
    const newCompletedDeeds = { ...completedDeeds, [deedId]: newCount };
    setCompletedDeeds(newCompletedDeeds);

    // Save to LocalStorage
    const todayKey = new Date().toDateString();
    localStorage.setItem(`bonus_deeds_${currentUser.username}_${todayKey}`, JSON.stringify(newCompletedDeeds));

    // Update User XP
    const updatedUser = {
        ...currentUser,
        bonusPoints: (currentUser.bonusPoints || 0) + xpChange
    };
    onUpdateUser(updatedUser);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${themeStyles.border} bg-black/40 backdrop-blur-md mb-8 p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
            <h3 className={`text-xl font-bold ${themeStyles.textPrimary}`}>Gudang Senjata Rahasia</h3>
            <p className={`text-xs ${themeStyles.textSecondary}`}>Amalan Sunnah & Sosial (Bonus XP)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BONUS_DEEDS.map((deed) => {
            const count = completedDeeds[deed.id] || 0;
            const maxCount = deed.maxCount || 1;
            const isMax = count >= maxCount;
            const Icon = deed.icon;

            return (
                <button
                    key={deed.id}
                    onClick={() => handleToggleDeed(deed.id)}
                    className={`relative group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left
                        ${isMax 
                            ? 'bg-emerald-900/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }
                    `}
                >
                    {/* Icon Box */}
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border ${isMax ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : `bg-white/5 border-white/10 ${deed.color}`}`}>
                        <Icon className="w-6 h-6" />
                    </div>

                    {/* Text */}
                    <div className="flex-grow">
                        <div className="flex items-center justify-between">
                            <h4 className={`font-bold ${isMax ? 'text-emerald-400' : 'text-slate-200'}`}>{deed.label}</h4>
                            <span className={`text-xs font-black px-2 py-0.5 rounded ${isMax ? 'bg-emerald-500 text-black' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                +{deed.xp} XP
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-tight mt-1">{deed.desc}</p>
                        
                        {/* Multi-step Progress (for Rawatib) */}
                        {deed.maxCount && (
                            <div className="flex gap-1 mt-2">
                                {[...Array(deed.maxCount)].map((_, i) => (
                                    <div key={i} className={`h-1.5 flex-grow rounded-full ${i < count ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Checkbox Visual */}
                    <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isMax ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 group-hover:border-slate-300'}`}>
                        {isMax && <CheckCircle2 className="w-4 h-4 text-black" />}
                    </div>

                    {/* Floating XP Animation */}
                    {showConfetti === deed.id && (
                        <div className="absolute top-0 right-0 -mt-8 animate-bounce text-yellow-400 font-black text-lg drop-shadow-md pointer-events-none">
                            +{deed.xp} XP!
                        </div>
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default BonusDeedsPanel;
