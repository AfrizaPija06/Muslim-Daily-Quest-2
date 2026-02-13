
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData, MENTORING_GROUPS, GlobalAssets, ArchivedData, AttendanceRecord, getRankInfo, RANK_TIERS } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS, RAMADHAN_START_DATE, getRankIconUrl } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { Loader2, Shield } from 'lucide-react';

// Import Pages & Components
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';
import GameHUD from './components/GameHUD';
import GameDock from './components/GameDock';
import MiniLeaderboard from './components/MiniLeaderboard';
import DailyTargetPanel from './components/DailyTargetPanel';

const App: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);

  // VIEW STATE
  const [view, setView] = useState<string>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  
  // GROUPS ARE NOW STATIC/LOCKED
  const groups = MENTORING_GROUPS;
  
  const [globalAssets, setGlobalAssets] = useState<GlobalAssets>({});
  const [archives, setArchives] = useState<ArchivedData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false); // Will likely remain false/local
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  
  // LOCKED THEME: RAMADHAN
  const currentTheme: AppTheme = 'ramadhan';
  const themeStyles = THEMES['ramadhan'];

  // --- SYNC LOGIC (Local Only) ---
  const performSync = useCallback(async () => {
    if (isSyncing || isResetting) return;
    setIsSyncing(true);
    try {
      // ApiService is now hardcoded to offline mode
      const result = await api.sync(currentUser, data, groups);
      
      // In offline mode, we treat success=true as "Local Sync Complete"
      if (result.success) {
        setIsOnline(true); // Virtual online status
        localStorage.setItem('nur_quest_users', JSON.stringify(result.users));
        
        if (result.trackers && currentUser && result.trackers[currentUser.username]) {
           const myCloudData = result.trackers[currentUser.username];
           // Simple overwrite for local-first approach
           setData(myCloudData);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, data, groups, isSyncing, isResetting]);

  const handleUpdateProfile = async (updatedUser: User) => {
    if (!currentUser) return;
    setCurrentUser(updatedUser);
    localStorage.setItem('nur_quest_session', JSON.stringify(updatedUser));
    // Save to user list immediately
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const idx = users.findIndex((u:any) => u.username === updatedUser.username);
    if (idx >= 0) {
       users[idx] = updatedUser;
       localStorage.setItem('nur_quest_users', JSON.stringify(users));
    }
    setTimeout(() => performSync(), 100); 
  };

  useEffect(() => {
    if (isResetting) return;
    const savedUser = localStorage.getItem('nur_quest_session');
    if (savedUser) {
      let user = JSON.parse(savedUser);
      // Ensure admin creds if matching
      if (user.username === ADMIN_CREDENTIALS.username) user = { ...user, ...ADMIN_CREDENTIALS };
      setCurrentUser(user);
      setView('tracker');
      const savedData = localStorage.getItem(`ibadah_tracker_${user.username}`);
      if (savedData) setData(JSON.parse(savedData));
    }
  }, [isResetting]);

  useEffect(() => {
    if (isResetting || !currentUser) return;
    performSync();
  }, [performSync, isResetting, currentUser]);

  useEffect(() => {
    if (currentUser && !isResetting) {
      localStorage.setItem(`ibadah_tracker_${currentUser.username}`, JSON.stringify(data));
    }
  }, [data, currentUser, isResetting]);

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toggleTheme = () => {
    // Disabled
  };

  const handleLogout = async () => {
    if (currentUser) await api.sync(currentUser, data, groups);
    localStorage.removeItem('nur_quest_session');
    setCurrentUser(null);
    setView('login');
    setData(INITIAL_DATA);
    setError(null);
  };

  // Point Calculation for Ramadhan
  const totalPoints = useMemo(() => {
    return data.days.reduce((acc: number, day: DayData) => {
      const prayerPoints = (Object.values(day.prayers) as number[]).reduce((pAcc: number, val: number) => {
        if (val === 1) return pAcc + POINTS.HOME;
        if (val === 2) return pAcc + POINTS.MOSQUE;
        return pAcc;
      }, 0);
      
      const extraPoints = 
        (day.tilawah * POINTS.TILAWAH_PER_LINE) + 
        (day.shaum ? POINTS.SHAUM : 0) + 
        (day.tarawih ? POINTS.TARAWIH : 0);

      return acc + prayerPoints + extraPoints;
    }, 0);
  }, [data]);

  // Determine Today's Data for Side Panel
  const currentDayIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(RAMADHAN_START_DATE);
    start.setHours(0,0,0,0);
    const diffTime = today.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, []);

  const todayData = data.days[currentDayIndex] || data.days[0];

  const commonProps = {
    themeStyles,
    currentTheme,
    toggleTheme,
    performSync,
    networkLogs,
    globalAssets, 
    refreshAssets: (newAssets: GlobalAssets) => setGlobalAssets(newAssets)
  };

  if (isResetting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-xs text-white/50 mt-2">Loading Ramadhan Event...</p>
      </div>
    );
  }

  // Helper for Rank Calculation inside Component
  const currentRank = getRankInfo(totalPoints);
  // Find next rank for progress
  const currentRankIndex = RANK_TIERS.findIndex(r => r.name === currentRank.name);
  const nextRank = RANK_TIERS[currentRankIndex - 1]; // RANK_TIERS is sorted DESC (high to low)
  // If nextRank undefined (already highest), use current max
  const nextRankMin = nextRank ? nextRank.min : 10000;
  const prevRankMin = currentRank.min;
  const rankProgress = Math.min(100, Math.max(0, ((totalPoints - prevRankMin) / (nextRankMin - prevRankMin)) * 100));


  // --- RENDER LOGIC ---

  if (view === 'login' || view === 'register') {
    return (
      <>
        {view === 'login' && <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />}
        {view === 'register' && <RegisterPage setView={setView} setError={setError} error={error} groups={groups} {...commonProps} />}
      </>
    );
  }

  // PROTECTED GAME SHELL
  return (
    <div className={`relative h-full w-full overflow-hidden flex flex-col ${themeStyles.bg}`}>
      
      {/* HUD */}
      <GameHUD 
        currentUser={currentUser!}
        totalPoints={totalPoints}
        themeStyles={themeStyles}
        currentTheme={currentTheme}
        isOnline={isOnline}
        isSyncing={isSyncing}
        performSync={performSync}
        openProfile={() => setView('profile')}
      />

      {/* DESKTOP LAYOUT WRAPPER: 3 COLUMNS */}
      <div className="flex-grow flex justify-center w-full overflow-hidden">
        
        {/* LEFT COLUMN: LEADERBOARD (Visible on XL screens) */}
        <div className="hidden xl:block w-80 pt-[80px] pb-[120px] px-4 overflow-y-auto no-scrollbar">
          <MiniLeaderboard currentUser={currentUser} themeStyles={themeStyles} />
        </div>

        {/* MIDDLE COLUMN: MAIN APP (Mobile View) */}
        <div className="flex-grow overflow-y-auto no-scrollbar pt-[80px] px-4 pb-[120px] w-full max-w-lg relative z-10">
          
          {view === 'tracker' && (
            <TrackerPage 
              currentUser={currentUser!}
              data={data}
              setData={setData}
              totalPoints={totalPoints}
              {...commonProps}
            />
          )}

          {view === 'leaderboard' && (
            <LeaderboardPage 
              currentUser={currentUser} 
              setView={setView} 
              handleLogout={handleLogout} 
              groups={groups} 
              updateGroups={(g) => Promise.resolve()} // No-op, groups locked
              handleUpdateProfile={handleUpdateProfile}
              archives={archives} 
              attendance={attendance}
              {...commonProps} 
            />
          )}

          {view === 'profile' && (
            <div className="animate-reveal space-y-4">
              <div className={`${themeStyles.card} p-6 rounded-3xl text-center relative overflow-hidden border-2 ${currentRank.bg}`}>
                  
                  {/* Decorative Glow */}
                  <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${currentRank.color.replace('text-', 'from-').replace('400', '500')}/20 to-transparent pointer-events-none`}></div>

                  <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold mb-6 text-white drop-shadow-md`}>Commander Profile</h2>
                  
                  {/* Avatar & Info */}
                  <div className="mb-8">
                     <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-black/50 shadow-2xl mb-4 bg-black relative z-10">
                        <img src={currentUser?.avatarSeed} className="w-full h-full object-cover"/>
                     </div>
                     <p className="text-2xl font-black text-white mb-1">{currentUser?.fullName}</p>
                     <p className="text-sm opacity-60 font-mono">@{currentUser?.username}</p>
                  </div>

                  {/* RANK CARD SECTION */}
                  <div className={`mb-8 p-4 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden`}>
                     {/* Rank Icon Container (Wadah) */}
                     <div className="flex justify-center mb-4 relative z-10">
                        <div className="w-32 h-32 flex items-center justify-center drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                           {/* Placeholder Icon Logic */}
                           <img 
                              src={getRankIconUrl(currentRank.assetKey)} 
                              alt={currentRank.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                 // Fallback visual if icon not uploaded yet
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.parentElement?.classList.add('bg-white/5', 'rounded-full', 'border-2', 'border-dashed', 'border-white/20');
                              }}
                           />
                           {/* Fallback Text if Image Fails (handled via onError hiding img) */}
                           <div className="absolute inset-0 flex items-center justify-center -z-10 text-[10px] text-white/20 font-mono uppercase text-center p-2">
                              {currentRank.assetKey}
                           </div>
                        </div>
                     </div>

                     <h3 className={`text-xl font-black uppercase tracking-widest ${currentRank.color} mb-1`}>
                        {currentRank.name}
                     </h3>
                     <p className="text-[10px] text-white/50 uppercase tracking-widest mb-4">Current Season Rank</p>

                     {/* Progress Bar */}
                     <div className="relative w-full h-4 bg-black/50 rounded-full overflow-hidden border border-white/10 mb-1">
                        <div 
                           className={`h-full transition-all duration-1000 ${currentRank.color.replace('text-', 'bg-')}`} 
                           style={{ width: `${rankProgress}%` }}
                        />
                     </div>
                     <div className="flex justify-between text-[10px] font-bold opacity-70">
                        <span>{totalPoints} XP</span>
                        <span>{nextRankMin > 9000 ? 'MAX' : `${nextRankMin} XP`}</span>
                     </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                        <Shield className="w-5 h-5 opacity-50" />
                        <div>
                           <p className="text-[10px] uppercase opacity-50">Role</p>
                           <p className="font-bold capitalize">{currentUser?.role}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-white/50" />
                        <div>
                           <p className="text-[10px] uppercase opacity-50">Group</p>
                           <p className="font-bold text-xs truncate max-w-[100px]">{currentUser?.group.split('#')[0]}</p>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button onClick={handleLogout} className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs uppercase hover:bg-red-500 hover:text-white transition-colors">
                       Logout System
                    </button>
                  </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: DAILY TARGETS (Visible on XL screens) */}
        <div className="hidden xl:block w-80 pt-[80px] pb-[120px] px-4 overflow-y-auto no-scrollbar">
          <DailyTargetPanel dayData={todayData} themeStyles={themeStyles} dayIndex={currentDayIndex} />
        </div>

      </div>

      {/* DOCK */}
      <GameDock 
        activeView={view} 
        setView={setView} 
        themeStyles={themeStyles} 
        currentTheme={currentTheme}
        role={currentUser?.role || 'mentee'}
      />

    </div>
  );
};

export default App;
