import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { Cloud, CloudOff, RefreshCw, Activity } from 'lucide-react';

// Import Pages
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'tracker' | 'leaderboard'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('nur_quest_theme') as AppTheme) || 'default';
  });

  const themeStyles = THEMES[currentTheme];

  const addLog = (msg: string) => {
    setNetworkLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  // --- REFACTORED CLOUD SYNC ---
  
  const performSync = useCallback(async (customUsers?: User[]) => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog("Syncing with Cloud Database...");
    
    try {
      const result = await api.sync(currentUser, data);
      
      // Update local storage for all users (for leaderboard)
      localStorage.setItem('nur_quest_users', JSON.stringify(result.users));
      Object.keys(result.trackers).forEach(uname => {
        if (uname !== currentUser?.username) {
          localStorage.setItem(`ibadah_tracker_${uname}`, JSON.stringify(result.trackers[uname]));
        }
      });

      // Update current user tracker if cloud has newer data
      if (result.updatedLocalData) {
        addLog("Received newer data from cloud.");
        setData(result.updatedLocalData);
        localStorage.setItem(`ibadah_tracker_${currentUser?.username}`, JSON.stringify(result.updatedLocalData));
      }

      setIsOnline(true);
      addLog("Sync Successful.");
    } catch (e) {
      setIsOnline(false);
      addLog("Sync Failed: Check internet connection.");
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, data, isSyncing]);

  // Initial Session Load
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

  // background polling
  useEffect(() => {
    performSync();
    const interval = setInterval(performSync, 20000);
    return () => clearInterval(interval);
  }, [performSync]);

  // Push only when current user data changes locally
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`ibadah_tracker_${currentUser.username}`, JSON.stringify(data));
    }
  }, [data, currentUser]);

  useEffect(() => {
    localStorage.setItem('nur_quest_theme', currentTheme);
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

  const totalPoints = useMemo(() => {
    // Adding explicit types to reduce callbacks to fix 'unknown' type errors (Error lines 114, 115)
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
    networkLogs
  };

  return (
    <>
      {/* PROFESSIONAL STATUS INDICATOR */}
      <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/10 p-1.5 pr-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-default group">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
           {isOnline ? <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> : <CloudOff className="w-4 h-4 text-red-500" />}
        </div>
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-tighter ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? 'Backend Online' : 'Backend Error'}
          </span>
          <span className="text-[8px] text-white/40 uppercase font-bold flex items-center gap-1">
            {isSyncing ? 'Synchronizing...' : 'Idle'}
            {isSyncing && <RefreshCw className="w-2 h-2 animate-spin" />}
          </span>
        </div>
      </div>

      {view === 'login' && <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />}
      {view === 'register' && <RegisterPage setView={setView} setError={setError} error={error} {...commonProps} />}
      {view === 'leaderboard' && currentUser?.role === 'mentor' && (
        <LeaderboardPage currentUser={currentUser} setView={setView} handleLogout={handleLogout} {...commonProps} />
      )}
      {view === 'tracker' && (
        <TrackerPage 
          currentUser={currentUser}
          setView={setView}
          handleLogout={handleLogout}
          data={data}
          setData={setData}
          totalPoints={totalPoints}
          {...commonProps}
        />
      )}
    </>
  );
};

export default App;