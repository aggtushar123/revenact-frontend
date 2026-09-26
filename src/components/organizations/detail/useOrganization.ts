import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/apiClient';
import type { Customer } from '../../../features/customers/customersSlice';
import { fetchPortfolio } from '../../../features/organizations/portfolioApi';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { errorMessage } from '../portfolio/usePortfolio';

type RowLoad = { key: string; row: PortfolioRow | null } | { key: string; error: string };
type CustomerLoad = { key: string; customer: Customer } | { key: string; error: string };

export interface OrganizationState {
  /** The List's row for this organization; null until it lands, or when not
   *  found. The last one that landed stays while a reload runs or fails. */
  row: PortfolioRow | null;
  /** GET /customers/{id}/: the health breakdown and the edit form's record. */
  customer: Customer | null;
  /** The row for the current id and version has not landed (or failed) yet. */
  loading: boolean;
  /** Not a number, or the portfolio has no such row for this viewer. */
  notFound: boolean;
  error: string | null;
  customerError: string | null;
  retry: () => void;
}

/** The header's two reads (spec §2 "Header"), fired together: the portfolio
 *  row by `ids` (archived and churned rows included) and the customer. A new
 *  `version` (after an edit, churn or archive) reloads both while the old row
 *  stays on screen; a row for another id never shows. */
export function useOrganization(id: number | null, version: number): OrganizationState {
  const [attempt, setAttempt] = useState(0);
  const key = `${id}#${version}#${attempt}`;
  const [rowLoad, setRowLoad] = useState<RowLoad | null>(null);
  // The last row that landed: it stays on screen while a new version reloads
  // and after a reload fails, so a failed refresh never blanks the page.
  const [lastRow, setLastRow] = useState<PortfolioRow | null>(null);
  const [customerLoad, setCustomerLoad] = useState<CustomerLoad | null>(null);

  useEffect(() => {
    if (id === null) return;
    let cancelled = false;
    const query = new URLSearchParams({ ids: String(id), include_churned: '1', limit: '1' }).toString();
    fetchPortfolio(query).then(
      (data) => {
        if (cancelled) return;
        const found = data.results.find((row) => row.id === id) ?? null;
        setRowLoad({ key, row: found });
        setLastRow(found);
      },
      (err: unknown) => {
        if (!cancelled) setRowLoad({ key, error: errorMessage(err, 'Could not load this organization.') });
      },
    );
    apiFetch<Customer>(`/customers/${id}/`).then(
      (customer) => {
        if (!cancelled) setCustomerLoad({ key, customer });
      },
      (err: unknown) => {
        if (!cancelled) setCustomerLoad({ key, error: errorMessage(err, 'Could not load the health breakdown.') });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const shown = rowLoad && 'row' in rowLoad ? rowLoad : null;
  const row = lastRow && lastRow.id === id ? lastRow : null;
  const customer = customerLoad && 'customer' in customerLoad && customerLoad.customer.id === id ? customerLoad.customer : null;
  return {
    row,
    customer,
    loading: id !== null && rowLoad?.key !== key,
    notFound: id === null || (shown !== null && shown.key === key && shown.row === null),
    error: rowLoad && 'error' in rowLoad && rowLoad.key === key ? rowLoad.error : null,
    customerError: customerLoad && 'error' in customerLoad && customerLoad.key === key ? customerLoad.error : null,
    retry,
  };
}
