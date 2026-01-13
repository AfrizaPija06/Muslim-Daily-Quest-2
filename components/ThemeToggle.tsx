
import React from 'react';
import { Palette } from 'lucide-react';
import { AppTheme } from '../types';

interface ThemeToggleProps {
  currentTheme: AppTheme;
  toggleTheme: () => void;
  themeStyles: any;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ toggleTheme, themeStyles }) => (
  <button 
    onClick={toggleTheme} 
    className={`p-3 rounded-xl border flex items-center justify-center transition-all group relative ${themeStyles.border} ${themeStyles.inputBg}`}
    title="Switch Theme"
  >
    <Palette className={`w-5 h-5 ${themeStyles.textAccent}`} />
    <span className="sr-only">Toggle Theme</span>
  </button>
);

export default ThemeToggle;
