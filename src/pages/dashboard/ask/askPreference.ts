export const ASK_PREFERENCE_KEY = 'revenact_dashboard_ask';

/** The person's own open/closed choice for the rail, or null before one. A
 *  private window or blocked storage reads as "no choice", so the default
 *  (open from xl) applies. */
export function readAskPreference(): boolean | null {
  try {
    const value = localStorage.getItem(ASK_PREFERENCE_KEY);
    return value === 'open' ? true : value === 'closed' ? false : null;
  } catch {
    return null;
  }
}

export function writeAskPreference(open: boolean): void {
  try {
    localStorage.setItem(ASK_PREFERENCE_KEY, open ? 'open' : 'closed');
  } catch {
    /* forgotten next visit; the default applies */
  }
}
