
import React from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { User, AppTheme } from '../types';
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
}

const Header: React.FC<HeaderProps> = ({ currentUser, setView, handleLogout, activeView, themeStyles, currentTheme, toggleTheme, performSync }) => {
  const isLegends = currentTheme === 'legends';

  return (
    <header className={`sticky top-0 z-50 px-4 py-4 md:px-8 backdrop-blur-md border-b transition-colors duration-500 ${isLegends ? 'bg-[#1a0505]/90 border-[#d4af37]/30' : 'bg-slate-950/80 border-emerald-500/20'}`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-full overflow-hidden ${themeStyles.border} border-2 ${themeStyles.glow}`}>
               <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.username}`} className="w-full h-full object-cover" alt="Avatar" />
            </div>
            <div className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter ${isLegends ? 'bg-[#d4af37] text-black' : 'bg-yellow-500 text-slate-900'}`}>
              {currentUser?.role === 'mentor' ? 'ADMIN' : 'LVL 12'}
            </div>
          </div>
          <div>
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
  );
};

export default Header;
