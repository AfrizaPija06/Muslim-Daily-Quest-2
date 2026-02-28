
import React, { useState } from 'react';
import { LogOut, RefreshCw, X, Save, UserCircle, Trophy, Moon, Edit2, Award } from 'lucide-react';
import { User, AppTheme, getRankInfo, GlobalAssets, HIJRI_YEAR, Character } from '../types';
import { getAvatarSrc } from '../constants';
import AvatarSelection from './AvatarSelection';

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
  globalAssets?: GlobalAssets;
  refreshAssets?: (assets: GlobalAssets) => void;
  currentDayIndex?: number; // Add currentDayIndex prop
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser, setView, handleLogout, activeView, themeStyles, performSync, handleUpdateProfile, totalPoints, currentDayIndex = 0
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    avatarSeed: '',
    characterId: ''
  });

  const seasonPoints = totalPoints * 1;
  const currentRank = getRankInfo(seasonPoints);

  const openProfileModal = () => {
    if (currentUser) {
      setEditForm({
        fullName: currentUser.fullName,
        username: currentUser.username,
        avatarSeed: currentUser.avatarSeed || '',
        characterId: currentUser.characterId || ''
      });
      setIsEditingProfile(true);
      setIsChangingAvatar(false);
    }
  };

  const handleCharacterSelect = (char: Character) => {
    setEditForm(prev => ({
      ...prev,
      characterId: char.id,
      avatarSeed: char.imageUrl // Update image URL based on character
    }));
    setIsChangingAvatar(false); // Go back to main edit form
  };

  const handleSaveProfile = () => {
    if (currentUser && handleUpdateProfile) {
      const updatedUser: User = {
        ...currentUser,
        fullName: editForm.fullName,
        avatarSeed: editForm.avatarSeed,
        characterId: editForm.characterId
      };
      handleUpdateProfile(updatedUser);
      setIsEditingProfile(false);
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 px-4 py-4 md:px-8 backdrop-blur-md border-b transition-colors duration-500 bg-[#0f0518]/90 border-[#fbbf24]/20`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={openProfileModal}
              className="relative group focus:outline-none"
              title="Edit Profile"
            >
              <div className={`w-14 h-14 rounded-full overflow-hidden ${themeStyles.border} border-2 ${themeStyles.glow} transition-transform group-hover:scale-105 bg-black/50`}>
                 <img 
                   src={getAvatarSrc(currentUser?.avatarSeed || currentUser?.username)} 
                   className="w-full h-full object-cover" 
                   alt="Avatar" 
                   onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentUser?.fullName}`}
                 />
              </div>
              
                <div className={`absolute -bottom-2 -right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-lg ${currentRank.bg}`}>
                <Trophy className={`w-3.5 h-3.5 ${currentRank.color}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider ${themeStyles.textPrimary}`}>
                  {currentRank.name}
                  {/* Show Stars only on Day 11+ */}
                  {currentDayIndex >= 10 && currentRank.stars !== undefined && currentRank.stars > 0 && (
                     <span className="ml-1 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">★{currentRank.stars}</span>
                  )}
                </span>
              </div>
            </button>
            <div className="mt-2 md:mt-0">
              <h1 className={`text-xl md:text-2xl ${themeStyles.fontDisplay} font-bold tracking-wide ${themeStyles.textPrimary} flex items-center gap-2`}>
                <Moon className="w-5 h-5 text-[#fbbf24]" />
                {currentUser?.fullName.split(' ')[0].toUpperCase()}'S {currentUser?.role === 'mentor' ? 'HUB' : 'QUEST'}
              </h1>
              <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${themeStyles.textAccent}`}>
                SEASON: {HIJRI_YEAR}
              </p>
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
      
      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full ${isChangingAvatar ? 'max-w-4xl' : 'max-w-md'} ${themeStyles.card} rounded-3xl p-6 ${themeStyles.glow} relative animate-in zoom-in-95 my-auto transition-all duration-300`}>
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-50">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className={`text-xl ${themeStyles.fontDisplay} font-bold uppercase mb-4 flex items-center gap-2 ${themeStyles.textPrimary}`}>
              <UserCircle className={themeStyles.textAccent} /> {isChangingAvatar ? 'Select Character' : 'Edit Profile'}
            </h3>

            {isChangingAvatar ? (
               <div className="animate-in fade-in">
                  <AvatarSelection 
                    selectedId={editForm.characterId} 
                    onSelect={handleCharacterSelect}
                    themeStyles={themeStyles}
                  />
                  <button 
                    onClick={() => setIsChangingAvatar(false)} 
                    className="mt-4 w-full py-3 bg-white/5 rounded-xl text-xs uppercase font-bold"
                  >
                    Cancel Selection
                  </button>
               </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-5 pb-6 border-b border-white/10">
                  <div className="relative group cursor-pointer" onClick={() => setIsChangingAvatar(true)}>
                    <div className={`w-24 h-24 rounded-full overflow-hidden border-4 bg-black/50 relative shrink-0 ${themeStyles.border}`}>
                        <img 
                          src={getAvatarSrc(editForm.avatarSeed || editForm.username)} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                          onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${editForm.fullName}`}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <Edit2 className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#fbbf24] text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Change</div>
                  </div>
                  
                      <div className="flex flex-col justify-center">
                          <div className={`inline-flex items-center gap-3 px-4 py-2 mb-2 rounded-full border ${currentRank.bg}`}>
                            <Trophy className={`w-6 h-6 ${currentRank.color}`} />
                            <span className={`text-sm font-black uppercase tracking-widest ${themeStyles.textPrimary}`}>
                              {currentRank.name}
                              {/* Show Stars only on Day 11+ */}
                              {currentDayIndex >= 10 && currentRank.stars !== undefined && currentRank.stars > 0 && (
                                 <span className="ml-1 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">★{currentRank.stars}</span>
                              )}
                            </span>
                        </div>
                        {currentUser?.specialTitle && (
                          <div className="mb-2 px-3 py-1.5 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-white/10 rounded-lg inline-flex items-center gap-2 w-fit">
                            <Award className="w-3 h-3 text-yellow-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{currentUser.specialTitle}</span>
                          </div>
                        )}
                        <p className="text-xs opacity-50 font-mono">Season EXP: {seasonPoints}</p>
                      </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>Full Name</label>
                  <input 
                    value={editForm.fullName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`}
                  />
                </div>
                
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[10px] text-white/50">
                  Catatan: Username dikelola oleh Admin. Ganti karakter dengan klik foto profil di atas.
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
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default Header;
