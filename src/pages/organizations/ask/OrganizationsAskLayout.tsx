import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { surfaceLabel } from '../../../components/copilot/surfaceLabels';
import { ORGANIZATIONS_ASK_KEY } from '../../dashboard/ask/askPreference';
import { AskProvider } from '../../dashboard/ask/AskProvider';
import type { AskSurface } from '../../dashboard/ask/context';
import { PortfolioOptionsContext, type PortfolioOptions } from './portfolioOptions';
import { useOrganizationsContext } from './useOrganizationsContext';

/** The Organizations routes' Ask (spec §3): one conversation above the List
 *  and the Board, so it survives the tab switch and every filter. Each page
 *  mounts the rail (and with it the pill) in OrganizationsFrame's rail slot. */
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
        <Outlet />
      </AskProvider>
    </PortfolioOptionsContext.Provider>
  );
}
