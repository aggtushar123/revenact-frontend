import { useCallback, useState } from 'react';
import type { Account } from '../../../features/customers/customersSlice';
import { hasStoryFilters, type DetailParams, type DetailTab } from '../../../features/organizations/detailParams';
import type { PanelKey } from '../../../features/organizations/portfolioFields';
import type { AddKind } from '../../../features/organizations/storyKinds';
import type { StoryItem } from '../../../features/organizations/storyTypes';
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
  onUpdate: (patch: Partial<DetailParams>, options?: { replace?: boolean }) => void;
  onAdded: () => void;
  onOpenTab: (tab: DetailTab) => void;
  onJump: (panel: PanelKey) => void;
}) {
  const [adding, setAdding] = useState<AddKind | null>(null);
  const [email, setEmail] = useState<StoryItem | null>(null);
  const [notice, setNotice] = useState('');
  const accountId = /^\d+$/.test(params.account) ? Number(params.account) : undefined;
  const accountName = accountId === undefined ? undefined : accounts.find((account) => account.id === accountId)?.name;
  const onSearch = useCallback((q: string) => onUpdate({ q }, { replace: true }), [onUpdate]);

  return (
    <div className="flex flex-col gap-3">
      {story.data ? (
        <AttentionBlock
          attention={story.data.attention}
          onFilter={(group) => onUpdate({ group })}
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
      <p role="status" className="sr-only">
        {notice}
      </p>
      <StoryStream
        story={story}
        filtered={hasStoryFilters(params)}
        onClearFilters={() => onUpdate({ account: '', group: '', sources: [], q: '' })}
        onOpenEmail={setEmail}
      />
      {adding ? (
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
            onAdded();
          }}
        />
      ) : null}
      {email?.link.thread_id ? (
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
