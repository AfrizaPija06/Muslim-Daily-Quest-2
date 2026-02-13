
import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Clock, Loader2, Moon, ArrowRight, ArrowLeft } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import AvatarSelection from './AvatarSelection';
import { User, AppTheme, Character } from '../types';
import { ADMIN_CREDENTIALS, GAME_LOGO_URL, AVAILABLE_CHARACTERS } from '../constants';
import { api } from '../services/ApiService';

interface RegisterPageProps {
  setView: (view: any) => void;
  setError: (error: string | null) => void;
  error: string | null;
  themeStyles: any;
  currentTheme: AppTheme;
  groups: string[];
}

const RegisterPage: React.FC<RegisterPageProps> = ({ setView, setError, error, themeStyles, currentTheme, groups }) => {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Character, Step 2: Form
  const [selectedChar, setSelectedChar] = useState<Character>(AVAILABLE_CHARACTERS[0]);
  
  // Default group is locked to the first one in the list (Mentoring Legends)
  const [formData, setFormData] = useState({ fullName: '', username: '', password: '', confirmPassword: '', group: groups[0] || 'Mentoring Legends #kelas7ikhwan' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password) { setError("Semua field wajib diisi."); return; }
    if (formData.password !== formData.confirmPassword) { setError("Password konfirmasi tidak cocok."); return; }
    
    setIsRegistering(true);

    try {
      const localUsers = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
      if (localUsers.some((u: any) => u.username === formData.username) || formData.username === ADMIN_CREDENTIALS.username) { 
        setError("Username sudah digunakan."); 
        setIsRegistering(false);
        return; 
      }

      const { confirmPassword, ...rest } = formData;
      const newUser: User = { 
        ...rest, 
        role: 'mentee', 
        status: 'active', // AUTO ACTIVE - NO APPROVAL NEEDED
        avatarSeed: selectedChar.imageUrl, 
        characterId: selectedChar.id 
      };

      // STRICTLY LOCAL REGISTRATION
      const result = await api.registerUserSafe(newUser);

      if (result.success) {
        setSuccess(true);
        setError(null);
      } else {
        setError(result.error || "Gagal mendaftar. Silakan coba lagi.");
      }

    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem. Coba lagi.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-500 ${themeStyles.bg}`}>
        <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
        <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10 text-center`}>
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full border-2 border-[#fbbf24] bg-[#fbbf24]/10`}>
              <Clock className={`w-12 h-12 text-[#fbbf24]`} />
            </div>
          </div>
          <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} mb-4`}>
            Registrasi Berhasil
          </h2>
          <p className={`${themeStyles.textSecondary} mb-8`}>
            Akun <strong>{selectedChar.name}</strong> berhasil dibuat. Anda sekarang bisa langsung login dan memulai quest.
          </p>
          <button 
            onClick={() => { setView('login'); setSuccess(false); }}
            className={`w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider ${themeStyles.buttonPrimary}`}
          >
            Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-500 ${themeStyles.bg}`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      
      {/* Container adapts width based on step */}
      <div className={`w-full ${step === 1 ? 'max-w-4xl' : 'max-w-lg'} ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10 transition-all duration-500`}>
        
        {/* Header Title */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} tracking-widest uppercase`}>
            {step === 1 ? 'Choose Your Role' : 'Identify Yourself'}
          </h2>
          <div className="flex justify-center gap-2 mt-2">
            <div className={`h-1 w-8 rounded-full ${step >= 1 ? 'bg-[#fbbf24]' : 'bg-white/10'}`} />
            <div className={`h-1 w-8 rounded-full ${step >= 2 ? 'bg-[#fbbf24]' : 'bg-white/10'}`} />
          </div>
        </div>
        
        {error && <div className="mb-6 p-3 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-xs"><ShieldCheck className="w-4 h-4" />{error}</div>}

        {/* STEP 1: CHARACTER SELECTION */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <AvatarSelection 
               selectedId={selectedChar.id} 
               onSelect={setSelectedChar} 
               themeStyles={themeStyles} 
             />
             <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setStep(2)}
                  className={`px-8 py-3 rounded-xl ${themeStyles.buttonPrimary} font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform`}
                >
                  Confirm {selectedChar.name} <ArrowRight className="w-5 h-5" />
                </button>
             </div>
             <p className={`mt-6 text-center text-xs ${themeStyles.textSecondary}`}>Sudah punya akun? <button onClick={() => setView('login')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Login</button></p>
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="md:col-span-2 flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 mb-2">
                <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-[#fbbf24]">
                   <img src={selectedChar.imageUrl} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedChar.name}`} />
                </div>
                <div>
                   <p className="text-[10px] uppercase opacity-50">Selected Role</p>
                   <p className="font-bold text-sm text-[#fbbf24]">{selectedChar.name}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs underline opacity-50 hover:opacity-100">Change</button>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Nama Lengkap</label>
              <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="Ahmad Al-Fatih" disabled={isRegistering} />
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Username</label>
              <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="mentee_01" disabled={isRegistering} />
            </div>
            
            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Kelompok</label>
              {/* READ ONLY GROUP - LOCKED */}
              <div className={`w-full rounded-xl py-3 px-4 ${themeStyles.fontDisplay} border ${themeStyles.inputBg} border-white/5 text-white/50 cursor-not-allowed text-sm`}>
                {formData.group}
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className={`w-full rounded-xl py-3 pl-4 pr-12 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} 
                  placeholder="••••••••" 
                  disabled={isRegistering}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textSecondary} hover:text-white transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Konfirmasi Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={formData.confirmPassword} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                  className={`w-full rounded-xl py-3 pl-4 pr-12 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} 
                  placeholder="••••••••" 
                  disabled={isRegistering}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textSecondary} hover:text-white transition-colors`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="md:col-span-2 flex gap-3 mt-4">
               <button 
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 py-4 rounded-xl border ${themeStyles.border} text-white/50 hover:bg-white/5 font-bold uppercase tracking-wider text-xs`}
                disabled={isRegistering}
              >
                <ArrowLeft className="w-4 h-4 mx-auto" />
              </button>
              <button 
                type="submit"
                disabled={isRegistering}
                className={`flex-[3] ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider ${themeStyles.buttonPrimary} ${isRegistering ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isRegistering ? (
                  <>Menyimpan Data... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>DAFTAR SEKARANG <ShieldCheck className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;