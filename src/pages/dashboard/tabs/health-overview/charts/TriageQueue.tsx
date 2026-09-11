import type { HealthStatus } from '../mockData';
import type { TriageRow } from '../triage';
import { TrajectoryGlyph } from './TrajectoryGlyph';
import { DualPulse } from './DualPulse';
import { RenewalRunway } from './RenewalRunway';

const STATUS_CHIP: Record<HealthStatus, string> = {
  Good: 'bg-success-dim text-success',
  Average: 'bg-warning-dim text-warning',
  Poor: 'bg-danger-dim text-danger',
};

const STATUS_DOT: Record<HealthStatus, string> = {
  Good: 'bg-success',
  Average: 'bg-warning',
  Poor: 'bg-danger',
};

/** Grid template shared by the header and every row, so columns line up. */
const COLUMNS = 'grid-cols-[20px_minmax(0,1fr)_78px] xl:grid-cols-[20px_minmax(0,1fr)_78px_62px_108px]';

export interface TriageQueueProps {
  scored: TriageRow[];
  /** How many rows to render. The rest stay one click away rather than
   *  turning the queue back into the 60-row grid it replaces. */
  limit?: number;
}

/**
 * Accounts ranked worst-first, with the charts that used to occupy their own
 * cards reduced to per-row glyphs.
 *
 * The ordering is the product here: `AccountHealthDetailTable` already lists
 * every account, but in `id` order, which means the account that needs a call
 * today sits wherever it happens to sit.
 */
export function TriageQueue({ scored, limit = 12 }: TriageQueueProps) {
  const shown = scored.slice(0, limit);

  return (
    <div className="w-full bg-surface border border-line-subtle rounded-lg shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-[14px] pt-[11px]">
        <h3 className="text-[12.5px] font-bold text-ink">Accounts by risk score</h3>
        <span className="text-[11px] text-ink-faint">
          {scored.length} account{scored.length === 1 ? '' : 's'} · scored on trajectory, pulse gap, renewal
        </span>
      </div>

      <div className="overflow-x-auto mt-[10px]">
        <div className="min-w-[520px]">
          <div
            className={`grid ${COLUMNS} gap-[10px] items-center px-[14px] py-[7px] border-b border-line
                        text-[10px] font-bold uppercase tracking-wider text-ink-faint`}
          >
            <div />
            <div>Account</div>
            <div>Trajectory</div>
            <div className="hidden xl:block">CSM / AI</div>
            <div className="hidden xl:block">Renewal</div>
          </div>

          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-faint">
              No accounts match the current filter.
            </p>
          ) : (
            <div role="list" aria-label="Accounts by risk score, highest first">
              {shown.map((t, i) => {
                const { row, factors, score } = t;
                const breakdown = factors.length
                  ? factors.map((f) => `${f.label} (+${f.points})`).join('\n')
                  : 'No risk factors';

                return (
                  <div
                    key={row.id}
                    role="listitem"
                    className={`grid ${COLUMNS} gap-[10px] items-center px-[14px] py-[8px]
                                border-b border-line-subtle last:border-b-0 hover:bg-base transition-colors`}
                  >
                    <div
                      className="text-[11px] font-bold text-ink-faint text-right tabular-nums cursor-help"
                      title={`Risk score ${score}\n${breakdown}`}
                    >
                      {i + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[12.5px] font-semibold text-ink truncate">{row.account}</span>
                        <span
                          className={`inline-flex items-center gap-[5px] shrink-0 rounded-full px-2 py-[2px]
                                      text-[10.5px] font-bold ${STATUS_CHIP[row.healthStatus]}`}
                        >
                          <span className={`w-[5px] h-[5px] rounded-full ${STATUS_DOT[row.healthStatus]}`} />
                          {row.healthStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-muted truncate mt-[1px]" title={row.aiPulseReason}>
                        {row.aiPulseReason} · <span className="text-ink-faint">{row.owner}</span>
                      </div>
                    </div>

                    <TrajectoryGlyph trail={t.trail} />

                    <div className="hidden xl:block">
                      <DualPulse csmPulseScore={row.csmPulseScore} aiPulseScore={row.aiPulseScore} />
                    </div>

                    <div className="hidden xl:block">
                      <RenewalRunway days={t.daysToRenewal} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-[14px] py-[10px] border-t border-line-subtle">
        <span className="inline-flex items-center gap-[5px] text-[10.5px] font-semibold text-ink-muted">
          <span className="w-[9px] h-[9px] rounded-[2.5px] bg-success" />Good
        </span>
        <span className="inline-flex items-center gap-[5px] text-[10.5px] font-semibold text-ink-muted">
          <span className="w-[9px] h-[9px] rounded-[2.5px] bg-warning" />Average
        </span>
        <span className="inline-flex items-center gap-[5px] text-[10.5px] font-semibold text-ink-muted">
          <span className="w-[9px] h-[9px] rounded-[2.5px] bg-danger" />Poor
        </span>
        <span className="ml-auto text-[10.5px] text-ink-faint">
          Trajectory reads oldest to newest, left to right
        </span>
      </div>
    </div>
  );
}
