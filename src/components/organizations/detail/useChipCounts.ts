import { useMemo } from 'react';
import { useAppSelector } from '../../../hooks';
import type { Account } from '../../../features/customers/customersSlice';
import { countByAccount } from '../../../features/organizations/accountScope';
import type { DetailTab } from '../../../features/organizations/detailParams';

/** The account chips' numbers on the active tab (spec 2026-09-27 §1): the
 *  story's own facet counts on Story; people, opportunities plus risks, and
 *  files plus calls on the other three, counted from the lists those tabs
 *  read. Null while a list loads or after it failed, so a chip shows no
 *  number rather than a wrong one, and on Details and Knowledge. */
export function useChipCounts(
  tab: DetailTab,
  storyCounts: Record<string, number> | null,
  accounts: Account[],
): Record<string, number> | null {
  const contacts = useAppSelector((state) => state.customers.contacts);
  const contactsBusy = useAppSelector((state) => state.customers.contactsLoading || state.customers.contactsError !== null);
  const opportunities = useAppSelector((state) => state.customers.pipelineOpportunities);
  const risks = useAppSelector((state) => state.customers.pipelineRisks);
  const dealsBusy = useAppSelector(
    (state) =>
      state.customers.pipelineOpportunitiesLoading ||
      state.customers.pipelineRisksLoading ||
      state.customers.pipelineOpportunitiesError !== null ||
      state.customers.pipelineRisksError !== null,
  );
  const files = useAppSelector((state) => state.files.items);
  const calls = useAppSelector((state) => state.calls.items);
  const filesBusy = useAppSelector(
    (state) => state.files.isLoading || state.calls.isLoading || state.files.error !== null || state.calls.error !== null,
  );

  return useMemo(() => {
    const ids = accounts.map((account) => account.id);
    switch (tab) {
      case 'story':
        return storyCounts;
      case 'people':
        return contactsBusy ? null : countByAccount(contacts, ids);
      case 'deals':
        return dealsBusy ? null : countByAccount([...opportunities, ...risks], ids);
      case 'files':
        return filesBusy ? null : countByAccount([...files, ...calls], ids);
      default:
        return null;
    }
  }, [tab, storyCounts, accounts, contacts, contactsBusy, opportunities, risks, dealsBusy, files, calls, filesBusy]);
}
