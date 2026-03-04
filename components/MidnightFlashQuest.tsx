import React, { useState, useEffect } from 'react';
import { Moon, Clock, CheckCircle, Sparkles, Lock } from 'lucide-react';
import { User } from '../types';

interface MidnightFlashQuestProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  themeStyles: any;
}

const QUESTS = [
  { id: 'tahajud', label: 'The Silent Prayer', desc: 'Perform 2 Rakaat Tahajud', xp: 500 },
  { id: 'istighfar', label: 'Seeker of Forgiveness', desc: 'Recite Astaghfirullah 70x', xp: 300 },
  { id: 'mulk', label: 'Guardian of the Grave', desc: 'Read Surah Al-Mulk', xp: 400 },
  { id: 'sedekah', label: 'Hidden Charity', desc: 'Give Sadaqah (Transfer/QRIS)', xp: 350 },
];

const MidnightFlashQuest: React.FC<MidnightFlashQuestProps> = ({ currentUser, onUpdateUser }) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [quest, setQuest] = useState(QUESTS[0]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Initialize Quest & Completion Status (Run Once)
  useEffect(() => {
    // Pick random quest based on day/seed
    const randomQuest = QUESTS[Math.floor(Math.random() * QUESTS.length)];
    setQuest(randomQuest);

    // Check if already completed today
    const todayKey = new Date().toDateString();
    const completedKey = `midnight_quest_${currentUser.username}_${todayKey}`;
    if (localStorage.getItem(completedKey)) {
        setIsCompleted(true);
    }
  }, [currentUser]);

  // Check Time Logic (Run Interval)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Active between 02:00 and 04:00
      const isMidnight = (hours >= 2 && hours < 4) || isSimulating;
      setIsActive(isMidnight);

      if (isMidnight) {
        // Calculate time left until 04:00
        const target = new Date();
        target.setHours(4, 0, 0, 0);
        if (isSimulating) {
            // If simulating, just show fake countdown
            setTimeLeft("01:30:00"); 
        } else {
            const diff = target.getTime() - now.getTime();
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        }
      } else {
        // Calculate time until next 02:00
        const target = new Date();
        if (hours >= 4) target.setDate(target.getDate() + 1);
        target.setHours(2, 0, 0, 0);
        
        const diff = target.getTime() - now.getTime();
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${h}h ${m}m`);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleComplete = () => {
    if (isCompleted) return;

    // Update User
    const updatedUser = {
        ...currentUser,
        bonusPoints: (currentUser.bonusPoints || 0) + quest.xp
    };
    onUpdateUser(updatedUser);

    // Save State
    const todayKey = new Date().toDateString();
    const completedKey = `midnight_quest_${currentUser.username}_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
    setIsCompleted(true);
    
    // Alert
    alert(`MashaAllah! You received ${quest.xp} XP for your night worship.`);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${isActive ? 'border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)]' : 'border-white/10'} bg-[#020617]/80 backdrop-blur-md mb-8 group transition-all duration-500`}>
      
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         {isActive ? (
             <>
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full animate-pulse-slow delay-1000"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
             </>
         ) : (
             <div className="absolute inset-0 bg-black/60 z-10"></div>
         )}
      </div>

      <div className="relative z-20 p-6 flex flex-col md:flex-row items-center gap-6">
         
         {/* Icon / Status */}
         <div className="shrink-0 relative">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${isActive ? 'bg-gradient-to-br from-indigo-900 to-purple-900 border-yellow-400/50 shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'bg-slate-900 border-slate-700 grayscale'}`}>
                {isActive ? (
                    <Moon className="w-10 h-10 text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
                ) : (
                    <Lock className="w-8 h-8 text-slate-500" />
                )}
            </div>
            {isActive && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-lg border border-red-400">
                    LIVE
                </div>
            )}
         </div>

         {/* Content */}
         <div className="flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-1">
                <h3 className={`text-xl font-black uppercase tracking-widest ${isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200' : 'text-slate-500'}`}>
                    {isActive ? "Midnight Flash Quest" : "The Gates are Closed"}
                </h3>
                {isActive && (
                    <div className="flex items-center gap-1 text-xs font-mono text-yellow-400/80 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                        <Clock className="w-3 h-3" /> {timeLeft}
                    </div>
                )}
            </div>

            {isActive ? (
                <>
                    <p className="text-sm text-indigo-200 mb-4 font-medium">
                        "The Lord descends to the lowest heaven in the last third of the night..."
                    </p>
                    
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="text-left">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Current Mission</p>
                            <p className="font-bold text-white text-lg">{quest.label}</p>
                            <p className="text-xs text-white/60">{quest.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-yellow-400 font-black text-xl">+{quest.xp} XP</div>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-sm text-slate-500">
                    The gates of Qiyamul Lail open at <span className="text-slate-300 font-bold">02:00 AM</span>. Prepare your heart and soul.
                    <br/>
                    <span className="text-xs opacity-50 mt-1 block">Next opening in: {timeLeft}</span>
                </p>
            )}
         </div>

         {/* Action Button */}
         {isActive && (
             <div className="shrink-0 w-full md:w-auto">
                 {isCompleted ? (
                     <button disabled className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold flex items-center justify-center gap-2 cursor-default">
                         <CheckCircle className="w-5 h-5" /> Completed
                     </button>
                 ) : (
                     <button 
                        onClick={handleComplete}
                        className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-400/50 text-white font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                     >
                         <Sparkles className="w-5 h-5" /> Complete Quest
                     </button>
                 )}
             </div>
         )}

      </div>
      
      {/* Dev Toggle (Hidden in Prod, but useful for demo) */}
      <button 
        onClick={() => setIsSimulating(!isSimulating)}
        className="absolute bottom-1 right-1 opacity-0 hover:opacity-20 text-[8px] text-white p-1"
      >
        Dev: Toggle Midnight
      </button>
    </div>
  );
};

export default MidnightFlashQuest;
