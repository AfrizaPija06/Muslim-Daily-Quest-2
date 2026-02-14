
import React from 'react';

interface FooterProps {
  themeStyles: any;
}

const Footer: React.FC<FooterProps> = ({ themeStyles }) => {
  // Debugging: Get Project Ref from URL (e.g., 'ebjhbldaslrrsmiecvzc' from 'https://ebjhbldaslrrsmiecvzc.supabase.co')
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const projectRef = supabaseUrl.split('.')[0]?.replace('https://', '') || 'Unknown';

  return (
    <footer className={`text-center pt-8 border-t ${themeStyles.border} pb-12 opacity-50 hover:opacity-100 transition-opacity`}>
      <p className={`${themeStyles.textSecondary} italic text-sm mb-2`}>“Kemenangan sejati adalah istiqamah.”</p>
      <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
        Server Node: {projectRef.substring(0, 8)}...
      </div>
    </footer>
  );
};

export default Footer;
