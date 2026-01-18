
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Users, Target, ShieldCheck, History, Trophy, Download, FileSpreadsheet, UserPlus, CheckCircle, XCircle, Calendar, Star } from 'lucide-react';
import * as XLSX from 'xlsx';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import { User, AppTheme, POINTS, WeeklyData, PRAYER_KEYS } from '../types';

interface LeaderboardPageProps {
  currentUser: User | null;
  setView: (view: any) => void;
  handleLogout: () => void;
  themeStyles: any;
  currentTheme: AppTheme;
  toggleTheme: () => void;
}

interface LeaderboardData {
  fullName: string;
  username: string;
  group: string;
  points: number;
  monthlyPoints: number; // Simulated Season Points
  activeDays: number;
  lastUpdated: string;
  status: string;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ currentUser, setView, handleLogout, themeStyles, currentTheme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'requests'>('leaderboard');
  const [menteesData, setMenteesData] = useState<LeaderboardData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  // Fetch data function
  const loadData = () => {
    const usersStr = localStorage.getItem('nur_quest_users');
    const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    // 1. Process Active Mentees for Leaderboard
    const activeMentees = allUsers
      .filter(u => u.role === 'mentee' && (u.status === 'active' || u.status === undefined))
      .map(u => {
        const trackerStr = localStorage.getItem(`ibadah_tracker_${u.username}`);
        const trackerData: WeeklyData | null = trackerStr ? JSON.parse(trackerStr) : null;
        
        let points = 0;
        let activeDays = 0;

        if (trackerData) {
          trackerData.days.forEach(day => {
            const prayerPoints = Object.values(day.prayers).reduce((acc: number, val: number) => {
              if (val === 1) return acc + POINTS.HOME;
              if (val === 2) return acc + POINTS.MOSQUE;
              return acc;
            }, 0);
            points += prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);

            const hasActivity = Object.values(day.prayers).some(p => p > 0) || day.tilawah > 0;
            if (hasActivity) activeDays++;
          });
        }

        // Simulate Monthly/Season Points (Weekly * 4 for this demo as we lack history DB)
        // In a real app, this would be an aggregation of 4 weeks.
        const monthlyPoints = points * 4; 

        return {
          fullName: u.fullName,
          username: u.username,
          group: u.group,
          points,
          monthlyPoints,
          activeDays,
          lastUpdated: trackerData?.lastUpdated || 'Belum ada data',
          status: 'active'
        };
      });

    setMenteesData(activeMentees);

    // 2. Process Pending Users
    const pending = allUsers.filter(u => u.role === 'mentee' && u.status === 'pending');
    setPendingUsers(pending);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleApproval = (username: string, action: 'approve' | 'reject') => {
    const usersStr = localStorage.getItem('nur_quest_users');
    let allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    allUsers = allUsers.map(u => {
      if (u.username === username) {
        return { ...u, status: action === 'approve' ? 'active' : 'rejected' };
      }
      return u;
    });

    localStorage.setItem('nur_quest_users', JSON.stringify(allUsers));
    loadData(); 
  };

  const sortedWeekly = useMemo(() => {
    return [...menteesData].sort((a, b) => b.points - a.points);
  }, [menteesData]);

  const sortedMonthly = useMemo(() => {
    return [...menteesData].sort((a, b) => b.monthlyPoints - a.monthlyPoints);
  }, [menteesData]);

