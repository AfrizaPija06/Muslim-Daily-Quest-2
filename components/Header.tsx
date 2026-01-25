
import React, { useState, useRef } from 'react';
import { LogOut, RefreshCw, X, Save, UserCircle, Trophy, Check, UploadCloud } from 'lucide-react';
import { User, AppTheme, getRankInfo } from '../types';
import { AVAILABLE_AVATARS, getAvatarSrc } from '../constants';
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
  const isMentor = currentUser?.role === 'mentor';
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    avatarSeed: ''
  });

  // Image Error State for Grid
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  
  // Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  // Calculate Season Points
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
      setImgErrors({}); // Reset errors on open
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

  const handleMainAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const src = getAvatarSrc('1'); 
    if (e.currentTarget.src !== src && src) {
      e.currentTarget.src = src;
    }
  };

  const handleGridImgError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  // --- MANUAL IMAGE UPLOAD HANDLER (MENTOR ONLY) ---
  const triggerUpload = (id: string) => {
    if (!isMentor) return; // Restrict to Mentor
    setUploadTargetId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Save to LocalStorage
        localStorage.setItem(`avatar_cache_${uploadTargetId}`, base64String);
        
        // Clear error for this ID so it retries loading
        setImgErrors(prev => {
           const newState = { ...prev };
           delete newState[uploadTargetId];
           return newState;
        });

        // Force re-render of selection if it was selected
        if (editForm.avatarSeed === uploadTargetId) {
           setEditForm(prev => ({ ...prev })); 
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
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
                   onError={handleMainAvatarError}
                   className="w-full h-full object-cover" 
                   alt="Avatar" 
                 />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-6 ${themeStyles.glow} relative animate-in zoom-in-95 my-auto`}>
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 text-white/50 hover:text-white z-50">
              <X className="w-6 h-6" />
            </button>
            
            <h3 className={`text-xl ${themeStyles.fontDisplay} font-bold uppercase mb-4 flex items-center gap-2 ${themeStyles.textPrimary}`}>
              <UserCircle className={themeStyles.textAccent} /> Edit Profile
            </h3>

            <div className="space-y-4">
              {/* CURRENT AVATAR & RANK */}
              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                 <div className={`w-20 h-20 rounded-full overflow-hidden border-4 bg-black/50 ${isLegends ? 'border-[#d4af37]' : 'border-emerald-500'}`}>
                    <img 
                      src={getAvatarSrc(editForm.avatarSeed)} 
                      onError={handleMainAvatarError}
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                 </div>
                 <div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 mb-1 rounded-full border ${currentRank.bg}`}>
                      <Trophy className={`w-3 h-3 ${currentRank.color}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${themeStyles.textPrimary}`}>
                        {currentRank.name}
                      </span>
                   </div>
                   <p className="text-[10px] opacity-50">Season EXP: {seasonPoints}</p>
                 </div>
              </div>

              {/* CHARACTER SELECTION GRID */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>Select Avatar Class</label>
                   {isMentor && <span className="text-[9px] text-white/40 italic">*Click image to upload (Mentor Only)</span>}
                 </div>
                 
                 <div className="grid grid-cols-3 gap-3">
                    {AVAILABLE_AVATARS.map((avatar) => {
                       const isSelected = editForm.avatarSeed === avatar.id;
                       const hasError = imgErrors[avatar.id];
                       
                       return (
                         <div 
                           key={avatar.id}
                           onClick={(e) => {
                             // If it's an error state, only Mentor can trigger upload
                             if (hasError) {
                               e.stopPropagation();
                               if (isMentor) triggerUpload(avatar.id);
                             } else {
                               setEditForm(prev => ({ ...prev, avatarSeed: avatar.id }));
                             }
                           }}
                           className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group cursor-pointer
                             ${isSelected && !hasError
                               ? (isLegends 
                                  ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 scale-105 shadow-lg shadow-[#d4af37]/20' 
                                  : 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-lg shadow-emerald-500/20') 
                               : 'border-white/10 hover:border-white/30 hover:scale-105 opacity-100'
                             }`}
                           title={hasError && isMentor ? "Click to Upload Image" : avatar.name}
                         >
                           {/* Gradient Background */}
                           <div className={`absolute inset-0 ${isLegends ? 'bg-gradient-to-br from-[#3a080e] to-[#0f0404]' : 'bg-gradient-to-br from-slate-800 to-slate-950'}`} />
                           
                           {!hasError ? (
                               <img 
                                 src={getAvatarSrc(avatar.id)} 
                                 alt={avatar.name} 
                                 onError={() => handleGridImgError(avatar.id)}
                                 className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110" 
                               />
                           ) : (
                               // UPLOAD STATE UI (Visible to all, but only Mentor has Icon)
                               <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-1 p-2 hover:bg-white/5 transition-colors">
                                  {isMentor ? (
                                    <>
                                      <UploadCloud className="w-6 h-6 animate-pulse text-yellow-500" />
                                      <span className="text-[7px] uppercase font-bold text-center leading-tight text-yellow-500">Tap to Upload</span>
                                    </>
                                  ) : (
                                    <span className="text-[7px] uppercase font-bold text-center leading-tight">Image Missing</span>
                                  )}
                               </div>
                           )}

                           {/* Selection Overlay (Only if not error) */}
                           {isSelected && !hasError && (
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-10">
                               <Check className="w-8 h-8 text-white drop-shadow-md" />
                             </div>
                           )}
                           
                           {/* Name Tag */}
                           <div className="absolute bottom-0 inset-x-0 bg-black/80 p-1.5 text-[9px] font-bold uppercase text-center truncate text-white/90 z-20 border-t border-white/10">
                             {avatar.name}
                           </div>
                         </div>
                       );
                    })}
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
            
            {/* Hidden File Input for Avatar Upload */}
            {isMentor && (
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default Header;
