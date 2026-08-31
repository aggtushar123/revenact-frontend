import React from 'react';

interface Metric {
  label: string;
  fill: number; // 0 to 100
  color: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  score: string;
  isMain?: boolean;
}

interface HealthPopoverProps {
  val: number;
  style: React.CSSProperties;
}

export function HealthPopover({ val, style }: HealthPopoverProps) {
  // Generate dummy metrics based on the main value to make the popover look realistic
  const isGood = val >= 7;
  const isAvg = val >= 4 && val < 7;
  
  const mainColor = isGood ? '#00a699' : (isAvg ? '#ffbb00' : '#fa5c5c');
  const mainBg = isGood ? '#e6f6f5' : (isAvg ? '#fff8e6' : '#ffebeb');
  const mainBadge = isGood ? 'Good' : (isAvg ? 'Average' : 'Poor');

  const metrics: Metric[] = [
    {
      label: 'Overall health score',
      fill: (val / 10) * 100,
      color: mainColor,
      badge: mainBadge,
      badgeColor: mainColor,
      badgeBg: mainBg,
      score: `${val}/10`,
      isMain: true
    },
    {
      label: 'Aggregate Adoption Score',
      fill: isGood ? 53 : 20,
      color: '#ffbb00',
      badge: 'Average',
      badgeColor: '#ffbb00',
      badgeBg: '#fff8e6',
      score: isGood ? '0.8/1.5' : '0.3/1.5'
    },
    {
      label: 'AI Pulse Configuration',
      fill: isGood ? 100 : 50,
      color: isGood ? '#00a699' : '#ffbb00',
      badge: isGood ? 'Good' : 'Average',
      badgeColor: isGood ? '#00a699' : '#ffbb00',
      badgeBg: isGood ? '#e6f6f5' : '#fff8e6',
      score: isGood ? '2.0/2.0' : '1.0/2.0'
    },
    {
      label: 'Customer Touch',
      fill: isGood ? 100 : 25,
      color: isGood ? '#00a699' : '#fa5c5c',
      badge: isGood ? 'Good' : 'Poor',
      badgeColor: isGood ? '#00a699' : '#fa5c5c',
      badgeBg: isGood ? '#e6f6f5' : '#ffebeb',
      score: isGood ? '4.0/4.0' : '1.0/4.0'
    },
    {
      label: 'Licence Utilization',
      fill: val > 8 ? 100 : 50,
      color: val > 8 ? '#00a699' : '#ffbb00',
      badge: val > 8 ? 'Good' : 'Average',
      badgeColor: val > 8 ? '#00a699' : '#ffbb00',
      badgeBg: val > 8 ? '#e6f6f5' : '#fff8e6',
      score: val > 8 ? '2.0/2.0' : '1.0/2.0'
    },
    {
      label: 'Support Tickets Volume',
      fill: isGood ? 100 : 100,
      color: '#00a699',
      badge: 'Good',
      badgeColor: '#00a699',
      badgeBg: '#e6f6f5',
      score: '0.5/0.5'
    }
  ];

  return (
    <div 
      style={style} 
      className="fixed z-[100] w-[360px] bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] border border-gray-100 p-5 text-[12px] text-gray-700 pointer-events-none transition-opacity duration-200"
    >
       {/* Tooltip Arrow pointing down */}
       <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-b border-r border-gray-100 transform rotate-45"></div>

       <div className="flex flex-col gap-3.5 relative z-10 bg-white">
          {metrics.map((m, i) => (
            <div key={i} className={`flex items-center justify-between ${m.isMain ? 'mb-1 font-bold text-gray-800' : 'font-medium'}`}>
               <div className="w-[140px] truncate pr-2">{m.label}</div>
               <div className="flex-1 h-[6px] bg-gray-100 rounded-full overflow-hidden flex mx-2">
                  <div className="h-full rounded-full" style={{ width: `${m.fill}%`, backgroundColor: m.color }}></div>
               </div>
               <div className="w-[50px] text-center ml-1">
                 <span 
                   className="px-2 py-[2px] rounded-md font-bold text-[10px]"
                   style={{ backgroundColor: m.badgeBg, color: m.badgeColor }}
                 >
                   {m.badge}
                 </span>
               </div>
               <div className="w-[45px] text-right text-[11px] tabular-nums">{m.score}</div>
            </div>
          ))}
       </div>
    </div>
  );
}
