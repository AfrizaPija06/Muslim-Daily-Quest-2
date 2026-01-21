
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Users, Target, ShieldCheck, Trophy, Download, UserPlus, Calendar, Database, Activity, Terminal, ChevronRight, Server } from 'lucide-react';
import * as XLSX from 'xlsx';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import { User, AppTheme, POINTS, WeeklyData } from '../types';
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
}

interface LeaderboardData {
  fullName: string;
  username: string;
  group: string;
  points: number;
  monthlyPoints: number; 
  activeDays: number;
  lastUpdated: string;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ 
  currentUser, setView, handleLogout, themeStyles, currentTheme, toggleTheme, performSync, networkLogs 
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'requests' | 'network'>('leaderboard');
  const [menteesData, setMenteesData] = useState<LeaderboardData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  const loadData = () => {
    const usersStr = localStorage.getItem('nur_quest_users');
    const allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    
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
            if (prayerPoints > 0 || day.tilawah > 0) activeDays++;
          });
        }

        return {
          fullName: u.fullName,
          username: u.username,
          group: u.group,
          points,
          monthlyPoints: points * 4,
          activeDays,
          lastUpdated: trackerData?.lastUpdated || 'No Data',
          status: 'active'
        };
      });

    setMenteesData(activeMentees);
    setPendingUsers(allUsers.filter(u => u.role === 'mentee' && u.status === 'pending'));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleApproval = async (username: string, action: 'approve' | 'reject') => {
    const usersStr = localStorage.getItem('nur_quest_users');
    let allUsers: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    allUsers = allUsers.map(u => {
      if (u.username === username) return { ...u, status: action === 'approve' ? 'active' : 'rejected' };
      return u;
    });

    localStorage.setItem('nur_quest_users', JSON.stringify(allUsers));
    
    // Pro-style: Push updated user list to cloud
    const currentDb = await api.fetchDatabase();
    await api.updateDatabase({ ...currentDb, users: allUsers });
    
    loadData(); 
  };

  const sortedWeekly = useMemo(() => [...menteesData].sort((a, b) => b.points - a.points), [menteesData]);

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={0} handleLogout={handleLogout} activeView="leaderboard" themeStyles={themeStyles} currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className={`text-4xl ${themeStyles.fontDisplay} font-bold tracking-tighter flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <Server className={`w-10 h-10 ${themeStyles.textAccent}`} /> Backend Admin
            </h2>
            <p className={`text-xs font-mono mt-1 opacity-50 uppercase tracking-widest`}>Production Environment • ID: NUR_QUEST_PROD_01</p>
          </div>
          <button onClick={() => XLSX.writeFile(XLSX.utils.book_append_sheet(XLSX.utils.book_new(), XLSX.utils.json_to_sheet(menteesData), "Mentees"), "Global_Export.xlsx")} className={`px-6 py-3 rounded-full flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${themeStyles.buttonPrimary}`}>
            <Download className="w-4 h-4" /> Export DB
          </button>
        </div>

        <div className="flex gap-6 border-b border-white/5 pb-0">
          {[
            { id: 'leaderboard', label: 'Global Ranking', icon: <Trophy className="w-4 h-4" /> },
            { id: 'requests', label: 'Auth Requests', icon: <UserPlus className="w-4 h-4" />, count: pendingUsers.length },
            { id: 'network', label: 'Server Logs', icon: <Terminal className="w-4 h-4" /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? `${themeStyles.textAccent} border-current` : 'text-white/30 border-transparent hover:text-white'}`}>
              {tab.icon} {tab.label} {tab.count ? <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
            </button>
          ))}
        </div>

        {activeTab === 'leaderboard' ? (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Node Status" value="Healthy" icon={<Activity className="w-6 h-6 text-emerald-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Active Users" value={menteesData.length} icon={<Users className="w-6 h-6 text-blue-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Total Requests" value="1.2k" icon={<Database className="w-6 h-6 text-purple-400" />} themeStyles={themeStyles} />
              <SummaryCard label="Avg. Score" value={menteesData.length ? Math.round(menteesData.reduce((a,b)=>a+b.points,0)/menteesData.length) : 0} icon={<Target className={`w-6 h-6 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
            </section>
            
            <div className={`${themeStyles.card} rounded-3xl overflow-hidden`}>
              <div className="p-6 border-b border-white/5 bg-white/5">
                <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" /> Database: Mentees_Rankings
                </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase font-black tracking-widest text-white/40 border-b border-white/5">
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Mentee Name</th>
                    <th className="px-6 py-4">Group</th>
                    <th className="px-6 py-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedWeekly.map((m, i) => (
                    <tr key={m.username} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-black opacity-30">#{i+1}</td>
                      <td className="px-6 py-4 font-bold">{m.fullName}</td>
                      <td className="px-6 py-4 text-xs opacity-50 uppercase tracking-widest">{m.group}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-500">{m.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <button onClick={() => handleApproval(u.username, 'approve')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Grant Access</button>
                  <button onClick={() => handleApproval(u.username, 'reject')} className="flex-1 bg-red-950/20 text-red-500/50 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-950/40 transition-all">Revoke</button>
                </div>
              </div>
            ))}
          </section>
        ) : (
          /* NETWORK LOGS (Ala Backend) */
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
                 <div className="flex gap-3 text-white/20 animate-pulse">
                   <span>{`>`}</span>
                   <span>Listening for incoming packets...</span>
                 </div>
               </div>
            </div>
            <div className="p-6 rounded-2xl bg-blue-950/10 border border-blue-500/20 flex gap-4 items-center">
              <Server className="w-8 h-8 text-blue-400" />
              <div>
                <h4 className="font-bold text-blue-400 text-sm uppercase">Engine Concept</h4>
                <p className="text-xs opacity-60">Professional apps use JSON-based REST APIs. The logs above show exactly how the Client (HP) and Server (Cloud DB) communicate through HTTP requests.</p>
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
