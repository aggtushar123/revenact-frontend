// One message, open in place: who, when, the account it was filed against,
// the body, the triage actions, and a reply box that sends from the mailbox
// it arrived in.

import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Check, MailOpen, Star, VolumeX, X } from 'lucide-react';
import type { MailMessageDetail } from '../../features/mail/mailboxSlice';
import { CATEGORY_LABEL } from './mailCategories';
import { ReplyBox } from './ReplyBox';
import { who } from './mailWho';

function whenOf(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Folders whose mail is not answered: a draft has not been sent, spam is
 *  not a correspondent, trash was thrown away. */
const NO_REPLY_FOLDERS = new Set(['drafts', 'spam', 'trash']);

export function MailDetail({
  message,
  loading,
  error,
  updateError,
  replying,
  replyError,
  replied,
  onRetry,
  onDismissUpdateError,
  onUpdate,
  onReply,
}: {
  message: MailMessageDetail | null;
  loading: boolean;
  /** Why the message could not be opened. */
  error: string | null;
  /** Why the last star / read / done / mute did not take. */
  updateError: string | null;
  replying: boolean;
  replyError: string | null;
  replied: boolean;
  onRetry: () => void;
  onDismissUpdateError: () => void;
  onUpdate: (patch: Partial<Pick<MailMessageDetail, 'is_read' | 'is_starred' | 'state'>>) => void;
  onReply: (body: string) => void;
}) {
  if (!message) {
    return (
      <section aria-label="Message" aria-busy={loading} className="grow min-w-0 rv-glass-inner border border-line rounded-xl flex items-center justify-center">
        {error ? (
          <div role="alert" className="flex flex-col items-center gap-2 text-center px-6">
            <AlertCircle className="w-4 h-4 text-danger" aria-hidden="true" />
            <p className="text-[13px] text-danger">{error}</p>
            <button type="button" onClick={onRetry} className="h-8 px-3 rounded-md border border-line text-[12px] font-semibold text-ink hover:border-line-strong">
              Try again
            </button>
          </div>
        ) : (
          <p className="text-[12.5px] text-ink-muted">{loading ? 'Opening…' : 'Choose a message to read it.'}</p>
        )}
      </section>
    );
  }

  const href = message.account ? (message.account.type === 'customer' ? `/organizations/${message.account.id}` : `/accounts/${message.account.id}`) : null;
  const canReply = !NO_REPLY_FOLDERS.has(message.folder) && (message.direction === 'received' ? Boolean(message.from_address) : message.to.length > 0);

  return (
    <section aria-label="Message" aria-live="polite" className="grow min-w-0 rv-glass-inner border border-line rounded-xl flex flex-col overflow-hidden">
      <div className="shrink-0 px-4.5 pt-4 pb-3.5 border-b border-line-subtle">
        <div className="flex items-start gap-3">
          <div className="grow min-w-0">
            <h2 className="text-[16.5px] font-bold text-ink tracking-tight mb-1.5">{message.subject}</h2>
            <div className="flex items-center gap-2 flex-wrap text-[12.5px]">
              <span className="font-bold text-ink">{message.direction === 'sent' ? `To ${who(message)}` : who(message)}</span>
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

      {updateError ? (
        <div role="alert" className="shrink-0 mx-4.5 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-danger/30 bg-danger-dim text-[12.5px] text-danger">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{updateError}</span>
          <button type="button" onClick={onDismissUpdateError} aria-label="Dismiss" className="w-6 h-6 rounded flex items-center justify-center hover:bg-danger/10">
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="grow overflow-y-auto custom-scrollbar px-4.5 py-3.5">
        <p className="text-[13px] leading-relaxed text-ink max-w-[72ch] whitespace-pre-line">{message.body || message.snippet}</p>
      </div>

      {canReply ? (
        <ReplyBox
          label="Reply"
          placeholder="Write your reply."
          hint={`Sends from your connected mailbox${message.account ? `, filed on ${message.account.name}` : ''}`}
          sendLabel="Send reply"
          draftSource={{ kind: 'mail_message', id: message.id }}
          onSend={onReply}
          sending={replying}
          sent={replied}
          error={replyError}
        />
      ) : null}
    </section>
  );
}
