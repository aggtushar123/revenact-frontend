import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TicketBucket } from '../../../../../features/tickets/ticketsSlice';
import { PRIORITY_COLORS, PRIORITY_VALUES, FALLBACK_COLOR } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { DrillTargets } from '../../../drill/DrillTargets';

const PATH = '/tickets/stats/';

export function PriorityDonut({
  data,
  query,
  drillable = true,
}: {
  data: TicketBucket[];
  query: string;
  /** False while the view refetches: the figures on screen are the old
   *  ones, but a drill would send the new query, so nothing opens. */
  drillable?: boolean;
}) {
  const { open } = useDrill();
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  // An empty bucket has no accounts behind it, so it offers no drill.
  const canDrill = (entry: TicketBucket) =>
    drillable && entry.value > 0 && Boolean(PRIORITY_VALUES[entry.name]);

  const openSegment = (entry: TicketBucket, trigger?: HTMLElement) => {
    const value = PRIORITY_VALUES[entry.name];
    if (!value || !canDrill(entry)) return;
    open(
      {
        title: entry.name,
        figure: String(entry.value),
        source: { kind: 'server', path: PATH, query, segment: `priority:${value}` },
      },
      trigger,
    );
  };

  // One keyboard target per slice the server actually recognises — a
  // priority added to the backend before `PRIORITY_VALUES` catches up is
  // still drawn (in the fallback colour) but offers no drill, same as an
  // unrecognised name in the pointer handler below.
  const drillItems = data
    .filter(canDrill)
    .map((entry) => ({
      name: entry.name,
      figure: String(entry.value),
      onSelect: (trigger: HTMLElement) => openSegment(entry, trigger),
    }));

  return (
    <div className="w-full h-full p-4 flex flex-col relative h-[280px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13px] font-bold text-ink">Ticket Priority Distribution</h3>
        <button className="text-ink-faint hover:text-ink-muted">
          {/* Mock expand icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      <DrillTargets label="Ticket Priority Distribution" items={drillItems} />

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...STATIC_SERIES}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              startAngle={90}
              endAngle={-270}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => {
                const { cx, cy, midAngle, outerRadius, value, name } = props;
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 15;
                const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
                const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);
                
                const percentage = ((Number(value) / total) * 100).toFixed(0);
                
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="var(--text-secondary)" 
                    textAnchor={x > Number(cx) ? 'start' : 'end'} 
                    dominantBaseline="central"
                    fontSize={10}
                    fontWeight={500}
                  >
                    <tspan x={x} dy="-0.5em">{name}</tspan>
                    <tspan x={x} dy="1.2em">{value} ({percentage}%)</tspan>
                  </text>
                );
              }}
              labelLine={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PRIORITY_COLORS[entry.name] ?? FALLBACK_COLOR}
                  cursor={canDrill(entry) ? 'pointer' : undefined}
                  onClick={canDrill(entry) ? () => openSegment(entry) : undefined}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, 'Count']}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-ink">{total}</span>
        </div>
      </div>
    </div>
  );
}
