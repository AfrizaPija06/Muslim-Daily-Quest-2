
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, Target, ShieldCheck, Trophy, Download, UserPlus, Calendar, Database, Activity, Terminal, ChevronRight, Server, Flag, Trash2, PlusCircle, Share2, Copy, AlertTriangle, Loader2, Image as ImageIcon, UploadCloud, Archive, Save, CheckSquare, CalendarCheck, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import { User, AppTheme, POINTS, WeeklyData, getRankInfo, GlobalAssets, ArchivedData, DayData, AttendanceRecord } from '../types';
import { getAvatarSrc, ADMIN_CREDENTIALS } from '../constants';
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
  refreshArchives?: () => void;
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
  currentUser, setView, handleLogout, themeStyles, currentTheme, toggleTheme, performSync, networkLogs, groups, updateGroups, handleUpdateProfile, globalAssets, refreshAssets, archives = [], refreshArchives, attendance = {}
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'requests' | 'avatars' | 'groups' | 'attendance' | 'network'>('leaderboard');
  const [menteesData, setMenteesData] = useState<LeaderboardData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, 'H' | 'S' | 'A'>>({});

  // Avatar Management
  const presetInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPreset, setIsUploadingPreset] = useState(false);

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
          rankIcon: rankInfo.iconUrl,
          activeDays,
          lastUpdated: trackerData?.lastUpdated || 'No Data',
          status: 'active',
          role: displayUser.role,
          trackerData: trackerData || undefined
        };
      });

    setMenteesData(activeUsers);
    setPendingUsers(allUsers.filter(u => u.role === 'mentee' && u.status === 'pending'));
  };

  useEffect(() => {
    loadData();
  }, [currentUser, globalAssets]); 
  
  useEffect(() => {
     if (attendance && attendance[attendanceDate]) {
        setCurrentAttendance(attendance[attendanceDate]);
     } else {
        setCurrentAttendance({});
     }
  }, [attendanceDate, attendance]);

  const handleSaveAttendance = async () => {
     setIsProcessing(true);
     try {
       await api.saveAttendance(attendanceDate, currentAttendance);
       await performSync();
       alert("Attendance Saved!");
     } catch(e) {
       alert("Failed to save attendance");
     } finally {
       setIsProcessing(false);
     }
  };

  // --- SQL DIRECT APPROVAL ---
  const handleApproval = async (username: string, action: 'approve' | 'reject') => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      const success = await api.updateUserStatus(username, newStatus);
      
      if (success) {
         // Optimistic Update
         setPendingUsers(prev => prev.filter(u => u.username !== username));
         // Sync to refresh full list from SQL
         await performSync();
      } else {
         alert("Gagal update status. Cek koneksi.");
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

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
        // Force sync to update list from Server
        await performSync();
        loadData();
      } else throw new Error("Gagal menghapus.");
    } catch (e: any) { alert(e.message); }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || groups.includes(newGroupName)) return;
    await updateGroups([...groups, newGroupName]);
    setNewGroupName('');
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (confirm(`Hapus kelompok '${groupName}'?`)) await updateGroups(groups.filter(g => g !== groupName));
  };
  
  const handleUploadPreset = async (e: React.ChangeEvent<HTMLInputElement>) => { 
     const file = e.target.files?.[0];
     if (file) {
       setIsUploadingPreset(true);
       const publicUrl = await api.uploadAvatar(file, `preset_${Date.now()}`);
       if (publicUrl) {
          if(refreshAssets && globalAssets) {
             // For simplicity, we just trigger sync/refresh. 
             // Ideally we store presets in a separate table or just use raw URLs.
             refreshAssets({...globalAssets, [`preset_${Date.now()}`]: publicUrl});
          }
          alert("Preset uploaded!");
       } else {
          alert("Upload failed");
       }
       setIsUploadingPreset(false);
       if (presetInputRef.current) presetInputRef.current.value = '';
     }
  };

  const handleDeletePreset = async (key: string) => {
     // Deprecated in SQL mode for now, simple implementation
     if(confirm("Delete this avatar preset?")) {
        // Just remove from local view
        if(globalAssets) {
           const newAssets = {...globalAssets};
           delete newAssets[key];
           if(refreshAssets) refreshAssets(newAssets);
        }
     }
  };

  const sortedWeekly = useMemo(() => [...menteesData].sort((a, b) => b.points - a.points), [menteesData]);
  const presets = globalAssets ? Object.keys(globalAssets).filter(k => k.startsWith('preset_')) : [];

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
        toggleTheme={toggleTheme} 
        handleUpdateProfile={handleUpdateProfile} 
        globalAssets={globalAssets} 
        refreshAssets={refreshAssets}
        // Kirim fungsi refresh manual ke Header agar user bisa tekan tombol sync
        performSync={performSync}
      />

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24 animate-reveal">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className={`text-4xl ${themeStyles.fontDisplay} font-bold tracking-tighter flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <Server className={`w-10 h-10 ${themeStyles.textAccent}`} /> Backend Admin
            </h2>
            <p className={`text-xs font-mono mt-1 opacity-50 uppercase tracking-widest`}>Mode: Eco (Manual Sync) • {currentUser?.group || 'Global'}</p>
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
            { id: 'attendance', label: 'Squad Check-in', icon: <CheckSquare className="w-4 h-4" /> },
            { id: 'requests', label: 'Auth', icon: <UserPlus className="w-4 h-4" />, count: pendingUsers.length },
            { id: 'avatars', label: 'Avatars', icon: <ImageIcon className="w-4 h-4" /> },
            { id: 'groups', label: 'Factions', icon: <Flag className="w-4 h-4" /> },
            { id: 'network', label: 'Logs', icon: <Terminal className="w-4 h-4" /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? `${themeStyles.textAccent} border-current` : 'opacity-40 border-transparent hover:opacity-100'}`}>
              {tab.icon} {tab.label} {tab.count ? <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
            </button>
          ))}
        </div>

        {/* --- LEADERBOARD TAB --- */}
        {activeTab === 'leaderboard' && (
          <div className="animate-reveal">
            {/* ... Summary Cards ... */}
             <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Node Status" value="Healthy" icon={<Activity className="w-6 h-6 text-emerald-400" />} themeStyles={themeStyles} />
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
                  <tbody className={`divide-y ${currentTheme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
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
                                   {m.rankIcon && <img src={m.rankIcon} className="w-7 h-7 object-contain drop-shadow-md" alt="Rank" />}
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

        {/* --- REQUESTS TAB (DIRECT DB) --- */}
        {activeTab === 'requests' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal">
            {pendingUsers.length === 0 ? <div className="col-span-full py-20 text-center text-xs uppercase tracking-widest opacity-30">No Authentication Requests</div> : pendingUsers.map((u, i) => (
              <div key={u.username} className={`${themeStyles.card} rounded-2xl p-6 border-l-4 border-yellow-500`}>
                <div className="flex justify-between items-start">
                   <div>
                     <h4 className="font-black text-lg">{u.fullName}</h4>
                     <p className="text-[10px] font-mono opacity-50 uppercase">UID: {u.username} • {u.group}</p>
                   </div>
                   <div className="bg-yellow-500/10 text-yellow-500 text-[8px] font-black px-2 py-1 rounded uppercase">Pending</div>
                </div>
                <div className="flex gap-2 mt-8">
                  <button 
                    onClick={() => handleApproval(u.username, 'approve')} 
                    disabled={isProcessing} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3" />}
                    Grant
                  </button>
                  <button 
                    onClick={() => handleApproval(u.username, 'reject')} 
                    disabled={isProcessing} 
                    className="flex-1 bg-red-950/20 text-red-500/50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-950/40 transition-all disabled:opacity-50"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ... Other Tabs ... */}
        {activeTab === 'attendance' && (
           <section className="space-y-6 animate-reveal">
              <div className={`${themeStyles.card} rounded-2xl p-6`}>
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                         <CalendarCheck className={themeStyles.textAccent} /> Squad Check-in
                      </h3>
                      <p className="text-xs opacity-50">Record weekly meeting attendance.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
                       <input 
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className={`bg-transparent ${themeStyles.textPrimary} text-sm font-bold uppercase outline-none`}
                       />
                       <button onClick={handleSaveAttendance} disabled={isProcessing} className={`px-4 py-2 ${themeStyles.buttonPrimary} rounded-lg text-xs font-bold uppercase flex items-center gap-2`}>
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />} Save
                       </button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className={`text-[10px] uppercase font-bold tracking-widest ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                             <th className="px-4 py-3">Mentee</th>
                             <th className="px-4 py-3 text-center">Hadir</th>
                             <th className="px-4 py-3 text-center">Izin/Sakit</th>
                             <th className="px-4 py-3 text-center">Alpha</th>
                          </tr>
                       </thead>
                       <tbody className={`divide-y ${currentTheme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                          {menteesData.filter(m => m.role === 'mentee').map((mentee) => {
                             const status = currentAttendance[mentee.username];
                             return (
                                <tr key={mentee.username} className="hover:bg-white/5">
                                   <td className="px-4 py-3 font-bold text-sm">{mentee.fullName}</td>
                                   <td className="px-4 py-3 text-center">
                                      <input 
                                        type="radio" 
                                        name={`att-${mentee.username}`} 
                                        checked={status === 'H'} 
                                        onChange={() => setCurrentAttendance(prev => ({...prev, [mentee.username]: 'H'}))}
                                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                                      />
                                   </td>
                                   <td className="px-4 py-3 text-center">
                                      <input 
                                        type="radio" 
                                        name={`att-${mentee.username}`} 
                                        checked={status === 'S'} 
                                        onChange={() => setCurrentAttendance(prev => ({...prev, [mentee.username]: 'S'}))}
                                        className="w-4 h-4 accent-yellow-500 cursor-pointer"
                                      />
                                   </td>
                                   <td className="px-4 py-3 text-center">
                                      <input 
                                        type="radio" 
                                        name={`att-${mentee.username}`} 
                                        checked={status === 'A'} 
                                        onChange={() => setCurrentAttendance(prev => ({...prev, [mentee.username]: 'A'}))}
                                        className="w-4 h-4 accent-red-500 cursor-pointer"
                                      />
                                   </td>
                                </tr>
                             )
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </section>
        )}

        {activeTab === 'avatars' && (
           <section className="space-y-6 animate-reveal">
              <div className={`${themeStyles.card} rounded-2xl p-6`}>
                 <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                         <ImageIcon className={themeStyles.textAccent} /> Global Avatars
                      </h3>
                      <p className="text-xs opacity-50">Upload images here for Mentees to choose from.</p>
                    </div>
                    <button 
                      onClick={() => presetInputRef.current?.click()}
                      disabled={isUploadingPreset}
                      className={`px-4 py-2 rounded-xl ${themeStyles.buttonPrimary} flex items-center gap-2 font-bold uppercase text-xs`}
                    >
                      {isUploadingPreset ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
                      Upload New Preset
                    </button>
                    <input type="file" ref={presetInputRef} className="hidden" accept="image/*" onChange={handleUploadPreset} />
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {presets.map((key, i) => (
                       <div key={key} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/30">
                          <img src={globalAssets?.[key]} alt="Preset" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => handleDeletePreset(key)}
                               className="p-2 bg-red-600 rounded-lg text-white hover:scale-110 transition-transform"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                             <span className="text-[8px] mt-2 font-mono opacity-70">ID: {key.split('_')[1]}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </section>
        )}

        {activeTab === 'groups' && (
          <section className="space-y-6 animate-reveal">
             <div className={`${themeStyles.card} rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center`}>
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Establish New Faction</h3>
                  <p className="text-xs opacity-50">Create a new group for mentees to join.</p>
                </div>
                <form onSubmit={handleAddGroup} className="flex gap-2 w-full md:w-auto">
                  <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Salahuddin Al-Ayyubi" className={`rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} min-w-[250px]`} />
                  <button type="submit" className={`px-4 rounded-xl ${themeStyles.buttonPrimary} flex items-center justify-center text-white`}><PlusCircle className="w-5 h-5" /></button>
                </form>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map((group, i) => (
                  <div key={group} className={`${themeStyles.card} p-4 rounded-xl flex items-center justify-between group border hover:border-red-500/50 transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${currentTheme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}><Flag className={`w-4 h-4 ${themeStyles.textAccent}`} /></div>
                      <span className="font-bold text-sm uppercase tracking-wider">{group}</span>
                    </div>
                    <button onClick={() => handleDeleteGroup(group)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
             </div>
          </section>
        )}

        {activeTab === 'network' && (
          <section className="space-y-4 animate-reveal">
            <div className={`${themeStyles.card} bg-black/90 rounded-2xl border border-white/10 overflow-hidden font-mono text-[11px]`}>
               <div className="p-6 space-y-2 h-[400px] overflow-y-auto">
                 {networkLogs.map((log, i) => (
                   <div key={i} className="flex gap-3 text-emerald-400/80">
                     <span className="text-white/20 shrink-0">{`>`}</span>
                     <span className={log.includes('Failed') ? 'text-red-400' : ''}>{log}</span>
                   </div>
                 ))}
               </div>
            </div>
          </section>
        )}

        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

export default LeaderboardPage;
