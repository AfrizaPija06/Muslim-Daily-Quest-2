
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData, MENTORING_GROUPS, GlobalAssets, ArchivedData, AttendanceRecord } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { Loader2 } from 'lucide-react';

// Import Pages & Components
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';
import GameHUD from './components/GameHUD';
import GameDock from './components/GameDock';

const App: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const APP_VERSION = 'v8.1_mobile_rpg'; 
    const storedVersion = localStorage.getItem('nur_quest_version');
    
    if (storedVersion !== APP_VERSION) {
      console.warn("System Upgrade: Mobile RPG UI.");
      localStorage.setItem('nur_quest_version', APP_VERSION);
    }
  }, []);

  // VIEW STATE: 'login' | 'register' | 'tracker' | 'leaderboard' | 'profile'
  const [view, setView] = useState<string>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  const [groups, setGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('nur_quest_groups');
    return saved ? JSON.parse(saved) : MENTORING_GROUPS;
  });
  
  const [globalAssets, setGlobalAssets] = useState<GlobalAssets>({});
  const [archives, setArchives] = useState<ArchivedData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('nur_quest_theme') as AppTheme) || 'default';
  });

  const themeStyles = THEMES[currentTheme];

  // --- SYNC LOGIC ---
  const performSync = useCallback(async () => {
    if (isSyncing || isResetting) return;
    setIsSyncing(true);
    try {
      const result = await api.sync(currentUser, data, groups);
      if (result.success) {
        setIsOnline(true);
        localStorage.setItem('nur_quest_users', JSON.stringify(result.users));
        
        if (result.trackers && currentUser && result.trackers[currentUser.username]) {
           const myCloudData = result.trackers[currentUser.username];
           const localTime = data.lastUpdated ? new Date(data.lastUpdated).getTime() : 0;
           const cloudTime = myCloudData.lastUpdated ? new Date(myCloudData.lastUpdated).getTime() : 0;
           if (cloudTime > localTime) {
             setData(myCloudData);
             localStorage.setItem(`ibadah_tracker_${currentUser.username}`, JSON.stringify(myCloudData));
           }
        }
        // Save others data for leaderboard
        Object.keys(result.trackers).forEach(uname => {
          if (uname !== currentUser?.username) {
            localStorage.setItem(`ibadah_tracker_${uname}`, JSON.stringify(result.trackers[uname]));
          }
        });
      } else {
        setIsOnline(false);
      }
    } catch (e: any) {
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, data, groups, isSyncing, isResetting]);

  const handleUpdateProfile = async (updatedUser: User) => {
    if (!currentUser) return;
    setCurrentUser(updatedUser);
    localStorage.setItem('nur_quest_session', JSON.stringify(updatedUser));
    setTimeout(() => performSync(), 100); 
  };

  useEffect(() => {
    if (isResetting) return;
    const savedUser = localStorage.getItem('nur_quest_session');
    if (savedUser) {
      let user = JSON.parse(savedUser);
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
    const interval = setInterval(performSync, 60000); 
    return () => clearInterval(interval);
  }, [performSync, isResetting, currentUser]);

  useEffect(() => {
    if (currentUser && !isResetting) {
      localStorage.setItem(`ibadah_tracker_${currentUser.username}`, JSON.stringify(data));
    }
  }, [data, currentUser, isResetting]);

  useEffect(() => {
    localStorage.setItem('nur_quest_theme', currentTheme);
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prev => {
      if (prev === 'default') return 'legends';
      if (prev === 'legends') return 'light';
      return 'default';
    });
  };

  const handleLogout = async () => {
    if (currentUser) await api.sync(currentUser, data, groups);
    localStorage.removeItem('nur_quest_session');
    setCurrentUser(null);
    setView('login');
    setData(INITIAL_DATA);
    setError(null);
  };

  const totalPoints = useMemo(() => {
    return data.days.reduce((acc: number, day: DayData) => {
      const prayerPoints = (Object.values(day.prayers) as number[]).reduce((pAcc: number, val: number) => {
        if (val === 1) return pAcc + POINTS.HOME;
        if (val === 2) return pAcc + POINTS.MOSQUE;
        return pAcc;
      }, 0);
      return acc + prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
    }, 0);
  }, [data]);

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
        <p className="text-xs text-white/50 mt-2">Initializing Game Engine...</p>
      </div>
    );
  }

  // --- RENDER LOGIC ---

  // 1. PUBLIC PAGES (Login/Register) - Full Screen
  if (view === 'login' || view === 'register') {
    return (
      <>
        {view === 'login' && <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />}
        {view === 'register' && <RegisterPage setView={setView} setError={setError} error={error} groups={groups} {...commonProps} />}
      </>
    );
  }

  // 2. PROTECTED GAME SHELL (HUD + Viewport + Dock)
  return (
    <div className={`relative h-full w-full overflow-hidden flex flex-col ${themeStyles.bg}`}>
      
      {/* A. HEADS UP DISPLAY (HUD) */}
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

      {/* B. SCROLLABLE VIEWPORT */}
      {/* Padding top for HUD (70px) and bottom for Dock (100px) */}
      <div className="flex-grow overflow-y-auto no-scrollbar pt-[80px] px-4 pb-[120px] w-full max-w-lg mx-auto">
        
        {view === 'tracker' && (
          <TrackerPage 
            currentUser={currentUser}
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
            updateGroups={(g) => Promise.resolve(setGroups(g))} 
            handleUpdateProfile={handleUpdateProfile}
            archives={archives} 
            attendance={attendance}
            {...commonProps} 
          />
        )}

        {/* PROFILE VIEW (Reusing parts of Header modal logic in future, for now simple placeholder) */}
        {view === 'profile' && (
          <div className="animate-reveal space-y-4">
             <div className={`${themeStyles.card} p-6 rounded-2xl text-center`}>
                <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold mb-2`}>Commander Profile</h2>
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white/10 mb-4 bg-black">
                   <img src={currentUser?.avatarSeed} className="w-full h-full object-cover"/>
                </div>
                <p className="text-xl font-bold">{currentUser?.fullName}</p>
                <p className="text-sm opacity-50 font-mono mb-6">@{currentUser?.username}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="p-3 bg-white/5 rounded-xl">
                      <p className="text-[10px] uppercase opacity-50">Role</p>
                      <p className="font-bold">{currentUser?.role}</p>
                   </div>
                   <div className="p-3 bg-white/5 rounded-xl">
                      <p className="text-[10px] uppercase opacity-50">Group</p>
                      <p className="font-bold">{currentUser?.group}</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <button onClick={toggleTheme} className={`w-full py-3 rounded-xl border ${themeStyles.border} font-bold text-xs uppercase`}>Switch Theme</button>
                   <button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs uppercase">Logout</button>
                </div>
             </div>
          </div>
        )}

      </div>

      {/* C. BOTTOM DOCK */}
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
