import { useEffect, useId, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { contactsSummaryParts } from '../../features/contacts/contactsFormat';
import { CONTACT_ROLES, SENTIMENTS, withFilter, type ContactsParams } from '../../features/contacts/contactsParams';
import type { ContactsSummary } from '../../features/contacts/contactsTypes';
import { apiFetch } from '../../lib/apiClient';
import { ListSearch, SummaryLine } from '../organizations/detail/ListParts';
import { FOCUS, PRIMARY } from '../organizations/portfolio/styles';

type Option = { id: number; name: string };

const SELECT = `min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-2 text-[15px] text-ink disabled:opacity-50 sm:min-h-9 sm:w-auto sm:max-w-[12rem] sm:text-[13px] ${FOCUS}`;

function Select({
  label,
  value,
  disabled = false,
  onChange,
  children,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </label>
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={SELECT}>
        {children}
      </select>
    </div>
  );
}

type Loaded<T> = { for: string; value: T };

/** The name of an organisation a deep link chose that is not on the first
 *  page of options, read by id (GET /customers/<id>/); null when it cannot
 *  be read, undefined while it is being read or not needed. */
function useOrganisationName(customer: string, needed: boolean): string | null | undefined {
  const [loaded, setLoaded] = useState<Loaded<string | null>>({ for: '', value: null });
  useEffect(() => {
    if (!needed) return;
    let cancelled = false;
    apiFetch<Option>(`/customers/${customer}/`)
      .then((row) => {
        if (!cancelled) setLoaded({ for: customer, value: row?.name ?? null });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ for: customer, value: null });
      });
    return () => {
      cancelled = true;
    };
  }, [customer, needed]);
  return needed && loaded.for === customer ? loaded.value : undefined;
}

/** The accounts of the chosen organisation, read when it changes (null
 *  until then). A failed read leaves only "All accounts". */
function useAccounts(customer: string): Option[] | null {
  const [loaded, setLoaded] = useState<{ for: string; rows: Option[] }>({ for: '', rows: [] });
  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    apiFetch<Option[]>(`/customers/${customer}/accounts/`)
      .then((rows) => {
        if (!cancelled) setLoaded({ for: customer, rows: Array.isArray(rows) ? rows : [] });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ for: customer, rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [customer]);
  if (!customer) return [];
  return loaded.for === customer ? loaded.rows : null;
}

/** The Contacts page's header (spec 2026-09-28 §3): the summary line, then
 *  search, the organisation, account, sentiment and role filters, and
 *  "+ Add". Every control writes the URL through `onChange`; the search
 *  waits 300 ms after the last key. */
export function ContactsToolbar({
  params,
  summary,
  organisations,
  organisationName,
  isSm,
  onChange,
  onAdd,
}: {
  params: ContactsParams;
  summary: ContactsSummary | null;
  /** The first page of /customers/ (fetchCustomers). */
  organisations: Option[];
  /** The chosen organisation's name when it is not on that page, from the
   *  list's rows; otherwise the toolbar reads it by id. */
  organisationName: string | null;
  isSm: boolean;
  /** `replace` for typing, so every key is not a history entry. */
  onChange: (next: ContactsParams, replace?: boolean) => void;
  onAdd: () => void;
}) {
  const [text, setText] = useState(params.q);
  const [lastQ, setLastQ] = useState(params.q);
  // The URL moved (Clear filters, Back): the box follows it.
  if (params.q !== lastQ) {
    setLastQ(params.q);
    setText(params.q);
  }
  useEffect(() => {
    if (text === params.q) return;
    const timer = setTimeout(() => onChange(withFilter(params, 'q', text), true), 300);
    return () => clearTimeout(timer);
  }, [text, params, onChange]);

  const accountRows = useAccounts(params.customer);
  const accounts = accountRows ?? [];
  const customerId = Number(params.customer);
  const accountId = Number(params.account);
  // A deep link can name an organisation past the first page of options,
  // or one that is gone; its option is named by reading it, never "Organisation 12".
  const orgMissing = !!params.customer && !organisations.some((o) => o.id === customerId);
  const fetchedName = useOrganisationName(params.customer, orgMissing && !organisationName);
  const orgLabel = organisationName ?? fetchedName ?? (fetchedName === null ? 'Organisation not found' : 'Loading…');
  const accountLabel = accountRows === null ? 'Loading…' : 'Account not found';
  const set = <K extends keyof ContactsParams>(key: K, value: ContactsParams[K]) => onChange(withFilter(params, key, value));

  return (
    <div className="flex flex-col gap-2">
      {summary ? <SummaryLine parts={contactsSummaryParts(summary)} /> : <p aria-hidden="true" className="h-5" />}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <ListSearch label="Search people" value={text} onChange={setText} isSm={isSm} />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select label="Organisation" value={params.customer} onChange={(value) => set('customer', value)}>
            <option value="">All organisations</option>
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
            {orgMissing ? <option value={params.customer}>{orgLabel}</option> : null}
          </Select>
          <Select label="Account" value={params.account} disabled={!params.customer} onChange={(value) => set('account', value)}>
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
            {params.account && !accounts.some((a) => a.id === accountId) ? (
              <option value={params.account}>{accountLabel}</option>
            ) : null}
          </Select>
          <Select label="Sentiment" value={params.sentiment} onChange={(value) => set('sentiment', value as ContactsParams['sentiment'])}>
            <option value="">Any sentiment</option>
            {SENTIMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <Select label="Role" value={params.role} onChange={(value) => set('role', value as ContactsParams['role'])}>
            <option value="">Any role</option>
            {CONTACT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <button type="button" onClick={onAdd} className={`${PRIMARY} justify-center sm:ml-auto`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
    </div>
  );
}
