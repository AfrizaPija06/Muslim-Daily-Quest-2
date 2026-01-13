
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Lock, 
  Home, 
  Church, 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  ShieldAlert, 
  ArrowRight, 
  LayoutDashboard, 
  Users, 
  Target, 
  History,
  Palette,
  Sword,
  Crown,
  Scroll
} from 'lucide-react';
import { 
  DAYS_OF_WEEK, 
  DayData, 
  WeeklyData, 
  PRAYER_KEYS, 
  POINTS, 
  PrayerState, 
  User, 
  MENTORING_GROUPS, 
  Role,
  AppTheme
} from './types';

// --- THEME CONFIGURATION ---
const THEMES = {
  default: {
    id: 'default',
    name: 'Cyber Faith',
    bg: 'bg-[#020617]',
    bgPatternColor: 'text-slate-800',
    fontMain: 'font-sans',
    fontDisplay: 'font-game',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-500',
    textAccent: 'text-emerald-500',
    textGold: 'text-yellow-500',
    card: 'glass-card border-emerald-500/20',
    border: 'border-emerald-500/20',
    buttonPrimary: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    inputBg: 'bg-slate-900/50',
    inputBorder: 'border-slate-700 focus:border-emerald-500',
    progressBar: 'from-emerald-600 via-emerald-400 to-yellow-500',
    activeTab: 'bg-emerald-500 text-slate-900',
    inactiveTab: 'text-slate-500 hover:text-slate-300',
    glow: 'glow-primary',
    icons: {
      trophy: 'text-yellow-500',
      home: 'text-emerald-400',
      mosque: 'text-yellow-400',
    }
  },
  legends: {
    id: 'legends',
    name: 'Mentoring Legends',
    // Dark red/brown fantasy gradient
    bg: 'bg-[#0f0404] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#3a080e] via-[#1a0305] to-[#000000]',
    bgPatternColor: 'text-[#4a101d]',
    fontMain: 'font-sans',
    fontDisplay: 'font-legends', // Cinzel font
    textPrimary: 'text-[#f0e6d2]', // Parchment / Bone white
    textSecondary: 'text-[#a68a6d]', // Bronze/Earth
    textAccent: 'text-[#d4af37]', // Gold
    textGold: 'text-[#ffdb78]', // Bright Gold
    card: 'glass-card border-[#d4af37]/50', // Uses the custom .theme-legends .glass-card css
    border: 'border-[#d4af37]/30',
    buttonPrimary: 'bg-gradient-to-r from-[#8a1c1c] to-[#590d0d] border border-[#d4af37] hover:bg-[#a32222] shadow-[0_0_20px_rgba(212,175,55,0.2)] text-[#f0e6d2]',
    inputBg: 'bg-[#1a0505]/80',
    inputBorder: 'border-[#5c4033] focus:border-[#d4af37]',
    progressBar: 'from-[#8a1c1c] via-[#d4af37] to-[#f0e6d2]',
    activeTab: 'bg-gradient-to-b from-[#d4af37] to-[#8a6e3e] text-[#1a0505] border border-[#f0e6d2]',
    inactiveTab: 'text-[#8a6e3e] hover:text-[#d4af37]',
    glow: 'glow-primary',
    icons: {
      trophy: 'text-[#d4af37]',
      home: 'text-[#8a6e3e]',
      mosque: 'text-[#f0e6d2] drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]',
    }
  }
};

// --- DATA & MOCKS ---

const ADMIN_CREDENTIALS = {
  username: 'mentor_admin',
  password: 'istiqamah2026',
  fullName: 'Ustadz Mentor',
  group: 'Pusat Mentoring',
  role: 'mentor' as Role
};

const getCurrentDayIndex = () => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
};

const INITIAL_DATA: WeeklyData = {
  days: DAYS_OF_WEEK.map((day, idx) => ({
    id: idx,
    dayName: day,
    prayers: { subuh: 0, zuhur: 0, asar: 0, magrib: 0, isya: 0 },
    tilawah: 0
  })),
  lastUpdated: new Date().toISOString()
};

