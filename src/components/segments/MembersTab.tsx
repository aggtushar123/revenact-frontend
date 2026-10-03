import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { Contact } from '../../features/customers/customersSlice';
import { formatCompactMoney } from '../../features/customers/formatters';
import type { PortfolioGroup, PortfolioRowBase } from '../../features/organizations/portfolioTypes';
import { fetchMembers, setMemberState } from '../../features/segments/segmentApi';
import { KIND_NOUN } from '../../features/segments/segmentFields';
import {
  MEMBERS_PAGE_SIZE,
  memberGroupOptions,
  membersQuery,
  memberSortOptions,
  type SegmentPageParams,
} from '../../features/segments/segmentParams';
import type { MemberState, MemberStateValue, Segment, SegmentMembersPage } from '../../features/segments/segmentTypes';
import { memberCountText } from '../../features/segments/summaryFigures';
import { useOrgCurrency } from '../../hooks';
import { SM, useMediaQuery } from '../../lib/useMediaQuery';
import { ACCOUNT_KIND } from '../accounts/portfolio/accountKind';
import { ContactListItem } from '../contacts/ContactListItem';
import { LIST } from '../organizations/detail/listStyles';
import { AccountRow } from '../organizations/portfolio/AccountRow';
import { AccountSheet } from '../organizations/portfolio/AccountSheet';
import { GroupSortFields } from '../organizations/portfolio/filterParts';
import { ORGANIZATION_KIND } from '../organizations/portfolio/organizationKind';
import { PortfolioKindContext, usePortfolioKind } from '../organizations/portfolio/portfolioKind';
import { EmptyState, ErrorBlock, ItemSkeleton, MoreButton, PagedSections } from '../organizations/portfolio/PortfolioSections';
import { ToolbarSearch } from '../organizations/portfolio/toolbarParts';
import { usePagedBook } from '../organizations/portfolio/usePagedBook';
import { errorMessage, usePagedRead } from '../organizations/portfolio/usePagedRead';
import { MONO } from '../organizations/portfolio/styles';
import { SECTION_PAGE_SIZE } from '../organizations/portfolio/usePortfolio';
import { useSearchText } from '../organizations/portfolio/useSearchText';
import { KeptOut } from './KeptOut';
import { MemberMenu } from './MemberMenu';

type MenuFor = (id: number, name: string) => ReactNode;
const noop = () => {};

/** The Contacts list's own surface, without `overflow-hidden`: a row menu
 *  hangs below its button and must not be clipped (Ruling G13). */
const MEMBER_LIST = LIST.replace(/\s*\boverflow-hidden\b/, '');

function emptyMembers(search: string): ReactNode {
  return search ? (
    <EmptyState title={`No members match "${search}"`} detail="Try another name." action={null} />
  ) : (
    <EmptyState title="No members yet" detail="Nobody matches the rules today. Edit the rules, or pin a record." action={null} />
  );
}

function MembersToolbar({ segment, params, update }: { segment: Segment; params: SegmentPageParams; update: (patch: Partial<SegmentPageParams>) => void }) {
  const isSm = useMediaQuery(SM);
  const searchRef = useRef<HTMLInputElement>(null);
  const commit = useCallback((search: string) => update({ search }), [update]);
  const [text, setText] = useSearchText(params.search, commit);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToolbarSearch label="Search members by name" searchRef={searchRef} value={text} onChange={setText} isSm={isSm} />
      {segment.kind !== 'contact' ? (
        <GroupSortFields
          group={params.group || 'none'}
          sort={params.sort}
          groupOptions={memberGroupOptions(segment.kind)}
          sortOptions={memberSortOptions(segment.kind)}
          onGroup={(group) => update({ group: group === 'none' ? '' : group })}
          onSort={(sort) => update({ sort })}
        />
      ) : null}
    </div>
  );
}

/** Organisations and accounts: the kind's own rows, groups and opened-row
 *  panels (inline from sm, a sheet on phones), never selectable. */
