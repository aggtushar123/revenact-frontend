import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { SM, useMediaQuery } from '../../lib/useMediaQuery';
import { fetchAccountsForCustomer, type Account } from '../../features/customers/customersSlice';
import {
  DETAIL_TABS,
  detailPanelId,
  detailTabId,
  storyFilters,
  type DetailTab,
} from '../../features/organizations/detailParams';
import { bulkUpdate } from '../../features/organizations/portfolioApi';
import type { PanelKey } from '../../features/organizations/portfolioFields';
import { storyQuery } from '../../features/organizations/storyApi';
import { ChurnOrganizationModal } from '../../components/organizations/ChurnOrganizationModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { OrganizationFormModal } from '../../components/organizations/OrganizationFormModal';
import { AccountChips } from '../../components/organizations/detail/AccountChips';
import { DealsTab } from '../../components/organizations/detail/DealsTab';
import { DetailsTab } from '../../components/organizations/detail/DetailsTab';
import { DetailTabs } from '../../components/organizations/detail/DetailTabs';
import { FilesCallsTab } from '../../components/organizations/detail/FilesCallsTab';
import { HeaderTiles } from '../../components/organizations/detail/HeaderTiles';
import { KnowledgeTab } from '../../components/organizations/detail/KnowledgeTab';
import { OrganizationHeader } from '../../components/organizations/detail/OrganizationHeader';
import { PeopleTab } from '../../components/organizations/detail/PeopleTab';
import { StoryTab } from '../../components/organizations/detail/StoryTab';
import { useDetailParams } from '../../components/organizations/detail/useDetailParams';
import { useOrganization } from '../../components/organizations/detail/useOrganization';
import { useStory } from '../../components/organizations/detail/useStory';
import { EmptyState, ErrorBlock } from '../../components/organizations/portfolio/PortfolioSections';
import { errorMessage } from '../../components/organizations/portfolio/usePortfolio';
import { FOCUS, QUIET } from '../../components/organizations/portfolio/styles';
import { AccountFormModal } from './AccountFormModal';
import { OrganizationsFrame } from './OrganizationsFrame';

const NO_ACCOUNTS: Account[] = [];

/** Archive through the bulk endpoint, as the List does. ConfirmDialog shows a
 *  thrown string as the reason, so a refusal says why. */
async function archiveOrganization(id: number): Promise<void> {
  let failure: string | null = null;
  try {
    const result = await bulkUpdate({ ids: [id], action: 'archive', value: null });
    failure = result.failed[0]?.reason ?? null;
  } catch (err) {
    failure = errorMessage(err, 'Could not archive this organization.');
  }
  if (failure) throw failure;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <OrganizationsFrame>
      <div className="mx-auto w-full max-w-6xl py-6">{children}</div>
    </OrganizationsFrame>
  );
}

/** A tab's content before the organization's row lands. */
function TabSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {[0, 1].map((i) => (
        <div key={i} aria-hidden="true" className="flex flex-col gap-2 rounded-xl bg-surface p-3">
          <span className="block h-3 w-32 animate-pulse rounded bg-subtle" />
          <span className="block h-3 w-full animate-pulse rounded bg-subtle" />
          <span className="block h-3 w-2/3 animate-pulse rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}

function HeaderSkeleton({ isSm }: { isSm: boolean }) {
  return (
    <div role="status" aria-label="Loading organization" className="flex flex-col gap-3">
      <div aria-hidden="true" className="flex items-center gap-3">
        <span className="h-11 w-11 animate-pulse rounded-full bg-subtle" />
        <span className="flex flex-col gap-1.5">
          <span className="block h-5 w-48 animate-pulse rounded bg-subtle" />
          <span className="block h-3 w-64 animate-pulse rounded bg-subtle" />
        </span>
      </div>
      <div aria-hidden="true" className={isSm ? 'grid grid-cols-4 gap-3' : 'flex gap-3 overflow-hidden'}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="block h-24 min-w-[11rem] animate-pulse rounded-xl bg-surface sm:min-w-0" />
        ))}
      </div>
    </div>
  );
}

/** The page is keyed by the route's id, so moving to another organization
 *  starts from nothing: no story, chips, sheets or visited tabs of the last
 *  one show under the next one's header. */
export function Details() {
  const { id } = useParams<{ id: string }>();
  return <OrganizationPage key={id} id={id} />;
}

