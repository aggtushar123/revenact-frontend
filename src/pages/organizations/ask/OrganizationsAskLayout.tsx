import { useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { surfaceLabel } from '../../../components/copilot/surfaceLabels';
import { ORGANIZATIONS_ASK_KEY } from '../../dashboard/ask/askPreference';
import { AskProvider } from '../../dashboard/ask/AskProvider';
import { AskRail } from '../../dashboard/ask/AskRail';
import type { AskSurface } from '../../dashboard/ask/context';
import { OrganizationsFrame } from '../OrganizationsFrame';
import { PortfolioOptionsContext, type PortfolioOptions } from './portfolioOptions';
import { useOrganizationsContext } from './useOrganizationsContext';

/** The Organizations routes' Ask (spec §3): one conversation above the List
 *  and the Board, so it survives the tab switch and every filter. The frame
 *  and its rail (with the pill) sit here too, beside the Outlet, so the rail
 *  is never remounted by the List/Board swap: react-router applies that swap
 *  in a transition, after a History pick's conversation has already shown. */
export function OrganizationsAskLayout() {
  const context = useOrganizationsContext();
  const [options, setOptions] = useState<PortfolioOptions | null>(null);
  const report = useCallback((next: PortfolioOptions) => {
    setOptions((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, []);
  // Stable across renders that don't change `context` or `options`, so
  // AskProvider's value doesn't churn on every unrelated render (spec:
  // a send must not re-render the whole List).
  const chipLabel = useCallback((asked: Parameters<AskSurface['chipLabel']>[0]) => surfaceLabel(asked, { organizations: options }), [options]);
  const surface: AskSurface = useMemo(() => ({ name: 'organizations', context, chipLabel }), [context, chipLabel]);
  return (
    <PortfolioOptionsContext.Provider value={report}>
      <AskProvider surface={surface} preferenceKey={ORGANIZATIONS_ASK_KEY}>
        <OrganizationsFrame rail={<AskRail />}>
          <Outlet />
        </OrganizationsFrame>
      </AskProvider>
    </PortfolioOptionsContext.Provider>
  );
}
