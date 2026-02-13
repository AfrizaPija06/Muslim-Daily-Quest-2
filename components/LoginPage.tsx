
import React, { useState } from 'react';
import { ArrowRight, ShieldAlert, Eye, EyeOff, Moon, Loader2 } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import { GAME_LOGO_URL, HIJRI_YEAR } from '../constants';
import { AppTheme } from '../types';
import { api } from '../services/ApiService';

interface LoginPageProps {
  setView: (view: any) => void;
  setCurrentUser: (user: any) => void;
  setData: (data: any) => void;
  setError: (error: string | null) => void;
  error: string | null;
  themeStyles: any;
  currentTheme: AppTheme;
}

const LoginPage: React.FC<LoginPageProps> = ({ setView, setCurrentUser, setData, setError, error, themeStyles, currentTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.login(username, password);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        // Simpan sesi dasar di LS agar tidak logout saat refresh, tapi data tetap dari DB
        localStorage.setItem('nur_quest_session', JSON.stringify(result.user));
        
        if (result.data) {
          setData(result.data);
        }
        
        setView('tracker');
      } else {
        setError(result.error || 'Login gagal.');
      }
    } catch (err) {
      setError('Gagal menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-1000 ${themeStyles.bg} overflow-hidden`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 animate-pulse-glow pointer-events-none bg-purple-500`} />

      <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10 animate-reveal border-t border-white/10 backdrop-blur-2xl`}>
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-6 relative group perspective-1000">
             <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse-glow bg-[#fbbf24]`}></div>
             <div className="animate-float relative z-10">
                {!logoError ? (
                  <img src={GAME_LOGO_URL} alt="Game Logo" className="w-56 h-56 object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform transition-transform duration-500 hover:scale-105" onError={() => setLogoError(true)} />
                ) : (
                  <div className={`w-32 h-32 rounded-3xl flex items-center justify-center border-4 shadow-2xl bg-[#1e1b4b] border-[#fbbf24] text-[#fbbf24]`}><Moon className="w-16 h-16" /></div>
                )}
             </div>
          </div>
          <h2 className={`text-4xl ${themeStyles.fontDisplay} font-black ${themeStyles.textPrimary} tracking-widest uppercase mb-2 drop-shadow-md`}>Ramadhan Quest</h2>
          <div className="flex items-center gap-3">
            <div className={`h-[1px] w-8 bg-[#fbbf24]`}></div>
            <p className={`text-[10px] uppercase font-bold tracking-[0.3em] ${themeStyles.textSecondary}`}>{HIJRI_YEAR} Special Event</p>
            <div className={`h-[1px] w-8 bg-[#fbbf24]`}></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-xs animate-in slide-in-from-top-2">
            <ShieldAlert className="w-5 h-5 shrink-0" /><span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2 group">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors ${themeStyles.textSecondary} group-focus-within:${themeStyles.textAccent}`}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className={`w-full rounded-xl py-4 px-4 outline-none ${themeStyles.fontDisplay} border transition-all duration-300 ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} focus:shadow-[0_0_20px_rgba(251,191,36,0.1)]`} placeholder="MENTOR_OR_MENTEE" disabled={isLoading} />
          </div>
          <div className="space-y-2 group">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors ${themeStyles.textSecondary} group-focus-within:${themeStyles.textAccent}`}>Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`w-full rounded-xl py-4 pl-4 pr-12 outline-none ${themeStyles.fontDisplay} border transition-all duration-300 ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} focus:shadow-[0_0_20px_rgba(251,191,36,0.1)]`} placeholder="••••••••" disabled={isLoading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textSecondary} hover:text-white transition-colors`}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
            </div>
          </div>
          <button disabled={isLoading} className={`w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg mt-8 flex items-center justify-center gap-2 ${themeStyles.buttonPrimary} uppercase tracking-wider transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Enter The Gates <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>
        <p className={`mt-8 text-center text-xs ${themeStyles.textSecondary} animate-reveal`} style={{ animationDelay: '0.8s' }}>Belum terdaftar? <button onClick={() => setView('register')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Buat akun</button></p>
      </div>
    </div>
  );
};

export default LoginPage;
