
import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Moon, UtensilsCrossed, Calendar, Target, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import PrayerCell from './PrayerCell';
import { PRAYER_KEYS, PrayerState, WeeklyData, POINTS, User, HIJRI_YEAR } from '../types';
import { RAMADHAN_START_DATE } from '../constants';
import DailyTargetPanel from './DailyTargetPanel';
import BonusDeedsPanel from './BonusDeedsPanel';
import CommunityRaid from './CommunityRaid';
import MidnightFlashQuest from './MidnightFlashQuest';
import RaidNotification from './RaidNotification';
import BonusNotification from './BonusNotification';
import AnnouncementModal from './AnnouncementModal';
import { api } from '../services/ApiService';
import { calculateTotalUserPoints } from '../utils';

interface TrackerPageProps {
  currentUser: User;
  data: WeeklyData;
  setData: React.Dispatch<React.SetStateAction<WeeklyData>>;
  themeStyles: any;
  currentTheme: string;
  totalPoints: number;
  onUpdateUser: (user: User) => void;
}

const TrackerPage: React.FC<TrackerPageProps> = ({ 
  data, setData, themeStyles, currentTheme, currentUser, onUpdateUser 
}) => {
  const activeDayRef = useRef<HTMLDivElement>(null);
  const [totalCommunityXP, setTotalCommunityXP] = useState(0);
  const [showDailyTarget, setShowDailyTarget] = useState(false);
  const [showRaidNotif, setShowRaidNotif] = useState(false);
  const [showBonusNotif, setShowBonusNotif] = useState(false);
  const [hasClaimedRaidReward, setHasClaimedRaidReward] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const claimed = localStorage.getItem(`raid_reward_claimed_1447_${currentUser.username}`);
      setHasClaimedRaidReward(!!claimed);
    }
  }, [currentUser]);

  const handleClaimRaidReward = () => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      bonusPoints: (currentUser.bonusPoints || 0) + 1000
    };
    
    onUpdateUser(updatedUser);
    localStorage.setItem(`raid_reward_claimed_1447_${currentUser.username}`, 'true');
    setHasClaimedRaidReward(true);
    alert("ALHAMDULILLAH! You have claimed your victory reward: 1000 XP!");
  };

  const getTodayIndex = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(RAMADHAN_START_DATE);
    start.setHours(0,0,0,0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays); 
  };

  const currentDayIndex = getTodayIndex();
  const [selectedDayIndex, setSelectedDayIndex] = useState(currentDayIndex);

  useEffect(() => {
    if (activeDayRef.current) {
      activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Fetch Community XP for Raid Boss (Day 11+)
  useEffect(() => {
    if (currentDayIndex >= 10) {
      const fetchCommunityXP = async () => {
        try {
          const users = await api.getAllUsersWithPoints();
          const total = users.reduce((acc, user) => {
             const points = calculateTotalUserPoints(user, user.trackerData);
             return acc + points;
          }, 0);
          setTotalCommunityXP(total);
        } catch (e) {
          console.error("Failed to fetch community XP", e);
        }
      };
      fetchCommunityXP();
      
      // Show Notification Sequence
      setShowRaidNotif(true);
      
      const timer1 = setTimeout(() => {
          setShowRaidNotif(false);
          // Show bonus notif after raid notif closes
          setTimeout(() => setShowBonusNotif(true), 500);
      }, 8000);

      const timer2 = setTimeout(() => {
          setShowBonusNotif(false);
      }, 16500); // 8000 + 500 + 8000

      return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
      };
    }
  }, [currentDayIndex]);

  const calculateDayPoints = (day: any) => {
    const prayerPoints = Object.values(day.prayers as Record<string, number>).reduce((acc: number, val: number) => {
      if (val === 1) return acc + POINTS.HOME;
      if (val === 2) return acc + POINTS.MOSQUE;
      return acc;
    }, 0);
    const extra = (day.shaum ? POINTS.SHAUM : 0) + (day.tarawih ? POINTS.TARAWIH : 0);
    return prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE) + extra;
  };

  return (
    <div className="w-full pb-32">
      {/* ANNOUNCEMENT MODAL */}
      <AnnouncementModal themeStyles={themeStyles} currentUser={currentUser} />

      {/* RAID NOTIFICATION */}
      <RaidNotification isVisible={showRaidNotif} onClose={() => setShowRaidNotif(false)} />
      <BonusNotification isVisible={showBonusNotif} onClose={() => setShowBonusNotif(false)} />

      {/* HEADER SECTION */}
      <div className="mb-8 mt-2 relative overflow-hidden rounded-3xl p-8 border border-white/10 shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-amber-600/20 z-0"></div>
         <div className="relative z-10">
            <h2 className={`text-4xl ${themeStyles.fontDisplay} font-bold uppercase tracking-wider ${themeStyles.textPrimary} mb-2 drop-shadow-lg`}>
              Ramadhan Quest
            </h2>
            <p className={`${themeStyles.textSecondary} text-sm font-mono uppercase tracking-widest flex items-center gap-2`}>
              <Moon className="w-4 h-4 text-yellow-400" />
              {HIJRI_YEAR} • 30 Days of Istiqamah
            </p>
         </div>
      </div>

      {/* MIDNIGHT FLASH QUEST - Only Show on Day 21+ (Phase 3) */}
      {currentDayIndex >= 20 && (
         <div className="mb-8 animate-reveal">
            <MidnightFlashQuest 
              currentUser={currentUser}
              onUpdateUser={onUpdateUser}
              themeStyles={themeStyles}
            />
         </div>
      )}

      {/* COMMUNITY RAID WIDGET - Only Show on Day 11+ */}
      {currentDayIndex >= 10 && (
         <div className="mb-8 animate-reveal">
            <CommunityRaid 
              totalXP={totalCommunityXP} 
              themeStyles={themeStyles} 
              onClaimReward={handleClaimRaidReward}
              hasClaimedReward={hasClaimedRaidReward}
              currentDayIndex={currentDayIndex}
            />
         </div>
      )}

      {/* BONUS DEEDS PANEL (THE HIDDEN ARMORY) */}
      <div className="mb-8 animate-reveal">
         <BonusDeedsPanel 
            currentUser={currentUser}
            onUpdateUser={onUpdateUser}
            themeStyles={themeStyles}
         />
      </div>

      {/* MOBILE DAILY TARGET BUTTON (Replaces Inline Panel) */}
      <div className="fixed bottom-24 left-4 z-40 xl:hidden">
         <button 
           onClick={() => setShowDailyTarget(true)}
           className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)] border border-yellow-500/30 bg-black/80 backdrop-blur-md text-white transition-transform active:scale-95`}
         >
            <Target className="w-7 h-7 text-yellow-400" />
            <span className="absolute -bottom-6 text-[9px] font-black uppercase tracking-widest text-white/80 bg-black/50 px-2 py-0.5 rounded-full">Misi</span>
         </button>
      </div>

      {/* DAILY TARGET MODAL */}
      {showDailyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDailyTarget(false)}>
           <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button 
                  onClick={() => setShowDailyTarget(false)}
                  className="p-2 text-white/70 hover:text-white bg-white/10 rounded-full"
                >
                   <X className="w-6 h-6" />
                </button>
              </div>
              <DailyTargetPanel dayData={data.days[currentDayIndex]} themeStyles={themeStyles} dayIndex={currentDayIndex} />
           </div>
        </div>
      )}

      {/* DAY SELECTOR (MINI-MAP) */}
      <div className="mb-6 flex items-center justify-between bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 max-w-2xl mx-auto">
        <button 
          onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
          disabled={selectedDayIndex === 0}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex-1 overflow-x-auto hide-scrollbar px-2 flex items-center justify-center gap-1.5">
          {data.days.map((_, idx) => {
             const isSelected = idx === selectedDayIndex;
             const isToday = idx === currentDayIndex;
             const isPast = idx < currentDayIndex;
             
             return (
               <button
                 key={idx}
                 onClick={() => setSelectedDayIndex(idx)}
                 className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                   isSelected 
                     ? 'bg-yellow-400 scale-150 shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                     : isToday
                       ? 'bg-emerald-400 animate-pulse'
                       : isPast
                         ? 'bg-white/40 hover:bg-white/60'
                         : 'bg-white/10 hover:bg-white/30'
                 }`}
                 title={`Hari ${idx + 1}`}
               />
             )
          })}
        </div>

        <button 
          onClick={() => setSelectedDayIndex(prev => Math.min(29, prev + 1))}
          disabled={selectedDayIndex === 29}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* SINGLE DAY CARD */}
      <div className="relative w-full max-w-2xl mx-auto">
        {(() => {
          const day = data.days[selectedDayIndex];
          const idx = selectedDayIndex;
          const dayPoints = calculateDayPoints(day);
          const isToday = idx === currentDayIndex;
          const isPast = idx < currentDayIndex;
          
          const cardBase = `${themeStyles.card} rounded-3xl p-6 relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[400px] shadow-2xl`;
          const activeBorder = isToday 
            ? 'border-[#fbbf24] ring-2 ring-[#fbbf24]/50 shadow-[0_0_40px_rgba(251,191,36,0.15)] z-10' 
            : 'border-white/10';
          
          const bgOpacity = isToday 
            ? 'bg-opacity-100' 
            : (isPast ? 'opacity-95 grayscale-[0.2]' : 'opacity-80 grayscale-[0.5]');

          const gregDate = new Date(RAMADHAN_START_DATE);
          gregDate.setDate(gregDate.getDate() + idx);
          const dateString = gregDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

          return (
            <div 
              key={day.id} 
              className={`${cardBase} ${activeBorder} ${bgOpacity} animate-in fade-in zoom-in-95 duration-300`}
            >
              <div className="flex-1">
                {/* Day Header */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                     <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-inner border border-white/10 ${isToday ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black' : 'bg-black/40 text-white/80'}`}>
                        <span className="text-2xl leading-none">{idx + 1}</span>
                        <span className="text-[10px] uppercase tracking-widest mt-1">RMD</span>
                     </div>
                     
                     <div className="flex flex-col">
                        <span className={`text-xl font-black uppercase tracking-widest ${isToday ? 'text-yellow-400' : 'text-white'}`}>
                          {HIJRI_YEAR}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-white/50 font-mono mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {dateString}
                          {isToday && <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-[9px] font-bold">HARI INI</span>}
                        </div>
                     </div>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-xl border ${themeStyles.border} bg-black/40 backdrop-blur-sm text-center shadow-inner`}>
                     <span className={`text-lg font-black ${themeStyles.fontDisplay} ${dayPoints > 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-slate-500'}`}>
                       {dayPoints} XP
                     </span>
                  </div>
                </div>

                {/* ACTION ROW - PRAYERS */}
                <div className="mb-8">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                     <Target className="w-4 h-4" /> Shalat Wajib
                   </h4>
                   <div className="flex justify-between items-center gap-2">
                      {PRAYER_KEYS.map((key) => (
                        <PrayerCell 
                          key={key}
                          label={key.substring(0,3)}
                          state={day.prayers[key]}
                          isLocked={false} 
                          themeStyles={themeStyles}
                          currentTheme={currentTheme}
                          onClick={() => {
                             setData(prev => {
                               const newDays = [...prev.days];
                               const d = { ...newDays[day.id] };
                               d.prayers = { ...d.prayers, [key]: (d.prayers[key] + 1) % 3 as PrayerState };
                               newDays[day.id] = d;
                               return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                             });
                          }}
                        />
                      ))}
                   </div>
                </div>

                {/* EXTRA QUESTS */}
                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                     <Sparkles className="w-4 h-4" /> Ibadah Tambahan
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => {
                          setData(prev => {
                            const newDays = [...prev.days];
                            newDays[day.id] = { ...newDays[day.id], shaum: !newDays[day.id].shaum };
                            return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                          })
                        }}
                        className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${day.shaum ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                    >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${day.shaum ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                            <UtensilsCrossed className={`w-5 h-5 ${day.shaum ? 'text-amber-400' : 'text-white/30'}`} />
                          </div>
                          <span className={`text-sm font-black uppercase tracking-wider ${day.shaum ? 'text-amber-100' : 'text-white/50'}`}>Shaum</span>
                        </div>
                        {day.shaum && <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_orange]"></div>}
                    </button>

                    <button 
                        onClick={() => {
                          setData(prev => {
                            const newDays = [...prev.days];
                            newDays[day.id] = { ...newDays[day.id], tarawih: !newDays[day.id].tarawih };
                            return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                          })
                        }}
                        className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${day.tarawih ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                    >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${day.tarawih ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                            <Moon className={`w-5 h-5 ${day.tarawih ? 'text-purple-400' : 'text-white/30'}`} />
                          </div>
                          <span className={`text-sm font-black uppercase tracking-wider ${day.tarawih ? 'text-purple-100' : 'text-white/50'}`}>Tarawih</span>
                        </div>
                        {day.tarawih && <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_purple]"></div>}
                    </button>
                  </div>
                </div>
              </div>

              {/* TILAWAH FOOTER */}
              <div className={`mt-auto pt-4 border-t border-white/10 flex items-center justify-between bg-black/40 -mx-6 -mb-6 px-6 py-5`}>
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-0.5">Tilawah</div>
                      <div className="text-[10px] text-white/40 font-mono">Target: 75 Ayat/Hari</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 bg-black/50 p-1.5 rounded-2xl border border-white/5">
                    <button 
                      onClick={() => {
                         setData(prev => {
                            const newDays = [...prev.days];
                            newDays[day.id] = { ...newDays[day.id], tilawah: Math.max(0, day.tilawah - 1) };
                            return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                         });
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/10 text-xl font-bold transition-colors text-white/70`}
                    >-</button>
                    
                    <input 
                      type="number" 
                      min="0"
                      value={day.tilawah}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setData(prev => {
                           const newDays = [...prev.days];
                           newDays[day.id] = { ...newDays[day.id], tilawah: Math.max(0, val) };
                           return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                        });
                      }}
                      className="w-16 bg-transparent text-center text-xl font-black text-cyan-400 outline-none p-1"
                    />

                    <button 
                       onClick={() => {
                         setData(prev => {
                            const newDays = [...prev.days];
                            newDays[day.id] = { ...newDays[day.id], tilawah: day.tilawah + 1 };
                            return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                         });
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/30`}
                    >+</button>
                 </div>
              </div>

            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default TrackerPage;
