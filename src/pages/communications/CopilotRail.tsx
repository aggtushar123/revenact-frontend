// The Copilot beside the inbox: the same Copilot, in a rail.
//
// A conversation is real (`sendMessage` to /copilot/messages/); the rail holds
// one at a time, "New chat" starts another, and History lists the recent ones
// to reopen. The ask box carries the context the person is looking at (the
// source they picked) as a chip, so a question about "these tickets" means
// what it says.

import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, MessageSquarePlus, Search, X } from 'lucide-react';
import { AskRevenactBox } from '../../components/shared/AskRevenactBox';
import { fetchConversation, fetchConversations, sendMessage } from '../copilot/copilotApi';
import type { Conversation, ConversationSummary, CopilotMessage } from '../copilot/types';
import { ApiError } from '../../lib/apiClient';

export function CopilotRail({
  context,
  onClearContext,
  conversation,
  onConversation,
}: {
  context: { label: string; icon: React.ReactNode } | null;
  onClearContext: () => void;
  conversation: Conversation | null;
  onConversation: (conversation: Conversation | null) => void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages: CopilotMessage[] = conversation?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length, pending]);

  async function send(text: string) {
    setError(null);
    setSending(true);
    setPending(text);
    try {
      const prefix = context ? `[About: ${context.label}] ` : '';
      const next = await sendMessage({ conversationId: conversation?.id, content: prefix + text });
      onConversation(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The Copilot did not answer. Try again.');
    } finally {
      setPending(null);
      setSending(false);
    }
  }

  return (
    <aside aria-label="Copilot" className="w-[320px] shrink-0 flex flex-col gap-3 h-full min-h-0">
      <section className="rv-card p-3" aria-labelledby="next-event-heading">
        <div className="flex items-center justify-between px-1 pb-1.5">
          <span id="next-event-heading" className="text-[12px] font-medium text-ink">Next event</span>
          <Calendar className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
        </div>
        {/* No endpoint serves "my next event" yet; this says so rather than inventing one. */}
        <div className="bg-[var(--rv-event-card-bg)] border border-[var(--rv-event-card-border)] rounded-xl p-3">
          <div className="text-[12px] font-medium text-[var(--rv-event-title)]">Nothing scheduled</div>
          <div className="text-[11px] text-[var(--rv-event-sub)] mt-0.5">Your next meeting will show here.</div>
        </div>
      </section>

      <section className="flex-1 min-h-0 flex flex-col rv-card overflow-hidden" aria-label="Copilot conversation">
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
          {messages.length === 0 && !pending ? (
            <p className="m-auto text-[12px] text-ink-faint text-center max-w-[22ch]">
              Ask about what is in front of you. Answers use your accounts, mail and tickets.
            </p>
          ) : null}
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[92%] text-[12.5px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'self-end bg-accent text-on-accent rounded-2xl rounded-br-md px-3 py-2' : 'self-start text-ink'}`}>
              {m.content}
            </div>
          ))}
          {pending ? (
            <>
              <div className="self-end max-w-[92%] bg-accent text-on-accent rounded-2xl rounded-br-md px-3 py-2 text-[12.5px] whitespace-pre-wrap">{pending}</div>
              <div className="self-start text-[12px] text-ink-faint" aria-live="polite">Thinking…</div>
            </>
          ) : null}
          {error ? <p role="alert" className="text-[12px] text-danger">{error}</p> : null}
          <div ref={endRef} />
        </div>
        <div className="p-2 pt-0">
          {context ? (
            <div className="px-1 pb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-subtle border border-line px-2 py-0.5 text-[11px] text-ink">
                {context.icon}
                {context.label}
                <button type="button" onClick={onClearContext} aria-label="Remove context" className="text-ink-faint hover:text-ink">
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </span>
            </div>
          ) : null}
          <AskRevenactBox onSend={(text) => send(text)} disabled={sending} />
        </div>
      </section>
    </aside>
  );
}

/** The History popover: recent conversations to reopen, and the scheduled
 *  tasks slot, which is honest about being empty until agents can schedule. */
export function HistoryPopover({ onClose, onOpen }: { onClose: () => void; onOpen: (conversation: Conversation) => void }) {
  const [recents, setRecents] = useState<ConversationSummary[] | null>(null);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchConversations()
      .then((list) => {
        if (!cancelled) setRecents(list);
      })
      .catch(() => {
        if (!cancelled) setRecents([]);
      });
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => {
      cancelled = true;
      document.removeEventListener('mousedown', onDoc);
    };
  }, [onClose]);

  const shown = (recents ?? []).filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} role="dialog" aria-label="History" className="absolute right-0 top-[calc(100%+8px)] w-[320px] rv-card p-4 z-30 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-ink">History</h2>
        <button type="button" onClick={onClose} aria-label="Close history" className="text-ink-faint hover:text-ink p-1">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <label className="relative block mt-3">
        <span className="sr-only">Search chats</span>
        <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats…" className="rv-input pl-8 text-[12.5px]" />
      </label>
      <section className="mt-3 rounded-xl border border-line-subtle p-3" aria-labelledby="scheduled-heading">
        <h3 id="scheduled-heading" className="text-[12.5px] font-medium text-ink">Scheduled tasks</h3>
        <p className="mt-2 flex items-center gap-2 text-[12px] text-ink-muted">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          No scheduled tasks yet
        </p>
      </section>
      <section className="mt-2 rounded-xl border border-line-subtle p-3" aria-labelledby="recents-heading">
        <h3 id="recents-heading" className="text-[12.5px] font-medium text-ink">Recents</h3>
        {recents === null ? (
          <p className="mt-2 text-[12px] text-ink-faint">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-[12px] text-ink-muted">
            <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
            No chats yet
          </p>
        ) : (
          <ul className="mt-1.5 flex flex-col">
            {shown.slice(0, 12).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      onOpen(await fetchConversation(c.id));
                    } catch {
                      /* the popover closes; the rail keeps what it had */
                    }
                    onClose();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-md text-[12.5px] text-ink hover:bg-subtle truncate"
                >
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

