
import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShieldCheck, BookOpen, Sword, Calendar, ChevronRight, Trophy, Star, Medal } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import StatCard from './StatCard';
import PrayerCell from './PrayerCell';
import { PRAYER_KEYS, PrayerState, WeeklyData, DayData, POINTS, User } from '../types';

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

interface MiniLeaderboardData {
  username: string;
  fullName: string;
  group: string;
  points: number;
  monthlyPoints: number;
  role: string;
}

const TrackerPage: React.FC<TrackerPageProps> = ({ 
  currentUser, setView, handleLogout, data, setData, 
  themeStyles, currentTheme, toggleTheme, totalPoints 
}) => {
  const [leaderboard, setLeaderboard] = useState<MiniLeaderboardData[]>([]);

  // Calculate day points
  const calculateDayPoints = (day: DayData) => {
    const prayerPoints = Object.values(day.prayers).reduce((acc, val) => {
      if (val === 1) return acc + POINTS.HOME;
      if (val === 2) return acc + POINTS.MOSQUE;
      return acc;
    }, 0);
    return prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
  };

  // Fetch Leaderboard Data specifically for Mentee View
  useEffect(() => {
    const loadLeaderboard = () => {
      const usersStr = localStorage.getItem('nur_quest_users');
      const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      // MODIFIED: Include mentors in the mini leaderboard
      const processed = allUsers
        .filter(u => (u.role === 'mentee' || u.role === 'mentor') && (u.status === 'active' || u.status === undefined))
        .map(u => {
          // If current user, use live state 'data', otherwise fetch from localstorage
          let trackerData: WeeklyData | null = null;
          
          if (u.username === currentUser.username) {
            trackerData = data;
          } else {
            const str = localStorage.getItem(`ibadah_tracker_${u.username}`);
            trackerData = str ? JSON.parse(str) : null;
          }
          
          let pts = 0;
          if (trackerData) {
            trackerData.days.forEach(day => {
              const prayerPoints = Object.values(day.prayers).reduce((acc: number, val: number) => {
                if (val === 1) return acc + POINTS.HOME;
                if (val === 2) return acc + POINTS.MOSQUE;
                return acc;
              }, 0);
              pts += prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
            });
          }

          return {
            username: u.username,
            fullName: u.fullName,
            group: u.group,
            points: pts,
            monthlyPoints: pts * 4, // Simulation for season
            role: u.role
          };
        });
      
      setLeaderboard(processed);
    };

    loadLeaderboard();
  }, [data, currentUser.username]); // Update leaderboard when user updates their own data

  const sortedWeekly = useMemo(() => [...leaderboard].sort((a, b) => b.points - a.points).slice(0, 10), [leaderboard]);
  const sortedMonthly = useMemo(() => [...leaderboard].sort((a, b) => b.monthlyPoints - a.monthlyPoints).slice(0, 10), [leaderboard]);

  const MiniLeaderboardTable = ({ title, data, icon, type }: { title: string, data: MiniLeaderboardData[], icon: React.ReactNode, type: 'weekly' | 'monthly' }) => (
    <div className={`${themeStyles.card} rounded-xl overflow-hidden flex flex-col h-full`}>
      <div className={`p-3 border-b ${themeStyles.border} flex items-center justify-between bg-white/5`}>
        <h3 className={`${themeStyles.fontDisplay} text-sm font-bold tracking-wider flex items-center gap-2 uppercase`}>
          {icon} {title}
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[500px]">
        <table className="w-full text-left">
          <tbody className={`divide-y ${currentTheme === 'legends' ? 'divide-[#590d0d]/30' : 'divide-slate-800'}`}>
            {data.map((user, idx) => {
              const isMe = user.username === currentUser.username;
              return (
                <tr key={user.username} className={`${isMe ? (currentTheme === 'legends' ? 'bg-[#d4af37]/20' : 'bg-emerald-500/20') : ''} hover:bg-white/5 transition-colors`}>
                  <td className="px-3 py-3 w-8">
                    <span className={`text-xs font-bold ${idx < 3 ? themeStyles.textGold : themeStyles.textSecondary}`}>#{idx + 1}</span>
                  </td>
                  <td className="px-1 py-3">
                    <div className={`text-xs font-bold ${isMe ? themeStyles.textAccent : themeStyles.textPrimary} truncate max-w-[100px] flex items-center gap-1`}>
                      {user.fullName.split(' ')[0]}
                      {user.role === 'mentor' && <span className="text-[6px] bg-yellow-500 text-black px-1 rounded uppercase">M</span>}
                    </div>
                    <div className="text-[9px] opacity-60 uppercase">{user.group}</div>
                  </td>
                  <td className={`px-3 py-3 text-right text-xs font-bold ${themeStyles.fontDisplay}`}>
                    {type === 'weekly' ? user.points : user.monthlyPoints}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
               <tr><td colSpan={3} className="p-4 text-center text-xs opacity-50">Belum ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative overflow-x-hidden transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={totalPoints} handleLogout={handleLogout} activeView="tracker" themeStyles={themeStyles} currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main className="flex-grow p-4 md:p-6 max-w-[1600px] mx-auto w-full space-y-6 pb-24">
        
        {/* Stat Cards (Top) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
           <StatCard label="Current Streak" value="24/31" icon={<Calendar className={`w-8 h-8 ${themeStyles.textAccent}`} />} themeStyles={themeStyles} />
           <StatCard label="Prayer Points" value={`${data.days.reduce((acc, d) => acc + Object.values(d.prayers).filter((p: any) => p > 0).length, 0)} Pts`} icon={<ShieldCheck className={`w-8 h-8 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
           <StatCard label="Tilawah Stat" value={`${data.days.reduce((acc, d) => acc + d.tilawah, 0)} Lines`} icon={<BookOpen className={`w-8 h-8 ${currentTheme === 'legends' ? 'text-blue-300' : 'text-blue-500'}`} />} themeStyles={themeStyles} />
        </section>

        {/* 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Weekly Leaderboard (Hidden on small screens, shown on Large) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24">
             <MiniLeaderboardTable 
                title="Weekly Top" 
                data={sortedWeekly} 
                type="weekly"
                icon={<Trophy className={`w-4 h-4 ${themeStyles.textGold}`} />} 
             />
          </div>

          {/* CENTER: Quest Board (Tracker) */}
          <div className="col-span-1 lg:col-span-6 space-y-6">
            <section className={`${themeStyles.card} rounded-xl overflow-hidden`}>
              <div className={`p-4 border-b ${themeStyles.border} flex justify-between items-center bg-gradient-to-r from-transparent via-white/5 to-transparent`}>
                <h2 className={`${themeStyles.fontDisplay} text-xl font-bold tracking-wider flex items-center gap-2 uppercase`}>
                  {currentTheme === 'legends' ? <Sword className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  {currentTheme === 'legends' ? 'Battle Log' : 'Weekly Quest Board'}
                </h2>
                <div className={`text-[10px] ${themeStyles.textSecondary} px-2 py-1 rounded border ${themeStyles.border} uppercase tracking-widest`}>
                  EDIT ANYTIME
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] uppercase tracking-widest font-bold ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                      <th className="px-6 py-4">Day</th>
                      {PRAYER_KEYS.map(k => <th key={k} className="px-2 py-4 text-center">{k.substring(0,3)}</th>)}
                      <th className="px-4 py-4 text-center">Tilawah</th>
                      <th className="px-4 py-4 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${currentTheme === 'legends' ? 'divide-[#590d0d]/30' : 'divide-slate-800'}`}>
                    {data.days.map((day, idx) => {
                      const dayPoints = calculateDayPoints(day);
                      // Removed isToday/isLocked logic. All days are editable.
                      const isToday = new Date().getDay() === (day.id + 1) % 7; 
                      
                      return (
                        <tr key={day.id} className={`group transition-colors duration-200 hover:bg-white/5`}>
                          <td className={`px-6 py-4 font-bold text-sm ${themeStyles.textSecondary}`}>
                            <div className="flex items-center gap-2">
                              <span className={isToday ? themeStyles.textAccent : ''}>{day.dayName}</span>
                              {isToday && <div className={`w-1.5 h-1.5 rounded-full ${currentTheme === 'legends' ? 'bg-[#d4af37]' : 'bg-emerald-500'}`} />}
                            </div>
                          </td>
                          {PRAYER_KEYS.map(prayerKey => (
                            <td key={prayerKey} className="px-1 py-4 text-center">
                               <PrayerCell 
                                  state={day.prayers[prayerKey]} 
                                  isLocked={false} // ALWAYS UNLOCKED
                                  themeStyles={themeStyles}
                                  currentTheme={currentTheme}
                                  onClick={() => {
                                    // Always allow update
                                    setData(prev => {
                                      const newDays = [...prev.days];
                                      const d = { ...newDays[day.id] };
                                      d.prayers = { ...d.prayers, [prayerKey]: (d.prayers[prayerKey] + 1) % 3 as PrayerState };
                                      newDays[day.id] = d;
                                      return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                                    });
                                  }}
                                />
                            </td>
                          ))}
                          <td className="px-2 py-4 text-center">
                            <input
                              type="number" 
                              value={day.tilawah === 0 ? '' : day.tilawah}
                              placeholder="0"
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setData(prev => {
                                  const newDays = [...prev.days];
                                  newDays[day.id] = { ...newDays[day.id], tilawah: val };
                                  return { ...prev, days: newDays, lastUpdated: new Date().toISOString() };
                                });
                              }}
                              className={`w-12 h-10 text-center rounded-lg ${themeStyles.fontDisplay} text-lg outline-none focus:ring-1 focus:ring-emerald-500 ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} border`}
                            />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className={`text-lg ${themeStyles.fontDisplay} font-bold ${dayPoints > 0 ? themeStyles.textAccent : themeStyles.textSecondary}`}>{dayPoints}</span>
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
                    SEASON 1: ISTIQAMAH
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
          </div>

          {/* RIGHT: Monthly Leaderboard (Hidden on small screens, shown on Large) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24">
             <MiniLeaderboardTable 
                title="Season Rank" 
                data={sortedMonthly} 
                type="monthly"
                icon={<Medal className={`w-4 h-4 ${currentTheme === 'legends' ? 'text-red-400' : 'text-blue-400'}`} />} 
             />
          </div>
          
          {/* MOBILE ONLY: Leaderboards Stacked at bottom */}
          <div className="col-span-1 lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
             <MiniLeaderboardTable 
                title="Weekly Top" 
                data={sortedWeekly} 
                type="weekly"
                icon={<Trophy className={`w-4 h-4 ${themeStyles.textGold}`} />} 
             />
             <MiniLeaderboardTable 
                title="Season Rank" 
                data={sortedMonthly} 
                type="monthly"
                icon={<Medal className={`w-4 h-4 ${currentTheme === 'legends' ? 'text-red-400' : 'text-blue-400'}`} />} 
             />
          </div>

        </div>
        
        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

export default TrackerPage;
