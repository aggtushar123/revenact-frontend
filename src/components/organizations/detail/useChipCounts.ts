import { useMemo } from 'react';
import { useAppSelector } from '../../../hooks';
import type { Account } from '../../../features/customers/customersSlice';
import { countByAccount } from '../../../features/organizations/accountScope';
import type { DetailTab } from '../../../features/organizations/detailParams';
import { listScope } from '../../../lib/listScope';

/** The account chips' numbers on the active tab (spec 2026-09-27 §1): the
 *  story's own facet counts on Story; people, opportunities plus risks, and
 *  files plus calls on the other three, counted from the lists those tabs
 *  read. Null while a list loads, after it failed, or while its slot holds
 *  another organization's records, so a chip shows no number rather than a
 *  wrong one, and on Details and Knowledge. */
export function useChipCounts(
  tab: DetailTab,
  storyCounts: Record<string, number> | null,
  accounts: Account[],
  customerId: number,
): Record<string, number> | null {
  const scope = listScope(customerId);
  const contacts = useAppSelector((state) => state.customers.contacts);
  const contactsReady = useAppSelector(
    (state) => state.customers.contactsFor === scope && !state.customers.contactsLoading && state.customers.contactsError === null,
  );
  const opportunities = useAppSelector((state) => state.customers.pipelineOpportunities);
  const risks = useAppSelector((state) => state.customers.pipelineRisks);
  const dealsReady = useAppSelector(
    (state) =>
      state.customers.pipelineOpportunitiesFor === scope &&
      state.customers.pipelineRisksFor === scope &&
      !state.customers.pipelineOpportunitiesLoading &&
      !state.customers.pipelineRisksLoading &&
      state.customers.pipelineOpportunitiesError === null &&
      state.customers.pipelineRisksError === null,
  );
  const files = useAppSelector((state) => state.files.items);
  const calls = useAppSelector((state) => state.calls.items);
  const filesReady = useAppSelector(
    (state) =>
      state.files.scope === scope &&
      state.calls.scope === scope &&
      !state.files.isLoading &&
      !state.calls.isLoading &&
      state.files.error === null &&
      state.calls.error === null,
  );

  return useMemo(() => {
    const ids = accounts.map((account) => account.id);
    switch (tab) {
      case 'story':
        return storyCounts;
      case 'people':
        return contactsReady ? countByAccount(contacts, ids) : null;
      case 'deals':
        return dealsReady ? countByAccount([...opportunities, ...risks], ids) : null;
      case 'files':
        return filesReady ? countByAccount([...files, ...calls], ids) : null;
      default:
        return null;
    }
  }, [tab, storyCounts, accounts, contacts, contactsReady, opportunities, risks, dealsReady, files, calls, filesReady]);
}
