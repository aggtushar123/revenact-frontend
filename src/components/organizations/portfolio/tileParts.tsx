import { useId, type ReactNode } from 'react';
import { FOCUS } from './styles';

/** A group named by its heading, not a region: five tiles as landmarks
 *  would crowd a screen reader's landmark list. */
export function Tile({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId} className="min-w-[15rem] shrink-0 snap-start rounded-xl bg-surface p-3 sm:min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-md bg-subtle p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-11 sm:min-h-6 rounded px-1.5 text-[11px] font-semibold ${FOCUS} ${
            value === option.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function FilterButton({
  pressed,
  onClick,
  compact = false,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex w-full min-w-0 min-h-11 ${compact ? 'sm:min-h-6' : 'sm:min-h-7'} items-center justify-between gap-2 rounded-md px-1.5 text-[11px] hover:bg-subtle active:bg-line-subtle ${FOCUS} ${
        pressed ? 'bg-subtle font-semibold text-ink' : 'text-ink-muted'
      }`}
    >
      {children}
    </button>
  );
}

/** A whole tile body as one filter toggle (Renewing, Closing, Overdue, …). */
export function TileButton({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`-m-1 block w-full rounded-lg p-1 text-left hover:bg-subtle active:bg-line-subtle ${FOCUS} ${pressed ? 'bg-subtle' : ''}`}
    >
      {children}
    </button>
  );
}

export function TilesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading summary" className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-2 @min-[50rem]:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden="true" className="min-w-[15rem] shrink-0 rounded-xl bg-surface p-3 sm:min-w-0">
          <span className="block h-2.5 w-16 animate-pulse rounded bg-subtle" />
          <span className="mt-3 block h-5 w-20 animate-pulse rounded bg-subtle" />
          <span className="mt-3 block h-2 w-full animate-pulse rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}
