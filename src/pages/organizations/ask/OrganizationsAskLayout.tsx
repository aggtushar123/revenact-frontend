import { useCallback, useState } from 'react';
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
  const surface: AskSurface = {
    name: 'organizations',
    context,
    chipLabel: (asked) => surfaceLabel(asked, { organizations: options }),
  };
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
