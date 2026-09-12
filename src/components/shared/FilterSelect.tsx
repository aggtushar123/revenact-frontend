// The filter chip every dashboard filter bar is built from — Ticket Overview's
// and AI Trending Topics' both. Lived inside TicketOverviewContainer until the
// second bar needed exactly the same control; a copy would have drifted the
// first time one of them changed its active styling.

export interface FilterOption {
  value: string;
  label: string;
}

/** A labelled group of options, rendered as an `<optgroup>`. */
export interface FilterGroup {
  label: string;
  options: FilterOption[];
}

/** A native `<select>` styled as the chip the bar already looked like.
 * Native rather than a custom popover so it stays keyboard-accessible
 * and behaves correctly on touch, and because the value it shows
 * doubles as the "All" suffix the original design called for. */
export function FilterSelect({
  label,
  value,
  selected,
  onChange,
  options,
}: {
  label: string;
  value: string;
  selected: string;
  onChange: (value: string) => void;
  /** Flat options, or groups of them — a grouped list renders `<optgroup>`s,
   *  which is how one chip can offer organisations and accounts at once. */
  options: (FilterOption | FilterGroup)[];
}) {
  const isActive = value !== 'All';

  return (
    <label className="relative flex items-center h-full group cursor-pointer">
      <span className="sr-only">{label}</span>
      <span
        className={`flex items-center gap-1 px-2 text-[12.5px] font-bold whitespace-nowrap border-b-[2px] h-full transition-all ${
          isActive
            ? 'border-accent text-accent bg-accent-dim/20'
            : 'border-transparent text-ink-muted group-hover:text-ink group-hover:bg-subtle/50'
        }`}
      >
        {label}
        <span
          className={`ml-1 text-[11px] font-normal ${isActive ? 'text-accent' : 'text-ink-faint'}`}
        >
          {value}
        </span>
      </span>
      <select
        aria-label={label}
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      >
        {options.map((option) =>
          'options' in option ? (
            <optgroup key={option.label} label={option.label}>
              {option.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}
