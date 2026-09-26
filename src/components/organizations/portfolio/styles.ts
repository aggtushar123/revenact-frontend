// Shared class strings for the portfolio components, so the focus ring and
// the quiet bordered button are written once.

export const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/** The quiet bordered button (toolbar, selection bar). */
export const BUTTON = `inline-flex min-h-11 sm:min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-subtle active:bg-line-subtle disabled:opacity-50 ${FOCUS}`;
