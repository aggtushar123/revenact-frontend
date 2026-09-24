import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import type { InteractionBucket } from '../../../../../features/interactions/interactionsSlice';
import { niceMax } from '../chartTheme';
import { UnclassifiedNote } from './UnclassifiedNote';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { ROLE, TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { DrillTargets } from '../../../drill/DrillTargets';

const PATH = '/interactions/stats/';

/** Subcategories are finer-grained than categories, so a couple more bars earn
 *  their place here — but the same readability ceiling applies. */
const MAX_BARS = 11;

/** Classified interactions by AI Subcategory, biggest first.
 *
 * Same shape as the Category bar beside it, and read together with it: the
 * backend guarantees every subcategory rolls up into exactly one of the
 * categories in that chart. */
export function ActivitiesByAISubCategoryBar({
  data,
  classified,
  total,
  query,
  drillable = true,
}: {
  data: InteractionBucket[];
  /** The API's own count of classified interactions — what the note below is
   *  about. Deliberately not the sum of the bars drawn: those are the top few,
   *  so summing them would understate the book and make the note a lie. */
  classified: number;
  total: number;
  query: string;
  /** False while the view refetches: the figures on screen are the old
   *  ones, but a drill would send the new query, so nothing opens. */
  drillable?: boolean;
}) {
  const { open } = useDrill();
  const rows = data.slice(0, MAX_BARS).reverse();
  const max = niceMax(rows.map((r) => r.value));

  const openSegment = (row: InteractionBucket, trigger?: HTMLElement) => {
    open(
      {
        title: row.name,
        figure: String(row.value),
        source: { kind: 'server', path: PATH, query, segment: `subcategory:${row.key}` },
      },
      trigger,
    );
  };

  const drillItems = (drillable ? rows : []).map((row) => ({
    name: row.name,
    figure: String(row.value),
    onSelect: (trigger: HTMLElement) => openSegment(row, trigger),
  }));

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[14px] font-bold text-ink">Activities By AI Sub Category</h3>
        {data.length > MAX_BARS && (
          <span className="text-[11px] text-ink-faint">
            top {MAX_BARS} of {data.length}
          </span>
        )}
      </div>

      <DrillTargets label="Activities By AI Sub Category" items={drillItems} />

      <div className="flex-1 w-full min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-strong)" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              domain={[0, max]}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={true}
              tickLine={true}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              width={140}
            />
            <Tooltip
              cursor={{ fill: CURSOR_FILL }}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar {...STATIC_SERIES} dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              <LabelList
                dataKey="value"
                position="right"
                fill="var(--text-secondary)"
                fontSize={11}
              />
              {rows.map((row) => (
                <Cell
                  key={row.key}
                  fill={ROLE.ink}
                  cursor={drillable ? 'pointer' : undefined}
                  onClick={drillable ? () => openSegment(row) : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <UnclassifiedNote classified={classified} total={total} />
    </div>
  );
}
