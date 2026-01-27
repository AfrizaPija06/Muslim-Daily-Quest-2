
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
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    avatarSeed: ''
  });

  // NEW: Temporary Avatar Preview to prevent flickering/disappearing on sync
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);

  // Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Calculate Season Points
  const seasonPoints = totalPoints * 4;
  const currentRank = getRankInfo(seasonPoints);

  const openProfileModal = () => {
    if (currentUser) {
      // Reset temp avatar when opening modal
      setTempAvatar(null);
      
      setEditForm({
        fullName: currentUser.fullName,
        username: currentUser.username,
        // Default avatar seed is the asset key stored in user profile, or fallback to username
        avatarSeed: currentUser.avatarSeed || (isMentor ? `user_${currentUser.username}` : currentUser.username)
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

  // --- MENTOR ONLY: UPLOAD PERSONAL PROFILE PICTURE ---
  const handleMentorProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Resize logic to save DB space
        const img = new Image();
        img.src = base64String;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; // Profile pic size limit
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
             if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
             if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          
          // 1. SET LOCAL PREVIEW IMMEDIATELY (Fixes the "disappearing" issue)
          setTempAvatar(compressedBase64);

          // 2. Upload to Server
          const assetKey = `user_${currentUser.username}`;
          const success = await api.uploadGlobalAsset(assetKey, compressedBase64);
          
          if (success) {
            setEditForm(prev => ({ ...prev, avatarSeed: assetKey }));
            // Update global store for app-wide consistency
            if (refreshAssets && globalAssets) refreshAssets({ ...globalAssets, [assetKey]: compressedBase64 });
          } else {
            alert("Upload failed. Check connection.");
            setTempAvatar(null); // Revert preview on failure
          }
          setIsUploading(false);
        };
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- GET AVAILABLE PRESETS FOR MENTEE ---
  // Filter assets that start with 'preset_'
  const availablePresets = globalAssets 
    ? Object.keys(globalAssets).filter(k => k.startsWith('preset_')) 
    : [];

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
                   src={getAvatarSrc(currentUser?.avatarSeed || currentUser?.username, globalAssets)} 
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
              {/* CURRENT AVATAR PREVIEW */}
              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                 <div className={`w-20 h-20 rounded-full overflow-hidden border-4 bg-black/50 relative group ${isLegends ? 'border-[#d4af37]' : 'border-emerald-500'}`}>
                    <img 
                      // PRIORITIZE TEMP AVATAR (Immediate Local Preview)
                      src={tempAvatar || getAvatarSrc(editForm.avatarSeed, globalAssets)} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* MENTOR ONLY: Camera Overlay */}
                    {isMentor && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                      >
                         {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white mb-1" />}
                         <span className="text-[8px] text-white uppercase font-bold">{isUploading ? 'Wait' : 'Upload'}</span>
                      </div>
                    )}
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

              {/* MENTEE ONLY: PRESET SELECTION GRID */}
              {!isMentor && (
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>Select Avatar Class</label>
                   </div>
                   
                   {availablePresets.length > 0 ? (
                     <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {availablePresets.map((presetKey) => {
                           const isSelected = editForm.avatarSeed === presetKey;
                           // Fetch from global assets
                           const imgSrc = globalAssets ? globalAssets[presetKey] : '';
                           
                           return (
                             <div 
                               key={presetKey}
                               onClick={() => setEditForm(prev => ({ ...prev, avatarSeed: presetKey }))}
                               className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group cursor-pointer
                                 ${isSelected 
                                   ? (isLegends ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 scale-105' : 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105') 
                                   : 'border-white/10 hover:border-white/30 hover:scale-105 opacity-80 hover:opacity-100'
                                 }`}
                             >
                               <img src={imgSrc} alt="Preset" className="w-full h-full object-cover" />
                               {isSelected && (
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] z-20">
                                   <Check className="w-8 h-8 text-white drop-shadow-md" />
                                 </div>
                               )}
                             </div>
                           );
                        })}
                     </div>
                   ) : (
                     <div className="p-6 border border-dashed border-white/20 rounded-xl text-center bg-white/5">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-white/30" />
                        <p className="text-[10px] text-white/50 font-bold uppercase">No Avatars Available</p>
                        <p className="text-[9px] text-white/30">Please ask your Mentor to upload presets in Dashboard.</p>
                     </div>
                   )}
                </div>
              )}

              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>Full Name</label>
                <input 
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>Username</label>
                <input 
                  value={editForm.username}
                  disabled={true} 
                  className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border bg-black/20 border-white/5 text-white/50 cursor-not-allowed`}
                />
                 <p className="text-[10px] text-white/30 italic">* Username cannot be changed.</p>
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
            
            {/* Hidden File Input for Mentor Personal Upload */}
            {isMentor && (
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleMentorProfileUpload}
              />
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default Header;
