import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Survey } from '../../features/customers/customersSlice';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface TrendPoint {
  key: string;
  month: string;
  nps?: number;
  csat?: number;
  ces?: number;
}

// Same "compute client-side from the already-fetched flat list" approach
// SurveysPage.tsx's own rollup cards already use — no new endpoint.
// Bucketed by month of `responded_at` (when the score was actually
// recorded), not `sent_at` — this is a "how is sentiment trending"
// view, so it should move when responses land, not when surveys go out.
function buildTrend(surveys: Survey[]): TrendPoint[] {
  const buckets = new Map<string, Record<Survey['survey_type'], { sum: number; count: number }>>();

  for (const survey of surveys) {
    if (survey.status !== 'responded' || survey.score === null || !survey.responded_at) continue;
    const [y, m] = survey.responded_at.split('-').map(Number);
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!buckets.has(key)) {
      buckets.set(key, { nps: { sum: 0, count: 0 }, csat: { sum: 0, count: 0 }, ces: { sum: 0, count: 0 } });
    }
    const bucket = buckets.get(key)![survey.survey_type];
    bucket.sum += survey.score;
    bucket.count += 1;
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, byType]) => {
      const [y, m] = key.split('-').map(Number);
      const point: TrendPoint = { key, month: `${MONTHS[m - 1]} ${y}` };
      (['nps', 'csat', 'ces'] as const).forEach((type) => {
        if (byType[type].count > 0) point[type] = Math.round(byType[type].sum / byType[type].count);
      });
      return point;
    });
}

const LINES: { type: 'nps' | 'csat' | 'ces'; label: string; color: string }[] = [
  { type: 'nps', label: 'NPS', color: 'var(--success)' },
  { type: 'csat', label: 'CSAT', color: 'var(--info)' },
  { type: 'ces', label: 'CES', color: 'var(--warning)' },
];

export function SurveyTrendChart({ surveys }: { surveys: Survey[] }) {
  const data = useMemo(() => buildTrend(surveys), [surveys]);

  return (
    <div className="w-full p-4 flex flex-col bg-surface border border-line-subtle rounded-xl shadow-sm h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-ink">Score Trend</h3>
        <div className="flex items-center gap-3">
          {LINES.map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] font-semibold text-ink-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[12.5px] text-ink-faint font-medium">Not enough responses yet.</p>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={{ stroke: 'var(--border-default)' }}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                domain={[-100, 100]}
                ticks={[-100, -50, 0, 50, 100]}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              {LINES.map(({ type, color }) => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={color}
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 3, fill: color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