  const handleDownloadExcel = () => {
    const usersStr = localStorage.getItem('nur_quest_users');
    const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const overviewData: any[] = [];
    const analysisData: any[] = [];
    const rawDailyData: any[] = [];

    allUsers.filter(u => u.role === 'mentee' && (u.status === 'active' || u.status === undefined)).forEach(u => {
      const trackerStr = localStorage.getItem(`ibadah_tracker_${u.username}`);
      const trackerData: WeeklyData | null = trackerStr ? JSON.parse(trackerStr) : null;
      
      if (!trackerData) return; 

      let totalPoints = 0;
      let activeDays = 0;
      let totalTilawah = 0;

      const prayerStats: Record<string, { masjid: number; rumah: number; bolong: number; score: number }> = {};
      PRAYER_KEYS.forEach(k => {
        prayerStats[k] = { masjid: 0, rumah: 0, bolong: 0, score: 0 };
      });

      trackerData.days.forEach(day => {
        rawDailyData.push({
          "Nama": u.fullName,
          "Kelompok": u.group,
          "Hari": day.dayName,
          "Subuh": day.prayers.subuh === 2 ? '2 - Masjid' : day.prayers.subuh === 1 ? '1 - Rumah' : '0 - Lewat',
          "Zuhur": day.prayers.zuhur === 2 ? '2 - Masjid' : day.prayers.zuhur === 1 ? '1 - Rumah' : '0 - Lewat',
          "Asar": day.prayers.asar === 2 ? '2 - Masjid' : day.prayers.asar === 1 ? '1 - Rumah' : '0 - Lewat',
          "Magrib": day.prayers.magrib === 2 ? '2 - Masjid' : day.prayers.magrib === 1 ? '1 - Rumah' : '0 - Lewat',
          "Isya": day.prayers.isya === 2 ? '2 - Masjid' : day.prayers.isya === 1 ? '1 - Rumah' : '0 - Lewat',
          "Tilawah (Baris)": day.tilawah
        });

        let dailyHasActivity = false;
        
        PRAYER_KEYS.forEach(key => {
           const val = day.prayers[key];
           if (val > 0) dailyHasActivity = true;
           if (val === 2) { 
             prayerStats[key].masjid++; 
             prayerStats[key].score += POINTS.MOSQUE; 
             totalPoints += POINTS.MOSQUE;
           } else if (val === 1) { 
             prayerStats[key].rumah++; 
             prayerStats[key].score += POINTS.HOME; 
             totalPoints += POINTS.HOME;
           } else { 
             prayerStats[key].bolong++; 
           }
        });

        if (day.tilawah > 0) {
          dailyHasActivity = true;
          totalTilawah += day.tilawah;
          totalPoints += (day.tilawah * POINTS.TILAWAH_PER_LINE);
        }
        if (dailyHasActivity) activeDays++;
      });

      let weakestPrayer = 'None';
      let lowestScore = Infinity;
      PRAYER_KEYS.forEach(key => {
        if (prayerStats[key].score < lowestScore) {
          lowestScore = prayerStats[key].score;
          weakestPrayer = key.charAt(0).toUpperCase() + key.slice(1);
        }
      });

      overviewData.push({
        "Nama Lengkap": u.fullName,
        "Kelompok": u.group,
        "Total Poin": totalPoints,
        "Total Tilawah (Baris)": totalTilawah,
        "Hari Aktif": activeDays,
        "Terakhir Update": trackerData.lastUpdated ? new Date(trackerData.lastUpdated).toLocaleDateString() : '-'
      });

      const analysisRow: any = {
        "Nama": u.fullName,
        "Kelompok": u.group,
        "Total Tilawah": totalTilawah,
        "REKOMENDASI EVALUASI": `Perbaiki Shalat ${weakestPrayer}`,
      };
      PRAYER_KEYS.forEach(key => {
        const KeyCap = key.charAt(0).toUpperCase() + key.slice(1);
        analysisRow[`${KeyCap} (Masjid)`] = prayerStats[key].masjid;
        analysisRow[`${KeyCap} (Rumah)`] = prayerStats[key].rumah;
        analysisRow[`${KeyCap} (Bolong)`] = prayerStats[key].bolong;
      });
      analysisData.push(analysisRow);
    });

    const wb = XLSX.utils.book_new();
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "1. Rekap Poin");
    const wsAnalysis = XLSX.utils.json_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(wb, wsAnalysis, "2. Analisis Shalat");
    const wsRaw = XLSX.utils.json_to_sheet(rawDailyData);
    XLSX.utils.book_append_sheet(wb, wsRaw, "3. Data Harian");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Evaluasi_Mentoring_${dateStr}.xlsx`);
  };

  const TableHeader = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
    <div className={`p-4 border-b ${themeStyles.border} flex justify-between items-center bg-white/5`}>
      <h3 className={`${themeStyles.fontDisplay} text-lg font-bold tracking-wider flex items-center gap-2 uppercase`}>
        {icon} {title}
      </h3>
    </div>
  );

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative overflow-x-hidden transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={0} handleLogout={handleLogout} activeView="leaderboard" themeStyles={themeStyles} currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">
        {/* Top Header */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${themeStyles.border} pb-6`}>
          <div>
            <h2 className={`text-3xl ${themeStyles.fontDisplay} font-bold tracking-widest flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <LayoutDashboard className={`w-8 h-8 ${themeStyles.textAccent}`} /> Mentor Dashboard
            </h2>
            <p className={`text-xs italic mt-1 font-medium ${themeStyles.textSecondary}`}>“Pantau perkembangan spiritual mentee secara real-time”</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadExcel}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${currentTheme === 'legends' ? 'bg-[#d4af37] text-black hover:bg-[#ffe680]' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-700/50 pb-1">
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'leaderboard' ? `${themeStyles.textAccent} border-current` : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            Rankings
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeTab === 'requests' ? `${themeStyles.textAccent} border-current` : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            Requests 
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
          </button>
        </div>

        {activeTab === 'leaderboard' ? (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Active Mentees" value={menteesData.length.toString()} icon={<Users className="w-6 h-6 text-blue-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Avg. Weekly" value={menteesData.length > 0 ? Math.round(menteesData.reduce((acc, m) => acc + m.points, 0) / menteesData.length).toString() : "0"} icon={<Target className={`w-6 h-6 ${themeStyles.textAccent}`} />} themeStyles={themeStyles} />
              <SummaryCard label="Top Consistent" value={sortedWeekly.length > 0 ? sortedWeekly[0].fullName.split(' ')[0] : "-"} icon={<ShieldCheck className={`w-6 h-6 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
              <SummaryCard label="Pending" value={pendingUsers.length.toString()} icon={<UserPlus className="w-6 h-6 text-orange-400" />} themeStyles={themeStyles} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT: WEEKLY LEADERBOARD */}
              <section className={`${themeStyles.card} rounded-xl overflow-hidden flex flex-col`}>
                <TableHeader title="Weekly Leaderboard" icon={<Trophy className={`w-5 h-5 ${themeStyles.textGold}`} />} />
                <div className="overflow-x-auto">
                  {sortedWeekly.length === 0 ? (
                    <div className="p-8 text-center text-sm opacity-50">Belum ada data.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className={`text-[10px] uppercase tracking-widest font-bold ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">Mentee</th>
                          <th className="px-4 py-3 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${currentTheme === 'legends' ? 'divide-[#590d0d]/30' : 'divide-slate-800'}`}>
                        {sortedWeekly.map((mentee, idx) => (
                          <tr key={mentee.username + 'w'} className={`transition-colors ${currentTheme === 'legends' ? 'hover:bg-[#3a080e]/40' : 'hover:bg-slate-900/30'}`}>
                            <td className={`px-4 py-3 ${themeStyles.fontDisplay} font-bold ${idx < 3 ? themeStyles.textGold : themeStyles.textSecondary}`}>#{idx + 1}</td>
                            <td className={`px-4 py-3 font-bold ${themeStyles.textPrimary}`}>
                              {mentee.fullName}
                              <div className="text-[10px] opacity-70 font-normal">{mentee.group}</div>
                            </td>
                            <td className={`px-4 py-3 text-right ${themeStyles.fontDisplay} text-lg ${themeStyles.textAccent}`}>{mentee.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* RIGHT: MONTHLY/SEASON LEADERBOARD */}
              <section className={`${themeStyles.card} rounded-xl overflow-hidden flex flex-col`}>
                <TableHeader title="Season (Monthly)" icon={<Calendar className={`w-5 h-5 ${currentTheme === 'legends' ? 'text-red-400' : 'text-blue-400'}`} />} />
                <div className="overflow-x-auto">
                  {sortedMonthly.length === 0 ? (
                    <div className="p-8 text-center text-sm opacity-50">Belum ada data.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className={`text-[10px] uppercase tracking-widest font-bold ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">Mentee</th>
                          <th className="px-4 py-3 text-right">Season Pts</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${currentTheme === 'legends' ? 'divide-[#590d0d]/30' : 'divide-slate-800'}`}>
                        {sortedMonthly.map((mentee, idx) => (
                          <tr key={mentee.username + 'm'} className={`transition-colors ${currentTheme === 'legends' ? 'hover:bg-[#3a080e]/40' : 'hover:bg-slate-900/30'}`}>
                            <td className={`px-4 py-3 ${themeStyles.fontDisplay} font-bold flex items-center gap-2 ${idx < 3 ? themeStyles.textGold : themeStyles.textSecondary}`}>
                              {idx === 0 && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />} #{idx + 1}
                            </td>
                            <td className={`px-4 py-3 font-bold ${themeStyles.textPrimary}`}>
                              {mentee.fullName}
                              <div className="text-[10px] opacity-70 font-normal">{mentee.group}</div>
                            </td>
                            <td className={`px-4 py-3 text-right ${themeStyles.fontDisplay} text-lg ${currentTheme === 'legends' ? 'text-red-400' : 'text-blue-400'}`}>{mentee.monthlyPoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          /* Request Tab Content */
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {pendingUsers.length === 0 ? (
              <div className="col-span-full text-center py-20 opacity-50">
                <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className={`${themeStyles.textSecondary} font-bold`}>Tidak ada permintaan pendaftaran baru.</p>
              </div>
            ) : (
              pendingUsers.map(user => (
                <div key={user.username} className={`${themeStyles.card} rounded-xl p-6 flex flex-col gap-4 border-l-4 ${currentTheme === 'legends' ? 'border-l-[#d4af37]' : 'border-l-blue-500'}`}>
                   <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`text-lg font-bold ${themeStyles.textPrimary}`}>{user.fullName}</h4>
                        <p className={`text-xs ${themeStyles.textSecondary} mt-1`}>@{user.username}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700`}>{user.group}</span>
                   </div>
                   
                   <div className="flex gap-2 mt-2">
                     <button 
                       onClick={() => handleApproval(user.username, 'approve')}
                       className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                     >
                       <CheckCircle className="w-4 h-4" /> Terima
                     </button>
                     <button 
                       onClick={() => handleApproval(user.username, 'reject')}
                       className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 border border-red-800 py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
                     >
                       <XCircle className="w-4 h-4" /> Tolak
                     </button>
                   </div>
                </div>
              ))
            )}
          </section>
        )}

        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

export default LeaderboardPage;
