import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { dateText, type PipelineKind } from '../../../features/pipelines/pipelineKinds';
import type { PipelineRow } from '../../../features/pipelines/pipelineTypes';
import { TITLE_BUTTON } from '../../organizations/detail/listStyles';
import { FOCUS, MONO } from '../../organizations/portfolio/styles';
import { DateLine, PartOf, PipelineSignal, PriorityTag, StageTag } from './itemParts';

export interface PipelineItemProps {
  row: PipelineRow;
  kind: PipelineKind;
  currency: CurrencyCode;
  /** Any item is selected (or the phone Select mode is on): taps select. */
  selecting: boolean;
  selected: boolean;
  /** Its list is loading or a bulk action is running: no checkbox. */
  selectDisabled?: boolean;
  /** The selection is at its 500-id cap. */
  atLimit?: boolean;
  onToggleSelect: (id: number) => void;
  /** Opens the item's form. */
  onOpen: (row: PipelineRow) => void;
}

/** One opportunity or risk as a rounded item, never a table row (spec §1
 *  "List items"). In a wide column it is one line: title and Part of, MRR,
 *  stage, priority, department, date, signal. In a narrow one (phones, or
 *  beside a rail) the title takes the first line and the facts wrap under
 *  it. The title, the item's body and a tap all open its form; while
 *  selecting they select instead. The priority tag is left out when High
 *  priority is already the item's signal (plan Decision 17). */
export function PipelineItem({
  row,
  kind,
  currency,
  selecting,
  selected,
  selectDisabled = false,
  atLimit = false,
  onToggleSelect,
  onOpen,
}: PipelineItemProps) {
  const checkboxDisabled = selectDisabled || (atLimit && !selected);
  const activate = () => (selecting ? onToggleSelect(row.id) : onOpen(row));

  return (
    <li
      data-item-id={row.id}
      className={`group rounded-xl bg-surface transition-shadow duration-[var(--dur-fast)] hover:shadow-sm ${selected ? 'ring-1 ring-accent' : ''}`}
    >
      <div
        data-part="item"
        onClick={activate}
        className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 @min-[60rem]:flex-nowrap"
      >
        <div className="flex min-w-0 basis-full items-start gap-2 @min-[60rem]:basis-auto @min-[60rem]:flex-1">
          <label
            onClick={(event) => event.stopPropagation()}
            className={`shrink-0 items-center justify-center w-11 h-11 -my-2 -ml-2 sm:w-6 sm:h-6 sm:m-0 ${
              selecting ? 'flex' : 'hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              disabled={checkboxDisabled}
              onChange={() => onToggleSelect(row.id)}
              aria-label={`Select ${row.title}`}
              title={atLimit && !selected ? '500 is the most you can select at once' : undefined}
              className={`w-4 h-4 cursor-pointer accent-accent ${FOCUS} disabled:cursor-not-allowed disabled:opacity-50`}
            />
          </label>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              data-field="title"
              aria-haspopup="dialog"
              onClick={(event) => {
                event.stopPropagation();
                activate();
              }}
              className={`${TITLE_BUTTON} text-[13px] font-semibold text-ink`}
            >
              {row.title}
            </button>
            <PartOf row={row} />
          </div>
        </div>
        <span data-field="mrr" className={`${MONO} text-[13px] text-ink @min-[60rem]:w-20 @min-[60rem]:text-right`}>
          {formatCompactMoney(row.mrr, currency)}
        </span>
        <StageTag label={row.stage.label} />
        {row.signal?.kind === 'high_priority' ? null : <PriorityTag priority={row.priority} />}
        <span data-field="department" className="min-w-0 truncate text-[11px] text-ink-muted @min-[60rem]:w-32">
          {row.department.label || 'Whole company'}
        </span>
        <span className="@min-[60rem]:w-28">
          <DateLine text={dateText(kind, row.date, row.open)} overdue={row.overdue} />
        </span>
        <span className="flex min-w-0 @min-[60rem]:w-28 @min-[60rem]:justify-end">
          <PipelineSignal signal={row.signal} />
        </span>
      </div>
    </li>
  );
}
