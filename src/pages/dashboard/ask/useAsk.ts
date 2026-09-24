import { useContext } from 'react';
import { AskContext, type AskState } from './context';

/** The dashboard's Ask rail, or null outside DashboardFrame (a view or list
 *  rendered on its own in a test), where the entry points hide themselves. */
export function useAsk(): AskState | null {
  return useContext(AskContext);
}
