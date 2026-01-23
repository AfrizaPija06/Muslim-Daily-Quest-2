
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData, MENTORING_GROUPS } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { CloudOff, RefreshCw, Activity, CheckCircle, Loader2 } from 'lucide-react';

// Import Pages
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';

const App: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);

  // --- VERSION RESET LOGIC ---
  // Runs immediately to ensure clean state for V7
  useEffect(() => {
    const APP_VERSION = 'v7_factory_reset';
    const storedVersion = localStorage.getItem('nur_quest_version');
    
    if (storedVersion !== APP_VERSION) {
      console.warn("System Update V7: Purging old data...");
      setIsResetting(true);
      
      // Clear all app specific data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('nur_quest_') || key.startsWith('ibadah_tracker_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      // Set new version
      localStorage.setItem('nur_quest_version', APP_VERSION);
      
      // Slight delay to ensure storage writes complete before reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, []);

  const [view, setView] = useState<'login' | 'register' | 'tracker' | 'leaderboard'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  const [groups, setGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('nur_quest_groups');
    return saved ? JSON.parse(saved) : MENTORING_GROUPS;
  });
  
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
  
  const performSync = useCallback(async () => {
    // Block sync if resetting
    if (isSyncing || isResetting) return;
    
    setIsSyncing(true);
    addLog("Syncing with Cloud Database...");
    
    try {
      const result = await api.sync(currentUser, data, groups);
      
      if (result.success) {
        setIsOnline(true);
        addLog("Sync Successful.");

        // Update local storage for all users (for leaderboard)
        localStorage.setItem('nur_quest_users', JSON.stringify(result.users));
        
        // Update groups if cloud has them
        if (result.groups && result.groups.length > 0) {
          setGroups(result.groups);
          localStorage.setItem('nur_quest_groups', JSON.stringify(result.groups));
        }

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
      } else {
        setIsOnline(false);
        // Show specific error if available
        addLog(`Sync Failed: ${result.errorMessage || "Network Issue"}`);
      }
    } catch (e: any) {
      setIsOnline(false);
      addLog(`Sync Error: ${e.message || "Unknown"}`);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, data, groups, isSyncing, isResetting]);

  // Initial Session Load
  useEffect(() => {
    if (isResetting) return;
    const savedUser = localStorage.getItem('nur_quest_session');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setView('tracker');
      const savedData = localStorage.getItem(`ibadah_tracker_${user.username}`);
      if (savedData) setData(JSON.parse(savedData));
    }
  }, [isResetting]);

  // background polling
  useEffect(() => {
    if (isResetting) return;
    performSync();
    const interval = setInterval(performSync, 20000);
    return () => clearInterval(interval);
  }, [performSync, isResetting]);

  // Push only when current user data changes locally
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
    setCurrentTheme(prev => prev === 'default' ? 'legends' : 'default');
  };

  const handleLogout = () => {
    localStorage.removeItem('nur_quest_session');
    setCurrentUser(null);
    setView('login');
    setData(INITIAL_DATA);
    setError(null);
  };

  // Handler to update groups from Admin Panel
  const updateGroups = async (newGroups: string[]) => {
    setGroups(newGroups);
    localStorage.setItem('nur_quest_groups', JSON.stringify(newGroups));
    
    // Force sync to push changes immediately
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const trackersStr = localStorage.getItem(`ibadah_tracker_${currentUser?.username}`);
    const trackers = trackersStr ? { [currentUser?.username!]: JSON.parse(trackersStr) } : {};
    
    await api.updateDatabase({ 
      users: users, 
      trackers: trackers, 
      groups: newGroups 
    });
    performSync();
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
    networkLogs
  };

  if (isResetting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-mono uppercase tracking-widest">System Update V7</h2>
        <p className="text-xs text-white/50 mt-2">Purging cached data for clean install...</p>
      </div>
    );
  }

  return (
    <>
      {/* PROFESSIONAL STATUS INDICATOR */}
      <div 
        onClick={performSync}
        className="fixed bottom-4 left-4 z-[9999] flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/10 p-1.5 pr-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer group"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
           {isOnline ? <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> : <CloudOff className="w-4 h-4 text-red-500" />}
        </div>
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-tighter ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? 'System Online' : 'Offline Mode'}
          </span>
          <span className="text-[8px] text-white/40 uppercase font-bold flex items-center gap-1">
            {isSyncing ? 'Syncing...' : isOnline ? 'Connected' : 'Tap to Retry'}
            {isSyncing ? <RefreshCw className="w-2 h-2 animate-spin" /> : isOnline && <CheckCircle className="w-2 h-2 text-emerald-500" />}
          </span>
        </div>
      </div>

      {view === 'login' && <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />}
      {view === 'register' && <RegisterPage setView={setView} setError={setError} error={error} groups={groups} {...commonProps} />}
      {view === 'leaderboard' && currentUser?.role === 'mentor' && (
        <LeaderboardPage 
          currentUser={currentUser} 
          setView={setView} 
          handleLogout={handleLogout} 
          groups={groups} 
          updateGroups={updateGroups} 
          {...commonProps} 
        />
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
