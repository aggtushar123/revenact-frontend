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

  const mainColor = isGood ? 'var(--success)' : (isAvg ? 'var(--warning)' : 'var(--danger)');
  const mainBg = isGood ? 'var(--success-dim)' : (isAvg ? 'var(--warning-dim)' : 'var(--danger-dim)');
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
      color: 'var(--warning)',
      badge: 'Average',
      badgeColor: 'var(--warning)',
      badgeBg: 'var(--warning-dim)',
      score: isGood ? '0.8/1.5' : '0.3/1.5'
    },
    {
      label: 'AI Pulse Configuration',
      fill: isGood ? 100 : 50,
      color: isGood ? 'var(--success)' : 'var(--warning)',
      badge: isGood ? 'Good' : 'Average',
      badgeColor: isGood ? 'var(--success)' : 'var(--warning)',
      badgeBg: isGood ? 'var(--success-dim)' : 'var(--warning-dim)',
      score: isGood ? '2.0/2.0' : '1.0/2.0'
    },
    {
      label: 'Customer Touch',
      fill: isGood ? 100 : 25,
      color: isGood ? 'var(--success)' : 'var(--danger)',
      badge: isGood ? 'Good' : 'Poor',
      badgeColor: isGood ? 'var(--success)' : 'var(--danger)',
      badgeBg: isGood ? 'var(--success-dim)' : 'var(--danger-dim)',
      score: isGood ? '4.0/4.0' : '1.0/4.0'
    },
    {
      label: 'Licence Utilization',
      fill: val > 8 ? 100 : 50,
      color: val > 8 ? 'var(--success)' : 'var(--warning)',
      badge: val > 8 ? 'Good' : 'Average',
      badgeColor: val > 8 ? 'var(--success)' : 'var(--warning)',
      badgeBg: val > 8 ? 'var(--success-dim)' : 'var(--warning-dim)',
      score: val > 8 ? '2.0/2.0' : '1.0/2.0'
    },
    {
      label: 'Support Tickets Volume',
      fill: isGood ? 100 : 100,
      color: 'var(--success)',
      badge: 'Good',
      badgeColor: 'var(--success)',
      badgeBg: 'var(--success-dim)',
      score: '0.5/0.5'
    }
  ];

  return (
    <div
      style={style}
      className="fixed z-[100] w-[360px] bg-elevated rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-line-strong p-5 text-[12px] text-ink-muted pointer-events-none transition-opacity duration-200"
    >
       {/* Tooltip Arrow pointing down */}
       <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-elevated border-b border-r border-line-strong transform rotate-45"></div>

       <div className="flex flex-col gap-3.5 relative z-10 bg-elevated">
          {metrics.map((m, i) => (
            <div key={i} className={`flex items-center justify-between ${m.isMain ? 'mb-1 font-bold text-ink' : 'font-medium'}`}>
               <div className="w-[140px] truncate pr-2">{m.label}</div>
               <div className="flex-1 h-[6px] bg-subtle rounded-full overflow-hidden flex mx-2">
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
