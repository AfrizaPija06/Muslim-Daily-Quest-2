
import React, { useMemo } from 'react';
import { POINTS, TOTAL_RAMADHAN_DAYS } from '../types';

interface AdminChartsProps {
  menteesData: any[];
  themeStyles: any;
}

const AdminCharts: React.FC<AdminChartsProps> = ({ menteesData, themeStyles }) => {
  
  // 1. Calculate Aggregated Data per Day
  const chartData = useMemo(() => {
    const dailyStats = Array.from({ length: TOTAL_RAMADHAN_DAYS }, (_, i) => ({
      day: i + 1,
      totalPrayerPoints: 0,
      totalTilawahLines: 0,
      activeUsersCount: 0
    }));

    if (menteesData.length === 0) return dailyStats;

    menteesData.forEach(user => {
      if (user.trackerData && user.trackerData.days) {
        user.trackerData.days.forEach((day: any, idx: number) => {
          if (idx < TOTAL_RAMADHAN_DAYS) {
            // Prayer Points Calculation
            const pPoints = Object.values(day.prayers as Record<string, number>).reduce((acc: number, val: number) => {
              if (val === 2) return acc + POINTS.MOSQUE; // Masjid
              if (val === 1) return acc + POINTS.HOME;   // Rumah
              return acc;
            }, 0);

            dailyStats[idx].totalPrayerPoints += pPoints;
            dailyStats[idx].totalTilawahLines += day.tilawah || 0;
            
            // Check activity to average correctly (optional, simplifikasi bagi rata semua user)
            dailyStats[idx].activeUsersCount++;
          }
        });
      }
    });

    return dailyStats;
  }, [menteesData]);

  // Max values for scaling charts
  const maxPrayerScore = menteesData.length * (5 * POINTS.MOSQUE); // Jika semua user full masjid
  const maxTilawah = Math.max(...chartData.map(d => d.totalTilawahLines), 10); // Dynamic max

  // --- SVG HELPER FUNCTIONS ---
  const getX = (index: number) => (index / (TOTAL_RAMADHAN_DAYS - 1)) * 100;
  
  // Chart 1: Prayer (Line Chart)
  const prayerPointsString = chartData.map((d, i) => {
    const x = getX(i);
    const y = 100 - ((d.totalPrayerPoints / (maxPrayerScore || 1)) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-reveal">
      
      {/* CHART 1: GRAFIK SHOLAT (Line Chart) */}
      <div className={`${themeStyles.card} rounded-3xl p-6 border border-[#fbbf24]/20`}>
        <div className="mb-4">
          <h3 className={`text-lg ${themeStyles.fontDisplay} font-bold text-[#fefce8] uppercase tracking-wider`}>
            Tren Sholat Berjamaah
          </h3>
          <p className="text-[10px] text-[#fbbf24] uppercase tracking-widest">Akumulasi Poin Group per Hari</p>
        </div>

        <div className="relative h-48 w-full">
           {/* Grid Lines */}
           <div className="absolute inset-0 flex flex-col justify-between text-[8px] text-white/20 font-mono">
              <span>100% (Perfect)</span>
              <span>50%</span>
              <span>0%</span>
           </div>
           
           <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Area Under Curve */}
              <defs>
                <linearGradient id="prayerGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d={`M0,100 ${prayerPointsString.split(' ').map(p => `L${p}`).join(' ')} L100,100 Z`} 
                fill="url(#prayerGradient)" 
              />
              {/* The Line */}
              <polyline 
                points={prayerPointsString}
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Dots */}
              {chartData.map((d, i) => (
                <circle 
                  key={i}
                  cx={getX(i)}
                  cy={100 - ((d.totalPrayerPoints / (maxPrayerScore || 1)) * 100)}
                  r="1.5"
                  className="fill-[#fbbf24] hover:r-4 transition-all"
                  vectorEffect="non-scaling-stroke"
                >
                  <title>Hari {d.day}: {d.totalPrayerPoints} Poin</title>
                </circle>
              ))}
           </svg>
        </div>
        <div className="flex justify-between mt-2 text-[8px] text-white/30 font-mono uppercase">
           <span>Day 1</span>
           <span>Ramadhan Timeline (30 Days)</span>
           <span>Day 30</span>
        </div>
      </div>

      {/* CHART 2: GRAFIK TILAWAH (Bar Chart) */}
      <div className={`${themeStyles.card} rounded-3xl p-6 border border-cyan-400/20`}>
        <div className="mb-4">
          <h3 className={`text-lg ${themeStyles.fontDisplay} font-bold text-[#fefce8] uppercase tracking-wider`}>
            Total Tilawah Group
          </h3>
          <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Jumlah Baris/Halaman per Hari</p>
        </div>

        <div className="relative h-48 w-full flex items-end gap-1">
           {chartData.map((d, i) => {
             const heightPercent = (d.totalTilawahLines / (maxTilawah || 1)) * 100;
             return (
               <div key={i} className="flex-1 flex flex-col justify-end group h-full relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    H{d.day}: {d.totalTilawahLines} Baris
                  </div>
                  {/* Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }} 
                    className={`w-full bg-cyan-500/50 border-t border-cyan-400 rounded-t-sm transition-all duration-500 hover:bg-cyan-400`}
                  ></div>
               </div>
             );
           })}
        </div>
        <div className="flex justify-between mt-2 text-[8px] text-white/30 font-mono uppercase">
           <span>Day 1</span>
           <span>Total Readings</span>
           <span>Day 30</span>
        </div>
      </div>

    </div>
  );
};

export default AdminCharts;
