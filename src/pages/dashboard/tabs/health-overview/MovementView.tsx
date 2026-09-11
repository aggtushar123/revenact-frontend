import { useMemo, useState } from 'react';
import { useHealthOverview } from './useHealthOverview';
import { HealthEmpty, HealthError, HealthLoading, HealthTruncatedNotice } from './HealthDataState';
import { buildFlow, netMovement, renewalBuckets, WINDOW_OPTIONS } from './movement';
import type { WindowMonths } from './movement';
import { HealthFlowChart } from './charts/HealthFlowChart';
import { RenewalRunwayChart } from './charts/RenewalRunwayChart';

const DEFAULT_WINDOW: WindowMonths = 6;

/**
 * Health Overview read as movement rather than as a snapshot.
 *
 * Every other tab answers a question about now — who to call, where the team's
 * read is wrong, what the book looks like. This one answers which way it is
 * going, by counting the transitions between months instead of the totals
 * within them, and what is coming up for renewal while it does.
 */
export function MovementView() {
  const [windowMonths, setWindowMonths] = useState<WindowMonths>(DEFAULT_WINDOW);
  // Pinned at mount so renewal buckets don't shift mid-session.
  const [now] = useState(() => new Date());

  const { rows, error, truncated, isInitialLoad, hasLoaded } = useHealthOverview();

  const flow = useMemo(() => buildFlow(rows, windowMonths), [rows, windowMonths]);
  const net = useMemo(() => netMovement(flow), [flow]);
  const buckets = useMemo(() => renewalBuckets(rows, now), [rows, now]);

  const first = flow.months[0];
  const last = flow.months[flow.months.length - 1];

  if (isInitialLoad) return <HealthLoading />;
  if (error) return <HealthError message={error} />;
  if (hasLoaded && rows.length === 0) return <HealthEmpty />;

  return (
    <div className="w-full flex flex-col gap-4 pb-12">
      {truncated && <HealthTruncatedNotice />}
      <div className="flex items-center flex-wrap gap-2 px-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mr-1">
          Window
        </span>
        {WINDOW_OPTIONS.map((months) => {
          const on = months === windowMonths;
          return (
            <button
              key={months}
              type="button"
              aria-pressed={on}
              onClick={() => setWindowMonths(months)}
              className={`text-[11px] font-bold py-[3px] px-3 rounded-full border transition-colors ${
                on
                  ? 'bg-accent-dim text-accent border-accent'
                  : 'border-line text-ink-muted hover:bg-subtle hover:text-ink'
              }`}
            >
              {months} months
            </button>
          );
        })}

        {first && last && (
          <span className="ml-auto text-[11px] text-ink-faint">
            {first.short} → {last.short} · {flow.tracked} accounts tracked
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-line-subtle rounded-lg shadow-sm px-[13px] py-[11px] border-l-[3px] border-l-danger">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">
            Downgrades
          </div>
          <div className="text-[25px] font-semibold leading-tight tracking-tight mt-[3px] tabular-nums text-danger">
            {net.declined}
          </div>
          <div className="text-[11px] text-ink-muted mt-[1px]">account-months lost a grade</div>
        </div>

        <div className="bg-surface border border-line-subtle rounded-lg shadow-sm px-[13px] py-[11px] border-l-[3px] border-l-success">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">
            Upgrades
          </div>
          <div className="text-[25px] font-semibold leading-tight tracking-tight mt-[3px] tabular-nums text-success">
            {net.improved}
          </div>
          <div className="text-[11px] text-ink-muted mt-[1px]">account-months gained a grade</div>
        </div>

        <div className="bg-surface border border-line-subtle rounded-lg shadow-sm px-[13px] py-[11px]">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">
            Net movement
          </div>
          <div
            className={`text-[25px] font-semibold leading-tight tracking-tight mt-[3px] tabular-nums ${
              net.net > 0 ? 'text-success' : net.net < 0 ? 'text-danger' : 'text-ink'
            }`}
          >
            {net.net > 0 ? '+' : ''}
            {net.net}
          </div>
          <div className="text-[11px] text-ink-muted mt-[1px]">
            {net.held} held steady across the window
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 pt-3">
          <div>
            <h3 className="text-[13px] font-bold text-ink">Health transitions</h3>
            <p className="text-[11px] text-ink-faint mt-[1px]">
              Ribbon width is the number of accounts moving · faded ribbons held their grade
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {(['Good', 'Average', 'Poor'] as const).map((status) => (
              <span key={status} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor:
                      status === 'Good'
                        ? 'var(--success)'
                        : status === 'Average'
                          ? 'var(--warning)'
                          : 'var(--danger)',
                  }}
                />
                <span className="text-[11px] font-medium text-ink-muted">{status}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="px-2 pb-3 pt-1">
          <HealthFlowChart flow={flow} />
        </div>
      </div>

      <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden h-[300px] flex flex-col">
        <RenewalRunwayChart buckets={buckets} />
      </div>
    </div>
  );
}
