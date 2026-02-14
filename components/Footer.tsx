
import React from 'react';
import { Flame } from 'lucide-react';

interface FooterProps {
  themeStyles: any;
}

const Footer: React.FC<FooterProps> = ({ themeStyles }) => {
  return (
    <footer className={`text-center pt-8 border-t ${themeStyles.border} pb-12 opacity-50 hover:opacity-100 transition-opacity`}>
      <p className={`${themeStyles.textSecondary} italic text-sm mb-2`}>“Kemenangan sejati adalah istiqamah.”</p>
      <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest flex items-center justify-center gap-1">
        Powered by <Flame className="w-3 h-3 text-orange-500/50" /> Firebase
      </div>
    </footer>
  );
};

export default Footer;