function PortfolioMemberList({ segment, params, version, menu }: { segment: Segment; params: SegmentPageParams; version: number; menu: MenuFor }) {
  const kind = usePortfolioKind();
  const isSm = useMediaQuery(SM);
  const orgCurrency = useOrgCurrency();
  const grouped = params.group !== '';
  const noun = KIND_NOUN[segment.kind];
  const read = useCallback((query: string) => fetchMembers<PortfolioRowBase>(segment.id, query), [segment.id]);
  const frameQuery = membersQuery(params, segment.kind, { limit: grouped ? '1' : String(MEMBERS_PAGE_SIZE) });
  const book = usePagedBook<PortfolioRowBase, SegmentMembersPage<PortfolioRowBase>>(read, noun, frameQuery, grouped, version, undefined, null, 0);
  const [openRow, setOpenRow] = useState<PortfolioRowBase | null>(null);
  const currency = book.data?.currency ?? orgCurrency;

  const renderRow = (row: PortfolioRowBase) => {
    const open = openRow?.id === row.id;
    return (
      <AccountRow
        key={row.id}
        row={row}
        currency={currency}
        pins={[]}
        isSm={isSm}
        selectable={false}
        selecting={false}
        selected={false}
        open={open}
        onToggleSelect={noop}
        onLongPress={noop}
        onToggleOpen={(r) => setOpenRow((current) => (current?.id === r.id ? null : r))}
        menu={menu(row.id, row.name)}
      >
        {open && isSm ? kind.renderDetails({ row, currency, id: `account-${row.id}-details` }) : null}
      </AccountRow>
    );
  };

  return (
    <div className="@container flex flex-col gap-2">
      {book.data ? (
        <p data-part="member-count" role="status" aria-live="polite" className={`${MONO} text-[13px] text-ink-muted`}>
          {memberCountText(book.data.count, book.data.summary.members, params.search, segment.kind)}
        </p>
      ) : null}
      <PagedSections<PortfolioRowBase, SegmentMembersPage<PortfolioRowBase>, PortfolioGroup>
        book={book}
        read={read}
        noun={noun}
        grouped={grouped}
        listHeading="Members"
        sectionQuery={(groupKey) => membersQuery(params, segment.kind, { group_value: groupKey, limit: String(SECTION_PAGE_SIZE) })}
        version={version}
        groupMoney={(group) => formatCompactMoney(group.arr, currency)}
        renderRow={renderRow}
        onRowsLoaded={noop}
        empty={emptyMembers(params.search)}
        skeleton={(n) => <ItemSkeleton count={n} label="Loading members" />}
      />
      {!isSm && openRow ? <AccountSheet row={openRow} currency={currency} onClose={() => setOpenRow(null)} /> : null}
    </div>
  );
}

/** Contacts: the Contacts list's own rows, by name, with Show more. */
function ContactMemberList({ segment, params, version, menu }: { segment: Segment; params: SegmentPageParams; version: number; menu: MenuFor }) {
  const read = useCallback((query: string) => fetchMembers<Contact>(segment.id, query), [segment.id]);
  const page = usePagedRead<Contact, SegmentMembersPage<Contact>>(
    read,
    KIND_NOUN.contact,
    membersQuery(params, 'contact', { limit: String(MEMBERS_PAGE_SIZE) }),
    true,
    version,
  );
  if (!page.data && page.error) return <ErrorBlock message={page.error} onRetry={page.retry} />;
  if (!page.data) return <ItemSkeleton count={6} label="Loading members" />;
  if (page.data.count === 0) return <>{emptyMembers(params.search)}</>;
  return (
    <div className="flex flex-col gap-2">
      <p data-part="member-count" role="status" aria-live="polite" className={`${MONO} text-[13px] text-ink-muted`}>
        {memberCountText(page.data.count, page.data.summary.members, params.search, 'contact')}
      </p>
      <ul aria-label="Members" aria-busy={page.loading} className={MEMBER_LIST}>
        {page.rows.map((contact) => (
          <ContactListItem key={contact.id} contact={contact} to={`/contacts/${contact.id}`} selected={false} actions={menu(contact.id, contact.name)} />
        ))}
      </ul>
      <MoreButton next={page.next} loading={page.loadingMore} error={page.moreError} label="Show more members" onClick={() => void page.loadMore()} />
    </div>
  );
}

/** A segment's Members tab (spec §3): the kind's own list rows, search,
 *  sort and grouping; for the owner, Pin and Keep out in each row's menu and
 *  the Kept out list. The kind picks the rows here and only here (plan
 *  Decision 8). */
export function MembersTab({
  segment,
  params,
  update,
  version,
  onChanged,
  onNotice,
}: {
  segment: Segment;
  params: SegmentPageParams;
  update: (patch: Partial<SegmentPageParams>) => void;
  version: number;
  onChanged: (state: MemberState) => void;
  onNotice: (message: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const stateOf = (id: number): MemberStateValue =>
    segment.pinned_ids.includes(id) ? 'pinned' : segment.excluded_ids.includes(id) ? 'excluded' : 'none';
  const choose = async (recordId: number, state: MemberStateValue) => {
    setBusy(true);
    onNotice(null);
    try {
      onChanged(await setMemberState(segment.id, recordId, state));
    } catch (err) {
      onNotice(errorMessage(err, 'Could not change this member.'));
    } finally {
      setBusy(false);
    }
  };
  // Owner only (the backend refuses anyone else with a 403).
  const menu: MenuFor = (id, name) =>
    segment.is_owner ? <MemberMenu name={name} state={stateOf(id)} disabled={busy} onChoose={(state) => void choose(id, state)} /> : null;
  const portfolioKind = (segment.kind === 'customer' ? ORGANIZATION_KIND : ACCOUNT_KIND);

  return (
    <div role="tabpanel" aria-label="Members" className="flex flex-col gap-3">
      <MembersToolbar segment={segment} params={params} update={update} />
      {segment.kind === 'contact' ? (
        <ContactMemberList segment={segment} params={params} version={version} menu={menu} />
      ) : (
        <PortfolioKindContext.Provider value={portfolioKind}>
          <PortfolioMemberList segment={segment} params={params} version={version} menu={menu} />
        </PortfolioKindContext.Provider>
      )}
      {segment.is_owner && segment.excluded_ids.length > 0 ? (
        <KeptOut segment={segment} disabled={busy} onLetBackIn={(id) => void choose(id, 'none')} />
      ) : null}
    </div>
  );
}
