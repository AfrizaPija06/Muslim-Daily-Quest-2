import React, { useState } from 'react';
import { ArrowRight, ShieldAlert, Eye, EyeOff, Moon, Loader2, Sparkles } from 'lucide-react';
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

const LoginPage: React.FC<LoginPageProps> = ({ setView, setCurrentUser, setData, setError, error, themeStyles }) => {
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
        // Persist minimal session
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
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 animate-pulse-glow pointer-events-none bg-purple-500`} />

      {/* MAIN CARD LAYOUT (Responsive) */}
      <div className={`w-full max-w-md md:max-w-4xl ${themeStyles.card} rounded-3xl overflow-hidden ${themeStyles.glow} relative z-10 animate-reveal border-t border-white/10 backdrop-blur-2xl flex flex-col md:flex-row shadow-2xl`}>
        
        {/* LEFT SIDE: Visuals (Hidden on mobile, Visible on Desktop) */}
        <div className="hidden md:flex md:w-1/2 bg-[#0f0518]/50 relative flex-col items-center justify-center p-12 border-r border-white/5">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent opacity-50"></div>
           
           <div className="relative z-10 text-center">
              <div className="mb-8 relative group perspective-1000 inline-block">
                 <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse-glow bg-[#fbbf24]`}></div>
                 <div className="animate-float relative z-10">
                    {!logoError ? (
                      <img src={GAME_LOGO_URL} alt="Game Logo" className="w-64 h-64 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)]" onError={() => setLogoError(true)} />
                    ) : (
                      <div className={`w-40 h-40 rounded-3xl flex items-center justify-center border-4 shadow-2xl bg-[#1e1b4b] border-[#fbbf24] text-[#fbbf24] mx-auto`}><Moon className="w-20 h-20" /></div>
                    )}
                 </div>
              </div>
              <h1 className={`text-3xl ${themeStyles.fontDisplay} font-black text-white uppercase tracking-widest mb-2`}>Ramadhan Quest</h1>
              <p className="text-purple-200/60 text-sm font-mono tracking-widest uppercase">Level Up Your Ibadah</p>
           </div>

           <div className="mt-12 flex gap-4 text-[10px] text-white/30 font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Gamified</div>
              <div className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Realtime</div>
              <div className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Secure</div>
           </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-black/40">
            
            {/* Mobile Logo Only - ENLARGED */}
            <div className="md:hidden text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 relative animate-float">
                <img 
                  src={GAME_LOGO_URL} 
                  className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(251,191,36,0.4)]" 
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                />
              </div>
              <h2 className={`text-3xl ${themeStyles.fontDisplay} font-black ${themeStyles.textPrimary} tracking-widest uppercase mb-2 drop-shadow-lg`}>LOGIN</h2>
            </div>

            <div className="hidden md:block mb-8">
               <h2 className={`text-3xl ${themeStyles.fontDisplay} font-black ${themeStyles.textPrimary} tracking-widest uppercase mb-2`}>Are You Ready?</h2>
               <div className="flex items-center gap-3">
                  <div className={`h-[1px] w-8 bg-[#fbbf24]`}></div>
                  <p className={`text-[10px] uppercase font-bold tracking-[0.3em] ${themeStyles.textSecondary}`}>{HIJRI_YEAR} Season</p>
               </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-xs animate-in slide-in-from-top-2">
                <ShieldAlert className="w-5 h-5 shrink-0" /><span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 group">
                <label className={`text-xs font-bold uppercase tracking-widest ml-1 transition-colors ${themeStyles.textSecondary} group-focus-within:${themeStyles.textAccent}`}>Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} className={`w-full rounded-xl py-4 px-4 outline-none ${themeStyles.fontDisplay} border transition-all duration-300 ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} focus:shadow-[0_0_20px_rgba(251,191,36,0.1)]`} placeholder="Enter username" disabled={isLoading} />
              </div>
              <div className="space-y-2 group">
                <label className={`text-xs font-bold uppercase tracking-widest ml-1 transition-colors ${themeStyles.textSecondary} group-focus-within:${themeStyles.textAccent}`}>Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`w-full rounded-xl py-4 pl-4 pr-12 outline-none ${themeStyles.fontDisplay} border transition-all duration-300 ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} focus:shadow-[0_0_20px_rgba(251,191,36,0.1)]`} placeholder="••••••••" disabled={isLoading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textSecondary} hover:text-white transition-colors`}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>
              
              <button disabled={isLoading} className={`w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 ${themeStyles.buttonPrimary} uppercase tracking-wider transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start Quest <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
            <p className={`mt-8 text-center text-xs ${themeStyles.textSecondary}`}>Belum punya akun? <button onClick={() => setView('register')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Daftar di sini</button></p>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-[10px] text-white/20 font-mono z-10">v9.0.0 • Firebase Edition</div>
    </div>
  );
};

export default LoginPage;
