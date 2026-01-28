
import React, { useState } from 'react';
import { ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import ThemeToggle from './ThemeToggle';
import { ADMIN_CREDENTIALS } from '../constants';
import { AppTheme } from '../types';

interface LoginPageProps {
  setView: (view: any) => void;
  setCurrentUser: (user: any) => void;
  setData: (data: any) => void;
  setError: (error: string | null) => void;
  error: string | null;
  themeStyles: any;
  currentTheme: AppTheme;
  toggleTheme: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setView, setCurrentUser, setData, setError, error, themeStyles, toggleTheme, currentTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setCurrentUser(ADMIN_CREDENTIALS);
      localStorage.setItem('nur_quest_session', JSON.stringify(ADMIN_CREDENTIALS));
      setView('tracker');
      setError(null);
      return;
    }
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    const user = users.find((u: any) => u.username === username && u.password === password);
    
    if (user) {
      const status = user.status || 'active';

      if (status === 'pending') {
        setError('Akun Anda masih menunggu persetujuan Mentor.');
        return;
      }

      if (status === 'rejected') {
        setError('Maaf, pendaftaran Anda ditolak.');
        return;
      }

      setCurrentUser(user);
      localStorage.setItem('nur_quest_session', JSON.stringify(user));
      const savedData = localStorage.getItem(`ibadah_tracker_${user.username}`);
      if (savedData) setData(JSON.parse(savedData));
      setView('tracker');
      setError(null);
    } else {
      setError('Username atau Password salah.');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-500 ${themeStyles.bg}`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <div className={`absolute top-4 right-4 z-20`}>
        <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} themeStyles={themeStyles} />
      </div>
      <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10`}>
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Main Logo Image */}
          <div className="mb-4 relative group">
             <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${currentTheme === 'legends' ? 'bg-[#d4af37]' : 'bg-emerald-500'}`}></div>
             <img 
               src="/logo.png" 
               alt="Game Logo" 
               className="w-24 h-24 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
             />
          </div>
          
          <h2 className={`text-3xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} tracking-widest uppercase`}>
            {currentTheme === 'legends' ? 'Mentoring Legends' : 'Leveling Mentoring'}
          </h2>
          <p className={`text-[10px] uppercase font-bold mt-1 tracking-widest ${themeStyles.textSecondary}`}>
            {currentTheme === 'legends' ? 'Season 2 Final Rank Announcement' : 'Daily Quest Rohis SMPN 1 Bojonggede'}
          </p>
        </div>
        {error && <div className="mb-6 p-3 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-xs"><ShieldAlert className="w-4 h-4" />{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className={`w-full rounded-xl py-4 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="MENTOR_OR_MENTEE" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className={`w-full rounded-xl py-4 pl-4 pr-12 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} 
                placeholder="••••••••" 
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
          <button className={`w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg mt-6 flex items-center justify-center gap-2 ${themeStyles.buttonPrimary} uppercase tracking-wider`}>LOGIN <ArrowRight className="w-5 h-5" /></button>
        </form>
        <p className={`mt-8 text-center text-xs ${themeStyles.textSecondary}`}>Belum terdaftar? <button onClick={() => setView('register')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Daftar Mentee</button></p>
      </div>
    </div>
  );
};

export default LoginPage;
