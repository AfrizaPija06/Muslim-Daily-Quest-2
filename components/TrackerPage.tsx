
import React from 'react';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';
import GameHUD from './GameHUD';
import PrayerCell from './PrayerCell';
import { PRAYER_KEYS, PrayerState, WeeklyData, POINTS, User } from '../types';

interface TrackerPageProps {
  currentUser: User;
  data: WeeklyData;
  setData: React.Dispatch<React.SetStateAction<WeeklyData>>;
  themeStyles: any;
  currentTheme: string;
  totalPoints: number;
}

const TrackerPage: React.FC<TrackerPageProps> = ({ 
  currentUser, data, setData, themeStyles, currentTheme, totalPoints 
}) => {
  const isLegends = currentTheme === 'legends';

  const calculateDayPoints = (day: any) => {
    const prayerPoints = Object.values(day.prayers as Record<string, number>).reduce((acc: number, val: number) => {
      if (val === 1) return acc + POINTS.HOME;
      if (val === 2) return acc + POINTS.MOSQUE;
      return acc;
    }, 0);
    return prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
  };

  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; // Mon=0, Sun=6

  return (
    <div className="w-full pb-32">
      {/* HEADER SECTION IN SCROLL AREA */}
      <div className="mb-6 mt-2">
         <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold uppercase tracking-wider ${themeStyles.textPrimary} mb-1 drop-shadow-lg`}>
           Weekly Quest
         </h2>
         <p className={`${themeStyles.textSecondary} text-xs font-mono uppercase tracking-widest`}>
           Season 4 • Week {Math.ceil(new Date().getDate() / 7)}
         </p>
      </div>

      {/* DAYS LIST (STAGES) */}
      <div className="space-y-4">
        {data.days.map((day, idx) => {
          const dayPoints = calculateDayPoints(day);
          const isToday = idx === currentDayIndex;
          const isPast = idx < currentDayIndex;
          
          // Card Styles
          const cardBase = `${themeStyles.card} rounded-2xl p-4 relative overflow-hidden transition-all duration-300`;
          const activeBorder = isToday 
            ? (isLegends ? 'border-[#d4af37] ring-1 ring-[#d4af37]/50' : 'border-emerald-500 ring-1 ring-emerald-500/50') 
            : 'border-transparent';
          const bgOpacity = isToday ? 'bg-opacity-100' : (isPast ? 'opacity-80' : 'opacity-60 grayscale-[0.5]');

          return (
            <div key={day.id} className={`${cardBase} ${activeBorder} ${bgOpacity}`}>
              {/* Day Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm uppercase shadow-inner ${isToday ? (isLegends ? 'bg-[#d4af37] text-black' : 'bg-emerald-500 text-white') : `${themeStyles.inputBg} ${themeStyles.textSecondary}`}`}>
                      {day.dayName.substring(0, 3)}
                   </div>
                   <div className="flex flex-col">
                      <span className={`text-xs font-bold uppercase tracking-widest ${isToday ? themeStyles.textAccent : themeStyles.textPrimary}`}>
                        Stage {idx + 1}
                      </span>
                      <span className="text-[10px] opacity-50 font-mono">
                        {isToday ? 'ACTIVE MISSION' : (isPast ? 'COMPLETED' : 'LOCKED')}
                      </span>
                   </div>
                </div>
                
                {/* Score Badge */}
                <div className={`px-3 py-1 rounded-full border ${themeStyles.border} bg-black/30 backdrop-blur-sm`}>
                   <span className={`text-sm font-black ${themeStyles.fontDisplay} ${dayPoints > 0 ? (isLegends ? 'text-[#ffdb78]' : 'text-emerald-400') : 'text-slate-500'}`}>
                     {dayPoints} <span className="text-[8px]">XP</span>
                   </span>
                </div>
              </div>

              {/* ACTION GRID (Skill Slots) */}
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

              {/* TILAWAH INPUT (Footer of Card) */}
              <div className={`mt-4 pt-3 border-t ${isLegends ? 'border-[#d4af37]/20' : 'border-white/10'} flex items-center justify-between`}>
                 <div className="flex items-center gap-2 opacity-70">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Tilawah Lines</span>
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
                      className={`w-6 h-6 rounded flex items-center justify-center border ${themeStyles.border} hover:bg-white/10`}
                    >-</button>
                    <span className={`text-sm font-bold w-6 text-center ${themeStyles.textPrimary}`}>{day.tilawah}</span>
                    <button 
                       onClick={() => {
                         setData(prev => {
                            const newDays = [...prev.days];
                            newDays[day.id] = { ...newDays[day.id], tilawah: day.tilawah + 1 };
                            return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                         });
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center ${isLegends ? 'bg-[#d4af37] text-black' : 'bg-emerald-500 text-white'}`}
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
