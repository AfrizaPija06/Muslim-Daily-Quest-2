
import React, { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  themeStyles: any;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon, themeStyles }) => (
  <div className={`${themeStyles.card} rounded-2xl p-5 space-y-2`}>
    <div className="flex justify-between items-center">
      <p className={`text-[10px] font-bold uppercase ${themeStyles.textSecondary}`}>{label}</p>
      {icon}
    </div>
    <p className={`text-xl ${themeStyles.fontDisplay} font-bold ${themeStyles.textPrimary}`}>{value}</p>
  </div>
);

export default SummaryCard;
