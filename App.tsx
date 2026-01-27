
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData, MENTORING_GROUPS } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { CloudOff, RefreshCw, Activity, CheckCircle, Loader2, Database, AlertTriangle, Terminal, ExternalLink, Play, X, Copy } from 'lucide-react';

// Import Pages
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';

// SQL Script Constant
const SQL_REPAIR_SCRIPT = `-- Copy dan Paste kode ini di SQL Editor Supabase
create table if not exists app_sync (
  id text primary key,
  json_data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table app_sync enable row level security;

-- Memberikan akses baca/tulis ke publik (tanpa login) agar aplikasi web bisa akses
create policy "Public Access" on app_sync for all using (true);

-- Inisialisasi data kosong agar tidak error not found
insert into app_sync (id, json_data) values ('global_store_v7', '{}') on conflict do nothing;`;

const App: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);

  // --- VERSION RESET LOGIC ---
  useEffect(() => {
    const APP_VERSION = 'v7_factory_reset';
    const storedVersion = localStorage.getItem('nur_quest_version');
    
    if (storedVersion !== APP_VERSION) {
      console.warn("System Update V7: Purging old data...");
      setIsResetting(true);
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('nur_quest_') || key.startsWith('ibadah_tracker_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('nur_quest_version', APP_VERSION);
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
  const [syncErrorMsg, setSyncErrorMsg] = useState<string>("");
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('nur_quest_theme') as AppTheme) || 'default';
  });

  const themeStyles = THEMES[currentTheme];

  const addLog = (msg: string) => {
    setNetworkLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  // --- REFACTORED CLOUD SYNC ---
  const performSync = useCallback(async () => {
    if (isSyncing || isResetting) return;
    
    setIsSyncing(true);
    
    try {
      const result = await api.sync(currentUser, data, groups);
      
      if (result.success) {
        setIsOnline(true);
        setSyncErrorMsg("");
        setShowRepairModal(false); // Auto close modal if connection restores
        
        if (!isOnline) addLog("Connection Restored: Sync Successful.");

        localStorage.setItem('nur_quest_users', JSON.stringify(result.users));
        
        if (result.groups && result.groups.length > 0) {
          setGroups(result.groups);
          localStorage.setItem('nur_quest_groups', JSON.stringify(result.groups));
        }

        Object.keys(result.trackers).forEach(uname => {
          if (uname !== currentUser?.username) {
            localStorage.setItem(`ibadah_tracker_${uname}`, JSON.stringify(result.trackers[uname]));
          }
        });

        if (result.updatedLocalData) {
          addLog("Received newer data from cloud.");
          setData(result.updatedLocalData);
          localStorage.setItem(`ibadah_tracker_${currentUser?.username}`, JSON.stringify(result.updatedLocalData));
        }
      } else {
        setIsOnline(false);
        const msg = result.errorMessage || "Unknown Connection Error";
        setSyncErrorMsg(msg);
        
        if (msg !== "Offline Mode") {
           addLog(`Sync Failed: ${msg}`);
        } else if (isOnline) {
           addLog("Switched to Offline Mode.");
        }
      }
    } catch (e: any) {
      setIsOnline(false);
      setSyncErrorMsg(e.message || "Critical System Error");
      addLog(`Sync Error: ${e.message || "Unknown"}`);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, data, groups, isSyncing, isResetting, isOnline]);

  // --- UPDATE PROFILE (Edit User) ---
  const handleUpdateProfile = async (updatedUser: User) => {
    if (!currentUser) return;

    try {
      addLog("Updating Profile...");
      const oldUsername = currentUser.username;
      const newUsername = updatedUser.username;
      
      // 1. Update Current State & Persist Session Immediately
      setCurrentUser(updatedUser);
      localStorage.setItem('nur_quest_session', JSON.stringify(updatedUser));
      
      // 2. Handle Username Change (Migration)
      if (oldUsername !== newUsername) {
        const trackerData = localStorage.getItem(`ibadah_tracker_${oldUsername}`);
        if (trackerData) {
          localStorage.setItem(`ibadah_tracker_${newUsername}`, trackerData);
          localStorage.removeItem(`ibadah_tracker_${oldUsername}`);
        }
      }

      // 3. Update Local User List
      const usersStr = localStorage.getItem('nur_quest_users');
      let allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
      allUsers = allUsers.filter(u => u.username !== oldUsername && u.username !== newUsername);
      allUsers.push(updatedUser);
      localStorage.setItem('nur_quest_users', JSON.stringify(allUsers));

      // 4. Push to Cloud (Targeted Update)
      const res = await api.updateUserProfile(updatedUser);

      if (res.success) {
        addLog("Profile Updated Successfully.");
      } else {
        addLog(`Update Failed: ${res.error}`);
      }

    } catch (e: any) {
      console.error("Update Profile Failed:", e);
      addLog(`Update Profile Failed: ${e.message}`);
    }
  };

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

  useEffect(() => {
    if (isResetting) return;
    performSync();
    // Sync interval 60s
    const interval = setInterval(performSync, 60000);
    return () => clearInterval(interval);
  }, [performSync, isResetting]);

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

  const handleLogout = () => {
    localStorage.removeItem('nur_quest_session');
    setCurrentUser(null);
    setView('login');
    setData(INITIAL_DATA);
    setError(null);
  };

  const updateGroups = async (newGroups: string[]) => {
    setGroups(newGroups);
    localStorage.setItem('nur_quest_groups', JSON.stringify(newGroups));
    
    // Trigger sync to push group update
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const trackers = {}; 
    await api.updateDatabase({ users, trackers, groups: newGroups });
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

  const errorLower = syncErrorMsg.toLowerCase();
  const isTableError = errorLower.includes("relation") || errorLower.includes("does not exist") || errorLower.includes("42p01");
  const isAuthError = errorLower.includes("api key") || errorLower.includes("jwt") || errorLower.includes("401");

  return (
    <>
      {/* STATUS BAR WITH CLICK HANDLER */}
      <div 
        onClick={() => {
           if (!isOnline) setShowRepairModal(true);
           else performSync();
        }}
        className="fixed bottom-4 left-4 z-[9999] flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/10 p-1.5 pr-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer group max-w-[80vw]"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
           {isOnline ? <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> : <CloudOff className="w-4 h-4 text-red-500" />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className={`text-[9px] font-black uppercase tracking-tighter truncate ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? 'System Online' : (isTableError ? 'Database Missing' : isAuthError ? 'Auth Error' : 'Offline Mode')}
          </span>
          <span className="text-[8px] text-white/40 uppercase font-bold flex items-center gap-1 truncate w-full">
             {isSyncing ? 'Syncing...' : (isOnline ? 'Connected' : (isTableError ? 'Click to Fix' : (syncErrorMsg || 'Check Connection')))}
             {isSyncing && <RefreshCw className="w-2 h-2 animate-spin" />}
          </span>
        </div>
      </div>
      
      {/* SELF REPAIR MODAL */}
      {showRepairModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className={`w-full max-w-lg ${themeStyles.card} rounded-3xl p-6 ${themeStyles.glow} relative`}>
              <button onClick={() => setShowRepairModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-red-500/20 rounded-xl">
                   <Terminal className="w-6 h-6 text-red-500" />
                 </div>
                 <div>
                   <h3 className={`text-lg ${themeStyles.fontDisplay} font-bold uppercase`}>System Diagnosis</h3>
                   <p className="text-[10px] text-white/50 uppercase tracking-widest">Database Connection Issue</p>
                 </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                   Aplikasi tidak dapat menemukan tabel database di Supabase Anda. Ini normal untuk instalasi baru. 
                   Silakan jalankan script berikut di <strong>SQL Editor</strong> Supabase Anda.
                </p>

                <div className="relative group">
                   <div className="absolute top-2 right-2 flex gap-1">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(SQL_REPAIR_SCRIPT);
                          alert("Code Copied!");
                        }}
                        className="bg-white/10 hover:bg-white/20 p-1.5 rounded text-xs flex items-center gap-1 text-white font-mono"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                   </div>
                   <pre className="bg-black/50 border border-white/10 p-4 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-[200px]">
                      {SQL_REPAIR_SCRIPT}
                   </pre>
                </div>

                <div className="flex gap-2 pt-2">
                   <a 
                     href="https://supabase.com/dashboard/project/fymoxcdhskimzxpljjgi/sql/new" 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                   >
                     <ExternalLink className="w-4 h-4" /> Open SQL Editor
                   </a>
                   <button 
                     onClick={() => {
                        setIsSyncing(false);
                        performSync();
                     }}
                     className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                   >
                     <Play className="w-4 h-4" /> Retry Connection
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
      
      {/* TOP ALERTS FOR CRITICAL ERRORS */}
      {!isOnline && isTableError && !showRepairModal && (
        <div 
          onClick={() => setShowRepairModal(true)}
          className="fixed top-0 left-0 w-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-2 z-[99999] animate-in slide-in-from-top duration-500 cursor-pointer hover:bg-red-500"
        >
          <Database className="w-3 h-3 inline mr-2" />
          Critical: Database Missing. Click Here to Fix.
        </div>
      )}

      {view === 'login' && <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />}
      {view === 'register' && <RegisterPage setView={setView} setError={setError} error={error} groups={groups} {...commonProps} />}
      {view === 'leaderboard' && currentUser?.role === 'mentor' && (
        <LeaderboardPage 
          currentUser={currentUser} 
          setView={setView} 
          handleLogout={handleLogout} 
          groups={groups} 
          updateGroups={updateGroups} 
          handleUpdateProfile={handleUpdateProfile} 
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
          handleUpdateProfile={handleUpdateProfile}
          {...commonProps}
        />
      )}
    </>
  );
};

export default App;
