import { useEffect, useRef, useState } from 'react';
import { Archive, Download, UserX, X } from 'lucide-react';
import type { PortfolioNoun } from '../../../features/organizations/portfolioLabels';
import type { Option } from '../../../features/organizations/portfolioTypes';
import { usePortfolioKind } from './portfolioKind';
import { BUTTON, FOCUS } from './styles';

export interface BulkReport {
  updated: number;
  failed: { id: number; name: string; reason: string }[];
  /** The request itself failed; nothing was applied. */
  error?: string;
}


type Pending = { action: 'owner' | 'lifecycle'; value: string };

function reportText(report: BulkReport, noun: PortfolioNoun): string {
  return `Updated ${report.updated} ${report.updated === 1 ? noun.one : noun.many}.${report.failed.length ? ` ${report.failed.length} failed:` : ''}`;
}

/** Selection mode's action bar (spec §1). It sticks to the bottom of the
 *  content column. Change owner and Set lifecycle never act on the select's
 *  own change (a closed select fires one per arrow key on Windows and
 *  Firefox): a choice arms "Apply to N" beside it, and that button runs it.
 *  Churn is offered for one account at a time: the backend refuses churn in
 *  bulk, and each churn records its own date and reason in the existing
 *  modal. The live regions stay mounted whether or not the bar shows, so
 *  only their text changes. */
export function SelectionBar({
  count,
  owners,
  lifecycles,
  activity,
  loading = false,
  report,
  onSetOwner,
  onSetLifecycle,
  onExport,
  onArchive,
  onChurn,
  keepChurn = false,
  onClose,
}: {
  count: number;
  /** Who the selection can be given to; `unassigned` is sent as null. */
  owners: Option[];
  /** Stages the selection can be moved to (churn is never offered). */
  lifecycles: Option[];
  /** What is running: controls disable and the bar says so. */
  activity: 'applying' | 'exporting' | null;
  /** The list is reloading: controls disable, with nothing claimed. */
  loading?: boolean;
  report: BulkReport | null;
  onSetOwner: (userId: number | null) => void;
  onSetLifecycle: (stage: string) => void;
  onExport: () => void;
  /** Absent (Accounts): no Archive button. */
  onArchive?: () => void;
  /** Absent (Accounts): no Churn button. */
  onChurn?: () => void;
  /** Offer Churn among the stages (Accounts, where it is only a stage). */
  keepChurn?: boolean;
  onClose: () => void;
}) {
  const kind = usePortfolioKind();
  const [pending, setPending] = useState<Pending | null>(null);
  // An armed choice never outlives the selection it was armed for.
  if (count === 0 && pending) setPending(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // A finished action lands focus on its report (or the bar), never on the
  // page body: the select was disabled and Apply unmounted meanwhile.
  useEffect(() => {
    if (report) (reportRef.current ?? regionRef.current)?.focus();
  }, [report]);

  const disabled = activity !== null || loading;
  const busyText = activity === 'applying' ? 'Applying…' : activity === 'exporting' ? 'Exporting…' : '';
  const announcement = busyText || (count > 0 ? `${count} selected` : '');

  const apply = () => {
    if (!pending) return;
    if (pending.action === 'owner') onSetOwner(pending.value === 'unassigned' ? null : Number(pending.value));
    else onSetLifecycle(pending.value);
    setPending(null);
    regionRef.current?.focus();
  };

  const choose = (action: Pending['action']) => (event: { target: { value: string } }) =>
    setPending(event.target.value ? { action, value: event.target.value } : null);

  const applyButton = (action: Pending['action']) =>
    pending?.action === action ? (
      <button type="button" onClick={apply} disabled={disabled} className={`${BUTTON} bg-accent text-on-accent border-accent hover:bg-accent-hover`}>
        Apply to <span className="font-mono-brand tabular-nums">{count}</span>
      </button>
    ) : null;

  const visible = count > 0 || report !== null;

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <p role="alert" className="sr-only">
        {report?.error ?? ''}
      </p>
      {visible ? (
        <div
          ref={regionRef}
          tabIndex={-1}
          role="region"
          aria-label="Selection"
          className={`sticky bottom-3 z-20 flex flex-col gap-2 rounded-xl border border-line bg-elevated px-3 py-2 shadow-md ${FOCUS}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {count > 0 ? (
              <>
                <p className="text-[13px] font-semibold text-ink">
                  <span className="font-mono-brand tabular-nums">{count}</span> selected
                </p>
                <select
                  aria-label="Change owner"
                  value={pending?.action === 'owner' ? pending.value : ''}
                  disabled={disabled}
                  onChange={choose('owner')}
                  className={BUTTON}
                >
                  <option value="">Change owner</option>
                  {owners.map((owner) => (
                    <option key={owner.value} value={owner.value}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                {applyButton('owner')}
                <select
                  aria-label="Set lifecycle"
                  value={pending?.action === 'lifecycle' ? pending.value : ''}
                  disabled={disabled}
                  onChange={choose('lifecycle')}
                  className={BUTTON}
                >
                  <option value="">Set lifecycle</option>
                  {lifecycles
                    .filter((stage) => keepChurn || stage.value !== 'churn')
                    .map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.name}
                      </option>
                    ))}
                </select>
                {applyButton('lifecycle')}
                <button type="button" onClick={onExport} disabled={disabled} className={BUTTON}>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Export
                </button>
                {onArchive ? (
                  <button type="button" onClick={onArchive} disabled={disabled} className={BUTTON}>
                    <Archive className="w-4 h-4" aria-hidden="true" />
                    Archive
                  </button>
                ) : null}
                {count === 1 && onChurn ? (
                  <button type="button" onClick={onChurn} disabled={disabled} className={`${BUTTON} text-danger`}>
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
          {busyText ? (
            <p aria-hidden="true" className="text-[11px] text-ink-muted">
              {busyText}
            </p>
          ) : null}
          {report ? (
            <div ref={reportRef} tabIndex={-1} className={`rounded-md text-[13px] ${FOCUS}`}>
              {report.error ? <p className="text-danger">{report.error}</p> : <p className="text-ink">{reportText(report, kind.noun)}</p>}
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
      ) : null}
    </>
  );
}
