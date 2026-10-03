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
import { placeLabel, placeOf } from '../../features/contacts/contactsFormat';
import type { ContactsNames } from '../../features/contacts/askContext';
import { ErrorState } from '../dashboard/shared/DataState';
import {
  CONTACT_NOT_FOUND,
  fetchAllContacts,
  fetchCustomers,
  loadMoreContacts,
  refreshContactsSummary,
} from '../../features/customers/customersSlice';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { MD, SM, XL, useMediaQuery } from '../../lib/useMediaQuery';
import { ContactsFrame } from './ContactsFrame';
import { useReportContactsNames } from './ask/contactsNames';
import { useAsk } from '../dashboard/ask/useAsk';
import { useSaveAsSegment } from '../segments/useSaveAsSegment';

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
  const [saveAsSegment, saveAsSegmentModal] = useSaveAsSegment('contact');
  const { id } = useParams();
  const selectedId = id && /^[1-9]\d*$/.test(id) ? Number(id) : null;
  // /contacts/abc: an id no person can have reads as not found, not as "Choose a person".
  const badId = id !== undefined && selectedId === null;
  const isMd = useMediaQuery(MD);
  const isSm = useMediaQuery(SM);
  const isXl = useMediaQuery(XL);
  const ask = useAsk();
  // The rail beside the page takes 320px: two panes fit beside it only from
  // xl, the list narrowed (spec 2026-09-28 §4.4 "the list narrows and the
  // profile stays"). Below sm the rail is a sheet over the page.
  const railBeside = isSm && Boolean(ask?.open);
  const twoPanes = isMd && (!railBeside || isXl);
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
    selectedContact,
  } = useAppSelector((state) => state.customers);

  useEffect(() => {
    void dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchAllContacts(apiPath));
  }, [dispatch, apiPath, refresh]);

  const organisations = useMemo(() => customers.map((c) => ({ id: c.id, name: c.name })), [customers]);
  // A filter can match nobody on the page (a sentiment nobody there has), so
  // the name falls back to the loaded organisations list rather than reading
  // "Organisation" (fix round 2, controller review).
  const organisationName =
    allContacts.find((c) => c.organisation && String(c.organisation.id) === params.customer)?.organisation?.name ??
    organisations.find((o) => String(o.id) === params.customer)?.name ??
    null;
  const accountName =
    allContacts.find((c) => c.account && String(c.account.id) === params.account)?.account?.name ?? null;

  // What a live question's chip can name before the server has (spec
  // 2026-09-28 §4.4): the open person and the filtered organisation and
  // account, from what this page already knows.
  const names = useMemo<ContactsNames>(
    () => ({
      person:
        selectedId !== null && selectedContact?.id === selectedId
          ? { id: selectedId, name: selectedContact.name, place: placeLabel(placeOf(selectedContact)) }
          : null,
      organisation: params.customer && organisationName ? { id: Number(params.customer), name: organisationName } : null,
      account: params.account && accountName ? { id: Number(params.account), name: accountName } : null,
    }),
    [selectedId, selectedContact, params.customer, params.account, organisationName, accountName],
  );
  useReportContactsNames(names);

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
      onSaveAsSegment={() => saveAsSegment(query)}
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
  const profile = badId ? (
    <div className="rounded-xl bg-surface">
      <ErrorState message="Could not open this person" detail={CONTACT_NOT_FOUND} />
    </div>
  ) : selectedId !== null ? (
    <ContactProfile
      key={selectedId}
      id={selectedId}
      onDeleted={() => {
        navigate(listPath);
        setRefresh((n) => n + 1);
      }}
      onSaved={() => void dispatch(refreshContactsSummary(apiPath))}
    />
  ) : (
    <EmptyState title="Choose a person" detail="Their sentiment and why, and their calls, emails and tickets, show here." action={null} />
  );

  let body;
  if (!twoPanes && (selectedId !== null || badId)) {
    body = (
      <div className="flex flex-col gap-2 pb-4">
        <Link to={listPath} className={BACK}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Contacts
        </Link>
        {profile}
      </div>
    );
  } else if (!twoPanes) {
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
          <div data-pane="list" className={`${railBeside ? 'w-[18rem]' : 'w-[22rem] lg:w-[26rem]'} shrink-0 overflow-y-auto`}>
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
      {saveAsSegmentModal}
    </ContactsFrame>
  );
}
