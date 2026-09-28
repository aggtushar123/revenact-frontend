import { FOCUS } from '../portfolio/styles';

const CHIP = `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] sm:min-h-9 ${FOCUS}`;

/** A pressable chip with an optional count: the account chips and the
 *  story's filters. The chosen one is the monochrome primary. */
export function CountChip({
  label,
  count,
  pressed,
  onClick,
  dimmed = false,
  describedBy,
}: {
  label: string;
  /** Null until the story has counted: the chip shows no number. */
  count: number | null;
  pressed: boolean;
  onClick: () => void;
  /** Muted ink, and the chosen one outlined rather than filled: the chip
   *  still works but filters nothing here. */
  dimmed?: boolean;
  /** The id of a note that says why the chip is dimmed. */
  describedBy?: string;
}) {
  const look = dimmed
    ? `${pressed ? 'border-accent' : 'border-line'} bg-surface text-ink-muted hover:bg-subtle active:bg-line-subtle`
    : pressed
      ? 'border-accent bg-accent text-on-accent'
      : 'border-line bg-surface text-ink hover:bg-subtle active:bg-line-subtle';
  return (
    <button type="button" aria-pressed={pressed} aria-describedby={describedBy} onClick={onClick} className={`${CHIP} ${look}`}>
      <span className="max-w-[12rem] truncate">{label}</span>
      {count == null ? null : (
        <>
          {' '}
          <span className={`font-mono-brand text-[11px] tabular-nums ${pressed ? '' : 'text-ink-muted'}`}>{count}</span>
        </>
      )}
    </button>
  );
}
