
import React, { useState } from 'react';
import { LogOut, RefreshCw, X, Save, RefreshCcw, UserCircle, Trophy } from 'lucide-react';
import { User, AppTheme, getRankInfo } from '../types';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  currentUser: User | null;
  setView: (view: any) => void;
  totalPoints: number;
  handleLogout: () => void;
  activeView: string;
  themeStyles: any;
  currentTheme: AppTheme;
  toggleTheme: () => void;
  performSync?: () => Promise<void>;
  handleUpdateProfile?: (user: User) => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, setView, handleLogout, activeView, themeStyles, currentTheme, toggleTheme, performSync, handleUpdateProfile, totalPoints }) => {
  const isLegends = currentTheme === 'legends';
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    avatarSeed: ''
  });

  // Calculate Season Points (Estimated as Weekly * 4 for this context)
  const seasonPoints = totalPoints * 4;
  const currentRank = getRankInfo(seasonPoints);

  const openProfileModal = () => {
    if (currentUser) {
      setEditForm({
        fullName: currentUser.fullName,
        username: currentUser.username,
        avatarSeed: currentUser.avatarSeed || currentUser.username
      });
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = () => {
    if (currentUser && handleUpdateProfile) {
      const updatedUser: User = {
        ...currentUser,
        fullName: editForm.fullName,
        username: editForm.username,
        avatarSeed: editForm.avatarSeed
      };
      handleUpdateProfile(updatedUser);
      setIsEditingProfile(false);
    }
  };

  const randomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setEditForm(prev => ({ ...prev, avatarSeed: randomSeed }));
  };

  return (
    <>
      <header className={`sticky top-0 z-50 px-4 py-4 md:px-8 backdrop-blur-md border-b transition-colors duration-500 ${isLegends ? 'bg-[#1a0505]/90 border-[#d4af37]/30' : 'bg-slate-950/80 border-emerald-500/20'}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={openProfileModal}
              className="relative group focus:outline-none"
              title="Edit Profile"
            >
              <div className={`w-14 h-14 rounded-full overflow-hidden ${themeStyles.border} border-2 ${themeStyles.glow} transition-transform group-hover:scale-105`}>
                 <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.avatarSeed || currentUser?.username}`} className="w-full h-full object-cover" alt="Avatar" />
              </div>
              {/* Dynamic Rank Badge */}
              <div className={`absolute -bottom-2 -right-4 scale-75 md:scale-100 flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-lg ${currentRank.bg}`}>
                <Trophy className={`w-3 h-3 ${currentRank.color}`} />
                <span className={`text-[8px] font-black uppercase tracking-wider ${themeStyles.textPrimary}`}>
                  {currentRank.name}
                </span>
              </div>
              
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <UserCircle className="w-6 h-6 text-white" />
              </div>
            </button>
            <div className="mt-2 md:mt-0">
              <h1 className={`text-xl md:text-2xl ${themeStyles.fontDisplay} font-bold tracking-wide ${themeStyles.textPrimary}`}>
                {currentUser?.fullName.split(' ')[0].toUpperCase()}'S {currentUser?.role === 'mentor' ? 'HUB' : 'QUEST'}
              </h1>
              <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${themeStyles.textAccent}`}>{currentUser?.group}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {performSync && (
              <button 
                onClick={performSync} 
                className={`p-3 border rounded-xl hover:text-emerald-500 transition-all ${themeStyles.inputBg} ${themeStyles.border} ${themeStyles.textSecondary}`}
                title="Force Sync Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
            <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} themeStyles={themeStyles} />
            <nav className={`flex items-center gap-1 p-1 rounded-xl border ${themeStyles.border} ${themeStyles.inputBg}`}>
              <button onClick={() => setView('tracker')} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${activeView === 'tracker' ? themeStyles.activeTab : themeStyles.inactiveTab}`}>TRACKER</button>
              {currentUser?.role === 'mentor' && (
                <button onClick={() => setView('leaderboard')} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${activeView === 'leaderboard' ? themeStyles.activeTab : themeStyles.inactiveTab}`}>DASHBOARD</button>
              )}
            </nav>
            <button onClick={handleLogout} className={`p-3 border rounded-xl hover:text-red-500 transition-all ${themeStyles.inputBg} ${themeStyles.border} ${themeStyles.textSecondary}`}><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-6 ${themeStyles.glow} relative animate-in zoom-in-95`}>
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className={`text-xl ${themeStyles.fontDisplay} font-bold uppercase mb-6 flex items-center gap-2 ${themeStyles.textPrimary}`}>
              <UserCircle className={themeStyles.textAccent} /> Edit Profile
            </h3>

            <div className="space-y-4">
              {/* Avatar Preview & Randomizer */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-white/10">
                 <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isLegends ? 'border-[#d4af37]' : 'border-emerald-500'}`}>
                    <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${editForm.avatarSeed}`} alt="Preview" className="w-full h-full object-cover" />
                 </div>
                 
                 {/* Current Rank Display in Modal */}
                 <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${currentRank.bg}`}>
                    <Trophy className={`w-4 h-4 ${currentRank.color}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${themeStyles.textPrimary}`}>
                      {currentRank.name}
                    </span>
                 </div>
                 <p className="text-[10px] opacity-50">Season EXP: {seasonPoints}</p>

                 <button 
                   onClick={randomizeAvatar}
                   className={`mt-2 text-xs flex items-center gap-2 px-4 py-2 rounded-full ${themeStyles.inputBg} hover:bg-white/10 transition-colors border ${themeStyles.border} ${themeStyles.textSecondary}`}
                 >
                   <RefreshCcw className="w-3 h-3" /> Randomize Look
                 </button>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>Full Name</label>
                <input 
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>Username (ID)</label>
                <input 
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`}
                />
                <p className="text-[10px] text-red-400 opacity-70 italic">* Changing username will migrate your data to a new ID.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                   onClick={() => setIsEditingProfile(false)}
                   className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-xs border ${themeStyles.border} text-white/50 hover:bg-white/5`}
                >
                  Cancel
                </button>
                <button 
                   onClick={handleSaveProfile}
                   className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 ${themeStyles.buttonPrimary}`}
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
