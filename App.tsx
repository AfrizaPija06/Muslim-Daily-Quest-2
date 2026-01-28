import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData, MENTORING_GROUPS, GlobalAssets } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { CloudOff, RefreshCw, Activity, CheckCircle, Loader2, Database, AlertTriangle, Terminal, ExternalLink, Play, X, Copy, WifiOff, Link as LinkIcon } from 'lucide-react';

// Import Pages
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';

// SQL Script Constant
const SQL_REPAIR_SCRIPT = `-- LANGKAH PENTING:
-- 1. HAPUS semua kode lama di layar ini.
-- 2. COPY & PASTE kode baru ini.
-- 3. Klik RUN.

-- Hapus policy lama jika ada (untuk reset izin)
drop policy if exists "Public Access" on app_sync;

create table if not exists app_sync (
  id text primary key,
  json_data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table app_sync enable row level security;

-- Memberikan akses PENUH (Baca/Tulis/Edit)
create policy "Public Access" on app_sync 
for all 
using (true) 
with check (true);

-- Inisialisasi data (jika belum ada)
insert into app_sync (id, json_data) values ('global_store_v7', '{}') on conflict do nothing;`;

const SUPABASE_PROJECT_ID = "fymoxcdhskimzxpljjgi";
const SUPABASE_SQL_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`;

const App: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const APP_VERSION = 'v7.4_fix_access'; 
    const storedVersion = localStorage.getItem('nur_quest_version');
    
    if (storedVersion !== APP_VERSION) {
      console.warn("System Update V7.4: Fixing Write Access...");
      localStorage.setItem('nur_quest_version', APP_VERSION);
      setIsResetting(true);
      setTimeout(() => setIsResetting(false), 1500);
    }
  }, []);

  const [view, setView] = useState<'login' | 'register' | 'tracker' | 'leaderboard'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  const [groups, setGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem('nur_quest_groups');
    return saved ? JSON.parse(saved) : MENTORING_GROUPS;
  });
  
  // NEW: Global Assets State
  const [globalAssets, setGlobalAssets] = useState<GlobalAssets>(() => {
    return JSON.parse(localStorage.getItem('nur_quest_assets') || '{}');
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
        
        if (!isOnline) addLog("Connection Restored: Sync Successful.");

        localStorage.setItem('nur_quest_users', JSON.stringify(result.users));
        
        if (result.groups && result.groups.length > 0) {
          setGroups(result.groups);
          localStorage.setItem('nur_quest_groups', JSON.stringify(result.groups));
        }
        
        // SYNC ASSETS
        if (result.assets) {
           setGlobalAssets(result.assets);
           localStorage.setItem('nur_quest_assets', JSON.stringify(result.assets));
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
        
        if (msg.toLowerCase().includes("relation") || msg.toLowerCase().includes("policy")) {
           setShowRepairModal(true);
        }
        
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

  const handleUpdateProfile = async (updatedUser: User) => {
    if (!currentUser) return;
    try {
      addLog("Updating Profile...");
      const oldUsername = currentUser.username;
      const newUsername = updatedUser.username;
      
      setCurrentUser(updatedUser);
      localStorage.setItem('nur_quest_session', JSON.stringify(updatedUser));
      
      if (oldUsername !== newUsername) {
        const trackerData = localStorage.getItem(`ibadah_tracker_${oldUsername}`);
        if (trackerData) {
          localStorage.setItem(`ibadah_tracker_${newUsername}`, trackerData);
          localStorage.removeItem(`ibadah_tracker_${oldUsername}`);
        }
      }

      const usersStr = localStorage.getItem('nur_quest_users');
      let allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
      allUsers = allUsers.filter(u => u.username !== oldUsername && u.username !== newUsername);
      allUsers.push(updatedUser);
      localStorage.setItem('nur_quest_users', JSON.stringify(allUsers));

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

  // Helper to refresh assets (called from Header)
  const refreshAssets = (newAssets: GlobalAssets) => {
    setGlobalAssets(newAssets);
    localStorage.setItem('nur_quest_assets', JSON.stringify(newAssets));
  };

  useEffect(() => {
    if (isResetting) return;
    const savedUser = localStorage.getItem('nur_quest_session');
    if (savedUser) {
      let user = JSON.parse(savedUser);
      
      // FORCE UPDATE: Ensure Admin always uses latest credentials (including new Avatar)
      if (user.username === ADMIN_CREDENTIALS.username) {
         user = { ...user, ...ADMIN_CREDENTIALS };
         localStorage.setItem('nur_quest_session', JSON.stringify(user));
      }

      setCurrentUser(user);
      setView('tracker');
      const savedData = localStorage.getItem(`ibadah_tracker_${user.username}`);
      if (savedData) setData(JSON.parse(savedData));
    }
  }, [isResetting]);

  useEffect(() => {
    if (isResetting) return;
    performSync();
    const interval = setInterval(performSync, 5000);
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
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const trackers = {}; 
    const assets = JSON.parse(localStorage.getItem('nur_quest_assets') || '{}');
    await api.updateDatabase({ users, trackers, groups: newGroups, assets });
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
    globalAssets, // Pass global assets down
    refreshAssets
  };

  if (isResetting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-mono uppercase tracking-widest">System Update V7.4</h2>
        <p className="text-xs text-white/50 mt-2">Fixing access permissions...</p>
      </div>
    );
  }

  const errorLower = syncErrorMsg.toLowerCase();
  const isTableError = errorLower.includes("relation") || errorLower.includes("does not exist") || errorLower.includes("42p01") || errorLower.includes("policy");

  return (
    <>
      {/* STATUS BAR */}
      <div 
        onClick={() => {
           console.log("Status Bar Clicked. Online:", isOnline, "Error:", syncErrorMsg);
           if (!isOnline) {
             setShowRepairModal(true);
           } else {
             performSync();
           }
        }}
        className="fixed bottom-4 left-4 z-[9999] flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/20 p-2 pr-5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer group max-w-[85vw] hover:bg-white/10"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'} transition-colors`}>
           {isOnline ? <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> : <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className={`text-[10px] font-black uppercase tracking-tighter truncate ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOnline ? 'SYSTEM ONLINE' : (isTableError ? 'DATABASE ERROR' : 'OFFLINE MODE')}
          </span>
          <span className="text-[8px] text-white/50 uppercase font-bold flex items-center gap-1 truncate w-full">
             {isSyncing ? 'SYNCING...' : (isOnline ? 'LIVE CONNECTION' : (isTableError ? 'CLICK TO FIX' : 'CLICK TO RETRY'))}
             {isSyncing && <RefreshCw className="w-2 h-2 animate-spin" />}
          </span>
        </div>
      </div>
      
      {/* SELF REPAIR MODAL */}
      {showRepairModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className={`w-full max-w-lg ${themeStyles.card} rounded-3xl p-6 ${themeStyles.glow} relative border-2 border-red-500/30`}>
              <button onClick={() => setShowRepairModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
                   <Database className="w-8 h-8 text-red-500" />
                 </div>
                 <div>
                   <h3 className={`text-xl ${themeStyles.fontDisplay} font-bold uppercase text-red-500`}>Update Database</h3>
                   <p className="text-[10px] text-white/50 uppercase tracking-widest">Permission Fix Required</p>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="bg-red-950/30 p-4 rounded-xl border border-red-500/20">
                  <p className="text-xs text-red-200 leading-relaxed font-bold">
                     Database menolak perubahan data (Grant Access).
                  </p>
                  <ol className="text-[10px] text-red-300/70 mt-2 list-decimal ml-4 space-y-1">
                     <li>Klik tombol biru <strong>"Open SQL Editor"</strong>.</li>
                     <li><strong>HAPUS SEMUA</strong> kode lama di layar SQL Editor.</li>
                     <li><strong>PASTE</strong> kode baru dari kotak di bawah ini.</li>
                     <li>Klik tombol hijau <strong>RUN</strong>.</li>
                  </ol>
                </div>

                <div className="relative group">
                   <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(SQL_REPAIR_SCRIPT);
                          alert("SQL Script Copied! Paste di SQL Editor.");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg text-xs flex items-center gap-1 text-white font-bold shadow-lg"
                      >
                        <Copy className="w-3 h-3" /> Copy Code
                      </button>
                   </div>
                   <pre className="bg-black border border-white/20 p-4 pt-10 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap max-h-[200px] shadow-inner">
                      {SQL_REPAIR_SCRIPT}
                   </pre>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                   <div className="flex gap-2">
                     <a 
                       href={SUPABASE_SQL_URL}
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all text-center"
                     >
                       <ExternalLink className="w-4 h-4" /> 1. Open SQL Editor
                     </a>
                     <button
                        onClick={() => {
                          navigator.clipboard.writeText(SUPABASE_SQL_URL);
                          alert("Link Copied! Please open it in your browser:\n" + SUPABASE_SQL_URL);
                        }}
                        className="w-14 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center"
                        title="Copy Link if button doesn't work"
                     >
                       <LinkIcon className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <button 
                     onClick={() => {
                        setShowRepairModal(false);
                        setIsSyncing(false);
                        performSync();
                     }}
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                   >
                     <Play className="w-4 h-4" /> 2. Saya Sudah Run Script (Retry)
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
      
      {!isOnline && isTableError && !showRepairModal && (
        <div 
          onClick={() => setShowRepairModal(true)}
          className="fixed top-0 left-0 w-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-3 z-[99999] animate-in slide-in-from-top duration-500 cursor-pointer hover:bg-red-500 flex items-center justify-center gap-2 shadow-xl"
        >
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>Database Permission Error: Click here to fix</span>
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