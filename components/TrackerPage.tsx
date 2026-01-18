
import React from 'react';
import { TrendingUp, ShieldCheck, BookOpen, Sword, Calendar, ChevronRight } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import StatCard from './StatCard';
import PrayerCell from './PrayerCell';
import { PRAYER_KEYS, PrayerState, WeeklyData, DayData, POINTS } from '../types';

interface TrackerPageProps {
  currentUser: any;
  setView: (view: any) => void;
  handleLogout: () => void;
  data: WeeklyData;
  setData: React.Dispatch<React.SetStateAction<WeeklyData>>;
  themeStyles: any;
  currentTheme: any;
  toggleTheme: () => void;
  totalPoints: number;
}

const getCurrentDayIndex = () => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

const TrackerPage: React.FC<TrackerPageProps> = ({ 
  currentUser, setView, handleLogout, data, setData, 
  themeStyles, currentTheme, toggleTheme, totalPoints 
}) => {

  const calculateDayPoints = (day: DayData) => {
    const prayerPoints = Object.values(day.prayers).reduce((acc, val) => {
      if (val === 1) return acc + POINTS.HOME;
      if (val === 2) return acc + POINTS.MOSQUE;
      return acc;
    }, 0);
    return prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative overflow-x-hidden transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={totalPoints} handleLogout={handleLogout} activeView="tracker" themeStyles={themeStyles} currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 pb-24">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <StatCard label="Current Streak" value="4 DAYS" icon={<TrendingUp className={`w-8 h-8 ${themeStyles.textAccent}`} />} themeStyles={themeStyles} />
           <StatCard label="Prayer Points" value={`${data.days.reduce((acc, d) => acc + Object.values(d.prayers).filter((p: any) => p > 0).length, 0)} Pts`} icon={<ShieldCheck className={`w-8 h-8 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
           <StatCard label="Tilawah Stat" value={`${data.days.reduce((acc, d) => acc + d.tilawah, 0)} Lines`} icon={<BookOpen className={`w-8 h-8 ${currentTheme === 'legends' ? 'text-blue-300' : 'text-blue-500'}`} />} themeStyles={themeStyles} />
        </section>

        <section className={`${themeStyles.card} rounded-xl overflow-hidden`}>
          <div className={`p-4 border-b ${themeStyles.border} flex justify-between items-center bg-gradient-to-r from-transparent via-white/5 to-transparent`}>
            <h2 className={`${themeStyles.fontDisplay} text-xl font-bold tracking-wider flex items-center gap-2 uppercase`}>
              {currentTheme === 'legends' ? <Sword className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
              {currentTheme === 'legends' ? 'Battle Log' : 'Weekly Quest Board'}
            </h2>
            <div className={`text-[10px] ${themeStyles.textSecondary} px-2 py-1 rounded border ${themeStyles.border} uppercase tracking-widest`}>
              {currentTheme === 'legends' ? 'Season 1 // Week 2' : 'Only Today Editable'}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-[10px] uppercase tracking-widest font-bold ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                  <th className="px-6 py-4">Day</th>
                  {PRAYER_KEYS.map(k => <th key={k} className="px-4 py-4 text-center">{k}</th>)}
                  <th className="px-4 py-4 text-center">Tilawah</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${currentTheme === 'legends' ? 'divide-[#590d0d]/30' : 'divide-slate-800'}`}>
                {data.days.map((day, idx) => {
                  const isToday = idx === getCurrentDayIndex();
                  const isLocked = !isToday;
                  const dayPoints = calculateDayPoints(day);
                  const activeRowClass = currentTheme === 'legends' ? 'bg-[#3a080e]/40' : 'bg-emerald-500/5';
                  
                  return (
                    <tr key={day.id} className={`group transition-colors duration-200 ${isToday ? activeRowClass : 'hover:bg-white/5'}`}>
                      <td className={`px-6 py-4 font-bold text-sm ${themeStyles.textSecondary}`}>
                        <div className="flex items-center gap-2">
                          <span className={isToday ? themeStyles.textAccent : ''}>{day.dayName}</span>
                          {isToday && <div className={`w-2 h-2 rounded-full animate-pulse ${currentTheme === 'legends' ? 'bg-[#d4af37]' : 'bg-emerald-500'}`} />}
                        </div>
                      </td>
                      {PRAYER_KEYS.map(prayerKey => (
                        <td key={prayerKey} className="px-2 py-4 text-center">
                           <PrayerCell 
                              state={day.prayers[prayerKey]} 
                              isLocked={isLocked}
                              themeStyles={themeStyles}
                              currentTheme={currentTheme}
                              onClick={() => {
                                if (isToday) {
                                  setData(prev => {
                                    const newDays = [...prev.days];
                                    const d = { ...newDays[day.id] };
                                    d.prayers = { ...d.prayers, [prayerKey]: (d.prayers[prayerKey] + 1) % 3 as PrayerState };
                                    newDays[day.id] = d;
                                    return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                                  });
                                }
                              }}
                            />
                        </td>
                      ))}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number" disabled={isLocked} value={day.tilawah === 0 && isLocked ? '' : day.tilawah}
                          onChange={(e) => {
                            if (isToday) {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setData(prev => {
                                const newDays = [...prev.days];
                                newDays[day.id] = { ...newDays[day.id], tilawah: val };
                                return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                              });
                            }
                          }}
                          className={`w-16 h-10 text-center rounded-lg ${themeStyles.fontDisplay} text-lg outline-none disabled:opacity-30 ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} border`}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-xl ${themeStyles.fontDisplay} font-bold ${dayPoints > 0 ? themeStyles.textAccent : themeStyles.textSecondary}`}>{dayPoints}</span>
                          <span className={`text-[8px] uppercase tracking-tighter ${themeStyles.textSecondary}`}>pts earned</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${themeStyles.textSecondary}`}>
                <ChevronRight className={`w-4 h-4 ${themeStyles.textAccent}`} /> Weekly Progress
              </h3>
              <p className={`text-2xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} tracking-wider`}>
                SEASON 1: ISTIQAMAH JOURNEY
              </p>
            </div>
            <div className="text-right">
              <span className={`text-3xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textGold}`}>{totalPoints}</span>
              <span className={`text-sm font-bold ml-1 ${themeStyles.textSecondary}`}>/ 735 PTS</span>
            </div>
          </div>
          <div className={`relative h-6 w-full rounded-full border ${themeStyles.border} overflow-hidden ${themeStyles.inputBg} ${themeStyles.glow}`}>
            <div className={`absolute top-0 left-0 h-full bg-gradient-to-r ${themeStyles.progressBar}`} style={{ width: `${Math.min(100, (totalPoints / 735) * 100)}%` }} />
          </div>
        </section>
        
        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

export default TrackerPage;
