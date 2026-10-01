import { memo, type DragEvent } from 'react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { dateText, type PipelineKind } from '../../../features/pipelines/pipelineKinds';
import type { PipelineRow } from '../../../features/pipelines/pipelineTypes';
import { TITLE_BUTTON } from '../../organizations/detail/listStyles';
import { MoveToMenu } from '../../organizations/portfolio/MoveToMenu';
import { MONO } from '../../organizations/portfolio/styles';
import { DateLine, PartOf, PipelineSignal, PriorityTag } from './itemParts';

export interface PipelineCardProps {
  row: PipelineRow;
  kind: PipelineKind;
  currency: CurrencyCode;
  /** From `sm`. HTML5 drag has no touch support, so phones move with the menu only. */
  isSm: boolean;
  /** Grouped by stage: the card drags and has a Move to… menu. */
  canMove: boolean;
  /** A move is saving or settling (one at a time). */
  moveDisabled: boolean;
  /** Why moving is off, shown on the Move to… button when it is stuck. */
  moveNote?: string | null;
  onOpen: (row: PipelineRow) => void;
  /** `fromMenu`: a Move to… choice, whose card keeps focus in its new column. */
  onMove: (row: PipelineRow, to: string, fromMenu?: boolean) => void;
  onDragStart: (row: PipelineRow) => void;
  onDragEnd: () => void;
}

/** One item on the Board (spec §1): the list item's content as a card, but
 *  for the stage tag (the column names the stage). The title (its form
 *  opens from it; `data-part="open"`, where focus returns after a Move
 *  to…), Part of, then MRR, priority, department, the date line and the
 *  signal. The priority tag is left out when High priority is already the
 *  signal. Memoised: dragging re-renders the board. */
function PipelineCardView({
  row,
  kind,
  currency,
  isSm,
  canMove,
  moveDisabled,
  moveNote = null,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
}: PipelineCardProps) {
  const draggable = isSm && canMove && !moveDisabled;
  const targets = kind.stages.filter((stage) => stage.value !== row.stage.value);

  const startDrag = (event: DragEvent<HTMLLIElement>) => {
    // jsdom has no DataTransfer. Browsers get the id so Firefox starts the drag.
    event.dataTransfer?.setData('text/plain', String(row.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    onDragStart(row);
  };

  return (
    <li
      data-card-id={row.id}
      draggable={draggable}
      onDragStart={draggable ? startDrag : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={() => onOpen(row)}
      className={`cursor-pointer rounded-xl bg-surface p-3 transition-shadow duration-[var(--dur-fast)] hover:shadow-sm ${draggable ? 'active:cursor-grabbing' : ''}`}
    >
      <div data-part="card-header" className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            data-part="open"
            aria-haspopup="dialog"
            draggable={false}
            onClick={(event) => {
              event.stopPropagation();
              onOpen(row);
            }}
            className={`${TITLE_BUTTON} text-[13px] font-semibold text-ink`}
          >
            {row.title}
          </button>
          <PartOf row={row} />
        </div>
        {canMove ? (
          <MoveToMenu name={row.title} disabled={moveDisabled} note={moveNote} targets={targets} onChoose={(to) => onMove(row, to, true)} />
        ) : null}
      </div>
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
        <span data-field="mrr" className={`${MONO} text-[13px] text-ink`}>
          {formatCompactMoney(row.mrr, currency)}
        </span>
        {row.signal?.kind === 'high_priority' ? null : <PriorityTag priority={row.priority} />}
        <span data-field="department" className="min-w-0 truncate text-[11px] text-ink-muted">
          {row.department.label || 'Whole company'}
        </span>
        <DateLine text={dateText(kind, row.date, row.open)} overdue={row.overdue} />
        <PipelineSignal signal={row.signal} />
      </div>
    </li>
  );
}

export const PipelineCard = memo(PipelineCardView);
