import { Link } from 'react-router-dom';
import { parentHref } from '../../../features/pipelines/pipelineKinds';
import type { PipelineRow } from '../../../features/pipelines/pipelineTypes';
import { FOCUS } from '../../organizations/portfolio/styles';
import { PRIORITY_COLORS } from '../kanbanConfig';

// The pieces of a Pipelines item and card (spec §1 "List items"), also used
// by the organisation and account pages' Deals & risks items.

const SIGNAL_TONE = {
  overdue: 'bg-danger-dim text-danger',
  high_priority: 'bg-warning-dim text-warning',
} as const;

/** At most one: Overdue first, then High priority on an open item. */
export function PipelineSignal({ signal }: { signal: PipelineRow['signal'] }) {
  if (!signal) return null;
  return (
    <span data-field="signal" className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SIGNAL_TONE[signal.kind]}`}>
      {signal.label}
    </span>
  );
}

/** "Closes in 12d", "Overdue 5d", "No date" (dateText), danger when overdue. */
export function DateLine({ text, overdue }: { text: string; overdue: boolean }) {
  return (
    <span data-field="date" className={`font-mono-brand tabular-nums text-[11px] ${overdue ? 'font-semibold text-danger' : 'text-ink-muted'}`}>
      {text}
    </span>
  );
}

export function StageTag({ label }: { label: string }) {
  return (
    <span data-field="stage" className="inline-flex shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] text-ink">
      {label}
    </span>
  );
}

/** Priority is the item's one colour: it carries severity. */
export function PriorityTag({ priority }: { priority: PipelineRow['priority'] }) {
  return (
    <span data-field="priority" className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${PRIORITY_COLORS[priority.value]}`}>
      {priority.label} priority
    </span>
  );
}

/** "Part of Pizza Hut EMEA · Pizza Hut": the item's organisation or account
 *  as a link (the server sends a row only when the viewer may open it), and
 *  for an account-level item the first organisation of that account the
 *  viewer may open (plan Decision 12). */
export function PartOf({ row }: { row: PipelineRow }) {
  const organisation = row.parent.type === 'account' ? row.companies[0]?.name : undefined;
  return (
    <p className="min-w-0 truncate text-[11px] text-ink-muted">
      Part of{' '}
      <Link
        to={parentHref(row.parent)}
        draggable={false}
        onClick={(event) => event.stopPropagation()}
        data-field="parent"
        className={`inline-flex min-h-11 items-center rounded-sm text-ink underline-offset-2 hover:underline sm:min-h-0 ${FOCUS}`}
      >
        {row.parent.name}
      </Link>
      {organisation ? ` · ${organisation}` : null}
    </p>
  );
}
