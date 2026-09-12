import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchMetricSlice, sliceKey } from '../../features/metrics/metricsSlice';
import { formatMetricChange, formatMetricValue, monthName } from './formatMetric';

const DIMENSION_LABELS: Record<string, string> = {
  owner: 'Owner',
  product: 'Product',
  segment: 'Size band',
  lifecycle: 'Lifecycle stage',
};

/** The cut to open on: the number a manager most wants decomposed. */
const DEFAULT_METRIC = 'at_risk_arr';

/**
 * A metric, cut one way: ARR at risk by product, NRR by owner, ARR by size
 * band. The members largest first, each with its move since the last
 * month-end.
 *
 * The picker offers only metrics the backend says have cuts, and only the
 * cuts it says they have — the registry decides what can honestly be
 * decomposed; this panel only draws it.
 */
export function DriversPanel() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { data, slices, sliceLoading, sliceError } = useAppSelector((state) => state.metrics);

  const cuttable = useMemo(
    () => (data?.metrics ?? []).filter((metric) => metric.dimensions.length > 0),
    [data]
  );
  const [metricKey, setMetricKey] = useState<string | null>(null);
  const [dimension, setDimension] = useState<string | null>(null);

  const metric =
    cuttable.find((m) => m.key === metricKey) ??
    cuttable.find((m) => m.key === DEFAULT_METRIC) ??
    cuttable[0] ??
    null;
  const activeDimension =
    metric && dimension && metric.dimensions.includes(dimension)
      ? dimension
      : (metric?.dimensions[0] ?? null);

  useEffect(() => {
    if (canSeeAll && metric && activeDimension) {
      dispatch(fetchMetricSlice({ metric: metric.key, dimension: activeDimension }));
    }
  }, [dispatch, canSeeAll, metric, activeDimension]);

  if (!canSeeAll || !data) return null;
  if (cuttable.length === 0) return null;

  const slice = metric && activeDimension ? slices[sliceKey(metric.key, activeDimension)] : undefined;
  const loading = metric && activeDimension && sliceLoading === sliceKey(metric.key, activeDimension);
  const widest = Math.max(1, ...(slice?.members ?? []).map((m) => Math.abs(m.value ?? 0)));
  const selectClass =
    'px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent';

  return (
    <section className="flex flex-col gap-3" aria-label="What moves it">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-ink">What moves it</h2>
          <p className="text-[11.5px] text-ink-faint">
            One number, cut one way — largest first, with its move since the last month-end.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-faint" htmlFor="drivers-metric">
            Metric
          </label>
          <select
            id="drivers-metric"
            value={metric?.key ?? ''}
            onChange={(e) => {
              setMetricKey(e.target.value);
              setDimension(null);
            }}
            className={selectClass}
          >
            {cuttable.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1" role="tablist" aria-label="Cut by">
            {(metric?.dimensions ?? []).map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={d === activeDimension}
                onClick={() => setDimension(d)}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
                  d === activeDimension
                    ? 'bg-accent-dim text-accent'
                    : 'text-ink-muted hover:text-ink hover:bg-subtle'
                }`}
              >
                {DIMENSION_LABELS[d] ?? d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sliceError && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {sliceError}
        </p>
      )}

      <div
        className={`bg-surface border border-line-subtle rounded-lg px-4 py-3 ${loading ? 'opacity-60' : ''}`}
      >
        {!slice ? (
          <p className="text-[12px] text-ink-faint">Loading…</p>
        ) : slice.members.length === 0 ? (
          <p className="text-[12px] text-ink-faint">Nothing to cut yet.</p>
        ) : (
          <ul className="flex flex-col gap-[10px]">
            {slice.members.map((member) => (
              <li key={member.member}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-medium text-ink truncate">{member.label}</span>
                  <span className="text-[11.5px] text-ink-muted tabular-nums shrink-0">
                    <span className="text-ink font-semibold">
                      {formatMetricValue(slice.metric.unit, member.value, slice.currency)}
                    </span>
                    {member.change !== null && member.previous && (
                      <span className="text-ink-faint">
                        {' '}
                        · {member.change === 0 ? 'unchanged' : formatMetricChange(slice.metric.unit, member.change, slice.currency)}{' '}
                        since {monthName(member.previous.period_end)} end
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-[3px] h-[8px] rounded-[3px] bg-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-[3px] ${
                      slice.metric.better === 'down' ? 'bg-danger/60' : 'bg-info/70'
                    }`}
                    style={{ width: `${(Math.abs(member.value ?? 0) / widest) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
