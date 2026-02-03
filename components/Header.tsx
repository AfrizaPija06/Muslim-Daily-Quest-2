
import React, { useState, useRef } from 'react';
import { LogOut, RefreshCw, X, Save, UserCircle, Trophy, Check, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { User, AppTheme, getRankInfo, GlobalAssets } from '../types';
import { getAvatarSrc } from '../constants';
import ThemeToggle from './ThemeToggle';
import { api } from '../services/ApiService';

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
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser, setView, handleLogout, activeView, themeStyles, currentTheme, toggleTheme, performSync, handleUpdateProfile, totalPoints, globalAssets, refreshAssets
}) => {
  const isLegends = currentTheme === 'legends';
  const isMentor = currentUser?.role === 'mentor';
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    avatarSeed: ''
  });

  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const seasonPoints = totalPoints * 1;
  const currentRank = getRankInfo(seasonPoints);

  const openProfileModal = () => {
    if (currentUser) {
      setTempAvatar(null); 
      setEditForm({
        fullName: currentUser.fullName,
        username: currentUser.username,
        avatarSeed: currentUser.avatarSeed || ''
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
        avatarSeed: editForm.avatarSeed // Ini sekarang berisi URL
      };
      handleUpdateProfile(updatedUser);
      setIsEditingProfile(false);
    }
  };

  // --- NEW: DIRECT STORAGE UPLOAD ---
  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      setIsUploading(true);
      
      // 1. Upload ke Supabase Storage (bukan DB text)
      const publicUrl = await api.uploadAvatar(file, currentUser.username);
      
      if (publicUrl) {
         setTempAvatar(publicUrl); // Tampilkan preview
         setEditForm(prev => ({ ...prev, avatarSeed: publicUrl })); // Simpan URL ke form
      } else {
         alert("Upload gagal. Pastikan file < 2MB.");
      }
      setIsUploading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              <div className={`w-14 h-14 rounded-full overflow-hidden ${themeStyles.border} border-2 ${themeStyles.glow} transition-transform group-hover:scale-105 bg-black/50`}>
                 <img 
                   src={getAvatarSrc(currentUser?.avatarSeed || currentUser?.username)} 
                   className="w-full h-full object-cover" 
                   alt="Avatar" 
                 />
              </div>
              
              <div className={`absolute -bottom-2 -right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-lg ${currentRank.bg}`}>
                <Trophy className={`w-3.5 h-3.5 ${currentRank.color}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider ${themeStyles.textPrimary}`}>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-6 ${themeStyles.glow} relative animate-in zoom-in-95 my-auto`}>
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-50">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className={`text-xl ${themeStyles.fontDisplay} font-bold uppercase mb-4 flex items-center gap-2 ${themeStyles.textPrimary}`}>
              <UserCircle className={themeStyles.textAccent} /> Edit Profile
            </h3>

            <div className="space-y-4">
              {/* CURRENT AVATAR PREVIEW */}
              <div className="flex items-center gap-5 pb-6 border-b border-white/10">
                 <div className={`w-24 h-24 rounded-full overflow-hidden border-4 bg-black/50 relative group shrink-0 ${isLegends ? 'border-[#d4af37]' : 'border-emerald-500'}`}>
                    <img 
                      src={tempAvatar || getAvatarSrc(editForm.avatarSeed)} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* ALL USERS CAN UPLOAD NOW because it is cheap (Storage) */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                       {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white mb-1" />}
                       <span className="text-[8px] text-white uppercase font-bold">{isUploading ? 'Wait' : 'Upload'}</span>
                    </div>
                 </div>
                 <div className="flex flex-col justify-center">
                    <div className={`inline-flex items-center gap-3 px-4 py-2 mb-2 rounded-full border ${currentRank.bg}`}>
                      <Trophy className={`w-6 h-6 ${currentRank.color}`} />
                      <span className={`text-sm font-black uppercase tracking-widest ${themeStyles.textPrimary}`}>
                        {currentRank.name}
                      </span>
                   </div>
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
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleProfileUpload}
            />

          </div>
        </div>
      )}
    </>
  );
};

export default Header;
