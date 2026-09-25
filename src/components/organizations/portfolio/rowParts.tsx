// This module intentionally exports both the row-visual components and the
// text helpers (trendLabel, renewalText, touchText) they and their tests
// share, per the brief's interface (Task 4). Fast refresh doesn't apply to
// this shared, mostly-presentational module.
/* eslint-disable react-refresh/only-export-components */
import { HEALTH_COLORS } from '../../../pages/dashboard/shared/chartPalette';
import { pulseWords } from '../../../features/organizations/portfolioFields';
import { HEALTH_LABEL } from '../../../features/organizations/portfolioLabels';
import type { HealthBand, PortfolioRow } from '../../../features/organizations/portfolioTypes';

export function trendLabel(trend: number[]): string {
  if (trend.length < 2) return 'Not enough health history for a trend';
  const first = trend[0];
  const last = trend[trend.length - 1];
  if (first === last) return `Health steady at ${last.toFixed(1)} over ${trend.length} months`;
  const direction = last < first ? 'falling' : 'rising';
  return `Health ${direction} from ${first.toFixed(1)} to ${last.toFixed(1)} over ${trend.length} months`;
}

export function renewalText(days: number | null): string {
  if (days == null) return 'No renewal date';
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return 'Renews today';
  return `in ${days}d`;
}

/** `null` means never contacted (Activity Tracking's rule, no joined-date fallback). */
export function touchText(days: number | null): string {
  if (days == null) return 'Never contacted';
  if (days === 0) return 'Touched today';
  return `Touched ${days}d ago`;
}

/** Score out of 10 as a ring, coloured by band; the number carries the meaning. */
export function HealthRing({ score, category }: { score: number; category: HealthBand }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(10, score)) / 10;
  const label = `Health ${score.toFixed(1)}, ${HEALTH_LABEL[category]}`;
  const box = 'w-10 h-10';
  return (
    <span role="img" aria-label={label} data-field="health" className={`relative inline-flex shrink-0 items-center justify-center ${box}`}>
      <svg viewBox="0 0 36 36" className={`absolute inset-0 -rotate-90 ${box}`} aria-hidden="true">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--border-default)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={HEALTH_COLORS[HEALTH_LABEL[category]]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${circumference * filled} ${circumference}`}
        />
      </svg>
      <span aria-hidden="true" className="font-mono-brand tabular-nums text-[11px] font-semibold text-ink">
        {score.toFixed(1)}
      </span>
    </span>
  );
}

/** Six months of health score from snapshots, as one line. */
export function TrendLine({ trend, category, className = '' }: { trend: number[]; category: HealthBand; className?: string }) {
  const width = 64;
  const height = 20;
  const points =
    trend.length < 2
      ? ''
      : trend
          .map((value, i) => {
            const x = (i / (trend.length - 1)) * width;
            const y = height - 2 - (Math.max(0, Math.min(10, value)) / 10) * (height - 4);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ');
  return (
    <span role="img" aria-label={trendLabel(trend)} className={`inline-flex shrink-0 ${className}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-16 h-5" aria-hidden="true">
        {points ? (
          <polyline points={points} fill="none" stroke={HEALTH_COLORS[HEALTH_LABEL[category]]} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        ) : (
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--border-default)" strokeDasharray="2 3" />
        )}
      </svg>
    </span>
  );
}

/** A bar filling toward the renewal date over a year's runway. */
export function RenewalRunway({ renewal, className = '' }: { renewal: PortfolioRow['renewal']; className?: string }) {
  const overdue = renewal.days != null && renewal.days < 0;
  const fill = renewal.days == null ? 0 : overdue ? 1 : Math.max(0, 1 - renewal.days / 365);
  return (
    <span className={`flex-col gap-1 w-28 shrink-0 ${className}`}>
      <span className="block h-1 w-full rounded-full bg-line overflow-hidden" aria-hidden="true">
        <span className={`block h-full rounded-full ${overdue ? 'bg-danger' : 'bg-ink-muted'}`} style={{ width: `${fill * 100}%` }} />
      </span>
      <span className={`font-mono-brand tabular-nums text-[11px] ${overdue ? 'text-danger font-semibold' : 'text-ink-muted'}`}>{renewalText(renewal.days)}</span>
    </span>
  );
}

const DOT: Record<number, string> = { 1: 'bg-success', 2: 'bg-danger', 3: 'bg-warning', 0: 'bg-line-strong' };

/** "AI n · CSM n", the stored pulse dots (the old Pulse column), the AI
 *  label (the old AI Pulse Score column) and, when the server says the two
 *  pulses differ by 2 or more, a marker in words. */
export function PulsePair({ pulse, className = '' }: { pulse: PortfolioRow['pulse']; className?: string }) {
  const show = (n: number | null) => (n == null ? '—' : String(n));
  return (
    <span className={`flex-col w-36 shrink-0 ${className}`}>
      <span className="font-mono-brand tabular-nums text-[13px] text-ink">
        AI {show(pulse.ai)} · CSM {show(pulse.csm)}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-[11px]">
        <span data-field="pulse" role="img" aria-label={`Pulse history: ${pulseWords(pulse.history)}`} className="flex gap-[3px]">
          {pulse.history.map((n, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${DOT[n] ?? DOT[0]}`} />
          ))}
        </span>
        <span data-field="aiPulseScore" className="truncate text-ink-muted">{pulse.ai_label || '—'}</span>
      </span>
      {pulse.disagree ? <span className="text-[11px] text-warning">pulses disagree</span> : null}
    </span>
  );
}

const SIGNAL_TONE = {
  renewal_overdue: 'bg-danger-dim text-danger',
  risk: 'bg-danger-dim text-danger',
  tickets: 'bg-warning-dim text-warning',
} as const;

export function SignalTag({ signal }: { signal: PortfolioRow['signal'] }) {
  if (!signal) return null;
  return (
    <span className={`inline-flex max-w-[9rem] truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${SIGNAL_TONE[signal.kind]}`}>
      {signal.label}
    </span>
  );
}
