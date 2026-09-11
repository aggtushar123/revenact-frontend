/**
 * The shared "no data yet" states for the Health Overview tabs.
 *
 * All four read the same book, so they fail and load the same ways; keeping the
 * wording in one place stops four tabs describing the same outage differently.
 */
export function HealthLoading() {
  return (
    <p className="px-2 py-10 text-center text-[13px] text-ink-faint">Loading account health…</p>
  );
}

export function HealthError({ message }: { message: string }) {
  return (
    <div className="px-2 py-10 text-center">
      <p className="text-[13px] font-bold text-danger">{message}</p>
      <p className="text-[12px] text-ink-faint mt-1">
        Nothing is shown rather than a partial picture — every tab here counts
        the whole book.
      </p>
    </div>
  );
}

export function HealthEmpty() {
  return (
    <p className="px-2 py-10 text-center text-[13px] text-ink-faint">
      No accounts to show yet.
    </p>
  );
}

export function HealthTruncatedNotice() {
  return (
    <p className="px-2 text-[11px] text-warning font-semibold">
      Showing the first accounts only — this book is larger than this screen
      loads in one request, so the figures below cover part of it.
    </p>
  );
}
