
import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Clock, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import AvatarSelection from './AvatarSelection';
import { User, AppTheme, Character } from '../types';
import { ADMIN_CREDENTIALS, AVAILABLE_CHARACTERS } from '../constants';
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
  
  const [formData, setFormData] = useState({ fullName: '', username: '', password: '', confirmPassword: '', group: groups[0] || 'Mentoring Legends #kelas7ikhwan' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password) { setError("Semua field wajib diisi."); return; }
    if (formData.password !== formData.confirmPassword) { setError("Password konfirmasi tidak cocok."); return; }
    
    setIsRegistering(true);
    setError(null);

    try {
      // NOTE: Kita menghapus blokir username admin agar Anda bisa mendaftarkan akun Admin secara resmi ke Firebase.
      
      const { confirmPassword, ...rest } = formData;
      const newUser: User = { 
        ...rest, 
        role: 'mentee', // Default mentee, tapi akan di-override di ApiService jika username == mentor_admin
        status: 'active', 
        avatarSeed: selectedChar.imageUrl, 
        characterId: selectedChar.id 
      };

      const result = await api.registerUserSafe(newUser);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Gagal mendaftar. Silakan coba lagi.");
      }

    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem.");
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
            Akun <strong>{selectedChar.name}</strong> berhasil dibuat. Anda sekarang bisa login.
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
    <div className={`min-h-screen flex items-center justify-center p-4 md:p-8 relative transition-colors duration-500 ${themeStyles.bg} overflow-x-hidden`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      
      {/* Container adapts width based on step. WIDER on Desktop for Step 1 */}
      <div className={`w-full ${step === 1 ? 'max-w-7xl' : 'max-w-xl'} ${themeStyles.card} rounded-3xl p-6 md:p-10 ${themeStyles.glow} relative z-10 transition-all duration-500`}>
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <h2 className={`text-3xl md:text-4xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} tracking-widest uppercase`}>
            {step === 1 ? 'Choose Your Destiny' : 'Identity Verification'}
          </h2>
          <div className="flex justify-center gap-2 mt-4">
            <div className={`h-1.5 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-[#fbbf24]' : 'bg-white/10'}`} />
            <div className={`h-1.5 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-[#fbbf24]' : 'bg-white/10'}`} />
          </div>
        </div>
        
        {error && <div className="mb-6 p-4 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-sm"><ShieldCheck className="w-5 h-5 shrink-0" />{error}</div>}

        {/* STEP 1: CHARACTER SELECTION */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center">
             <AvatarSelection 
               selectedId={selectedChar.id} 
               onSelect={setSelectedChar} 
               themeStyles={themeStyles} 
             />
             <div className="mt-12 flex flex-col md:flex-row items-center justify-center w-full gap-4">
                <p className={`text-sm ${themeStyles.textSecondary}`}>Character: <span className="font-bold text-white uppercase">{selectedChar.name}</span></p>
                <button 
                  onClick={() => setStep(2)}
                  className={`w-full md:w-auto px-16 py-5 rounded-xl ${themeStyles.buttonPrimary} font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl`}
                >
                  Select Hero <ArrowRight className="w-6 h-6" />
                </button>
             </div>
             <p className={`mt-6 text-center text-sm ${themeStyles.textSecondary}`}>Sudah punya akun? <button onClick={() => setView('login')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Login</button></p>
          </div>
        )}

        {/* STEP 2: FORM */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="grid grid-cols-1 gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 mb-2">
                <div className="w-20 h-20 rounded-xl bg-black overflow-hidden border border-[#fbbf24] shadow-lg shrink-0">
                   <img src={selectedChar.imageUrl} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedChar.name}`} />
                </div>
                <div>
                   <p className="text-[10px] uppercase opacity-50 tracking-widest">Selected Role</p>
                   <p className="font-bold text-xl text-[#fbbf24]">{selectedChar.name}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="ml-auto px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold uppercase transition-colors">Change</button>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Nama Lengkap</label>
              <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="Contoh: Ahmad Al-Fatih" disabled={isRegistering} />
            </div>
            
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Username (Untuk Login)</label>
              <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="contoh: mentee01" disabled={isRegistering} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className={`w-full rounded-xl py-3 pl-4 pr-12 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} 
                    placeholder="••••••••" 
                    disabled={isRegistering}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textSecondary} hover:text-white transition-colors`}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Konfirmasi</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={formData.confirmPassword} 
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                    className={`w-full rounded-xl py-3 pl-4 pr-12 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} 
                    placeholder="••••••••" 
                    disabled={isRegistering}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textSecondary} hover:text-white transition-colors`}>
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
               <button 
                type="button"
                onClick={() => setStep(1)}
                className={`w-16 flex items-center justify-center rounded-xl border ${themeStyles.border} text-white/50 hover:bg-white/5 transition-colors`}
                disabled={isRegistering}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button 
                type="submit"
                disabled={isRegistering}
                className={`flex-1 ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider ${themeStyles.buttonPrimary} ${isRegistering ? 'opacity-70 cursor-wait' : ''}`}
              >
                {isRegistering ? (
                  <>Menyimpan... <Loader2 className="w-5 h-5 animate-spin" /></>
                ) : (
                  <>Buat Akun <ShieldCheck className="w-5 h-5" /></>
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
