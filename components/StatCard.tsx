
import React, { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  themeStyles: any;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, themeStyles }) => (
  <div className={`${themeStyles.card} rounded-2xl p-5 flex items-center justify-between`}>
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${themeStyles.textSecondary}`}>{label}</p>
      <p className={`text-2xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary}`}>{value}</p>
    </div>
    {icon}
  </div>
);

export default StatCard;
