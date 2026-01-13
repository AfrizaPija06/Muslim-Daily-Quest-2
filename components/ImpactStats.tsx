
import React from 'react';

const ImpactStats: React.FC = () => {
  const stats = [
    { label: 'COMMUNITIES SERVED', value: '150+' },
    { label: 'CSR CAPITAL MANAGED', value: '$45M+' },
    { label: 'SUCCESSFUL PROGRAMS', value: '420' },
    { label: 'GOVERNMENT PARTNERS', value: '12' },
  ];

  return (
    <section id="impact" className="relative -mt-20 z-20 max-w-6xl mx-auto px-6">
      <div className="bg-white shadow-2xl rounded-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border-b-4 border-[#6B0F1A]">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-8 md:p-12 text-center group transition-colors duration-300 hover:bg-[#FDFBF7]">
            <div className="text-3xl md:text-4xl font-serif font-bold text-[#1A0407] mb-2 group-hover:text-[#6B0F1A] transition-colors">
              {stat.value}
            </div>
            <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-slate-500 uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ImpactStats;