const MOCK_MENTEES = [
  { fullName: 'Ahmad Al-Fatih', username: 'ahmad', group: 'Al-Fatih', points: 735, activeDays: 7 },
  { fullName: 'Siti Fatimah', username: 'fatimah', group: 'Salahuddin', points: 680, activeDays: 7 },
  { fullName: 'Ali Murtadha', username: 'ali', group: 'Al-Fatih', points: 412, activeDays: 5 },
  { fullName: 'Umar bin Khattab', username: 'umar', group: 'Khalid bin Walid', points: 300, activeDays: 4 },
  { fullName: 'Zaid bin Tsabit', username: 'zaid', group: 'Thariq bin Ziyad', points: 50, activeDays: 1 },
];

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'tracker' | 'leaderboard'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('nur_quest_theme') as AppTheme) || 'default';
  });

  const themeStyles = THEMES[currentTheme];

  useEffect(() => {
    const savedUser = localStorage.getItem('nur_quest_session');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setView('tracker');
      const savedData = localStorage.getItem(`ibadah_tracker_${user.username}`);
      if (savedData) setData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`ibadah_tracker_${currentUser.username}`, JSON.stringify(data));
    }
  }, [data, currentUser]);

  useEffect(() => {
    localStorage.setItem('nur_quest_theme', currentTheme);
    // Apply global class for CSS variables/overrides
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'default' ? 'legends' : 'default');
  };

  const handleLogout = () => {
    localStorage.removeItem('nur_quest_session');
    setCurrentUser(null);
    setView('login');
    setData(INITIAL_DATA);
    setError(null);
  };

  const calculateDayPoints = (day: DayData) => {
    const prayerPoints = Object.values(day.prayers).reduce((acc, val) => {
      if (val === 1) return acc + POINTS.HOME;
      if (val === 2) return acc + POINTS.MOSQUE;
      return acc;
    }, 0);
    return prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
  };

  const totalPoints = useMemo(() => {
    return data.days.reduce((acc, day) => acc + calculateDayPoints(day), 0);
  }, [data]);

  // Props to pass down
  const commonProps = {
    themeStyles,
    currentTheme,
    toggleTheme
  };

  if (view === 'login') return <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />;
  if (view === 'register') return <RegisterPage setView={setView} setError={setError} error={error} {...commonProps} />;
  if (view === 'leaderboard' && currentUser?.role === 'mentor') return <LeaderboardPage currentUser={currentUser} setView={setView} handleLogout={handleLogout} {...commonProps} />;
  
  // Default Tracker View
  if (view === 'leaderboard' && currentUser?.role !== 'mentor') { setView('tracker'); return null; }

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative overflow-x-hidden transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={totalPoints} handleLogout={handleLogout} activeView="tracker" {...commonProps} />

      <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 pb-24">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <StatCard label="Current Streak" value="4 DAYS" icon={<TrendingUp className={`w-8 h-8 ${themeStyles.textAccent}`} />} themeStyles={themeStyles} />
           <StatCard label="Prayer Points" value={`${data.days.reduce((acc, d) => acc + Object.values(d.prayers).filter(p => p > 0).length, 0)} Pts`} icon={<ShieldCheck className={`w-8 h-8 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
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

// --- LEADERBOARD PAGE ---
const LeaderboardPage = ({ currentUser, setView, handleLogout, themeStyles, currentTheme, toggleTheme }: any) => {
  const [filter, setFilter] = useState<'weekly' | 'all'>('weekly');
  const [sortField, setSortField] = useState<'points' | 'activeDays'>('points');

  const sortedMentees = useMemo(() => {
    return [...MOCK_MENTEES].sort((a, b) => {
      if (a[sortField] === b[sortField]) return b.activeDays - a.activeDays;
      return b[sortField] - a[sortField];
    });
  }, [sortField]);

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative overflow-x-hidden transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={0} handleLogout={handleLogout} activeView="leaderboard" themeStyles={themeStyles} currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 pb-24">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${themeStyles.border} pb-6`}>
          <div>
            <h2 className={`text-3xl ${themeStyles.fontDisplay} font-bold tracking-widest flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <LayoutDashboard className={`w-8 h-8 ${themeStyles.textAccent}`} /> Mentor Dashboard
            </h2>
            <p className={`text-xs italic mt-1 font-medium ${themeStyles.textSecondary}`}>“Data pembinaan khusus mentor”</p>
          </div>
          <div className={`flex p-1 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg}`}>
            {['weekly', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? themeStyles.activeTab : themeStyles.inactiveTab}`}>{f.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Mentee" value="42" icon={<Users className="w-6 h-6 text-blue-400" />} themeStyles={themeStyles} />
          <SummaryCard label="Avg. Weekly" value="485 Pts" icon={<Target className={`w-6 h-6 ${themeStyles.textAccent}`} />} themeStyles={themeStyles} />
          <SummaryCard label="Top Consistent" value="Ahmad Al-Fatih" icon={<ShieldCheck className={`w-6 h-6 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
          <SummaryCard label="Total Group" value="12,450" icon={<History className="w-6 h-6 text-purple-400" />} themeStyles={themeStyles} />
        </section>

        <section className={`${themeStyles.card} rounded-xl overflow-hidden`}>
          <div className={`p-6 border-b ${themeStyles.border} flex justify-between items-center`}>
            <h3 className={`${themeStyles.fontDisplay} text-xl font-bold tracking-wider flex items-center gap-2 uppercase`}>
              <Trophy className={`w-5 h-5 ${themeStyles.textGold}`} /> Performance Tracker
            </h3>
            <div className="flex gap-2">
              {['points', 'activeDays'].map(s => (
                <button key={s} onClick={() => setSortField(s as any)} className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${sortField === s ? `${themeStyles.textAccent} border-current bg-white/5` : `${themeStyles.textSecondary} border-transparent hover:text-white`}`}>SORT: {s === 'points' ? 'PTS' : 'DAYS'}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`text-[10px] uppercase tracking-widest font-bold ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                  <th className="px-8 py-4">Rank</th>
                  <th className="px-4 py-4">Mentee Name</th>
                  <th className="px-4 py-4 text-center">Weekly Pts</th>
                  <th className="px-4 py-4 text-center">Active Days</th>
                  <th className="px-8 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${currentTheme === 'legends' ? 'divide-[#590d0d]/30' : 'divide-slate-800'}`}>
                {sortedMentees.map((mentee, idx) => (
                  <tr key={mentee.username} className={`transition-colors ${currentTheme === 'legends' ? 'hover:bg-[#3a080e]/40' : 'hover:bg-slate-900/30'}`}>
                    <td className={`px-8 py-5 ${themeStyles.fontDisplay} text-xl font-bold ${idx < 3 ? themeStyles.textGold : themeStyles.textSecondary}`}>#{idx + 1}</td>
                    <td className={`px-4 py-5 font-bold ${themeStyles.textPrimary}`}>{mentee.fullName}</td>
                    <td className={`px-4 py-5 text-center ${themeStyles.fontDisplay} text-xl ${themeStyles.textAccent}`}>{mentee.points}</td>
                    <td className="px-4 py-5 text-center text-blue-400 font-game text-lg">{mentee.activeDays}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${mentee.activeDays < 3 ? 'bg-red-950/20 border-red-500/30 text-red-500' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500'}`}>
                        {mentee.activeDays < 3 ? 'PENDAMPINGAN' : 'ON TRACK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

// --- AUTH PAGES ---
const LoginPage = ({ setView, setCurrentUser, setData, setError, error, themeStyles, toggleTheme, currentTheme }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setCurrentUser(ADMIN_CREDENTIALS);
      localStorage.setItem('nur_quest_session', JSON.stringify(ADMIN_CREDENTIALS));
      setView('tracker');
      setError(null);
      return;
    }
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const user = users.find((u: any) => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('nur_quest_session', JSON.stringify(user));
      const savedData = localStorage.getItem(`ibadah_tracker_${user.username}`);
      if (savedData) setData(JSON.parse(savedData));
      setView('tracker');
      setError(null);
    } else {
      setError('Username atau Password salah.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-500 ${themeStyles.bg}`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <div className={`absolute top-4 right-4 z-20`}>
        <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} themeStyles={themeStyles} />
      </div>
      <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10`}>
        <div className="text-center mb-8">
          <div className={`inline-block p-4 rounded-2xl mb-4 border ${themeStyles.border} bg-white/5`}>
            {currentTheme === 'legends' ? <Crown className={`w-10 h-10 ${themeStyles.textAccent}`} /> : <Lock className="w-10 h-10 text-emerald-500" />}
          </div>
          <h2 className={`text-3xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} tracking-widest uppercase`}>
            {currentTheme === 'legends' ? 'Mentoring Legends' : 'Leveling Mentoring'}
          </h2>
          <p className={`text-[10px] uppercase font-bold mt-1 tracking-widest ${themeStyles.textSecondary}`}>
            {currentTheme === 'legends' ? 'Season 2 Final Rank Announcement' : 'Daily Quest Rohis SMPN 1 Bojonggede'}
          </p>
        </div>
        {error && <div className="mb-6 p-3 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-xs"><ShieldAlert className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className={`w-full rounded-xl py-4 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="MENTOR_OR_MENTEE" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={`w-full rounded-xl py-4 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="••••••••" />
          </div>
          <button className={`w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg mt-6 flex items-center justify-center gap-2 ${themeStyles.buttonPrimary} uppercase tracking-wider`}>LOGIN <ArrowRight className="w-5 h-5" /></button>
        </form>
        <p className={`mt-8 text-center text-xs ${themeStyles.textSecondary}`}>Belum terdaftar? <button onClick={() => setView('register')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Daftar Mentee</button></p>
      </div>
    </div>
  );
};

const RegisterPage = ({ setView, setError, error, themeStyles, currentTheme, toggleTheme }: any) => {
  const [formData, setFormData] = useState({ fullName: '', username: '', password: '', confirmPassword: '', group: MENTORING_GROUPS[0] });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password) { setError("Semua field wajib diisi."); return; }
    if (formData.password !== formData.confirmPassword) { setError("Password konfirmasi tidak cocok."); return; }
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    if (users.some((u: any) => u.username === formData.username) || formData.username === ADMIN_CREDENTIALS.username) { setError("Username sudah digunakan."); return; }
    const newUser = { ...formData, role: 'mentee' as Role };
    localStorage.setItem('nur_quest_users', JSON.stringify([...users, newUser]));
    setView('login');
    setError(null);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-500 ${themeStyles.bg}`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <div className={`absolute top-4 right-4 z-20`}>
        <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} themeStyles={themeStyles} />
      </div>
      <div className={`w-full max-w-lg ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10`}>
        <div className="text-center mb-8">
          <div className={`inline-block p-4 rounded-2xl mb-4 border ${themeStyles.border} bg-white/5`}>
            {currentTheme === 'legends' ? <Scroll className={`w-10 h-10 ${themeStyles.textAccent}`} /> : <UserIcon className="w-10 h-10 text-yellow-500" />}
          </div>
          <h2 className={`text-3xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} tracking-widest uppercase`}>
            {currentTheme === 'legends' ? 'Join The Ranks' : 'Registrasi Mentee'}
          </h2>
          <p className={`text-[10px] uppercase font-bold mt-1 tracking-widest ${themeStyles.textSecondary}`}>Bergabung dalam perjalanan spiritual</p>
        </div>
        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Nama Lengkap</label>
            <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="Ahmad Al-Fatih" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Username</label>
            <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="mentee_01" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Kelompok</label>
            <select value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} appearance-none`}>
              {MENTORING_GROUPS.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
            </select>
          </div>
          <div className="space-y-2"><label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Password</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="••••••••" /></div>
          <div className="space-y-2"><label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Konfirmasi Password</label><input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="••••••••" /></div>
          <button className={`md:col-span-2 w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 uppercase tracking-wider ${themeStyles.buttonPrimary}`}>DAFTAR SEKARANG <ShieldCheck className="w-5 h-5" /></button>
        </form>
        <p className={`mt-8 text-center text-xs ${themeStyles.textSecondary}`}>Sudah punya akun? <button onClick={() => setView('login')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Login</button></p>
      </div>
    </div>
  );
};

// --- COMMON UI COMPONENTS ---
const Header = ({ currentUser, setView, totalPoints, handleLogout, activeView, themeStyles, currentTheme, toggleTheme }: any) => (
  <header className={`sticky top-0 z-50 px-4 py-4 md:px-8 backdrop-blur-md border-b transition-colors duration-500 ${currentTheme === 'legends' ? 'bg-[#1a0505]/90 border-[#d4af37]/30' : 'bg-slate-950/80 border-emerald-500/20'}`}>
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={`w-14 h-14 rounded-full overflow-hidden ${themeStyles.border} border-2 ${themeStyles.glow}`}>
             <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.username}`} className="w-full h-full object-cover" />
          </div>
          <div className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter ${currentTheme === 'legends' ? 'bg-[#d4af37] text-black' : 'bg-yellow-500 text-slate-900'}`}>
            {currentUser?.role === 'mentor' ? 'ADMIN' : 'LVL 12'}
          </div>
        </div>
        <div>
          <h1 className={`text-xl md:text-2xl ${themeStyles.fontDisplay} font-bold tracking-wide ${themeStyles.textPrimary}`}>
            {currentUser?.fullName.split(' ')[0].toUpperCase()}'S {currentUser?.role === 'mentor' ? 'HUB' : 'QUEST'}
          </h1>
          <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${themeStyles.textAccent}`}>{currentUser?.group}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} themeStyles={themeStyles} />
        <nav className={`flex items-center gap-1 p-1 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg}`}>
          <button onClick={() => setView('tracker')} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${activeView === 'tracker' ? themeStyles.activeTab : themeStyles.inactiveTab}`}>TRACKER</button>
          {currentUser?.role === 'mentor' && (
            <button onClick={() => setView('leaderboard')} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${activeView === 'leaderboard' ? themeStyles.activeTab : themeStyles.inactiveTab}`}>DASHBOARD</button>
          )}
        </nav>
        <button onClick={handleLogout} className={`p-3 border rounded-xl hover:text-red-500 transition-all ${themeStyles.inputBg} ${themeStyles.border} ${themeStyles.textSecondary}`}><LogOut className="w-5 h-5" /></button>
      </div>
    </div>
  </header>
);

