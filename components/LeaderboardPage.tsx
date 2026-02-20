
import React, { useState, useMemo, useEffect } from 'react';
import { Users, Target, Trophy, Download, Server, Trash2, Activity, Loader2, ExternalLink, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import AdminCharts from './AdminCharts'; // Import Komponen Grafik Baru
import { User, AppTheme, POINTS, WeeklyData, getRankInfo, GlobalAssets, ArchivedData, AttendanceRecord } from '../types';
import { getAvatarSrc, getRankIconUrl, ADMIN_CREDENTIALS } from '../constants';
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
  onUserClick?: (user: any) => void; // New prop for click handling
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
  rankAssetKey?: string; // Add asset key field
  activeDays: number;
  lastUpdated: string;
  status: string;
  role: string;
  trackerData?: WeeklyData;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ 
  currentUser, setView, handleLogout, themeStyles, currentTheme, handleUpdateProfile, globalAssets, refreshAssets, onUserClick
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard'>('leaderboard');
  const [menteesData, setMenteesData] = useState<LeaderboardData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allUsers = await api.getAllUsersWithPoints();
      
      const activeUsers = allUsers
        .map(u => {
          const trackerData: WeeklyData | null = u.trackerData;
          
          let points = 0;
          let activeDays = 0;

          if (trackerData && trackerData.days) {
            trackerData.days.forEach(day => {
              const prayerPoints = Object.values(day.prayers as any).reduce<number>((acc: number, val: any) => {
                if (val === 1) return acc + POINTS.HOME;
                if (val === 2) return acc + POINTS.MOSQUE;
                return acc;
              }, 0);
              points += prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE);
              if (prayerPoints > 0 || day.tilawah > 0) activeDays++;
            });
          }

          const monthlyPoints = points * 4; // Estimasi poin bulanan
          const rankInfo = getRankInfo(monthlyPoints);

          return {
            fullName: u.fullName,
            username: u.username,
            avatarSeed: u.avatarSeed,
            group: u.group,
            points,
            monthlyPoints,
            rankName: rankInfo.name,
            rankColor: rankInfo.color,
            rankAssetKey: rankInfo.assetKey, // Store asset key for icon
            activeDays,
            lastUpdated: trackerData?.lastUpdated || 'No Data',
            status: u.status,
            role: u.role,
            trackerData: trackerData || undefined
          };
        });

      setMenteesData(activeUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Attempt to repair permissions silently on load if Admin
    if (currentUser?.username === ADMIN_CREDENTIALS.username) {
        api.repairAdminRole().catch(console.error);
    }
    loadData();
  }, []); 

  // --- LOGIC EXPORT EXCEL YANG DIPERBAHARUI ---
  const handleDetailedExport = () => {
     const wb = XLSX.utils.book_new();
     
     // SHEET 1: RINGKASAN (LEADERBOARD)
     const summaryData = menteesData.map(m => ({
        Nama: m.fullName,
        Username: m.username,
        Kelompok: m.group,
        Total_Poin: m.points,
        Rank: m.rankName,
        Hari_Aktif: m.activeDays,
        Role: m.role
     }));
     const wsSummary = XLSX.utils.json_to_sheet(summaryData);
     XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

     // SHEET 2: LOG HARIAN DETIL
     // Format: Tanggal | Nama | Subuh | Dzuhur | Ashar | Maghrib | Isya | Quran (Baris) | Puasa | Tarawih
     const detailedLog: any[] = [];
     
     menteesData.forEach(user => {
        if (user.trackerData && user.trackerData.days) {
           user.trackerData.days.forEach((day: any) => {
              // Helper convert code to text
              const getPrayerStatus = (code: number) => {
                 if (code === 2) return "Masjid";
                 if (code === 1) return "Rumah";
                 return "Kosong";
              };

              detailedLog.push({
                 Hari: day.dayName, // e.g. "1 Ramadhan"
                 Nama: user.fullName,
                 Subuh: getPrayerStatus(day.prayers.subuh),
                 Dzuhur: getPrayerStatus(day.prayers.zuhur),
                 Ashar: getPrayerStatus(day.prayers.asar),
                 Maghrib: getPrayerStatus(day.prayers.magrib),
                 Isya: getPrayerStatus(day.prayers.isya),
                 Quran_Baris: day.tilawah || 0,
                 Puasa: day.shaum ? "Ya" : "-",
                 Tarawih: day.tarawih ? "Ya" : "-"
              });
           });
        }
     });

     const wsDetails = XLSX.utils.json_to_sheet(detailedLog);
     
     // Mengatur lebar kolom agar rapi
     wsDetails['!cols'] = [
        { wch: 15 }, // Hari
        { wch: 25 }, // Nama
        { wch: 10 }, // Subuh
        { wch: 10 }, // Dzuhur
        { wch: 10 }, // Ashar
        { wch: 10 }, // Maghrib
        { wch: 10 }, // Isya
        { wch: 10 }, // Quran
        { wch: 8 },  // Puasa
        { wch: 8 }   // Tarawih
     ];

     XLSX.utils.book_append_sheet(wb, wsDetails, "Log Harian");

     // Download File
     XLSX.writeFile(wb, `Laporan_Mutabaah_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleFixAccess = async () => {
     setIsProcessing(true);
     try {
        const success = await api.repairAdminRole();
        if (success) {
            alert("✅ Access Repaired! Permission Admin telah dipulihkan. Silakan coba hapus user kembali.");
        } else {
            alert("⚠️ Akun ini tidak terdeteksi sebagai Admin utama di konfigurasi.");
        }
     } catch (e) {
        alert("Error: " + e);
     } finally {
        setIsProcessing(false);
     }
  };

  const handleKickUser = async (targetUsername: string, targetName: string) => {
    if (!confirm(`PERINGATAN: Hapus permanen ${targetName}?\n\nData yang dihapus tidak bisa dikembalikan.`)) return;
    setIsProcessing(true);
    try {
      const result = await api.deleteUser(targetUsername);
      if (result.success) {
        alert("✅ User berhasil dihapus dari database.");
        await loadData();
      } else {
        alert(`❌ Gagal menghapus user: ${result.error}`);
      }
    } catch (e: any) { 
      alert("System Error: " + e.message); 
    }
    finally { setIsProcessing(false); }
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
        toggleTheme={() => {}} 
        handleUpdateProfile={handleUpdateProfile} 
        globalAssets={globalAssets} 
        refreshAssets={refreshAssets}
        performSync={async () => { await loadData(); }}
      />

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24 animate-reveal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className={`text-4xl ${themeStyles.fontDisplay} font-bold tracking-tighter flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <Server className={`w-10 h-10 ${themeStyles.textAccent}`} /> Dashboard
            </h2>
            <p className={`text-xs font-mono mt-1 opacity-50 uppercase tracking-widest`}>Database Connection: Online</p>
          </div>
          <div className="flex gap-2">
             <div className="flex items-center gap-2 bg-black/30 p-1 pr-3 rounded-full border border-white/10">
                <button 
                  onClick={handleFixAccess}
                  disabled={isProcessing}
                  className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:text-emerald-400 text-white/70 px-2 border-r border-white/10 pr-4 mr-2`}
                  title="Perbaiki Permission Admin"
                >
                  <Shield className="w-4 h-4 text-emerald-500" /> Fix Access
                </button>

                <button onClick={handleDetailedExport} className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:text-white text-white/70`}>
                  <Download className="w-4 h-4" /> Export Excel
                </button>
             </div>
          </div>
        </div>

        {/* STATS & CHARTS SECTION */}
        {activeTab === 'leaderboard' && !isLoading && (
          <AdminCharts menteesData={menteesData} themeStyles={themeStyles} />
        )}

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-white/5 pb-0 overflow-x-auto">
          {[
            { id: 'leaderboard', label: 'Members & Data', icon: <Trophy className="w-4 h-4" /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? `${themeStyles.textAccent} border-current` : 'opacity-40 border-transparent hover:opacity-100'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'leaderboard' && (
          <div className="animate-reveal">
             <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Node Status" value="Online" icon={<Activity className="w-6 h-6 text-emerald-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Total Users" value={menteesData.length} icon={<Users className="w-6 h-6 text-blue-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Avg. Score" value={menteesData.length ? Math.round(menteesData.reduce((a,b)=>a+b.points,0)/menteesData.length) : 0} icon={<Target className={`w-6 h-6 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
            </section>
            
            <div className={`${themeStyles.card} rounded-3xl overflow-hidden`}>
              {isLoading ? (
                 <div className="p-10 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-white/50" /></div>
              ) : (
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
                      {sortedWeekly.map((m) => (
                        <tr 
                          key={m.username} 
                          className={`group hover:bg-white/[0.05] transition-colors cursor-pointer border-l-4 border-transparent hover:border-[#fbbf24]`}
                          onClick={() => onUserClick && onUserClick(m)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-4">
                                {/* Small Avatar in Table */}
                                <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 bg-black/50 border border-white/10 group-hover:scale-110 transition-transform">
                                  <img src={getAvatarSrc(m.avatarSeed || m.username)} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 font-bold text-base group-hover:text-[#fbbf24] transition-colors">
                                    {m.fullName}
                                    {m.role === 'mentor' && <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase">MENTOR</span>}
                                  </div>
                                  <div className="text-[10px] opacity-40 font-mono mb-1">{m.username}</div>
                                  
                                  {/* Rank Icon + Name Display */}
                                  <div className="flex items-center gap-2 mt-1">
                                    {m.rankAssetKey && (
                                       <div className="w-6 h-6 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                                          <img src={getRankIconUrl(m.rankAssetKey)} className="w-full h-full object-contain" alt="Rank" />
                                       </div>
                                    )}
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${m.rankColor.replace('text-', 'border-').replace('400', '500')} ${m.rankColor} bg-white/5`}>{m.rankName}</span>
                                  </div>

                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs opacity-50 uppercase tracking-widest">{m.group}</td>
                          <td className="px-6 py-4 text-right font-black text-emerald-500 text-lg">{m.points}</td>
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                             <div className="flex items-center justify-center gap-2">
                                {/* FIX: Added explicit onClick handler here even though row click exists, because e.stopPropagation prevents row click */}
                                <button 
                                  className="p-2 text-white/20 hover:text-[#fbbf24]" 
                                  type="button"
                                  title="View Profile"
                                  onClick={() => onUserClick && onUserClick(m)}
                                >
                                   <ExternalLink className="w-4 h-4" />
                                </button>
                                {m.role !== 'mentor' && currentUser?.role === 'mentor' && (
                                  <button 
                                    onClick={() => handleKickUser(m.username, m.fullName)} 
                                    type="button"
                                    className="p-2 bg-red-950/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50" 
                                    disabled={isProcessing} 
                                    title="Kick User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

export default LeaderboardPage;
