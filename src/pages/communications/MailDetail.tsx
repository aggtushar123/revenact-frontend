// One message, open in place: who, when, the account it was filed against,
// the body, the triage actions, and a reply box that sends from the mailbox
// it arrived in.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, MailOpen, Star, VolumeX } from 'lucide-react';
import type { MailMessageDetail } from '../../features/mail/mailboxSlice';
import { CATEGORY_LABEL } from './mailCategories';
import { who } from './mailWho';

function whenOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function MailDetail({
  message,
  loading,
  replying,
  replyError,
  replied,
  onUpdate,
  onReply,
}: {
  message: MailMessageDetail | null;
  loading: boolean;
  replying: boolean;
  replyError: string | null;
  replied: boolean;
  onUpdate: (patch: Partial<Pick<MailMessageDetail, 'is_read' | 'is_starred' | 'state'>>) => void;
  onReply: (body: string) => void;
}) {
  const [draft, setDraft] = useState('');

  if (!message) {
    return (
      <section aria-label="Message" aria-busy={loading} className="grow min-w-0 rv-glass-inner border border-line rounded-xl flex items-center justify-center">
        <p className="text-[12.5px] text-ink-muted">{loading ? 'Opening…' : 'Choose a message to read it.'}</p>
      </section>
    );
  }

  const href = message.account ? (message.account.type === 'customer' ? `/organizations/${message.account.id}` : `/accounts/${message.account.id}`) : null;
  const canReply = message.direction === 'received' ? Boolean(message.from_address) : message.to.length > 0;

  return (
    <section aria-label="Message" aria-live="polite" className="grow min-w-0 rv-glass-inner border border-line rounded-xl flex flex-col overflow-hidden">
      <div className="shrink-0 px-4.5 pt-4 pb-3.5 border-b border-line-subtle">
        <div className="flex items-start gap-3">
          <div className="grow min-w-0">
            <h2 className="text-[16.5px] font-bold text-ink tracking-tight mb-1.5">{message.subject}</h2>
            <div className="flex items-center gap-2 flex-wrap text-[12.5px]">
              <span className="font-bold text-ink">{who(message)}</span>
              {message.direction === 'received' && message.from_name ? <span className="text-ink-muted">{message.from_address}</span> : null}
              <span className="text-line-strong" aria-hidden="true">
                /
              </span>
              <span className="text-ink-muted">{whenOf(message.sent_at)}</span>
              <span className="px-2 py-0.5 rounded-md bg-subtle text-[11px] text-ink-muted">{CATEGORY_LABEL[message.category]}</span>
              {message.account && href ? (
                <Link to={href} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-dim text-[11px] font-semibold text-ink hover:opacity-80">
                  {message.account.name}
                  <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdate({ is_starred: !message.is_starred })}
              aria-pressed={message.is_starred}
              aria-label={message.is_starred ? 'Unstar' : 'Star'}
              title={message.is_starred ? 'Unstar' : 'Star'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-subtle ${message.is_starred ? 'text-warning' : 'text-ink-muted hover:text-ink'}`}
            >
              <Star className="w-4 h-4" fill={message.is_starred ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onUpdate({ is_read: false })} aria-label="Mark unread" title="Mark unread" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-subtle">
              <MailOpen className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ state: message.state === 'muted' ? 'open' : 'muted' })}
              aria-pressed={message.state === 'muted'}
              aria-label={message.state === 'muted' ? 'Unmute' : 'Mute'}
              title={message.state === 'muted' ? 'Unmute' : 'Mute'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-subtle ${message.state === 'muted' ? 'bg-subtle text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ state: message.state === 'done' ? 'open' : 'done' })}
              aria-pressed={message.state === 'done'}
              className={`h-8 px-3 rounded-lg text-[12px] font-semibold inline-flex items-center gap-1.5 ${message.state === 'done' ? 'bg-subtle text-ink' : 'bg-accent text-on-accent hover:opacity-90'}`}
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              {message.state === 'done' ? 'Done' : 'Mark done'}
            </button>
          </div>
        </div>
      </div>

      <div className="grow overflow-y-auto custom-scrollbar px-4.5 py-3.5">
        <p className="text-[13px] leading-relaxed text-ink max-w-[72ch] whitespace-pre-line">{message.body || message.snippet}</p>
      </div>

      {canReply ? (
        <form
          className="shrink-0 px-4.5 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) onReply(draft.trim());
          }}
        >
          <div className="border border-line rounded-lg overflow-hidden">
            <label htmlFor="mail-reply" className="block px-3.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Reply
            </label>
            <textarea id="mail-reply" rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write your reply." className="w-full px-3.5 pt-1.5 pb-2.5 text-[13px] leading-snug text-ink resize-none outline-none bg-transparent" />
            <div className="px-3 py-2 border-t border-line-subtle bg-base flex items-center gap-2">
              {replyError ? (
                <span role="alert" className="text-[11.5px] text-danger">
                  {replyError}
                </span>
              ) : replied ? (
                <span role="status" className="text-[11.5px] text-success">
                  Sent from your mailbox.
                </span>
              ) : (
                <span className="text-[11px] text-ink-muted">Sends from your connected mailbox{message.account ? `, filed on ${message.account.name}` : ''}</span>
              )}
              <span className="grow" />
              <button type="submit" disabled={draft.trim().length === 0 || replying} className="h-[30px] px-3.5 rounded-md bg-accent text-on-accent text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                {replying ? 'Sending…' : 'Send reply'}
              </button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  );
}
