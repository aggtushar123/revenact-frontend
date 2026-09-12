import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchSignals } from '../../features/metrics/metricsSlice';
import type { Signal } from '../../features/metrics/metricsSlice';
import { formatMetricChange, formatMetricValue, monthName } from './formatMetric';
import { ExplanationCard } from './ExplanationCard';

/**
 * What moved since the last month-end — the metrics that moved materially,
 * bad news first, each naming the members that moved it most.
 *
 * This is the "why" layer's front door. The backend decides what is
 * material (deliberately blunt: five points or ten per cent) and what
 * drove it; this panel only says it plainly. Before a second month-end
 * exists there is nothing to compare against, and it says that rather than
 * inventing a baseline.
 */
export function SignalsPanel() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { signals, signalsError } = useAppSelector((state) => state.metrics);

  useEffect(() => {
    if (canSeeAll) dispatch(fetchSignals());
  }, [dispatch, canSeeAll]);

  if (!canSeeAll) return null;

  return (
    <section className="flex flex-col gap-2" aria-label="What moved">
      <div>
        <h2 className="text-[15px] font-bold text-ink">
          What moved{signals?.baseline ? ` since ${monthName(signals.baseline)} end` : ''}
        </h2>
        <p className="text-[11.5px] text-ink-faint">
          Material moves against the last month-end, worst first, with what drove them.
        </p>
      </div>

      {signalsError && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {signalsError}
        </p>
      )}

      {signals && signals.baseline === null && (
        <p className="text-[12px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-3 py-2">
          No month-end recorded yet. Signals appear once there is a month to compare against.
        </p>
      )}
      {signals && signals.baseline !== null && signals.signals.length === 0 && (
        <p className="text-[12px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-3 py-2">
          Nothing has moved materially since {monthName(signals.baseline)} end.
        </p>
      )}

      {signals && signals.signals.length > 0 && (
        <ul className="flex flex-col gap-2">
          {signals.signals.map((signal) => (
            <SignalRow key={signal.key} signal={signal} currency={signals.currency} asOf={signals.as_of} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SignalRow({ signal, currency, asOf }: { signal: Signal; currency: Parameters<typeof formatMetricValue>[2]; asOf: string }) {
  const [why, setWhy] = useState(false);
  const tone =
    signal.improved === null ? 'text-ink-muted' : signal.improved ? 'text-success' : 'text-danger';
  const accent =
    signal.improved === null ? 'border-l-info' : signal.improved ? 'border-l-success' : 'border-l-danger';
  const Arrow = signal.change === 0 ? Minus : signal.change > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <li
      className={`bg-surface border border-line-subtle rounded-lg px-[13px] py-[10px] border-l-[3px] ${accent}`}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-bold text-ink">{signal.label}</span>
          <span className="text-[13px] tabular-nums text-ink">
            {formatMetricValue(signal.unit, signal.value, currency)}
          </span>
        </div>
        <span className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-[12px] font-semibold tabular-nums ${tone}`}>
            <Arrow className="w-3.5 h-3.5" />
            {formatMetricChange(signal.unit, signal.change, currency)}
            <span className="text-ink-faint font-normal">
              from {formatMetricValue(signal.unit, signal.previous.value, currency)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setWhy((open) => !open)}
            aria-expanded={why}
            className="text-[11.5px] font-bold text-accent hover:underline"
          >
            {why ? 'Hide' : 'Why?'}
          </button>
        </span>
      </div>
      {signal.drivers.length > 0 && (
        <p className="text-[11.5px] text-ink-muted mt-1">
          <span className="text-ink-faint">Driven by </span>
          {signal.drivers.map((driver, index) => (
            <span key={`${driver.dimension}:${driver.member}`}>
              {index > 0 && <span className="text-ink-faint"> · </span>}
              <span className="font-medium text-ink">{driver.label}</span>
              <span className="text-ink-faint"> ({driver.dimension_label.toLowerCase()}) </span>
              <span className="tabular-nums">
                {formatMetricChange(signal.unit, driver.change, currency)}
              </span>
            </span>
          ))}
        </p>
      )}
      {why && (
        <div className="mt-2">
          <ExplanationCard metricKey={signal.key} asOf={asOf} />
        </div>
      )}
    </li>
  );
}
