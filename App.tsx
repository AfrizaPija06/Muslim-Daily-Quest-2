
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WeeklyData, User, AppTheme, MENTORING_GROUPS, GlobalAssets, ArchivedData, AttendanceRecord, getRankInfo, RANK_TIERS, Badge } from './types';
import { INITIAL_DATA, ADMIN_CREDENTIALS, RAMADHAN_START_DATE, getRankIconUrl, MENTOR_AVATAR_URL, BADGES } from './constants';
import { THEMES } from './theme';
import { api } from './services/ApiService';
import { calculateTotalUserPoints } from './utils';
import { Loader2, Shield, Flame, ArrowLeft, Trophy, X, Medal, Lock, HelpCircle, Award } from 'lucide-react';
import { isFirebaseConfigured, auth } from './lib/firebase';

// Import Pages & Components
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LeaderboardPage from './components/LeaderboardPage';
import TrackerPage from './components/TrackerPage';
import GameHUD from './components/GameHUD';
import GameDock from './components/GameDock';
import MiniLeaderboard from './components/MiniLeaderboard';
import DailyTargetPanel from './components/DailyTargetPanel';
import LevelUpModal from './components/LevelUpModal';
import BackgroundMusic from './components/BackgroundMusic';
import BadgeModal from './components/BadgeModal'; 
import BadgeQuestBoard from './components/BadgeQuestBoard'; 
import AshraReportModal from './components/AshraReportModal'; 

