import type { ReactNode } from 'react';
import { surfaceLabel } from '../../../components/copilot/surfaceLabels';
import { AskProvider } from './AskProvider';
import type { AskSurface } from './context';
import { useFilterNames } from './filterNames';
import { useDashboardContext } from './useDashboardContext';

/** The Dashboard's side of Ask: where the person is on it (read at send
 *  time, never figures), and chips named from the views' filter options.
 *  Sits inside FilterNamesProvider, where the old provider read the same. */
export function DashboardAskProvider({ children }: { children: ReactNode }) {
  const { context } = useDashboardContext();
  const names = useFilterNames();
  const surface: AskSurface = {
    name: 'dashboard',
    context,
    chipLabel: (asked) => surfaceLabel(asked, { dashboard: names }),
  };
  return <AskProvider surface={surface}>{children}</AskProvider>;
}
