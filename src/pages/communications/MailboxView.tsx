// The person's own inbox, whole: what the Communications page shows when the
// sidebar source is their mailbox. Folders, filters and categories on the
// left; the Categories block and the list, or the open message, on the right.
//
// Everything here is the mailbox as synced: the provider's folders and
// flags, this product's own done/muted, a category decided at sync. A star
// or a read mark changed here stays here; nothing is written back to Gmail.

import { useEffect } from 'react';
import { ArrowLeft, ChevronUp, RefreshCw, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchMailMessage,
  fetchMailMessages,
  fetchMailSummary,
  replyToMailMessage,
  selectMailMessage,
  setMailFolder,
  setMailPriority,
  setMailUnread,
  toggleMailCategory,
  updateMailMessage,
} from '../../features/mail/mailboxSlice';
import type { MailMessage } from '../../features/mail/mailboxSlice';
import { syncMailbox } from '../../features/mail/mailSlice';
import { InboxZero } from './InboxList';
import { CategoriesBlock, MailList } from './MailList';
import { MailDetail } from './MailDetail';
import { MailboxPanel } from './MailboxPanel';
import { CATEGORY_LABEL } from './mailCategories';

const FOLDER_TITLE: Record<string, string> = {
  inbox: 'Inbox',
  drafts: 'Drafts',
  sent: 'Sent',
  done: 'Done',
  muted: 'Muted',
  spam: 'Spam',
  trash: 'Trash',
  starred: 'Starred',
  important: 'Important',
};

export function MailboxView({ panelOpen, onTogglePanel }: { panelOpen: boolean; onTogglePanel: () => void }) {
  const dispatch = useAppDispatch();
  const { folder, category, unread, priority, search, page, loading, error, summary, selectedId, detail, detailLoading, replying, replyError, repliedId } = useAppSelector((state) => state.mailbox);
  const syncing = useAppSelector((state) => state.mail?.saving ?? false);

  useEffect(() => {
    dispatch(fetchMailMessages({ folder, category, unread, priority, search }));
  }, [dispatch, folder, category, unread, priority, search]);

  useEffect(() => {
    dispatch(fetchMailSummary());
  }, [dispatch]);

  useEffect(() => {
    if (selectedId === null) return;
    dispatch(fetchMailMessage(selectedId));
  }, [dispatch, selectedId]);

  function open(row: MailMessage) {
    dispatch(selectMailMessage(row.id));
    if (!row.is_read) {
      dispatch(updateMailMessage({ id: row.id, patch: { is_read: true } })).then(() => dispatch(fetchMailSummary()));
    }
  }

  async function update(patch: Parameters<typeof updateMailMessage>[0]['patch']) {
    if (selectedId === null) return;
    await dispatch(updateMailMessage({ id: selectedId, patch }));
    dispatch(fetchMailSummary());
    // Done and muted leave the inbox; the list should show that.
    if (patch.state !== undefined) dispatch(fetchMailMessages({ folder, category, unread, priority, search }));
  }

  async function sync() {
    await dispatch(syncMailbox());
    dispatch(fetchMailSummary());
    dispatch(fetchMailMessages({ folder, category, unread, priority, search }));
  }

  const rows = page?.results ?? [];

  return (
    <section aria-label="Mailbox" className="flex-1 min-w-0 rv-card-glass flex flex-col overflow-hidden">
      <div className="h-14 shrink-0 flex items-center gap-2 px-3">
        <button type="button" onClick={onTogglePanel} aria-label={panelOpen ? 'Hide folders' : 'Show folders'} aria-expanded={panelOpen} className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-ink-muted hover:text-ink hover:bg-subtle">
          <ChevronUp className={`w-4 h-4 transition-transform duration-[var(--dur-fast)] ${panelOpen ? '' : 'rotate-180'}`} aria-hidden="true" />
        </button>
        <h1 className="text-[15px] font-semibold text-ink">{FOLDER_TITLE[folder]}</h1>
        {summary?.address ? <span className="text-[12px] text-ink-faint truncate">{summary.address}</span> : null}
        {category ? (
          <button type="button" onClick={() => dispatch(toggleMailCategory(category))} className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-[12px] text-ink hover:bg-line-subtle">
            {CATEGORY_LABEL[category]}
            <X className="w-3 h-3 text-ink-muted" aria-hidden="true" />
          </button>
        ) : null}
        <span className="ml-auto font-mono-brand text-[11.5px] tabular-nums text-ink-faint">
          {summary && folder === 'inbox' ? `${summary.unread} unread` : page ? `${page.count}` : ''}
        </span>
        <button type="button" onClick={sync} disabled={syncing} aria-label="Sync now" title={summary?.last_synced_at ? `Last synced ${new Date(summary.last_synced_at).toLocaleString()}` : 'Sync now'} className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-subtle disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex px-3 pb-3">
        {panelOpen ? (
          <MailboxPanel
            folder={folder}
            category={category}
            unread={unread}
            priority={priority}
            summary={summary}
            onFolder={(f) => dispatch(setMailFolder(f))}
            onCategory={(c) => dispatch(toggleMailCategory(c))}
            onUnread={(next) => dispatch(setMailUnread(next))}
            onPriority={(next) => dispatch(setMailPriority(next))}
          />
        ) : null}

        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto custom-scrollbar pl-1" role="region" aria-label={selectedId !== null ? 'Reading' : 'Mail'}>
          {error ? (
            <div role="alert" className="flex items-start gap-3 p-4 border border-danger/30 rounded-xl bg-danger-dim">
              <div>
                <h3 className="text-[13px] font-semibold text-danger">Could not load your mail</h3>
                <p className="text-[12.5px] text-danger mt-0.5">{error}</p>
                <button type="button" onClick={() => dispatch(fetchMailMessages({ folder, category, unread, priority, search }))} className="mt-2 h-8 px-3 rounded-md border border-danger bg-surface text-[12px] font-semibold text-danger">
                  Try again
                </button>
              </div>
            </div>
          ) : selectedId !== null ? (
            <div className="h-full flex flex-col">
              <button type="button" onClick={() => dispatch(selectMailMessage(null))} className="self-start inline-flex items-center gap-1 text-[12.5px] text-ink-muted hover:text-ink mb-2">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                {FOLDER_TITLE[folder]}
              </button>
              <div className="flex-1 min-h-0 flex">
                <MailDetail key={selectedId} message={detail} loading={detailLoading} replying={replying} replyError={replyError} replied={repliedId === selectedId} onUpdate={update} onReply={(body) => dispatch(replyToMailMessage({ id: selectedId, body }))} />
              </div>
            </div>
          ) : (
            <>
              {folder === 'inbox' && !unread && !priority && !search ? <CategoriesBlock blocks={summary?.categories ?? []} active={category} onPick={(c) => dispatch(toggleMailCategory(c))} /> : null}
              <MailList
                rows={rows}
                isLoading={loading}
                onSelect={(id) => {
                  const row = rows.find((r) => r.id === id);
                  if (row) open(row);
                }}
                emptyState={
                  search.trim() ? (
                    <InboxZero title={`No match for “${search}”`} line="Try a sender or a subject." />
                  ) : folder === 'inbox' && !category && !unread && !priority ? (
                    summary && !summary.has_mailbox ? (
                      <InboxZero title="No mailbox" line="Connect one from Integrations and your mail appears here." />
                    ) : (
                      <InboxZero />
                    )
                  ) : (
                    <InboxZero title="Nothing here" line="Nothing in this view." />
                  )
                }
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
