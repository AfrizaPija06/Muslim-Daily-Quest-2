
import React, { useMemo, useEffect, useState } from 'react';
import { Trophy, Crown, Medal, Loader2 } from 'lucide-react';
import { User, POINTS } from '../types';
import { getAvatarSrc } from '../constants';
import { api } from '../services/ApiService';

interface MiniLeaderboardProps {
  currentUser: User | null;
  themeStyles: any;
  onUserClick?: (user: any) => void;
}

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ currentUser, themeStyles, onUserClick }) => {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await api.getAllUsersWithPoints();
        const processed = users.map(u => {
          let points = 0;
          if (u.trackerData && u.trackerData.days) {
            u.trackerData.days.forEach((day: any) => {
              const prayerPoints = Object.values(day.prayers as any).reduce<number>((acc: number, val: any) => {
                if (val === 1) return acc + POINTS.HOME;
                if (val === 2) return acc + POINTS.MOSQUE;
                return acc;
              }, 0);
              points += prayerPoints + (day.tilawah * POINTS.TILAWAH_PER_LINE) + (day.shaum ? POINTS.SHAUM : 0) + (day.tarawih ? POINTS.TARAWIH : 0);
            });
          }
          return { ...u, points };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 10); // Top 10
        
        setLeaderboardData(processed);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // OPTIMIZATION: Refresh every 10 minutes (600000ms) instead of 2 minutes to save bandwidth (Egress)
    const interval = setInterval(fetchData, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`h-full ${themeStyles.card} rounded-3xl p-6 border-2 border-[#fbbf24]/20 flex flex-col gap-4 overflow-hidden`}>
      <div className="flex items-center gap-3 border-b border-[#fbbf24]/20 pb-4">
        <div className="p-2 bg-[#fbbf24]/10 rounded-lg">
          <Trophy className="w-6 h-6 text-[#fbbf24]" />
        </div>
        <div>
          <h3 className={`text-lg ${themeStyles.fontDisplay} font-bold text-[#fefce8] uppercase tracking-wider`}>Top Mujahid</h3>
          <p className="text-[10px] text-[#fbbf24] uppercase tracking-widest">Ramadhan Leaderboard</p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar space-y-3 pr-2">
        {isLoading ? (
          <div className="flex justify-center py-10 opacity-50"><Loader2 className="animate-spin w-6 h-6"/></div>
        ) : (
          leaderboardData.map((user, idx) => {
            const isMe = currentUser?.username === user.username;
            let rankIcon = <span className="font-mono font-bold text-sm w-6 text-center opacity-50">#{idx + 1}</span>;
            
            if (idx === 0) rankIcon = <Crown className="w-5 h-5 text-yellow-400" />;
            if (idx === 1) rankIcon = <Medal className="w-5 h-5 text-gray-300" />;
            if (idx === 2) rankIcon = <Medal className="w-5 h-5 text-amber-600" />;

            return (
              <button 
                key={user.username} 
                onClick={() => onUserClick && onUserClick(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left ${isMe ? 'bg-[#fbbf24]/20 border border-[#fbbf24]/50' : 'bg-white/5 border border-transparent hover:bg-white/10 hover:scale-[1.02]'}`}
              >
                <div className="flex items-center justify-center w-6 shrink-0">
                  {rankIcon}
                </div>
                
                <div className="w-8 h-8 rounded-full bg-black overflow-hidden border border-white/10 shrink-0">
                  <img src={getAvatarSrc(user.avatarSeed || user.username)} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow min-w-0">
                  <p className={`text-xs font-bold truncate ${isMe ? 'text-[#fbbf24]' : 'text-[#fefce8]'}`}>
                    {user.fullName}
                  </p>
                  <p className="text-[9px] opacity-50 uppercase truncate">{user.group}</p>
                </div>
                
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-[#fbbf24]">{user.points}</p>
                  <p className="text-[8px] opacity-50">XP</p>
                </div>
              </button>
            );
          })
        )}
        {!isLoading && leaderboardData.length === 0 && (
          <p className="text-center text-xs opacity-50 py-10">Belum ada data</p>
        )}
      </div>
    </div>
  );
};

export default MiniLeaderboard;
