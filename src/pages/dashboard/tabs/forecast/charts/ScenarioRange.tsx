import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { ForecastScenarios } from '../../../../../features/forecast/forecastSlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';

export interface ScenarioRangeProps {
  scenarios: ForecastScenarios;
  opening: number;
  currency: CurrencyCode;
}

/**
 * Worst, likely and best on one scale, because a forecast is a range.
 *
 * A single number invites a precision nobody has. The three are built from the
 * same book: worst loses every renewal that falls inside the window and every
 * open risk, and closes nothing; best loses nothing and closes the whole
 * pipeline; likely is the weighted bridge beside it.
 *
 * Opening ARR is marked on the same scale, so "are we forecasting growth or
 * shrinkage" is one glance rather than two subtractions.
 *
 * Hand-drawn rather than a chart library: it is one axis, three points and a
 * marker, and a charting component would need a container height and an axis
 * config to draw less.
 */
export function ScenarioRange({ scenarios, opening, currency }: ScenarioRangeProps) {
  const top = Math.max(scenarios.best, opening) || 1;
  const pct = (value: number) => `${Math.max(0, Math.min(100, (value / top) * 100))}%`;

  const points = [
    { key: 'worst', label: 'Worst', value: scenarios.worst, tone: 'bg-danger' },
    { key: 'likely', label: 'Likely', value: scenarios.likely, tone: 'bg-ink' },
    { key: 'best', label: 'Best', value: scenarios.best, tone: 'bg-success' },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 pt-3">
        <h3 className="text-[13px] font-bold text-ink">Forecast range</h3>
        <p className="text-[11px] text-ink-faint mt-[1px]">
          Worst loses every renewal in the window and closes nothing · best loses nothing and
          closes all open pipeline
        </p>
      </div>

      <div className="px-4 pt-4 pb-3">
        <div className="relative h-[26px] rounded-[4px] bg-subtle overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-ink/10"
            style={{ left: pct(scenarios.worst), right: `calc(100% - ${pct(scenarios.best)})` }}
          />
          {/* Where the book stands today, on the same scale — so growth and
              shrinkage are a glance rather than a subtraction. */}
          <div
            className="absolute inset-y-0 w-px bg-ink"
            style={{ left: pct(opening) }}
            role="img"
            aria-label={`Opening ARR ${formatMoney(opening, currency)}`}
          />
          <div
            className="absolute inset-y-0 w-[3px] bg-ink"
            style={{ left: pct(scenarios.likely) }}
          />
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <span className="text-[10.5px] text-ink-faint">{formatCompactMoney(0, currency)}</span>
          <span className="text-[10.5px] text-ink-faint">
            today {formatCompactMoney(opening, currency)}
          </span>
        </div>

        <dl className="grid grid-cols-3 gap-2 mt-3">
          {points.map((point) => (
            <div key={point.key}>
              <dt className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">
                <span className={`w-2 h-2 rounded-[2px] ${point.tone}`} aria-hidden />
                {point.label}
              </dt>
              <dd className="text-[15px] font-semibold text-ink tabular-nums mt-[2px]">
                {formatCompactMoney(point.value, currency)}
              </dd>
              <dd className="text-[10.5px] text-ink-muted tabular-nums">
                {opening > 0 ? `${Math.round((point.value / opening) * 100)}% of today` : '—'}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
