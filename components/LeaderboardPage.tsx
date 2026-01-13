
import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Users, Target, ShieldCheck, History, Trophy } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import Header from './Header';
import Footer from './Footer';
import SummaryCard from './SummaryCard';
import { MOCK_MENTEES } from '../constants';
import { User, AppTheme } from '../types';

interface LeaderboardPageProps {
  currentUser: User | null;
  setView: (view: any) => void;
  handleLogout: () => void;
  themeStyles: any;
  currentTheme: AppTheme;
  toggleTheme: () => void;
}

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ currentUser, setView, handleLogout, themeStyles, currentTheme, toggleTheme }) => {
  const [filter, setFilter] = useState<'weekly' | 'all'>('weekly');
  const [sortField, setSortField] = useState<'points' | 'activeDays'>('points');

  const sortedMentees = useMemo(() => {
    return [...MOCK_MENTEES].sort((a, b) => {
      if (a[sortField] === b[sortField]) return b.activeDays - a.activeDays;
      return b[sortField] - a[sortField];
    });
  }, [sortField]);

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.textPrimary} flex flex-col relative overflow-x-hidden transition-colors duration-500`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <Header currentUser={currentUser} setView={setView} totalPoints={0} handleLogout={handleLogout} activeView="leaderboard" themeStyles={themeStyles} currentTheme={currentTheme} toggleTheme={toggleTheme} />

      <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 pb-24">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b ${themeStyles.border} pb-6`}>
          <div>
            <h2 className={`text-3xl ${themeStyles.fontDisplay} font-bold tracking-widest flex items-center gap-3 ${themeStyles.textPrimary} uppercase`}>
              <LayoutDashboard className={`w-8 h-8 ${themeStyles.textAccent}`} /> Mentor Dashboard
            </h2>
            <p className={`text-xs italic mt-1 font-medium ${themeStyles.textSecondary}`}>“Data pembinaan khusus mentor”</p>
          </div>
          <div className={`flex p-1 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg}`}>
            {['weekly', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? themeStyles.activeTab : themeStyles.inactiveTab}`}>{f.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Mentee" value="42" icon={<Users className="w-6 h-6 text-blue-400" />} themeStyles={themeStyles} />
          <SummaryCard label="Avg. Weekly" value="485 Pts" icon={<Target className={`w-6 h-6 ${themeStyles.textAccent}`} />} themeStyles={themeStyles} />
          <SummaryCard label="Top Consistent" value="Ahmad Al-Fatih" icon={<ShieldCheck className={`w-6 h-6 ${themeStyles.textGold}`} />} themeStyles={themeStyles} />
          <SummaryCard label="Total Group" value="12,450" icon={<History className="w-6 h-6 text-purple-400" />} themeStyles={themeStyles} />
        </section>

        <section className={`${themeStyles.card} rounded-xl overflow-hidden`}>
          <div className={`p-6 border-b ${themeStyles.border} flex justify-between items-center`}>
            <h3 className={`${themeStyles.fontDisplay} text-xl font-bold tracking-wider flex items-center gap-2 uppercase`}>
              <Trophy className={`w-5 h-5 ${themeStyles.textGold}`} /> Performance Tracker
            </h3>
            <div className="flex gap-2">
              {['points', 'activeDays'].map(s => (
                <button key={s} onClick={() => setSortField(s as any)} className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all ${sortField === s ? `${themeStyles.textAccent} border-current bg-white/5` : `${themeStyles.textSecondary} border-transparent hover:text-white`}`}>SORT: {s === 'points' ? 'PTS' : 'DAYS'}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`text-[10px] uppercase tracking-widest font-bold ${themeStyles.textSecondary} border-b ${themeStyles.border}`}>
                  <th className="px-8 py-4">Rank</th>
                  <th className="px-4 py-4">Mentee Name</th>
                  <th className="px-4 py-4 text-center">Weekly Pts</th>
                  <th className="px-4 py-4 text-center">Active Days</th>
                  <th className="px-8 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${currentTheme === 'legends' ? 'divide-[#590d0d]/30' : 'divide-slate-800'}`}>
                {sortedMentees.map((mentee, idx) => (
                  <tr key={mentee.username} className={`transition-colors ${currentTheme === 'legends' ? 'hover:bg-[#3a080e]/40' : 'hover:bg-slate-900/30'}`}>
                    <td className={`px-8 py-5 ${themeStyles.fontDisplay} text-xl font-bold ${idx < 3 ? themeStyles.textGold : themeStyles.textSecondary}`}>#{idx + 1}</td>
                    <td className={`px-4 py-5 font-bold ${themeStyles.textPrimary}`}>{mentee.fullName}</td>
                    <td className={`px-4 py-5 text-center ${themeStyles.fontDisplay} text-xl ${themeStyles.textAccent}`}>{mentee.points}</td>
                    <td className="px-4 py-5 text-center text-blue-400 font-game text-lg">{mentee.activeDays}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${mentee.activeDays < 3 ? 'bg-red-950/20 border-red-500/30 text-red-500' : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500'}`}>
                        {mentee.activeDays < 3 ? 'PENDAMPINGAN' : 'ON TRACK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <Footer themeStyles={themeStyles} />
      </main>
    </div>
  );
};

export default LeaderboardPage;
