import { Archive, Download, UserX, X } from 'lucide-react';
import type { Option } from '../../../features/organizations/portfolioTypes';

export interface BulkReport {
  updated: number;
  failed: { id: number; name: string; reason: string }[];
  /** The request itself failed; nothing was applied. */
  error?: string;
}

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const CONTROL = `inline-flex min-h-11 sm:min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-subtle active:bg-line-subtle disabled:opacity-50 ${FOCUS}`;

/** Selection mode's action bar (spec §1). It sticks to the bottom of the
 *  content column. Churn is offered for one account at a time: the backend
 *  refuses churn in bulk, and each churn records its own date and reason
 *  in the existing modal. */
export function SelectionBar({
  count,
  owners,
  lifecycles,
  busy,
  report,
  onSetOwner,
  onSetLifecycle,
  onExport,
  onArchive,
  onChurn,
  onClose,
}: {
  count: number;
  owners: Option[];
  lifecycles: Option[];
  busy: boolean;
  report: BulkReport | null;
  onSetOwner: (userId: number | null) => void;
  onSetLifecycle: (stage: string) => void;
  onExport: () => void;
  onArchive: () => void;
  onChurn: () => void;
  onClose: () => void;
}) {
  if (count === 0 && !report) return null;
  return (
    <div role="region" aria-label="Selection" className="sticky bottom-3 z-20 flex flex-col gap-2 rounded-xl border border-line bg-elevated px-3 py-2 shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        {count > 0 ? (
          <>
            <p role="status" aria-live="polite" className="text-[13px] font-semibold text-ink">
              <span className="font-mono-brand tabular-nums">{count}</span> selected
            </p>
            <select
              aria-label="Change owner"
              value=""
              disabled={busy}
              onChange={(event) => {
                const value = event.target.value;
                if (value) onSetOwner(value === 'unassigned' ? null : Number(value));
              }}
              className={CONTROL}
            >
              <option value="">Change owner</option>
              {owners.map((owner) => (
                <option key={owner.value} value={owner.value}>
                  {owner.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Set lifecycle"
              value=""
              disabled={busy}
              onChange={(event) => {
                if (event.target.value) onSetLifecycle(event.target.value);
              }}
              className={CONTROL}
            >
              <option value="">Set lifecycle</option>
              {lifecycles
                .filter((stage) => stage.value !== 'churn')
                .map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.name}
                  </option>
                ))}
            </select>
            <button type="button" onClick={onExport} disabled={busy} className={CONTROL}>
              <Download className="w-4 h-4" aria-hidden="true" />
              Export
            </button>
            <button type="button" onClick={onArchive} disabled={busy} className={CONTROL}>
              <Archive className="w-4 h-4" aria-hidden="true" />
              Archive
            </button>
            {count === 1 ? (
              <button type="button" onClick={onChurn} disabled={busy} className={`${CONTROL} text-danger`}>
                <UserX className="w-4 h-4" aria-hidden="true" />
                Churn
              </button>
            ) : null}
          </>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label={count > 0 ? 'Clear selection' : 'Dismiss'}
          className={`ml-auto inline-flex w-11 h-11 sm:w-9 sm:h-9 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle ${FOCUS}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {busy ? <p className="text-[11px] text-ink-muted">Applying…</p> : null}
      {report ? (
        <div role="status" className="text-[13px]">
          {report.error ? (
            <p className="text-danger">{report.error}</p>
          ) : (
            <p className="text-ink">
              {`Updated ${report.updated} organization${report.updated === 1 ? '' : 's'}.`}
              {report.failed.length ? ` ${report.failed.length} failed:` : ''}
            </p>
          )}
          {report.failed.length ? (
            <ul className="mt-1 flex flex-col gap-0.5">
              {report.failed.map((failure) => (
                <li key={failure.id} className="text-[11px] text-danger">
                  <span className="font-semibold">{failure.name}</span>: {failure.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
