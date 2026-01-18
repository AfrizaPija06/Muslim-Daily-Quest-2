
import React, { useState } from 'react';
import { User as UserIcon, ShieldCheck, Scroll, Eye, EyeOff, Clock } from 'lucide-react';
import BackgroundOrnament from './BackgroundOrnament';
import ThemeToggle from './ThemeToggle';
import { MENTORING_GROUPS, Role, AppTheme } from '../types';
import { ADMIN_CREDENTIALS } from '../constants';

interface RegisterPageProps {
  setView: (view: any) => void;
  setError: (error: string | null) => void;
  error: string | null;
  themeStyles: any;
  currentTheme: AppTheme;
  toggleTheme: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ setView, setError, error, themeStyles, currentTheme, toggleTheme }) => {
  const [formData, setFormData] = useState({ fullName: '', username: '', password: '', confirmPassword: '', group: MENTORING_GROUPS[0] });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password) { setError("Semua field wajib diisi."); return; }
    if (formData.password !== formData.confirmPassword) { setError("Password konfirmasi tidak cocok."); return; }
    
    const users = JSON.parse(localStorage.getItem('nur_quest_users') || '[]');
    if (users.some((u: any) => u.username === formData.username) || formData.username === ADMIN_CREDENTIALS.username) { setError("Username sudah digunakan."); return; }
    
    // Create new user with PENDING status
    const newUser = { ...formData, role: 'mentee' as Role, status: 'pending' };
    
    localStorage.setItem('nur_quest_users', JSON.stringify([...users, newUser]));
    setSuccess(true);
    setError(null);
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-500 ${themeStyles.bg}`}>
        <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
        <div className={`w-full max-w-md ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10 text-center`}>
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full border-2 ${currentTheme === 'legends' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-emerald-500 bg-emerald-500/10'}`}>
              <Clock className={`w-12 h-12 ${themeStyles.textAccent}`} />
            </div>
          </div>
          <h2 className={`text-2xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} mb-4`}>Pendaftaran Berhasil!</h2>
          <p className={`${themeStyles.textSecondary} mb-8`}>
            Akun Anda telah dibuat dan sedang menunggu persetujuan dari Mentor. Silakan cek secara berkala.
          </p>
          <button 
            onClick={() => { setView('login'); setSuccess(false); }}
            className={`w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider ${themeStyles.buttonPrimary}`}
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-500 ${themeStyles.bg}`}>
      <BackgroundOrnament colorClass={themeStyles.bgPatternColor} />
      <div className={`absolute top-4 right-4 z-20`}>
        <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} themeStyles={themeStyles} />
      </div>
      <div className={`w-full max-w-lg ${themeStyles.card} rounded-3xl p-8 ${themeStyles.glow} relative z-10`}>
        <div className="text-center mb-8">
          <div className={`inline-block p-4 rounded-2xl mb-4 border ${themeStyles.border} bg-white/5`}>
            {currentTheme === 'legends' ? <Scroll className={`w-10 h-10 ${themeStyles.textAccent}`} /> : <UserIcon className="w-10 h-10 text-yellow-500" />}
          </div>
          <h2 className={`text-3xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary} tracking-widest uppercase`}>
            {currentTheme === 'legends' ? 'Join The Ranks' : 'Registrasi Mentee'}
          </h2>
          <p className={`text-[10px] uppercase font-bold mt-1 tracking-widest ${themeStyles.textSecondary}`}>Bergabung dalam perjalanan spiritual</p>
        </div>
        
        {error && <div className="mb-6 p-3 bg-red-950/40 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-xs"><ShieldCheck className="w-4 h-4" />{error}</div>}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Nama Lengkap</label>
            <input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="Ahmad Al-Fatih" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Username</label>
            <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary}`} placeholder="mentee_01" />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${themeStyles.textSecondary}`}>Kelompok</label>
            <select value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})} className={`w-full rounded-xl py-3 px-4 outline-none ${themeStyles.fontDisplay} border ${themeStyles.inputBg} ${themeStyles.inputBorder} ${themeStyles.textPrimary} appearance-none`}>
              {MENTORING_GROUPS.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
            </select>
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
          <button className={`md:col-span-2 w-full ${themeStyles.fontDisplay} font-bold py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 uppercase tracking-wider ${themeStyles.buttonPrimary}`}>DAFTAR SEKARANG <ShieldCheck className="w-5 h-5" /></button>
        </form>
        <p className={`mt-8 text-center text-xs ${themeStyles.textSecondary}`}>Sudah punya akun? <button onClick={() => setView('login')} className={`font-bold hover:underline ${themeStyles.textAccent}`}>Login</button></p>
      </div>
    </div>
  );
};

export default RegisterPage;
