// Shared class strings for the portfolio components, so the focus ring and
// the quiet bordered button are written once.

export const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/** The quiet bordered button (toolbar, selection bar). */
export const BUTTON = `inline-flex min-h-11 sm:min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-subtle active:bg-line-subtle disabled:opacity-50 ${FOCUS}`;

/** The quiet borderless button (Try again, Show more, empty-state actions). */
export const QUIET = `inline-flex min-h-11 sm:min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-ink hover:bg-subtle active:bg-line-subtle disabled:opacity-50 ${FOCUS}`;

/** The monochrome primary button (one per surface): accent fill, its own
 *  text colour. Written out rather than layered on BUTTON, whose surface
 *  fill and ink text would win in the stylesheet's order. */
export const PRIMARY = `inline-flex min-h-11 sm:min-h-9 items-center gap-1.5 rounded-lg border border-accent bg-accent px-3 text-[13px] font-semibold text-on-accent hover:bg-accent-hover active:bg-accent-hover disabled:opacity-50 ${FOCUS}`;
