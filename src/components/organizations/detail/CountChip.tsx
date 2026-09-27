import { FOCUS } from '../portfolio/styles';

const CHIP = `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] sm:min-h-9 ${FOCUS}`;

/** A pressable chip with an optional count: the account chips and the
 *  story's filters. The chosen one is the monochrome primary. */
export function CountChip({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  /** Null until the story has counted: the chip shows no number. */
  count: number | null;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`${CHIP} ${pressed ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-ink hover:bg-subtle active:bg-line-subtle'}`}
    >
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
