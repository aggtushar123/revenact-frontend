/** A tab's content before the page's row lands. */
export function TabSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div key={i} aria-hidden="true" className="flex flex-col gap-2 rounded-xl bg-surface p-3">
          <span className="block h-3 w-32 animate-pulse rounded bg-subtle" />
          <span className="block h-3 w-full animate-pulse rounded bg-subtle" />
          <span className="block h-3 w-2/3 animate-pulse rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}

/** The name row and the four tiles before the page's row lands: a grid of
 *  four from sm, a strip on phones, as the tiles themselves. */
export function HeaderSkeleton({ isSm, label }: { isSm: boolean; label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      <div aria-hidden="true" className="flex items-center gap-3">
        <span className="h-11 w-11 animate-pulse rounded-full bg-subtle" />
        <span className="flex flex-col gap-1.5">
          <span className="block h-5 w-48 animate-pulse rounded bg-subtle" />
          <span className="block h-3 w-64 animate-pulse rounded bg-subtle" />
        </span>
      </div>
      <div aria-hidden="true" className={isSm ? 'grid grid-cols-4 gap-3' : 'flex gap-3 overflow-hidden'}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="block h-24 min-w-[11rem] animate-pulse rounded-xl bg-surface sm:min-w-0" />
        ))}
      </div>
    </div>
  );
}
