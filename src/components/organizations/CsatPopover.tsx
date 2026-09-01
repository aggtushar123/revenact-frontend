import React from 'react';

interface CsatPopoverProps {
  style: React.CSSProperties;
}

export function CsatPopover({ style }: CsatPopoverProps) {
  const data = [
    { label: 'Very Satisfied:', count: 5, fill: 21.74, color: 'var(--success)', textClass: 'text-success' },
    { label: 'Satisfied:', count: 6, fill: 26.09, color: 'var(--success)', textClass: 'text-success' },
    { label: 'Neutral:', count: 4, fill: 17.39, color: 'var(--warning)', textClass: 'text-warning' },
    { label: 'Dissatisfied:', count: 5, fill: 21.74, color: 'var(--danger)', textClass: 'text-danger' },
    { label: 'Very Dissatisfied:', count: 3, fill: 13.04, color: 'var(--danger)', textClass: 'text-danger' },
  ];

  return (
    <div
      style={style}
      className="fixed z-[100] w-[340px] bg-elevated rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-line-strong p-5 text-[12px] font-medium pointer-events-none transition-opacity duration-200"
    >
       <div className="font-bold text-ink text-[13px] mb-4">23 Responses</div>

       <div className="flex flex-col gap-3 relative z-10 bg-elevated">
          {data.map((row, i) => (
            <div key={i} className="flex items-center justify-between">
               <div className="w-[110px] text-ink-faint">{row.label}</div>
               <div className="w-[16px] font-bold text-ink-muted text-right">{row.count}</div>
               <div className="flex-1 h-[6px] bg-subtle rounded-full overflow-hidden mx-3">
                  {/* Scale fill purely for visual purposes so the bar doesn't look too tiny */}
                  <div className="h-full rounded-full" style={{ width: `${row.fill * 2}%`, backgroundColor: row.color }}></div>
               </div>
               <div className={`w-[45px] text-right font-bold ${row.textClass}`}>{row.fill}%</div>
            </div>
          ))}
       </div>

       {/* Tooltip Arrow pointing down */}
       <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-elevated border-b border-r border-line-strong transform rotate-45"></div>
    </div>
  );
}