const App: React.FC = () => {
  const [isResetting] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // VIEW STATE
  const [view, setView] = useState<string>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // State untuk Melihat Profil Orang Lain
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingStats, setViewingStats] = useState<{points: number, rank: any, unlockedBadges: string[]} | null>(null);

  // State untuk Mobile Leaderboard Modal
  const [showMobileLeaderboard, setShowMobileLeaderboard] = useState(false);

  const [data, setData] = useState<WeeklyData>(INITIAL_DATA);
  
  const groups = MENTORING_GROUPS;
  const [globalAssets, setGlobalAssets] = useState<GlobalAssets>({});
  const [archives] = useState<ArchivedData[]>([]);
  const [attendance] = useState<AttendanceRecord>({});
  
  const [error, setError] = useState<string | null>(null);
  const [isOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkLogs] = useState<string[]>([]);
  
  // LEVEL UP & BADGE STATE
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showQuestBoard, setShowQuestBoard] = useState(false);
  const [showAshraReport, setShowAshraReport] = useState(false);
  const [hasNewAshraReport, setHasNewAshraReport] = useState(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);
  const prevRankRef = useRef<string>(""); 

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentTheme, setCurrentTheme] = useState<AppTheme>('ramadhan');
  const themeStyles = THEMES[currentTheme];

  // --- CALCULATE CURRENT DAY INDEX ---
  const currentDayIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(RAMADHAN_START_DATE);
    start.setHours(0,0,0,0);
    const diffTime = today.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, []);

  // --- THEME LOGIC BASED ON PHASE ---
  useEffect(() => {
     // Phase 1: Ramadhan (Day 1-10) -> 'ramadhan'
     // Phase 2: Maghfirah (Day 11-20) -> 'maghfirah'
     
     if (currentDayIndex >= 10) {
        setCurrentTheme('maghfirah');
     } else {
        setCurrentTheme('ramadhan');
     }
  }, [currentDayIndex]);

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
    localStorage.setItem('nur_quest_session', JSON.stringify(updatedUser));
    await api.updateUserProfile(updatedUser);
  };

  // --- SESSION RESTORATION (FIREBASE WAY) ---
  useEffect(() => {
    if (isResetting) return;

    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (user) {
        try {
          const profile = await api.getUserProfile(user.uid);
          if (profile) {
            if (profile.user.username === ADMIN_CREDENTIALS.username) {
               profile.user.avatarSeed = MENTOR_AVATAR_URL;
            }
            setCurrentUser(profile.user);
            setData(profile.data);
            setView('tracker');
          } else {
             setView('login');
          }
        } catch (e) {
          console.error("Restoration error", e);
          setView('login');
        }
      } else {
        const savedUser = localStorage.getItem('nur_quest_session');
        if (savedUser) {
           try {
             const parsed = JSON.parse(savedUser);
             if (parsed.username === ADMIN_CREDENTIALS.username) {
                setCurrentUser({ ...ADMIN_CREDENTIALS, avatarSeed: MENTOR_AVATAR_URL });
                setData(INITIAL_DATA);
                setView('tracker');
             } else {
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
    try { 
      if (auth) await auth.signOut(); 
    } catch (e) { console.error(e); }
    localStorage.removeItem('nur_quest_session');
    setCurrentUser(null);
    setView('login');
    setData(INITIAL_DATA);
    setError(null);
  };

  const totalPoints = useMemo(() => {
    return calculateTotalUserPoints(currentUser, data);
  }, [data, currentUser]);

  // --- RANK UP DETECTION LOGIC ---
  const currentRank = getRankInfo(totalPoints);
  
  useEffect(() => {
    if (isSessionLoading || !currentUser) return;
    
    // Initialize ref on first load
    if (prevRankRef.current === "") {
        prevRankRef.current = currentRank.name;
        return;
    }

    // Check if rank name changed AND points increased (to avoid demotion alert)
    if (currentRank.name !== prevRankRef.current && totalPoints > 0) {
        // Simple check: compare min points required
        const prevRankObj = RANK_TIERS.find(r => r.name === prevRankRef.current);
        if (prevRankObj && currentRank.min > prevRankObj.min) {
            setShowLevelUp(true);
        }
        prevRankRef.current = currentRank.name;
    }
  }, [totalPoints, currentRank.name, isSessionLoading, currentUser]);


  // --- BADGE DETECTION LOGIC ---
  useEffect(() => {
    if (!currentUser || isSessionLoading || isResetting) return;

    const unlocked = currentUser.unlockedBadges || [];
    let newUnlocked: Badge | null = null;
    let accumulatedBonus = 0;
    const newBadgeIds: string[] = [];

    // Check all badges
    BADGES.forEach(badge => {
       if (!unlocked.includes(badge.id)) {
          if (badge.condition(data)) {
             // Unlock this badge!
             if (!newUnlocked) newUnlocked = badge; // Show first unlocked
             accumulatedBonus += badge.bonusXP;
             newBadgeIds.push(badge.id);
          }
       }
    });

    if (newBadgeIds.length > 0) {
       // Update User State & Fire Modal
       const updatedUser = {
          ...currentUser,
          unlockedBadges: [...unlocked, ...newBadgeIds],
          bonusPoints: (currentUser.bonusPoints || 0) + accumulatedBonus
       };
       
       // Update Local
       setCurrentUser(updatedUser);
       // Update Remote (Fire & Forget)
       api.updateUserProfile(updatedUser);

       // Show Modal for the first one found
       if (newUnlocked) setNewlyUnlockedBadge(newUnlocked);
    }

  }, [data, currentUser, isSessionLoading, isResetting]);

  // --- ASHRA REPORT CHECK ---
  useEffect(() => {
     if (isSessionLoading || !currentUser) return;
     
     // Trigger on Day 11 (Index 10) or later
     if (currentDayIndex >= 10) {
        const hasSeen = localStorage.getItem(`ashra_report_1_${currentUser.username}`);
        if (!hasSeen) {
           setHasNewAshraReport(true);
           // Auto-open is optional, but let's keep it for now
           setTimeout(() => setShowAshraReport(true), 1500); 
        } else {
           setHasNewAshraReport(false);
        }
     }
  }, [currentDayIndex, isSessionLoading, currentUser]);

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

  // --- HANDLE VIEW OTHER USER PROFILE ---
  const handleViewUserProfile = (user: any) => {
     setViewingUser(user);
     // Points from Leaderboard/MiniLeaderboard are already calculated via calculateTotalUserPoints
     const totalP = user.points || 0;
     setViewingStats({
        points: totalP,
        rank: getRankInfo(totalP),
        unlockedBadges: user.unlockedBadges || []
     });
     setView('profile');
  };

  const handleBackToMyProfile = () => {
    setViewingUser(null);
    setViewingStats(null);
  }

  // Determine Profile Data to Show (Mine vs Others)
  const profileUser = viewingUser || currentUser;
  const profilePoints = viewingStats ? viewingStats.points : totalPoints;
  const profileRank = viewingStats ? viewingStats.rank : currentRank;
  const profileBadges = viewingStats ? viewingStats.unlockedBadges : (currentUser?.unlockedBadges || []);

  // Rank Progress Calculation for Profile View
  const profileRankIndex = RANK_TIERS.findIndex(r => r.name === profileRank.name);
  const nextRank = RANK_TIERS[profileRankIndex - 1]; 
  const nextRankMin = nextRank ? nextRank.min : 10000;
  const prevRankMin = profileRank.min;
  const profileProgress = Math.min(100, Math.max(0, ((profilePoints - prevRankMin) / (nextRankMin - prevRankMin)) * 100));


  if (isResetting || isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col text-emerald-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-xs text-white/50 mt-2">Connecting to Server Node...</p>
      </div>
    );
  }

  // --- RENDER COMPONENT BACKGROUND MUSIC ---
  const BackgroundMusicComponent = <BackgroundMusic themeStyles={themeStyles} />;

  if (view === 'login' || view === 'register') {
    return (
      <>
        {BackgroundMusicComponent}
        {view === 'login' && <LoginPage setView={setView} setCurrentUser={setCurrentUser} setData={setData} setError={setError} error={error} {...commonProps} />}
        {view === 'register' && <RegisterPage setView={setView} setError={setError} error={error} groups={groups} {...commonProps} />}
      </>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden flex flex-col ${themeStyles.bg}`}>
      
      {BackgroundMusicComponent}
      
      {/* MOBILE LEADERBOARD FAB */}
      <button 
        onClick={() => setShowMobileLeaderboard(true)}
        className="xl:hidden fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-black shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center justify-center hover:scale-110 transition-transform active:scale-95 border-2 border-white/20 animate-reveal"
      >
        <Trophy className="w-6 h-6" />
      </button>

      {/* MOBILE LEADERBOARD MODAL */}
      {showMobileLeaderboard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="relative w-full max-w-md h-[75vh] animate-in zoom-in-95">
              <button 
                onClick={() => setShowMobileLeaderboard(false)} 
                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white"
              >
                 <X className="w-8 h-8" />
              </button>
              <MiniLeaderboard 
                 currentUser={currentUser}
                 themeStyles={themeStyles}
                 onUserClick={(u) => {
                    setShowMobileLeaderboard(false);
                    handleViewUserProfile(u);
                 }}
              />
           </div>
        </div>
      )}

      {/* LEVEL UP MODAL */}
      {showLevelUp && (
         <LevelUpModal 
            newRank={currentRank} 
            themeStyles={themeStyles} 
            onClose={() => setShowLevelUp(false)} 
         />
      )}

      {/* BADGE UNLOCKED MODAL */}
      {newlyUnlockedBadge && (
         <BadgeModal 
            badge={newlyUnlockedBadge}
            themeStyles={themeStyles}
            onClose={() => setNewlyUnlockedBadge(null)}
         />
      )}

      {/* QUEST BOARD MODAL */}
      {showQuestBoard && (
        <BadgeQuestBoard
          unlockedBadges={currentUser?.unlockedBadges || []}
          onClose={() => setShowQuestBoard(false)}
          themeStyles={themeStyles}
        />
      )}

      {/* ASHRA REPORT MODAL */}
      {showAshraReport && currentUser && (
        <AshraReportModal
          data={data}
          currentUser={currentUser}
          onClose={() => {
             setShowAshraReport(false);
             setHasNewAshraReport(false); // Clear notification
             localStorage.setItem(`ashra_report_1_${currentUser.username}`, 'true');
          }}
        />
      )}

      <GameHUD 
        currentUser={currentUser!}
        totalPoints={totalPoints}
        themeStyles={themeStyles}
        currentTheme={currentTheme}
        isOnline={isOnline}
        isSyncing={isSyncing}
        performSync={performSync}
        openProfile={() => { handleBackToMyProfile(); setView('profile'); }}
        openQuestBoard={() => setShowQuestBoard(true)}
        openAshraReport={() => setShowAshraReport(true)}
        hasNewAshraReport={hasNewAshraReport}
      />

      <div className="flex-grow flex w-full overflow-hidden">
        
        <div className="hidden xl:block w-[300px] shrink-0 pt-[80px] pb-[120px] px-4 overflow-y-auto no-scrollbar border-r border-white/5">
          <MiniLeaderboard 
            currentUser={currentUser} 
            themeStyles={themeStyles} 
            onUserClick={handleViewUserProfile}
          />
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
                updateGroups={(_g) => Promise.resolve()} 
                handleUpdateProfile={handleUpdateProfile}
                archives={archives} 
                attendance={attendance}
                onUserClick={handleViewUserProfile} 
                {...commonProps} 
              />
            )}

            {view === 'profile' && (
              <div className="animate-reveal space-y-4 max-w-lg mx-auto pb-8">
                
                {/* Back Button if viewing others */}
                {viewingUser && (
                   <button onClick={() => { setView('leaderboard'); setViewingUser(null); }} className="flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white mb-2 transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
                   </button>
                )}

                <div className={`${themeStyles.card} p-6 rounded-[2.5rem] text-center relative overflow-hidden border-2 ${profileRank.bg} shadow-2xl`}>
                    
                    {/* Background Gradient */}
                    <div className={`absolute top-0 inset-x-0 h-64 bg-gradient-to-b ${profileRank.color.replace('text-', 'from-').replace('400', '500')}/20 to-transparent pointer-events-none`}></div>

                    <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold mb-6 text-white drop-shadow-md relative z-10 uppercase tracking-widest`}>
                      {viewingUser ? 'Trooper Profile' : 'Commander Profile'}
                    </h2>
                    
                    {/* --- PROFILE IMAGE (4:5 RATIO) --- */}
                    <div className="mb-6 relative z-10 group perspective-1000">
                      <div className="w-48 aspect-[4/5] mx-auto rounded-2xl overflow-hidden border-4 border-[#fbbf24] shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black relative transform transition-transform duration-500 hover:scale-[1.02]">
                          {/* Inner Vignette */}
                          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] z-20 pointer-events-none"></div>
                          
                          {/* Rank Badge on Corner */}
                          <div className="absolute top-2 right-2 z-30 w-10 h-10 bg-black/80 backdrop-blur rounded-lg border border-white/20 flex items-center justify-center shadow-lg">
                             <Trophy className={`w-5 h-5 ${profileRank.color}`} />
                          </div>

                          <img 
                             src={profileUser?.avatarSeed} 
                             className="w-full h-full object-cover"
                             alt="Avatar"
                          />
                      </div>
                    </div>

                    <div className="relative z-10 mb-8">
                      <p className="text-3xl font-black text-white mb-1 uppercase tracking-tight">{profileUser?.fullName}</p>
                      <p className="text-sm opacity-60 font-mono tracking-widest">@{profileUser?.username}</p>
                      {profileUser?.specialTitle && (
                          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-900/80 to-blue-900/80 border border-white/20 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse-slow">
                            <Award className="w-3 h-3 text-yellow-300" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md">{profileUser.specialTitle}</span>
                          </div>
                      )}
                    </div>

                    <div className={`mb-8 p-6 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden backdrop-blur-md`}>
                      <div className="flex justify-center mb-6 relative z-10">
                          <div className="w-24 h-24 flex items-center justify-center drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] animate-float">
                            <img 
                                src={getRankIconUrl(profileRank.assetKey)} 
                                alt={profileRank.name}
                                className="w-full h-full object-contain"
                            />
                          </div>
                      </div>

                      <h3 className={`text-2xl font-black uppercase tracking-widest ${profileRank.color} mb-1 drop-shadow-sm`}>
                          {profileRank.name}
                      </h3>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest mb-6">Current Season Rank</p>

                      <div className="relative w-full h-5 bg-black/50 rounded-full overflow-hidden border border-white/10 mb-2">
                          <div 
                            className={`h-full transition-all duration-1000 ${profileRank.color.replace('text-', 'bg-')}`} 
                            style={{ width: `${profileProgress}%` }}
                          />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold opacity-70">
                          <span>{profilePoints} XP</span>
                          <span>{nextRankMin > 9000 ? 'MAX' : `${nextRankMin} XP`}</span>
                      </div>
                    </div>
                    
                    {/* --- BADGES SHOWCASE SECTION --- */}
                    <div className="mb-8 text-left relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                           <Medal className="w-3 h-3" /> Badge Collection
                        </p>
                        
                        <div className="grid grid-cols-5 gap-2">
                           {/* Render Unlocked Badges */}
                           {BADGES.filter(b => profileBadges.includes(b.id)).map(badge => {
                              const Icon = badge.icon;
                              const tierColor = {
                                 bronze: 'text-orange-400 border-orange-600',
                                 silver: 'text-slate-300 border-slate-400',
                                 gold: 'text-yellow-400 border-yellow-500',
                                 emerald: 'text-emerald-400 border-emerald-500',
                                 mythic: 'text-purple-400 border-purple-500'
                              }[badge.tier || 'bronze'];

                              return (
                                <div key={badge.id} className="relative group cursor-pointer animate-in zoom-in-50 duration-500">
                                   <div className={`aspect-square rounded-xl flex items-center justify-center border bg-black/50 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${tierColor}`}>
                                      <Icon className={`w-5 h-5 ${tierColor.split(' ')[0]} drop-shadow-md`} />
                                   </div>
                                   {/* Tooltip */}
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black border border-white/10 p-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-md">
                                      <p className={`text-[9px] font-bold uppercase mb-1 ${tierColor.split(' ')[0]}`}>{badge.name}</p>
                                      <p className="text-[8px] leading-tight text-white/70">{badge.description}</p>
                                   </div>
                                </div>
                              )
                           })}

                           {/* Render Locked Non-Secret Badges (Preview) */}
                           {BADGES.filter(b => !profileBadges.includes(b.id) && !b.secret).map(badge => (
                              <div key={badge.id} className="relative group cursor-not-allowed opacity-40 grayscale">
                                 <div className={`aspect-square rounded-xl flex items-center justify-center border border-white/10 bg-white/5`}>
                                    <Lock className="w-4 h-4 text-white/30" />
                                 </div>
                              </div>
                           ))}

                           {/* Render Locked Secret Badges (Hidden/Mystery) */}
                           {BADGES.filter(b => !profileBadges.includes(b.id) && b.secret).map((_, idx) => (
                              <div key={`secret-${idx}`} className="relative group cursor-help opacity-20">
                                 <div className={`aspect-square rounded-xl flex items-center justify-center border border-white/5 bg-black/20`}>
                                    <HelpCircle className="w-4 h-4 text-white/20" />
                                 </div>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 bg-black border border-white/10 p-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                      <p className="text-[8px] leading-tight text-white/70 italic">Secret Achievement</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors">
                          <Shield className="w-5 h-5 opacity-50" />
                          <div>
                            <p className="text-[10px] uppercase opacity-50">Role</p>
                            <p className="font-bold capitalize">{profileUser?.role}</p>
                          </div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors">
                          <div className="w-5 h-5 rounded-full border border-white/50" />
                          <div>
                            <p className="text-[10px] uppercase opacity-50">Group</p>
                            <p className="font-bold text-xs truncate max-w-[100px]">{profileUser?.group.split('#')[0]}</p>
                          </div>
                      </div>
                    </div>

                    {!viewingUser && (
                      <div className="space-y-3 relative z-10">
                        <button onClick={handleLogout} className="w-full py-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs uppercase hover:bg-red-500 hover:text-white transition-colors">
                          Logout System
                        </button>
                      </div>
                    )}
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
