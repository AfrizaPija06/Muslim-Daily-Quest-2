
import React from 'react';
import { Target, CheckCircle2, Circle, Moon, Sun, BookOpen, UtensilsCrossed } from 'lucide-react';
import { DayData, PRAYER_KEYS } from '../types';
import { TARGET_TILAWAH_DAILY } from '../constants';

interface DailyTargetPanelProps {
  dayData: DayData | undefined;
  themeStyles: any;
  dayIndex: number;
}

const DailyTargetPanel: React.FC<DailyTargetPanelProps> = ({ dayData, themeStyles, dayIndex }) => {
  if (!dayData) return null;

  const targets = [
    { 
      id: 'subuh', 
      label: 'Subuh Berjamaah', 
      icon: <Sun className="w-4 h-4 text-blue-400" />,
      done: dayData.prayers.subuh === 2,
      subtext: 'Wajib di Masjid'
    },
    { 
      id: 'zuhur', 
      label: 'Zuhur Berjamaah', 
      icon: <Sun className="w-4 h-4 text-yellow-400" />,
      done: dayData.prayers.zuhur === 2,
      subtext: 'Wajib di Masjid'
    },
    { 
      id: 'asar', 
      label: 'Asar Berjamaah', 
      icon: <Sun className="w-4 h-4 text-orange-400" />,
      done: dayData.prayers.asar === 2,
      subtext: 'Wajib di Masjid'
    },
    { 
      id: 'magrib', 
      label: 'Magrib Berjamaah', 
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      done: dayData.prayers.magrib === 2,
      subtext: 'Wajib di Masjid'
    },
    { 
      id: 'isya', 
      label: 'Isya Berjamaah', 
      icon: <Moon className="w-4 h-4 text-purple-400" />,
      done: dayData.prayers.isya === 2,
      subtext: 'Wajib di Masjid'
    },
    {
      id: 'shaum',
      label: 'Puasa Ramadhan',
      icon: <UtensilsCrossed className="w-4 h-4 text-amber-500" />,
      done: dayData.shaum === true,
      subtext: 'Menahan diri'
    },
    {
      id: 'tarawih',
      label: 'Sholat Tarawih',
      icon: <Moon className="w-4 h-4 text-emerald-400" />,
      done: dayData.tarawih === true,
      subtext: 'Qiyamul Lail'
    },
    {
      id: 'tilawah',
      label: `Tilawah ${TARGET_TILAWAH_DAILY} Baris`,
      icon: <BookOpen className="w-4 h-4 text-cyan-400" />,
      done: dayData.tilawah >= TARGET_TILAWAH_DAILY,
      subtext: `${dayData.tilawah}/${TARGET_TILAWAH_DAILY} Baris`
    }
  ];

  const completedCount = targets.filter(t => t.done).length;
  const progress = (completedCount / targets.length) * 100;

  return (
    <div className={`h-full ${themeStyles.card} rounded-3xl p-6 border-2 border-[#fbbf24]/20 flex flex-col gap-4 overflow-hidden`}>
      <div className="flex items-center gap-3 border-b border-[#fbbf24]/20 pb-4">
        <div className="p-2 bg-[#fbbf24]/10 rounded-lg">
          <Target className="w-6 h-6 text-[#fbbf24]" />
        </div>
        <div>
          <h3 className={`text-lg ${themeStyles.fontDisplay} font-bold text-[#fefce8] uppercase tracking-wider`}>Misi Harian</h3>
          <p className="text-[10px] text-[#fbbf24] uppercase tracking-widest">Hari ke-{dayIndex + 1} Ramadhan</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full bg-black/50 border border-white/10 overflow-hidden relative">
         <div 
           className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 transition-all duration-500" 
           style={{ width: `${progress}%` }}
         ></div>
      </div>
      <p className="text-right text-[10px] opacity-70 font-mono">{completedCount}/{targets.length} Selesai</p>

      <div className="flex-grow overflow-y-auto no-scrollbar space-y-2 pr-2">
         {targets.map((target) => (
            <div 
              key={target.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${target.done ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/5 border-red-500/10'}`}
            >
               <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${target.done ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                     {target.icon}
                  </div>
                  <div>
                     <p className={`text-xs font-bold ${target.done ? 'text-emerald-100' : 'text-slate-300'}`}>{target.label}</p>
                     <p className="text-[9px] opacity-50">{target.subtext}</p>
                  </div>
               </div>
               <div>
                  {target.done ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-red-900/50" />}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default DailyTargetPanel;