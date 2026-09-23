import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TicketBucket } from '../../../../../features/tickets/ticketsSlice';
import { STATUS_COLORS, FALLBACK_COLOR } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

export function StatusDonut({ data }: { data: TicketBucket[] }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full h-full p-4 flex flex-col relative h-[280px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13px] font-bold text-ink">Ticket Status Distribution</h3>
      </div>

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
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] ?? FALLBACK_COLOR} />
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
