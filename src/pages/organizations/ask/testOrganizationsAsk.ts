import { vi } from 'vitest';
import { stubCopilot } from '../../../components/copilot/testCopilot';
import { stubPortfolio, type PortfolioStub } from '../../../features/organizations/testPortfolio';

/** Test-only. The portfolio's endpoints (stubPortfolio) and the Copilot's
 *  (stubCopilot) behind one fetch, so a page and its rail both answer.
 *  `copilot` is the spy postedBodies reads; `portfolio` the one
 *  portfolioQueries and patchBodies read. */
export function stubOrganizationsAsk(options: { copilot?: Parameters<typeof stubCopilot>[0]; portfolio?: PortfolioStub } = {}) {
  const copilot = stubCopilot(options.copilot);
  const portfolio = stubPortfolio(options.portfolio);
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    String(input).includes('/copilot/') ? copilot.spy(String(input), init) : portfolio(input, init),
  );
  vi.stubGlobal('fetch', spy);
  return { copilot: copilot.spy, portfolio, release: copilot.release };
}
