import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TicketBucket } from '../../../../../features/tickets/ticketsSlice';
import { STATUS_COLORS, STATUS_VALUES, FALLBACK_COLOR } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { DrillTargets } from '../../../drill/DrillTargets';

const PATH = '/tickets/stats/';

export function StatusDonut({
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
  const canDrill = (entry: TicketBucket) => drillable && Boolean(STATUS_VALUES[entry.name]);

  const openSegment = (entry: TicketBucket, trigger?: HTMLElement) => {
    const value = STATUS_VALUES[entry.name];
    if (!value || !canDrill(entry)) return;
    open(
      {
        title: entry.name,
        figure: String(entry.value),
        source: { kind: 'server', path: PATH, query, segment: `status:${value}` },
      },
      trigger,
    );
  };

  // One keyboard target per slice the server recognises — same
  // ignore-the-unmapped-name convention the pointer handler follows.
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
        <h3 className="text-[13px] font-bold text-ink">Ticket Status Distribution</h3>
      </div>

      <DrillTargets label="Ticket Status Distribution" items={drillItems} />

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
                  fill={STATUS_COLORS[entry.name] ?? FALLBACK_COLOR}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
          <span className="text-3xl font-bold text-ink">{total}</span>
        </div>
      </div>
    </div>
  );
}
