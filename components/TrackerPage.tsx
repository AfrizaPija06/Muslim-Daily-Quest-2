
import React, { useEffect, useRef } from 'react';
import { BookOpen, Moon, UtensilsCrossed, Calendar } from 'lucide-react';
import PrayerCell from './PrayerCell';
import { PRAYER_KEYS, PrayerState, WeeklyData, POINTS, User, HIJRI_YEAR } from '../types';
import { RAMADHAN_START_DATE } from '../constants';
import DailyTargetPanel from './DailyTargetPanel';

interface TrackerPageProps {
  currentUser: User;
  data: WeeklyData;
  setData: React.Dispatch<React.SetStateAction<WeeklyData>>;
  themeStyles: any;
  currentTheme: string;
  totalPoints: number;
}

const TrackerPage: React.FC<TrackerPageProps> = ({ 
  data, setData, themeStyles, currentTheme 
}) => {
  const activeDayRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (activeDayRef.current) {
      activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

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

      {/* MOBILE DAILY TARGET (Visible only on Mobile/Tablet, hidden on XL because sidebar exists) */}
      <div className="mb-6 xl:hidden">
         <DailyTargetPanel dayData={data.days[currentDayIndex]} themeStyles={themeStyles} dayIndex={currentDayIndex} />
      </div>

      {/* DAYS GRID SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {data.days.map((day, idx) => {
          const dayPoints = calculateDayPoints(day);
          const isToday = idx === currentDayIndex;
          const isPast = idx < currentDayIndex;
          
          // Card Styles
          const cardBase = `${themeStyles.card} rounded-2xl p-4 relative overflow-hidden transition-all duration-300 flex flex-col justify-between h-full`;
          const activeBorder = isToday 
            ? 'border-[#fbbf24] ring-2 ring-[#fbbf24]/50 shadow-[0_0_30px_rgba(251,191,36,0.2)] z-10 scale-[1.02]' 
            : 'border-transparent hover:border-white/10 hover:bg-white/5';
          
          const bgOpacity = isToday 
            ? 'bg-opacity-100' 
            : (isPast ? 'opacity-90 grayscale-[0.3]' : 'opacity-60 grayscale-[0.8]');

          const gregDate = new Date(RAMADHAN_START_DATE);
          gregDate.setDate(gregDate.getDate() + idx);
          const dateString = gregDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

          return (
            <div 
              key={day.id} 
              ref={isToday ? activeDayRef : null}
              className={`${cardBase} ${activeBorder} ${bgOpacity}`}
            >
              <div>
                {/* Day Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shadow-inner border border-white/5 ${isToday ? 'bg-[#fbbf24] text-purple-900' : `${themeStyles.inputBg} ${themeStyles.textSecondary}`}`}>
                        <span className="text-lg leading-none">{idx + 1}</span>
                        <span className="text-[8px] uppercase">RMD</span>
                     </div>
                     
                     <div className="flex flex-col">
                        <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? themeStyles.textAccent : themeStyles.textPrimary}`}>
                          {HIJRI_YEAR}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] opacity-50 font-mono">
                          <Calendar className="w-3 h-3" />
                          {dateString}
                        </div>
                     </div>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-lg border ${themeStyles.border} bg-black/30 backdrop-blur-sm min-w-[60px] text-center`}>
                     <span className={`text-xs font-black ${themeStyles.fontDisplay} ${dayPoints > 0 ? 'text-[#fbbf24]' : 'text-slate-500'}`}>
                       {dayPoints} XP
                     </span>
                  </div>
                </div>

                {/* ACTION ROW */}
                <div className="flex justify-between items-center gap-1 mb-5 px-1">
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

                {/* EXTRA QUESTS */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button 
                      onClick={() => {
                        setData(prev => {
                          const newDays = [...prev.days];
                          newDays[day.id] = { ...newDays[day.id], shaum: !newDays[day.id].shaum };
                          return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                        })
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${day.shaum ? 'bg-amber-500/20 border-amber-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className={`w-3.5 h-3.5 ${day.shaum ? 'text-amber-400' : 'opacity-50'}`} />
                        <span className={`text-[9px] font-black uppercase ${day.shaum ? 'text-amber-100' : 'opacity-50'}`}>Shaum</span>
                      </div>
                      {day.shaum && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_orange]"></div>}
                  </button>

                  <button 
                      onClick={() => {
                        setData(prev => {
                          const newDays = [...prev.days];
                          newDays[day.id] = { ...newDays[day.id], tarawih: !newDays[day.id].tarawih };
                          return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                        })
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${day.tarawih ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                      <div className="flex items-center gap-2">
                        <Moon className={`w-3.5 h-3.5 ${day.tarawih ? 'text-purple-400' : 'opacity-50'}`} />
                        <span className={`text-[9px] font-black uppercase ${day.tarawih ? 'text-purple-100' : 'opacity-50'}`}>Tarawih</span>
                      </div>
                      {day.tarawih && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_purple]"></div>}
                  </button>
                </div>
              </div>

              {/* TILAWAH FOOTER */}
              <div className={`pt-3 border-t border-white/5 flex items-center justify-between bg-black/20 -mx-4 -mb-4 px-4 py-3`}>
                 <div className="flex items-center gap-2 opacity-70">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Tilawah</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                         setData(prev => {
                            const newDays = [...prev.days];
                            newDays[day.id] = { ...newDays[day.id], tilawah: Math.max(0, day.tilawah - 1) };
                            return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                         });
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center border border-white/20 hover:bg-white/10 text-xs font-bold`}
                    >-</button>
                    <span className={`text-sm font-bold w-6 text-center text-cyan-400`}>{day.tilawah}</span>
                    <button 
                       onClick={() => {
                         setData(prev => {
                            const newDays = [...prev.days];
                            newDays[day.id] = { ...newDays[day.id], tilawah: day.tilawah + 1 };
                            return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                         });
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500`}
                    >+</button>
                 </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackerPage;