/** /organizations/:id, the organization's story (spec 2026-09-26, delivery 1):
 *  the name row and tiles from the List's own row, the account chips, and six
 *  tabs whose choice, like the story's filters, lives in the URL. It lands in
 *  four requests; every other tab reads its data when first opened. Ask on
 *  this page is delivery 3, so the frame has no rail yet. */
function OrganizationPage({ id }: { id: string | undefined }) {
  const orgId = id && /^\d+$/.test(id) ? Number(id) : null;
  const isSm = useMediaQuery(SM);
  const dispatch = useAppDispatch();
  const { params, update } = useDetailParams();
  const idBase = useId();

  const [version, setVersion] = useState(0);
  const [storyVersion, setStoryVersion] = useState(0);
  const [callsVersion, setCallsVersion] = useState(0);
  const reloadHeader = useCallback(() => setVersion((v) => v + 1), []);
  const org = useOrganization(orgId, version);

  // A tab mounts when first opened and then stays mounted, hidden while
  // another is shown: People, Deals and Knowledge read on mount, so
  // unmounting one would read it again and blank it on the way back, and the
  // story keeps its place. Tracked during render, so the tab mounts in the
  // same render that selects it.
  const [visited, setVisited] = useState<ReadonlySet<DetailTab>>(() => new Set([params.tab]));
  if (!visited.has(params.tab)) setVisited(new Set(visited).add(params.tab));
  const story = useStory(orgId ?? 0, storyQuery(storyFilters(params)), storyVersion, orgId !== null && visited.has('story'));

  const { accountsForCustomer, accountsLoading, accountsError, accountsCustomerId } = useAppSelector((state) => state.customers);
  // The accounts slot is global: until it holds this organization's list,
  // the page shows it loading rather than another organization's accounts.
  const accountsOurs = orgId !== null && accountsCustomerId === orgId;
  const accounts = accountsOurs ? accountsForCustomer : NO_ACCOUNTS;
  const accountsBusy = accountsLoading || !accountsOurs;
  const accountsFailure = accountsOurs ? accountsError : null;
  const [accountsAttempt, setAccountsAttempt] = useState(0);
  useEffect(() => {
    if (orgId !== null) dispatch(fetchAccountsForCustomer(orgId));
  }, [dispatch, orgId, accountsAttempt]);

  const [editing, setEditing] = useState(false);
  const [churning, setChurning] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // A tile jumps to its Details panel: the tab switches, then the panel
  // scrolls into view and takes focus. Each jump is numbered, so a second
  // jump while already on Details still moves.
  const [jump, setJump] = useState<{ panel: PanelKey; n: number } | null>(null);
  const handledJump = useRef(0);
  const jumpTo = useCallback(
    (panel: PanelKey) => {
      setJump((prev) => ({ panel, n: (prev?.n ?? 0) + 1 }));
      update({ tab: 'details' });
    },
    [update],
  );
  useEffect(() => {
    if (!jump || jump.n === handledJump.current || params.tab !== 'details' || !org.row) return;
    handledJump.current = jump.n;
    const section = document.querySelector<HTMLElement>(`[data-panel="${jump.panel}"]`);
    if (!section) return;
    section.setAttribute('tabindex', '-1');
    section.scrollIntoView?.({ block: 'start' });
    section.focus();
  }, [jump, params.tab, org.row]);

  if (orgId === null || org.notFound) {
    return (
      <Centered>
        <EmptyState
          title="Organization not found"
          detail="It may have been removed, or you may not have access to it."
          action={
            <Link to="/organizations/list" className={`${QUIET} border border-line`}>
              Back to organizations
            </Link>
          }
        />
      </Centered>
    );
  }
  if (org.error && !org.row) {
    return (
      <Centered>
        <ErrorBlock message={org.error} onRetry={org.retry} />
      </Centered>
    );
  }

  const row = org.row;
  const tab = params.tab;
  return (
    <OrganizationsFrame>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 pb-6">
        {row ? (
          <section data-part="header" aria-label="Organization summary" className="flex flex-col gap-3">
            <OrganizationHeader
              row={row}
              canEdit={org.customer !== null}
              editError={org.customerError}
              onRetryEdit={org.retry}
              onEdit={() => setEditing(true)}
              onArchive={() => setArchiving(true)}
              onChurn={() => setChurning(true)}
            />
            <HeaderTiles row={row} customer={org.customer} customerError={org.customerError} isSm={isSm} onJump={jumpTo} />
          </section>
        ) : (
          <HeaderSkeleton isSm={isSm} />
        )}

        {row && org.error ? (
          // A reload (after an edit, archive or churn) failed: the last row stays.
          <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl bg-surface px-3 py-2 text-[13px] text-danger">
            <span>Could not refresh this organization: {org.error}</span>
            <button type="button" onClick={org.retry} className={QUIET}>
              Try again
            </button>
          </div>
        ) : null}

        {tab === 'story' ? (
          <AccountChips
            accounts={accounts}
            loading={accountsBusy}
            error={accountsFailure}
            counts={story.data?.counts.by_account ?? null}
            selected={params.account}
            onSelect={(account) => update({ account })}
            onRetry={() => setAccountsAttempt((n) => n + 1)}
            onAdd={() => setAddingAccount(true)}
            onEdit={setEditingAccount}
          />
        ) : null}

        <DetailTabs idBase={idBase} active={tab} onChange={(next) => update({ tab: next })} />

        {DETAIL_TABS.filter(({ key }) => key === tab || visited.has(key)).map(({ key }) => (
          <div
            key={key}
            role="tabpanel"
            id={detailPanelId(idBase, key)}
            aria-labelledby={detailTabId(idBase, key)}
            hidden={key !== tab}
            tabIndex={0}
            className={`min-w-0 rounded-sm ${FOCUS}`}
          >
            {key === 'story' ? (
              <StoryTab
                orgId={orgId}
                story={story}
                params={params}
                accounts={accounts}
                isSm={isSm}
                active={tab === 'story'}
                onUpdate={update}
                onAdded={(what) => {
                  setStoryVersion((v) => v + 1);
                  // Files keeps CallSense mounted once opened: a call logged
                  // here reads its list again.
                  if (what === 'call') setCallsVersion((v) => v + 1);
                }}
                onOpenTab={(next) => update({ tab: next })}
                onJump={jumpTo}
              />
            ) : key === 'details' ? (
              row ? (
                <DetailsTab
                  row={row}
                  customerId={orgId}
                  isSm={isSm}
                  accounts={{
                    items: accounts,
                    loading: accountsBusy,
                    error: accountsFailure,
                    onRetry: () => setAccountsAttempt((n) => n + 1),
                    onAdd: () => setAddingAccount(true),
                    onEdit: setEditingAccount,
                  }}
                  customer={org.customer}
                  customerError={org.customerError}
                  onRetryCustomer={org.retry}
                  onEdit={org.customer ? () => setEditing(true) : undefined}
                />
              ) : (
                <TabSkeleton label="Loading details" />
              )
            ) : key === 'people' ? (
              <PeopleTab customerId={orgId} />
            ) : key === 'deals' ? (
              <DealsTab customerId={orgId} />
            ) : key === 'knowledge' ? (
              row ? <KnowledgeTab customerId={orgId} customerName={row.name} /> : <TabSkeleton label="Loading knowledge" />
            ) : (
              <FilesCallsTab customerId={orgId} callsVersion={callsVersion} />
            )}
          </div>
        ))}
      </div>

      {editing && org.customer ? (
        <OrganizationFormModal
          customer={org.customer}
          onSaved={() => {
            // Needs attention (the renewal) comes with the story.
            reloadHeader();
            setStoryVersion((v) => v + 1);
          }}
          onClose={() => setEditing(false)}
        />
      ) : null}
      {churning && row ? (
        <ChurnOrganizationModal
          customerIds={[row.id]}
          customerNames={[row.name]}
          onChurned={reloadHeader}
          onClose={() => setChurning(false)}
        />
      ) : null}
      {archiving && row ? (
        <ConfirmDialog
          title={`Archive ${row.name}?`}
          message="Hidden from the Organizations list and its summary, but not deleted. You can unarchive later."
          confirmLabel="Archive"
          danger
          onConfirm={async () => {
            await archiveOrganization(row.id);
            reloadHeader();
          }}
          onClose={() => setArchiving(false)}
        />
      ) : null}
      {addingAccount ? (
        <AccountFormModal
          customerId={orgId}
          onSaved={() => {
            setAccountsAttempt((n) => n + 1);
            // The chips list only the accounts the story counts, so the
            // story counts again to take the new one in.
            setStoryVersion((v) => v + 1);
          }}
          onClose={() => setAddingAccount(false)}
        />
      ) : null}
      {editingAccount ? (
        <AccountFormModal customerId={orgId} account={editingAccount} onClose={() => setEditingAccount(null)} />
      ) : null}
    </OrganizationsFrame>
  );
}
