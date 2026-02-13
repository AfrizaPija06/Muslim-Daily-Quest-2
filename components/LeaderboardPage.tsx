import React, { useState, useMemo, useEffect } from 'react';
import { Users, Target, Trophy, Download, Server, Trash2, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import { User, AppTheme, POINTS, WeeklyData, getRankInfo, GlobalAssets, ArchivedData, AttendanceRecord } from '../types';
import { getAvatarSrc, getRankIconUrl } from '../constants';
import { api } from '../services/ApiService';

interface LeaderboardPageProps {
  currentUser: User | null;
  setView: (view: any) => void;
  handleLogout: () => void;
  themeStyles: any;
  currentTheme: AppTheme;
  toggleTheme: () => void;
  performSync: (users?: User[]) => Promise<void>;
  networkLogs: string[];
  groups: string[];
  updateGroups: (newGroups: string[]) => Promise<void>;
  handleUpdateProfile?: (user: User) => void;
  globalAssets?: GlobalAssets;
  refreshAssets?: (assets: GlobalAssets) => void;
  archives?: ArchivedData[]; 
  attendance?: AttendanceRecord;
}

interface LeaderboardData {
  fullName: string;
  username: string;
  avatarSeed?: string;
  group: string;
  points: number;
  monthlyPoints: number; 
  rankName: string;
  rankColor: string;
  rankIcon?: string;
  activeDays: number;
  lastUpdated: string;
  status: string;
  role: string;
  trackerData?: WeeklyData;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ 
  currentUser, setView, handleLogout, themeStyles, currentTheme, performSync, networkLogs, groups, updateGroups, handleUpdateProfile, globalAssets, refreshAssets, attendance = {}
}) => {
  // Only Leaderboard tab remains
  const [activeTab, setActiveTab] = useState<'leaderboard'>('leaderboard');
  const [menteesData, setMenteesData] = useState<LeaderboardData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Attendance State (Kept but UI currently focused on Leaderboard)
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const loadData = () => {
    const usersStr = localStorage.getItem('nur_quest_users');
    const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const activeUsers = allUsers
      .filter(u => (u.role === 'mentee' || u.role === 'mentor') && (u.status === 'active' || u.status === undefined))
      .map(u => {
        const isMe = currentUser && u.username === currentUser.username;
        const displayUser = isMe ? currentUser : u;

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
            if (prayerPoints > 0 || day.tilawah > 0) activeDays++;
          });
        }

        const monthlyPoints = points * 4;
        const rankInfo = getRankInfo(monthlyPoints);

        return {
          fullName: displayUser.fullName,
          username: displayUser.username,
          avatarSeed: displayUser.avatarSeed,
          group: displayUser.group,
          points,
          monthlyPoints,
          rankName: rankInfo.name,
          rankColor: rankInfo.color,
          rankIcon: getRankIconUrl(rankInfo.assetKey),
          activeDays,
          lastUpdated: trackerData?.lastUpdated || 'No Data',
          status: 'active',
          role: displayUser.role,
          trackerData: trackerData || undefined
        };
      });

    setMenteesData(activeUsers);
  };

  useEffect(() => {
    loadData();
  }, [currentUser, globalAssets]); 

  const handleDetailedExport = () => {
     const wb = XLSX.utils.book_new();
     // Prepare data
     const data = menteesData.map(m => ({
        Nama: m.fullName,
        Username: m.username,
        Kelompok: m.group,
        Poin_Mingguan: m.points,
        Poin_Bulanan: m.monthlyPoints,
        Rank: m.rankName,
        Hari_Aktif: m.activeDays,
        Role: m.role
     }));
     const ws = XLSX.utils.json_to_sheet(data);
     XLSX.utils.book_append_sheet(wb, ws, "Laporan");
     XLSX.writeFile(wb, "Laporan_Mentoring.xlsx");
  };

  const handleKickUser = async (targetUsername: string, targetName: string) => {
    if (!confirm(`PERINGATAN: Hapus permanen ${targetName}? Data ibadah mereka akan hilang.`)) return;
    try {
      const success = await api.deleteUser(targetUsername);
      if (success) {
        localStorage.removeItem(`ibadah_tracker_${targetUsername}`);
        await performSync();
        loadData();
      }
    } catch (e: any) { alert(e.message); }
  };

  const sortedWeekly = useMemo(() => [...menteesData].sort((a, b) => b.points - a.points), [menteesData]);

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header 
        currentUser={currentUser} 
        setView={setView} 
        totalPoints={0} 
        handleLogout={handleLogout} 
        activeView="leaderboard" 
        themeStyles={themeStyles} 
        currentTheme={currentTheme} 
        toggleTheme={() => {}} // No-op
        handleUpdateProfile={handleUpdateProfile} 
        globalAssets={globalAssets} 
        refreshAssets={refreshAssets}
        performSync={performSync}
      />

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24 animate-reveal">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className={`text-4xl ${themeStyles.fontDisplay} font-bold tracking-tighter flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <Server className={`w-10 h-10 ${themeStyles.textAccent}`} /> Local Admin
            </h2>
            <p className={`text-xs font-mono mt-1 opacity-50 uppercase tracking-widest`}>Offline Mode • Mentoring Legends</p>
          </div>
          <div className="flex gap-2">
             <div className="flex items-center gap-2 bg-black/30 p-1 pr-3 rounded-full border border-white/10">
                <button onClick={handleDetailedExport} className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:text-white text-white/70`}>
                  <Download className="w-4 h-4" /> Reports
                </button>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-white/5 pb-0 overflow-x-auto">
          {[
            { id: 'leaderboard', label: 'Members', icon: <Trophy className="w-4 h-4" /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? `${themeStyles.textAccent} border-current` : 'opacity-40 border-transparent hover:opacity-100'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* --- LEADERBOARD TAB --- */}
        {activeTab === 'leaderboard' && (
          <div className="animate-reveal">
             <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Node Status" value="Local Only" icon={<Activity className="w-6 h-6 text-emerald-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Active Members" value={menteesData.length} icon={<Users className="w-6 h-6 text-blue-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Avg. Score" value={menteesData.length ? Math.round(menteesData.reduce((a,b)=>a+b.points,0)/menteesData.length) : 0} icon={<Target className={`w-6 h-6 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
            </section>
            
            <div className={`${themeStyles.card} rounded-3xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={`text-[10px] uppercase font-black tracking-widest ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                      <th className="px-6 py-4">User Details & Rank</th>
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4 text-right">EXP</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-white/5`}>
                    {sortedWeekly.map((m, i) => (
                      <tr key={m.username} className={`hover:bg-white/[0.02] transition-colors`}>
                        <td className="px-6 py-4">
                           <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden shrink-0 bg-black/50 border border-white/10">
                                <img src={getAvatarSrc(m.avatarSeed || m.username, globalAssets)} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 font-bold text-base">
                                  {m.fullName}
                                  {m.role === 'mentor' && <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase">MENTOR</span>}
                                </div>
                                <div className="text-[10px] opacity-40 font-mono mb-1">{m.username}</div>
                                <div className="flex items-center gap-2">
                                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${m.rankColor.replace('text-', 'border-').replace('400', '500')} ${m.rankColor} bg-white/5`}>{m.rankName}</span>
                                </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs opacity-50 uppercase tracking-widest">{m.group}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-500">{m.points}</td>
                        <td className="px-6 py-4 text-center">
                          {m.role !== 'mentor' && (
                            <button onClick={() => handleKickUser(m.username, m.fullName)} className="p-2 bg-red-950/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50" disabled={isProcessing}><Trash2 className="w-4 h-4" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

export default LeaderboardPage;