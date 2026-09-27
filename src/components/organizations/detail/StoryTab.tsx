import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Account } from '../../../features/customers/customersSlice';
import { hasStoryFilters, type DetailParams, type DetailTab } from '../../../features/organizations/detailParams';
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

/** The Story tab (spec §1.6): Needs attention, the toolbar, then the stream.
 *  Filters live in the URL (through `onUpdate`); "+ Add" and an opened email
 *  are sheets over the page. */
export function StoryTab({
  orgId,
  story,
  params,
  accounts,
  isSm,
  active,
  onUpdate,
  onAdded,
  onOpenTab,
  onJump,
}: {
  orgId: number;
  story: StoryState;
  params: DetailParams;
  accounts: Account[];
  isSm: boolean;
  /** Whether the Story tab is the one showing. A hidden tab closes its
   *  sheets (browser Back to another tab must not leave one open over it). */
  active: boolean;
  onUpdate: (patch: Partial<DetailParams>, options?: { replace?: boolean }) => void;
  /** A record was added through + Add; the page reloads what shows it. */
  onAdded: (what: AddKind) => void;
  onOpenTab: (tab: DetailTab) => void;
  onJump: (panel: PanelKey) => void;
}) {
  const [adding, setAdding] = useState<AddKind | null>(null);
  const [email, setEmail] = useState<StoryItem | null>(null);
  const [notice, setNotice] = useState('');
  if (!active && (adding || email)) {
    setAdding(null);
    setEmail(null);
  }
  // An account the organization does not have (a stale or hand-edited
  // ?account=) is no place to save: + Add saves on the organization.
  const chosen = /^\d+$/.test(params.account) ? accounts.find((account) => account.id === Number(params.account)) : undefined;
  const accountId = chosen?.id;
  const accountName = chosen?.name;
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
        // Surveys are edited, expired and deleted on the Surveys page, which
        // has no per-organization filter yet, so this links to all of them.
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
          <span>Edit, expire or delete a survey on the Surveys page.</span>
          <Link to="/surveys" className={`${QUIET} border border-line`}>
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
          customerId={orgId}
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
          orgId={orgId}
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
