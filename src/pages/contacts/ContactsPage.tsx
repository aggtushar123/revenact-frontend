import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ContactFormModal } from '../../components/contacts/ContactFormModal';
import { ContactList } from '../../components/contacts/ContactList';
import { ContactProfile } from '../../components/contacts/ContactProfile';
import { ContactsToolbar } from '../../components/contacts/ContactsToolbar';
import { EmptyState } from '../../components/organizations/portfolio/PortfolioSections';
import { FOCUS } from '../../components/organizations/portfolio/styles';
import {
  NO_FILTERS,
  contactsApiPath,
  hasFilters,
  parseContactsParams,
  toContactsSearch,
  type ContactsParams,
} from '../../features/contacts/contactsParams';
import { fetchAllContacts, fetchCustomers, loadMoreContacts } from '../../features/customers/customersSlice';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { MD, SM, useMediaQuery } from '../../lib/useMediaQuery';
import { ContactsFrame } from './ContactsFrame';

const BACK = `-ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-ink-muted hover:bg-subtle hover:text-ink active:bg-line-subtle ${FOCUS}`;

// The page's own column, full width but capped (fix round 1, 2026-09-28):
// same cap as the organisation page's (Details.tsx's PAGE_COLUMN), so
// Contacts reads as one family with it rather than stretching edge to edge
// on very wide screens.
const COLUMN = 'mx-auto w-full max-w-[1800px]';

/** The Contacts page (spec 2026-09-28 §3): the summary line and filters, a
 *  list of people on the left and the chosen person's profile on the right.
 *  `/contacts/:id` chooses them; the filters live in the URL (`q`,
 *  `customer`, `account`, `sentiment`, `role`). On phones the list is full
 *  width and a person opens as their own screen with a back link. */
export function ContactsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const selectedId = id && /^[1-9]\d*$/.test(id) ? Number(id) : null;
  const isMd = useMediaQuery(MD);
  const isSm = useMediaQuery(SM);
  const [search, setSearch] = useSearchParams();
  const params = useMemo(() => parseContactsParams(search), [search]);
  const query = toContactsSearch(params).toString();
  const apiPath = contactsApiPath(params);
  const [refresh, setRefresh] = useState(0);
  const [adding, setAdding] = useState(false);
  const {
    customers,
    allContacts,
    allContactsCount,
    allContactsNext,
    allContactsLoading,
    allContactsError,
    allContactsSummary,
    allContactsLoadingMore,
    allContactsMoreError,
  } = useAppSelector((state) => state.customers);

  useEffect(() => {
    void dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchAllContacts(apiPath));
  }, [dispatch, apiPath, refresh]);

  const organisations = useMemo(() => customers.map((c) => ({ id: c.id, name: c.name })), [customers]);
  const organisationName =
    allContacts.find((c) => c.organisation && String(c.organisation.id) === params.customer)?.organisation?.name ?? null;

  const change = useCallback(
    (next: ContactsParams, replace = false) => setSearch(toContactsSearch(next), { replace }),
    [setSearch],
  );
  const suffix = query ? `?${query}` : '';
  const listPath = { pathname: '/contacts', search: suffix };
  const linkFor = (personId: number) => ({ pathname: `/contacts/${personId}`, search: suffix });

  const toolbar = (
    <ContactsToolbar
      params={params}
      summary={allContactsSummary}
      organisations={organisations}
      organisationName={organisationName}
      isSm={isSm}
      onChange={change}
      onAdd={() => setAdding(true)}
    />
  );
  const list = (
    <ContactList
      rows={allContacts}
      count={allContactsCount}
      loading={allContactsLoading}
      error={allContactsError}
      filtered={hasFilters(params)}
      next={allContactsNext}
      loadingMore={allContactsLoadingMore}
      moreError={allContactsMoreError}
      selectedId={selectedId}
      linkFor={linkFor}
      onRetry={() => setRefresh((n) => n + 1)}
      onClear={() => change(NO_FILTERS)}
      onMore={() => {
        if (allContactsNext) void dispatch(loadMoreContacts(allContactsNext));
      }}
    />
  );
  const profile =
    selectedId !== null ? (
      <ContactProfile
        key={selectedId}
        id={selectedId}
        onDeleted={() => {
          navigate(listPath);
          setRefresh((n) => n + 1);
        }}
      />
    ) : (
      <EmptyState title="Choose a person" detail="Their sentiment and why, and their calls, emails and tickets, show here." action={null} />
    );

  let body;
  if (!isMd && selectedId !== null) {
    body = (
      <div className="flex flex-col gap-2 pb-4">
        <Link to={listPath} className={BACK}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Contacts
        </Link>
        {profile}
      </div>
    );
  } else if (!isMd) {
    body = (
      <div className="flex flex-col gap-3 pb-4">
        {toolbar}
        {list}
      </div>
    );
  } else {
    body = (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {toolbar}
        <div className="flex min-h-0 flex-1 gap-3">
          <div data-pane="list" className="w-[22rem] shrink-0 overflow-y-auto lg:w-[26rem]">
            {list}
          </div>
          <section aria-label="Profile" data-pane="profile" className="min-w-0 flex-1 overflow-y-auto">
            {profile}
          </section>
        </div>
      </div>
    );
  }

  return (
    <ContactsFrame>
      <div data-part="column" className={`${COLUMN} flex min-h-0 flex-1 flex-col`}>
        {body}
      </div>
      {adding ? (
        <ContactFormModal companies={organisations} onClose={() => setAdding(false)} onSaved={() => setRefresh((n) => n + 1)} />
      ) : null}
    </ContactsFrame>
  );
}
