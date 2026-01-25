
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Users, Target, ShieldCheck, Trophy, Download, UserPlus, Calendar, Database, Activity, Terminal, ChevronRight, Server, Flag, Trash2, PlusCircle, Share2, Copy, AlertTriangle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import { User, AppTheme, POINTS, WeeklyData, getRankInfo } from '../types';
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
  activeDays: number;
  lastUpdated: string;
  status: string;
  role: string;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ 
  currentUser, setView, handleLogout, themeStyles, currentTheme, toggleTheme, performSync, networkLogs, groups, updateGroups, handleUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'requests' | 'network' | 'groups'>('leaderboard');
  const [menteesData, setMenteesData] = useState<LeaderboardData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

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
          activeDays,
          lastUpdated: trackerData?.lastUpdated || 'No Data',
          status: 'active',
          role: displayUser.role
        };
      });

    setMenteesData(activeUsers);
    setPendingUsers(allUsers.filter(u => u.role === 'mentee' && u.status === 'pending'));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); 
    return () => clearInterval(interval);
  }, [currentUser]); 

  // --- FIXED: HANDLE APPROVAL LOGIC WITH ROBUST ERROR HANDLING ---
  const handleApproval = async (username: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      // 1. Get current list from local
      const usersStr = localStorage.getItem('nur_quest_users');
      let allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      // 2. Find target user
      const targetUser = allUsers.find(u => u.username === username);
      if (!targetUser) throw new Error("User not found locally");

      // 3. Create updated user object
      const updatedUser: User = { 
        ...targetUser, 
        status: action === 'approve' ? 'active' : 'rejected' 
      };

      // 4. Update Database Directly
      const response = await api.updateUserProfile(updatedUser);
      
      if (response.success) {
        // 5. Update Local State
        const newUsersList = allUsers.map(u => u.username === username ? updatedUser : u);
        localStorage.setItem('nur_quest_users', JSON.stringify(newUsersList));
        loadData(); // Refresh UI
        
        if (response.warning) {
          console.warn(response.warning);
        }
      } else {
        alert(`Failed: ${response.error || "Server Connection Error"}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKickUser = async (targetUsername: string, targetName: string) => {
    if (!confirm(`PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN user ${targetName}? \n\nData tidak dapat dikembalikan dan akan hilang dari database.`)) return;
    
    setIsProcessing(true);
    try {
      const success = await api.deleteUser(targetUsername);

      if (success) {
        setMenteesData(prev => prev.filter(m => m.username !== targetUsername));
        setPendingUsers(prev => prev.filter(m => m.username !== targetUsername));

        const usersStr = localStorage.getItem('nur_quest_users');
        if (usersStr) {
          const allUsers = JSON.parse(usersStr) as User[];
          const filteredUsers = allUsers.filter(u => u.username !== targetUsername);
          localStorage.setItem('nur_quest_users', JSON.stringify(filteredUsers));
        }
        localStorage.removeItem(`ibadah_tracker_${targetUsername}`);
        alert(`User ${targetName} berhasil dihapus permanen.`);
      } else {
        throw new Error("Gagal menghapus dari server.");
      }
      loadData();
    } catch (e: any) {
      alert(`Gagal menghapus user: ${e.message}`);
      loadData(); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (groups.includes(newGroupName)) return;

    const updatedGroups = [...groups, newGroupName];
    await updateGroups(updatedGroups);
    setNewGroupName('');
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (confirm(`Are you sure you want to disband '${groupName}'?`)) {
      const updatedGroups = groups.filter(g => g !== groupName);
      await updateGroups(updatedGroups);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedWeekly = useMemo(() => [...menteesData].sort((a, b) => b.points - a.points), [menteesData]);

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={0} handleLogout={handleLogout} activeView="leaderboard" themeStyles={themeStyles} currentTheme={currentTheme} toggleTheme={toggleTheme} handleUpdateProfile={handleUpdateProfile} />

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
            <button onClick={copyLink} className={`px-6 py-3 rounded-full flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all border ${themeStyles.border} ${themeStyles.inputBg} hover:bg-white/10`}>
              {copied ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />} {copied ? 'Link Copied!' : 'Share App'}
            </button>
            <button onClick={() => {
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(menteesData), "Mentees");
              XLSX.writeFile(wb, "Global_Export.xlsx");
            }} className={`px-6 py-3 rounded-full flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${themeStyles.buttonPrimary} text-white`}>
              <Download className="w-4 h-4" /> Export DB
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-white/5 pb-0 overflow-x-auto">
          {[
            { id: 'leaderboard', label: 'Members & Ranking', icon: <Trophy className="w-4 h-4" /> },
            { id: 'requests', label: 'Auth Requests', icon: <UserPlus className="w-4 h-4" />, count: pendingUsers.length },
            { id: 'groups', label: 'Factions', icon: <Flag className="w-4 h-4" /> },
            { id: 'network', label: 'Server Logs', icon: <Terminal className="w-4 h-4" /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? `${themeStyles.textAccent} border-current` : 'opacity-40 border-transparent hover:opacity-100'}`}>
              {tab.icon} {tab.label} {tab.count ? <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
            </button>
          ))}
        </div>

        {activeTab === 'leaderboard' ? (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Node Status" value="Healthy" icon={<Activity className="w-6 h-6 text-emerald-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Active Members" value={menteesData.length} icon={<Users className="w-6 h-6 text-blue-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Total Requests" value={pendingUsers.length > 0 ? `${pendingUsers.length} Pending` : "All Clear"} icon={<Database className="w-6 h-6 text-purple-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Avg. Score" value={menteesData.length ? Math.round(menteesData.reduce((a,b)=>a+b.points,0)/menteesData.length) : 0} icon={<Target className={`w-6 h-6 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
            </section>
            
            <div className={`${themeStyles.card} rounded-3xl overflow-hidden`}>
              <div className={`p-6 border-b ${themeStyles.border} ${currentTheme === 'light' ? 'bg-slate-50' : 'bg-white/5'}`}>
                <h3 className={`font-black text-xs uppercase tracking-widest flex items-center gap-2 ${themeStyles.textPrimary}`}>
                  <Database className="w-4 h-4 text-emerald-500" /> Database: Active Members
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className={`text-[10px] uppercase font-black tracking-widest ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">User Name</th>
                      <th className="px-6 py-4">Group</th>
                      <th className="px-6 py-4">Season Rank</th>
                      <th className="px-6 py-4 text-right">EXP</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${currentTheme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {sortedWeekly.map((m, i) => (
                      <tr key={m.username} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-black opacity-30">#{i+1}</td>
                        <td className="px-6 py-4 font-bold flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0 bg-black/50">
                             <img src={getAvatarSrc(m.avatarSeed || m.username)} alt="av" className="w-full h-full object-cover" />
                          </div>
                          {m.fullName}
                          {m.role === 'mentor' && <span className="text-[8px] bg-yellow-500 text-black px-1 rounded font-black uppercase">Mentor</span>}
                        </td>
                        <td className="px-6 py-4 text-xs opacity-50 uppercase tracking-widest">{m.group}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${m.rankColor.replace('text-', 'border-').replace('400', '500')} ${m.rankColor} bg-white/5`}>
                            {m.rankName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-500">{m.points}</td>
                        <td className="px-6 py-4 text-center">
                          {m.role !== 'mentor' && (
                            <button 
                              onClick={() => handleKickUser(m.username, m.fullName)}
                              className="p-2 bg-red-950/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                              title="Delete Permanently"
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sortedWeekly.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center opacity-30 text-xs uppercase tracking-widest">No Active Users Found. Waiting for sync...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'requests' ? (
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
                  <button onClick={() => handleApproval(u.username, 'approve')} disabled={isProcessing} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Grant Access</button>
                  <button onClick={() => handleApproval(u.username, 'reject')} disabled={isProcessing} className="flex-1 bg-red-950/20 text-red-500/50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-950/40 transition-all">Revoke</button>
                </div>
              </div>
            ))}
          </section>
        ) : activeTab === 'groups' ? (
          <section className="space-y-6">
             <div className={`${themeStyles.card} rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center`}>
                <div className="flex-1 w-full">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Establish New Faction</h3>
                  <p className="text-xs opacity-50">Create a new group for mentees to join.</p>
                </div>
                <form onSubmit={handleAddGroup} className="flex gap-2 w-full md:w-auto">
                  <input 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Salahuddin Al-Ayyubi"
                    className={`rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} min-w-[250px]`}
                  />
                  <button type="submit" className={`px-4 rounded-xl ${themeStyles.buttonPrimary} flex items-center justify-center text-white`}>
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </form>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map(group => (
                  <div key={group} className={`${themeStyles.card} p-4 rounded-xl flex items-center justify-between group border hover:border-red-500/50 transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${currentTheme === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                        <Flag className={`w-4 h-4 ${themeStyles.textAccent}`} />
                      </div>
                      <span className="font-bold text-sm uppercase tracking-wider">{group}</span>
                    </div>
                    <button onClick={() => handleDeleteGroup(group)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
             </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className={`${themeStyles.card} bg-black/90 rounded-2xl border border-white/10 overflow-hidden font-mono text-[11px]`}>
               <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500" />
                   <div className="w-2 h-2 rounded-full bg-yellow-500" />
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="ml-2 font-black text-white/40 uppercase text-[10px]">Real-time Request Logs</span>
                 </div>
                 <span className="text-emerald-500">LIVE CONNECTION</span>
               </div>
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
