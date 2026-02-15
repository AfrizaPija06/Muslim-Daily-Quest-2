
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WeeklyData, User, AppTheme, POINTS, DayData, MENTORING_GROUPS, GlobalAssets, ArchivedData, AttendanceRecord, getRankInfo, RANK_TIERS } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS, RAMADHAN_START_DATE, getRankIconUrl, MENTOR_AVATAR_URL } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { Loader2, Shield, Settings, Flame } from 'lucide-react';
import { isFirebaseConfigured, auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // VIEW STATE
  const [view, setView] = useState<string>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  
  const groups = MENTORING_GROUPS;
  const [globalAssets, setGlobalAssets] = useState<GlobalAssets>({});
  const [archives, setArchives] = useState<ArchivedData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTheme: AppTheme = 'ramadhan';
  const themeStyles = THEMES['ramadhan'];

  // --- FIREBASE CONFIGURATION CHECK ---
  if (!isFirebaseConfigured()) {
     return (
       <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center space-y-6">
          <Flame className="w-24 h-24 text-orange-500 animate-pulse" />
          <h1 className="text-3xl font-bold uppercase">Setup Firebase</h1>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 max-w-lg">
            <p className="mb-4 text-lg">Aplikasi telah dimigrasi ke Google Firebase.</p>
            <div className="h-px bg-white/20 my-4"></div>
            <p className="font-bold text-yellow-400">Langkah Setup:</p>
            <ol className="text-left text-sm space-y-2 list-decimal list-inside mt-2 text-slate-300">
              <li>Buat Project di <a href="https://console.firebase.google.com" target="_blank" className="text-blue-400 underline">Firebase Console</a>.</li>
              <li>Aktifkan <strong>Authentication</strong> (Email/Password).</li>
              <li>Aktifkan <strong>Firestore Database</strong> (Mode Test/Production).</li>
              <li>Copy config App Web ke file <code>.env</code>.</li>
            </ol>
          </div>
       </div>
     )
  }

  // --- SYNC LOGIC (DEBOUNCED) ---
  const performSync = useCallback(async () => {
    if (isSyncing || isResetting || !currentUser) return;
    setIsSyncing(true);
    try {
      await api.sync(currentUser, data, groups);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, data, groups, isSyncing, isResetting]);

  const handleUpdateProfile = async (updatedUser: User) => {
    if (!currentUser) return;
    setCurrentUser(updatedUser);
    // Kita tetap update localStorage sebagai cache cepat, tapi session asli dipegang Firebase
    localStorage.setItem('nur_quest_session', JSON.stringify(updatedUser));
    await api.updateUserProfile(updatedUser);
  };

  // --- SESSION RESTORATION (FIREBASE WAY) ---
  useEffect(() => {
    if (isResetting) return;

    // Listener untuk status login Firebase (Persistent)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User logged in via Firebase
        try {
          // Fetch data terbaru dari Firestore
          const profile = await api.getUserProfile(user.uid);
          if (profile) {
            // FIX: Force update avatar jika user adalah admin agar sesuai constants.ts
            if (profile.user.username === ADMIN_CREDENTIALS.username) {
               profile.user.avatarSeed = MENTOR_AVATAR_URL;
            }

            setCurrentUser(profile.user);
            setData(profile.data);
            setView('tracker');
          } else {
             // User ada di Auth tapi data hilang di DB?
             console.error("Auth exists but DB data missing");
             setView('login');
          }
        } catch (e) {
          console.error("Restoration error", e);
          setView('login');
        }
      } else {
        // User not logged in via Firebase
        // Cek apakah ini Admin Backdoor (via LocalStorage)
        const savedUser = localStorage.getItem('nur_quest_session');
        if (savedUser) {
           try {
             const parsed = JSON.parse(savedUser);
             if (parsed.username === ADMIN_CREDENTIALS.username) {
                // Restore Admin Session secara manual karena admin tidak pakai Firebase Auth
                // FIX: Force use latest Avatar URL
                setCurrentUser({ ...ADMIN_CREDENTIALS, avatarSeed: MENTOR_AVATAR_URL });
                setData(INITIAL_DATA);
                setView('tracker');
             } else {
                // User biasa tapi session firebase habis -> Logout
                setView('login');
             }
           } catch { setView('login'); }
        } else {
           setView('login');
        }
      }
      setIsSessionLoading(false);
    });

    return () => unsubscribe();
  }, [isResetting]);


  useEffect(() => {
    if (isResetting || !currentUser) return;

    if (syncTimeoutRef.current) {
       clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
       performSync();
    }, 2000);

    return () => {
       if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    }
  }, [data, performSync, isResetting, currentUser]);


  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  const toggleTheme = () => {
    // Disabled
  };

  const handleLogout = async () => {
    if (currentUser) await api.sync(currentUser, data, groups);
    
    // Logout dari Firebase
    try {
      await signOut(auth);
    } catch (e) { console.error(e); }

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
      
      const extraPoints = 
        (day.tilawah * POINTS.TILAWAH_PER_LINE) + 
        (day.shaum ? POINTS.SHAUM : 0) + 
        (day.tarawih ? POINTS.TARAWIH : 0);

      return acc + prayerPoints + extraPoints;
    }, 0);
  }, [data]);

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
    performSync: async () => { performSync(); },
    networkLogs,
    globalAssets, 
    refreshAssets: (newAssets: GlobalAssets) => setGlobalAssets(newAssets)
  };

  if (isResetting || isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-xs text-white/50 mt-2">Connecting to Server Node...</p>
      </div>
    );
  }

  const currentRank = getRankInfo(totalPoints);
  const currentRankIndex = RANK_TIERS.findIndex(r => r.name === currentRank.name);
  const nextRank = RANK_TIERS[currentRankIndex - 1]; 
  const nextRankMin = nextRank ? nextRank.min : 10000;
  const prevRankMin = currentRank.min;
  const rankProgress = Math.min(100, Math.max(0, ((totalPoints - prevRankMin) / (nextRankMin - prevRankMin)) * 100));

  if (view === 'login' || view === 'register') {
    return (
      <>
        {view === 'login' && <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />}
        {view === 'register' && <RegisterPage setView={setView} setError={setError} error={error} groups={groups} {...commonProps} />}
      </>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden flex flex-col ${themeStyles.bg}`}>
      
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

      <div className="flex-grow flex w-full overflow-hidden">
        
        <div className="hidden xl:block w-[300px] shrink-0 pt-[80px] pb-[120px] px-4 overflow-y-auto no-scrollbar border-r border-white/5">
          <MiniLeaderboard currentUser={currentUser} themeStyles={themeStyles} />
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar pt-[80px] px-4 pb-[120px] relative z-10 w-full">
          
          <div className="max-w-7xl mx-auto">
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
                updateGroups={(g) => Promise.resolve()} 
                handleUpdateProfile={handleUpdateProfile}
                archives={archives} 
                attendance={attendance}
                {...commonProps} 
              />
            )}

            {view === 'profile' && (
              <div className="animate-reveal space-y-4 max-w-lg mx-auto">
                <div className={`${themeStyles.card} p-6 rounded-3xl text-center relative overflow-hidden border-2 ${currentRank.bg}`}>
                    <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${currentRank.color.replace('text-', 'from-').replace('400', '500')}/20 to-transparent pointer-events-none`}></div>

                    <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold mb-6 text-white drop-shadow-md`}>Commander Profile</h2>
                    
                    <div className="mb-8">
                      <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-black/50 shadow-2xl mb-4 bg-black relative z-10">
                          <img src={currentUser?.avatarSeed} className="w-full h-full object-cover"/>
                      </div>
                      <p className="text-2xl font-black text-white mb-1">{currentUser?.fullName}</p>
                      <p className="text-sm opacity-60 font-mono">@{currentUser?.username}</p>
                    </div>

                    <div className={`mb-8 p-4 rounded-2xl bg-black/40 border border-white/5 relative overflow-hidden`}>
                      <div className="flex justify-center mb-4 relative z-10">
                          <div className="w-32 h-32 flex items-center justify-center drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">
                            <img 
                                src={getRankIconUrl(currentRank.assetKey)} 
                                alt={currentRank.name}
                                className="w-full h-full object-contain"
                                onError={(e) => e.currentTarget.style.display = 'none'}
                            />
                            {/* REMOVED: The distracting text overlay block that was here */}
                          </div>
                      </div>

                      <h3 className={`text-xl font-black uppercase tracking-widest ${currentRank.color} mb-1`}>
                          {currentRank.name}
                      </h3>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest mb-4">Current Season Rank</p>

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
        </div>

        <div className="hidden xl:block w-[300px] shrink-0 pt-[80px] pb-[120px] px-4 overflow-y-auto no-scrollbar border-l border-white/5">
          <DailyTargetPanel dayData={todayData} themeStyles={themeStyles} dayIndex={currentDayIndex} />
        </div>

      </div>

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
