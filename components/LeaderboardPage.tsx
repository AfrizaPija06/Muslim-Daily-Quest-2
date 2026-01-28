
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, Target, ShieldCheck, Trophy, Download, UserPlus, Calendar, Database, Activity, Terminal, ChevronRight, Server, Flag, Trash2, PlusCircle, Share2, Copy, AlertTriangle, Loader2, Image as ImageIcon, UploadCloud, Archive, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import { User, AppTheme, POINTS, WeeklyData, getRankInfo, GlobalAssets, ArchivedData, DayData } from '../types';
import { getAvatarSrc } from '../constants';
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
  archives?: ArchivedData[]; // Added Archives
  refreshArchives?: () => void;
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
  rankIcon?: string; // New field for icon
  activeDays: number;
  lastUpdated: string;
  status: string;
  role: string;
  trackerData?: WeeklyData; // Include Raw Data for Archive
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ 
  currentUser, setView, handleLogout, themeStyles, currentTheme, toggleTheme, performSync, networkLogs, groups, updateGroups, handleUpdateProfile, globalAssets, refreshAssets, archives = [], refreshArchives
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'requests' | 'avatars' | 'groups' | 'network' | 'archives'>('leaderboard');
  const [menteesData, setMenteesData] = useState<LeaderboardData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Archive States
  const [selectedMonthName, setSelectedMonthName] = useState('');
  const [exportSource, setExportSource] = useState('current'); // 'current' or archive ID

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
          rankIcon: rankInfo.iconUrl, // Extract icon
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
    const interval = setInterval(loadData, 10000); 
    return () => clearInterval(interval);
  }, [currentUser]); 

  // --- ARCHIVING LOGIC ---
  const handleSaveArchive = async () => {
    if (!selectedMonthName) {
      alert("Please enter a month name (e.g., 'Januari 2025')");
      return;
    }
    if (!confirm(`Archive current data as '${selectedMonthName}'? This will snapshot everyone's stats.`)) return;

    setIsProcessing(true);
    try {
      const records = menteesData.map(m => ({
        username: m.username,
        fullName: m.fullName,
        group: m.group,
        totalPoints: m.points,
        rankName: m.rankName,
        detailedDays: m.trackerData?.days || []
      }));

      const newArchive: ArchivedData = {
        id: selectedMonthName,
        timestamp: new Date().toISOString(),
        records
      };

      const success = await api.saveArchive(newArchive);
      
      if (success) {
        alert("Archive Saved Successfully!");
        setSelectedMonthName('');
        if(refreshArchives) refreshArchives();
      } else {
        alert("Failed to save archive.");
      }
    } catch (e) {
      alert("Error saving archive.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleDetailedExport = () => {
    const wb = XLSX.utils.book_new();
    let dataToExport = menteesData;
    let titlePrefix = "Current";

    // Handle Archive Export
    if (exportSource !== 'current') {
      const archive = archives?.find(a => a.id === exportSource);
      if (!archive) {
         alert("Archive not found");
         return;
      }
      titlePrefix = archive.id;
      // Map Archive format to LeaderboardData format for exporting
      dataToExport = archive.records.map(r => ({
        fullName: r.fullName,
        username: r.username,
        group: r.group,
        points: r.totalPoints,
        rankName: r.rankName,
        lastUpdated: archive.timestamp,
        trackerData: { days: r.detailedDays, lastUpdated: archive.timestamp }
      } as LeaderboardData));
    }

    // 1. SHEET REKAP UTAMA (Rank Sheet)
    const summaryData = dataToExport.map((m, i) => ({
      Rank: i + 1,
      Nama_Lengkap: m.fullName,
      Username: m.username,
      Kelompok: m.group,
      Tier: m.rankName,
      Total_EXP: m.points,
      Last_Sync: m.lastUpdated ? new Date(m.lastUpdated).toLocaleDateString() : '-'
    }));
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{wch:5}, {wch:25}, {wch:15}, {wch:25}, {wch:15}, {wch:10}, {wch:20}];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Rank Sheet");

    // 2. SHEET PER USER (Detail)
    dataToExport.forEach(mentee => {
      if (!mentee.trackerData) return;

      const exportRows = mentee.trackerData.days.map(day => {
        const getStatus = (val: number) => {
          if (val === 2) return "Masjid";
          if (val === 1) return "Rumah";
          return "-"; 
        };

        return {
          Hari: day.dayName,
          Subuh: getStatus(day.prayers.subuh),
          Dzuhur: getStatus(day.prayers.zuhur),
          Ashar: getStatus(day.prayers.asar),
          Maghrib: getStatus(day.prayers.magrib),
          Isya: getStatus(day.prayers.isya),
          Quran: day.tilawah
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      ws['!cols'] = [{wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 8}];

      let sheetName = mentee.fullName.replace(/[\\/?*[\]]/g, "").substring(0, 30);
      if (wb.SheetNames.includes(sheetName)) {
        sheetName = `${sheetName.substring(0,25)}_${mentee.username.substring(0,3)}`;
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Laporan_${titlePrefix}_${dateStr}.xlsx`);
  };

  // --- AVATAR MANAGEMENT LOGIC ---
  const handleUploadPreset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPreset(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const img = new Image();
        img.src = base64String;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 500;
          let width = img.width; let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          const presetId = `preset_${Date.now()}`;
          const success = await api.uploadGlobalAsset(presetId, compressed);
          if(success) { await performSync(); alert("Avatar Preset Uploaded!"); } else { alert("Failed to upload preset."); }
          setIsUploadingPreset(false);
        };
      };
      reader.readAsDataURL(file);
    }
    if (presetInputRef.current) presetInputRef.current.value = '';
  };

  const handleDeletePreset = async (key: string) => {
    if(confirm("Are you sure? Mentees currently using this avatar will revert to default.")) {
      const success = await api.deleteGlobalAsset(key);
      if(success) { await performSync(); } else { alert("Failed to delete."); }
    }
  };

  const handleApproval = async (username: string, action: 'approve' | 'reject') => {
    const targetUser = pendingUsers.find(u => u.username === username);
    if (!targetUser) return;

    const updatedUser: User = { ...targetUser, status: action === 'approve' ? 'active' : 'rejected' };
    setPendingUsers(prev => prev.filter(u => u.username !== username));
    
    if (action === 'approve') {
       const newActiveUser: LeaderboardData = {
          fullName: targetUser.fullName,
          username: targetUser.username,
          avatarSeed: targetUser.avatarSeed,
          group: targetUser.group,
          points: 0,
          monthlyPoints: 0,
          rankName: 'Warrior',
          rankColor: 'text-slate-400',
          activeDays: 0,
          lastUpdated: new Date().toISOString(),
          status: 'active',
          role: 'mentee'
       };
       setMenteesData(prev => [...prev, newActiveUser]);
    }

    const usersStr = localStorage.getItem('nur_quest_users');
    let allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    const newUsersList = allUsers.map(u => u.username === username ? updatedUser : u);
    localStorage.setItem('nur_quest_users', JSON.stringify(newUsersList));

    api.updateUserProfile(updatedUser).then(res => {
      if (!res.success) console.error("Failed to sync approval to cloud:", res.error);
    });
  };

  const handleKickUser = async (targetUsername: string, targetName: string) => {
    if (!confirm(`PERINGATAN: Hapus permanen ${targetName}?`)) return;
    setMenteesData(prev => prev.filter(m => m.username !== targetUsername));
    setPendingUsers(prev => prev.filter(m => m.username !== targetUsername));
    try {
      const success = await api.deleteUser(targetUsername);
      if (success) {
        localStorage.removeItem(`ibadah_tracker_${targetUsername}`);
      } else throw new Error("Gagal menghapus di server.");
    } catch (e: any) {
      alert(e.message);
      loadData(); 
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || groups.includes(newGroupName)) return;
    await updateGroups([...groups, newGroupName]);
    setNewGroupName('');
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (confirm(`Disband '${groupName}'?`)) await updateGroups(groups.filter(g => g !== groupName));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      />

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className={`text-4xl ${themeStyles.fontDisplay} font-bold tracking-tighter flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <Server className={`w-10 h-10 ${themeStyles.textAccent}`} /> Backend Admin
            </h2>
            <p className={`text-xs font-mono mt-1 opacity-50 uppercase tracking-widest`}>Production Environment • {currentUser?.group || 'Global'}</p>
          </div>
          <div className="flex gap-2">
             <div className="flex items-center gap-2 bg-black/30 p-1 pr-3 rounded-full border border-white/10">
                <select 
                  value={exportSource} 
                  onChange={(e) => setExportSource(e.target.value)}
                  className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-emerald-400 outline-none p-2 cursor-pointer"
                >
                  <option value="current" className="bg-slate-900">Current Data</option>
                  {archives?.map(arch => (
                    <option key={arch.id} value={arch.id} className="bg-slate-900">Archive: {arch.id}</option>
                  ))}
                </select>
                <button onClick={handleDetailedExport} className={`flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:text-white text-white/70`}>
                  <Download className="w-4 h-4" /> Download
                </button>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-white/5 pb-0 overflow-x-auto">
          {[
            { id: 'leaderboard', label: 'Members', icon: <Trophy className="w-4 h-4" /> },
            { id: 'requests', label: 'Auth', icon: <UserPlus className="w-4 h-4" />, count: pendingUsers.length },
            { id: 'archives', label: 'Archives', icon: <Archive className="w-4 h-4" /> },
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
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <tr key={m.username} className="hover:bg-white/[0.02] transition-colors">
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
                                
                                {/* RANK BADGE */}
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
          </>
        )}

        {/* --- ARCHIVES TAB --- */}
        {activeTab === 'archives' && (
           <section className="space-y-6">
              <div className={`${themeStyles.card} rounded-2xl p-6`}>
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                         <Archive className={themeStyles.textAccent} /> Monthly Archives
                      </h3>
                      <p className="text-xs opacity-50">Snapshot current leaderboard data into a monthly record.</p>
                    </div>
                 </div>
                 
                 <div className="mt-6 flex gap-3 items-end border-b border-white/5 pb-8">
                     <div className="flex-1 space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">New Archive Name</label>
                        <input 
                          value={selectedMonthName} 
                          onChange={(e) => setSelectedMonthName(e.target.value)}
                          placeholder="e.g. Januari 2025" 
                          className={`w-full p-3 rounded-xl border bg-black/20 ${themeStyles.border} outline-none text-sm`}
                        />
                     </div>
                     <button 
                       onClick={handleSaveArchive}
                       disabled={isProcessing || !selectedMonthName}
                       className={`px-6 py-3 rounded-xl ${themeStyles.buttonPrimary} font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50`}
                     >
                       {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                       Save Current State
                     </button>
                 </div>

                 <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest opacity-70">Saved Archives</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {archives && archives.length > 0 ? archives.map((arch) => (
                          <div key={arch.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex justify-between items-center group">
                             <div>
                                <div className="font-bold text-lg">{arch.id}</div>
                                <div className="text-[10px] font-mono opacity-50">{new Date(arch.timestamp).toLocaleDateString()}</div>
                                <div className="text-[10px] opacity-70 mt-1">{arch.records.length} Records</div>
                             </div>
                             <button onClick={() => {
                               setExportSource(arch.id);
                               alert(`Selected '${arch.id}' for Export. Click Download button above.`);
                             }} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors">
                                <Download className="w-4 h-4" />
                             </button>
                          </div>
                       )) : (
                          <div className="col-span-full py-8 text-center text-xs opacity-30 italic">No archives found.</div>
                       )}
                    </div>
                 </div>
              </div>
           </section>
        )}

        {/* ... Other Tabs ... */}
        {activeTab === 'avatars' && (
           <section className="space-y-6">
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
                    {presets.map(key => (
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
                    {presets.length === 0 && (
                       <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-xl">
                          <p className="opacity-50 text-xs">No presets uploaded yet.</p>
                       </div>
                    )}
                 </div>
              </div>
           </section>
        )}

        {/* --- REQUESTS TAB --- */}
        {activeTab === 'requests' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.length === 0 ? <div className="col-span-full py-20 text-center text-xs uppercase tracking-widest opacity-30">No Authentication Requests</div> : pendingUsers.map(u => (
              <div key={u.username} className={`${themeStyles.card} rounded-2xl p-6 border-l-4 border-yellow-500 animate-in slide-in-from-bottom-2`}>
                <div className="flex justify-between items-start">
                   <div>
                     <h4 className="font-black text-lg">{u.fullName}</h4>
                     <p className="text-[10px] font-mono opacity-50 uppercase">UID: {u.username} • {u.group}</p>
                   </div>
                   <div className="bg-yellow-500/10 text-yellow-500 text-[8px] font-black px-2 py-1 rounded uppercase">Pending</div>
                </div>
                <div className="flex gap-2 mt-8">
                  <button onClick={() => handleApproval(u.username, 'approve')} disabled={isProcessing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Grant</button>
                  <button onClick={() => handleApproval(u.username, 'reject')} disabled={isProcessing} className="flex-1 bg-red-950/20 text-red-500/50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-950/40 transition-all">Revoke</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* --- GROUPS TAB --- */}
        {activeTab === 'groups' && (
          <section className="space-y-6">
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
                {groups.map(group => (
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

        {/* --- NETWORK TAB --- */}
        {activeTab === 'network' && (
          <section className="space-y-4">
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
