import { useMemo } from 'react';

import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow, HealthStatus } from '../mockData';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE, CURSOR_FILL, HEALTH_COLORS } from '../../../shared/chartPalette';
import { AXIS_BASE, axisLabel, categoryAxis, chartMargin } from '../../../shared/chartAxis';

const STATUSES: HealthStatus[] = ['Poor', 'Average', 'Good'];

const seats = (value: unknown) => `${value} ${Number(value) === 1 ? 'seat' : 'seats'}`;

/**
 * Active seats held by accounts in each health status. (It was called
 * "…ByRecruiters" after the mock it replaced, which invented a recruiter
 * count; the backend records `total_active_seats`.)
 */
export function AccountHealthBySeats({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => {
    // Accounts with no seat figure recorded contribute nothing rather than a
    // zero that looks measured.
    const totalSeats: Record<HealthStatus, number> = { Poor: 0, Average: 0, Good: 0 };
    data.forEach((d) => {
      totalSeats[d.healthStatus] += d.activeSeats ?? 0;
    });
    return STATUSES.map((name) => ({ name, value: totalSeats[name], fill: HEALTH_COLORS[name] })).filter(
      (d) => d.value > 0,
    );
  }, [data]);

  return (
    <div className="w-full p-4 flex flex-col gap-2">
      <h3 className="text-[13px] font-bold text-ink">Account health by active seats</h3>

      {/* The status names on the axis are the key; each bar says its count. */}
      <div className="w-full h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={chartMargin({ x: true })} barSize={48}>
            <XAxis {...AXIS_BASE} dataKey="name" {...categoryAxis(chartData.length)} label={axisLabel('Health status', 'x')} />
            {/* Hidden: every bar carries its seat count. */}
            <YAxis hide />
            <Tooltip
              cursor={{ fill: CURSOR_FILL }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [seats(value), 'Active seats']}
            />
            <Bar {...STATIC_SERIES} dataKey="value" name="Active seats">
              <LabelList dataKey="value" position="top" fill="var(--text-secondary)" fontSize={11} formatter={seats} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