const ThemeToggle = ({ currentTheme, toggleTheme, themeStyles }: any) => (
  <button 
    onClick={toggleTheme} 
    className={`p-3 rounded-xl border flex items-center justify-center transition-all group relative ${themeStyles.border} ${themeStyles.inputBg}`}
    title="Switch Theme"
  >
    <Palette className={`w-5 h-5 ${themeStyles.textAccent}`} />
    <span className="sr-only">Toggle Theme</span>
  </button>
);

const StatCard = ({ label, value, icon, themeStyles }: any) => (
  <div className={`${themeStyles.card} rounded-2xl p-5 flex items-center justify-between`}>
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>{label}</p>
      <p className={`text-2xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary}`}>{value}</p>
    </div>
    {icon}
  </div>
);

const SummaryCard = ({ label, value, icon, themeStyles }: any) => (
  <div className={`${themeStyles.card} rounded-2xl p-5 space-y-2`}>
    <div className="flex justify-between items-center"><p className={`text-[10px] font-bold uppercase ${themeStyles.textSecondary}`}>{label}</p>{icon}</div>
    <p className={`text-xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary}`}>{value}</p>
  </div>
);

const PrayerCell = ({ state, isLocked, onClick, themeStyles, currentTheme }: any) => (
  <button onClick={onClick} className={`w-12 h-12 mx-auto rounded-xl border flex items-center justify-center transition-all relative overflow-hidden group 
    ${isLocked ? `${themeStyles.inputBg} opacity-40` : state === 1 ? (currentTheme === 'legends' ? 'bg-[#3a080e] border-[#d4af37]/50' : 'bg-emerald-950 border-emerald-500/50') : state === 2 ? (currentTheme === 'legends' ? 'bg-[#590d0d] border-[#f0e6d2]' : 'bg-yellow-950 border-yellow-500/50') : `${themeStyles.inputBg} ${themeStyles.border}`}`}>
    {state === 1 ? <Home className={`w-5 h-5 ${themeStyles.icons.home}`} /> : state === 2 ? <Church className={`w-5 h-5 ${themeStyles.icons.mosque}`} /> : <div className="w-2 h-2 rounded-full bg-slate-700/50" />}
    {/* Shine effect for Legends theme */}
    {currentTheme === 'legends' && state > 0 && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
  </button>
);

const BackgroundOrnament = ({ colorClass }: { colorClass: string }) => (
  <div className={`fixed inset-0 pointer-events-none opacity-5 overflow-hidden ${colorClass}`}>
    <svg width="100%" height="100%"><pattern id="pattern-hex" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M25 0L50 12.5V37.5L25 50L0 37.5V12.5L25 0Z" fill="none" stroke="currentColor" strokeWidth="1" /></pattern><rect width="100%" height="100%" fill="url(#pattern-hex)" /></svg>
  </div>
);

const Footer = ({ themeStyles }: any) => (
  <footer className={`text-center pt-8 border-t ${themeStyles.border} pb-12`}>
    <p className={`${themeStyles.textSecondary} italic text-sm`}>“Kemenangan sejati adalah istiqamah.”</p>
  </footer>
);

export default App;
