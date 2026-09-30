import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Account } from '../../../features/customers/customersSlice';
import { chosenAccount } from '../../../features/organizations/accountScope';
import { hasStoryFilters, type DetailTab, type StoryParams } from '../../../features/organizations/detailParams';
import { resolveScope, type DetailScope } from '../../../features/organizations/detailScope';
import type { PanelKey } from '../../../features/organizations/portfolioFields';
import type { AddKind } from '../../../features/organizations/storyKinds';
import type { StoryItem } from '../../../features/organizations/storyTypes';
import { QUIET } from '../portfolio/styles';
import { AddFlow } from './AddFlow';
import { AttentionBlock } from './AttentionBlock';
import { EmailThread } from './EmailThread';
import { StoryStream } from './StoryStream';
import { StoryToolbar } from './StoryToolbar';
import type { StoryState } from './useStory';

type StoryTabProps = ({ orgId: number; scope?: undefined } | { scope: DetailScope; orgId?: undefined }) & {
  story: StoryState;
  params: StoryParams;
  accounts: Account[];
  isSm: boolean;
  /** Whether the Story tab is the one showing. A hidden tab closes its
   *  sheets (browser Back to another tab must not leave one open over it). */
  active: boolean;
  onUpdate: (patch: Partial<StoryParams>, options?: { replace?: boolean }) => void;
  /** A record was added through + Add; the page reloads what shows it. */
  onAdded: (what: AddKind) => void;
  /** Where Needs attention's questions row goes (the organization page's Knowledge). */
  onOpenTab?: (tab: DetailTab) => void;
  onJump: (panel: PanelKey) => void;
};

/** The Story tab (organisation spec §1.6; account spec §2.5): Needs
 *  attention, the toolbar, then the stream. Filters live in the URL (through
 *  `onUpdate`); "+ Add" and an opened email are sheets over the page. On an
 *  organization (`orgId`) + Add saves on the chosen account chip or the
 *  organization; on one account (`scope`) it always saves on that account. */
export function StoryTab(props: StoryTabProps) {
  const { story, params, accounts, isSm, active, onUpdate, onAdded, onOpenTab, onJump } = props;
  const scope = resolveScope({ customerId: props.orgId, scope: props.scope });
  const [adding, setAdding] = useState<AddKind | null>(null);
  const [email, setEmail] = useState<StoryItem | null>(null);
  const [notice, setNotice] = useState('');
  if (!active && (adding || email)) {
    setAdding(null);
    setEmail(null);
  }
  // An account the organization does not have (a stale or hand-edited
  // ?account=) is no place to save: + Add saves on the organization.
  const chosen = scope.kind === 'account' ? undefined : chosenAccount(accounts, params.account);
  const accountId = scope.kind === 'account' ? scope.id : chosen?.id;
  const accountName = scope.kind === 'account' ? scope.name : chosen?.name;
  const onSearch = useCallback((q: string) => onUpdate({ q }, { replace: true }), [onUpdate]);

  return (
    <div className="flex flex-col gap-3">
      {story.data ? (
        <AttentionBlock
          attention={story.data.attention}
          // The attention counts ignore the search and the sources, so its
          // row opens the whole group, not a narrowed slice of it.
          onFilter={(group) => onUpdate({ group, q: '', sources: [] })}
          onOpenTab={onOpenTab}
          onJump={onJump}
          renewalPanel={scope.kind === 'account' ? 'commercial' : 'contract'}
        />
      ) : null}
      <StoryToolbar
        group={params.group}
        sources={params.sources}
        q={params.q}
        byGroup={story.data?.counts.by_group ?? null}
        byKind={story.data?.counts.by_kind ?? null}
        isSm={isSm}
        onGroup={(group) => onUpdate({ group })}
        onSources={(sources) => onUpdate({ sources })}
        onSearch={onSearch}
        onAdd={(what) => {
          setNotice('');
          setAdding(what);
        }}
      />
      {params.group === 'feedback' ? (
        // Surveys are edited, expired and deleted on the Surveys page: filtered
        // to this organization, or whole for an account (it filters by
        // organization only, and an account may have several).
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
          <span>Edit, expire or delete a survey on the Surveys page.</span>
          <Link to={scope.kind === 'organization' ? `/surveys?customer=${scope.id}` : '/surveys'} className={`${QUIET} border border-line`}>
            Manage surveys
          </Link>
        </p>
      ) : null}
      <p role="status" className="sr-only">
        {notice}
      </p>
      <StoryStream
        story={story}
        filtered={hasStoryFilters(params)}
        onClearFilters={() => onUpdate({ account: '', group: '', sources: [], q: '' })}
        onOpenEmail={setEmail}
      />
      {active && adding ? (
        <AddFlow
          what={adding}
          customerId={scope.kind === 'organization' ? scope.id : undefined}
          accountId={accountId}
          accountName={accountName}
          isSm={isSm}
          onClose={() => setAdding(null)}
          onAdded={() => {
            setAdding(null);
            setNotice('Added to the story.');
            onAdded(adding);
          }}
        />
      ) : null}
      {active && email?.link.thread_id ? (
        <EmailThread
          orgId={scope}
          threadId={email.link.thread_id}
          openedId={email.id}
          title={email.title}
          isSm={isSm}
          onClose={() => setEmail(null)}
        />
      ) : null}
    </div>
  );
}
