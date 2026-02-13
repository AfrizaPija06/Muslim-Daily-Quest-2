
import React from 'react';
import { Scroll, User, LayoutDashboard, Moon } from 'lucide-react';
import { AppTheme } from '../types';

interface GameDockProps {
  activeView: string;
  setView: (view: any) => void;
  themeStyles: any;
  currentTheme: AppTheme;
  role: string;
}

const GameDock: React.FC<GameDockProps> = ({ activeView, setView, themeStyles, currentTheme, role }) => {
  const navItems = [
    { id: 'tracker', label: 'Quests', icon: <Moon className="w-5 h-5" /> },
    ...(role === 'mentor' ? [{ id: 'leaderboard', label: 'Admin', icon: <LayoutDashboard className="w-5 h-5" /> }] : []),
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
      <div className={`flex items-center justify-around px-2 py-2 rounded-2xl border shadow-2xl glass-panel border-[#fbbf24]/30 bg-[#0f0518]/80 backdrop-blur-xl`}>
         {navItems.map((item) => {
           const isActive = activeView === item.id;
           return (
             <button
               key={item.id}
               onClick={() => setView(item.id)}
               className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 w-full ${isActive ? 'scale-110 -translate-y-2' : 'opacity-60 hover:opacity-100'}`}
             >
               <div className={`absolute inset-0 rounded-xl blur-md opacity-0 transition-opacity ${isActive ? 'opacity-40' : ''} bg-[#fbbf24]`}></div>
               
               <div className={`relative z-10 p-2 rounded-lg ${isActive ? 'bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] border border-[#fbbf24] text-[#fbbf24]' : 'text-[#c4b5fd]'}`}>
                 {item.icon}
               </div>
               
               {isActive && (
                 <span className={`absolute -bottom-4 text-[9px] font-black uppercase tracking-widest text-[#fbbf24]`}>
                   {item.label}
                 </span>
               )}
             </button>
           );
         })}
      </div>
    </div>
  );
};

export default GameDock;