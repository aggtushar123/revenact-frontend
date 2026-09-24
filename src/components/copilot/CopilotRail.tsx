// The Copilot in a rail: shared by Communications (beside the inbox) and the
// Dashboard (beside the figures).
//
// A conversation is real (`sendMessage` to /copilot/messages/); the rail holds
// one at a time. The context says what a question is about: Communications
// sends its picked source as a text prefix, the Dashboard sends where the
// person is as a structured `context` the server grounds the answer in.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Clock, MessageSquare, Plus, Search, X } from 'lucide-react';
import { AskRevenactBox } from '../shared/AskRevenactBox';
import { fetchConversation, fetchConversations } from '../../pages/copilot/copilotApi';
import { MessageSources } from '../../pages/copilot/MessageSources';
import type { Conversation, ConversationSummary, CopilotMessage } from '../../pages/copilot/types';
import type { RailContext } from './railContext';
import { useCopilotThread, type CopilotThread, type Turn } from './useCopilotThread';

export interface CopilotRailProps {
  context: RailContext | null;
  onClearContext: () => void;
  conversation: Conversation | null;
  onConversation: (conversation: Conversation | null) => void;
  /** The rail's accessible name. */
  label?: string;
  /** 'glass' is Communications' translucent card, its documented exception;
   *  'plain' is a bordered surface for everywhere else. */
  variant?: 'glass' | 'plain';
  /** Width classes. */
  className?: string;
  /** Rendered above the conversation (Communications' Next event card, the
   *  Dashboard's rail header). */
  top?: ReactNode;
  /** Drive the rail from outside (the dashboard sends "Why?" without the composer). */
  thread?: CopilotThread;
}

function UserTurn({ text }: { text: string }) {
  return (
    <div className="self-end max-w-[92%] flex flex-col items-end gap-1">
      <div className="bg-accent text-on-accent rounded-2xl rounded-br-md px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap">{text}</div>
    </div>
  );
}

/** Shaped like an answer, not a spinner; the words are for screen readers. */
function Thinking() {
  return (
    <div role="status" className="self-start w-4/5 flex flex-col gap-1.5">
      <span className="sr-only">Thinking…</span>
      <span aria-hidden="true" className="h-3 w-full rounded bg-subtle animate-pulse" />
      <span aria-hidden="true" className="h-3 w-4/5 rounded bg-subtle animate-pulse" />
      <span aria-hidden="true" className="h-3 w-3/5 rounded bg-subtle animate-pulse" />
    </div>
  );
}

export function CopilotRail({
  context,
  onClearContext,
  conversation,
  onConversation,
  label = 'Copilot',
  variant = 'glass',
  className = 'w-[320px]',
  top,
  thread: given,
}: CopilotRailProps) {
  const own = useCopilotThread(conversation, onConversation);
  const thread = given ?? own;
  const { pending, failed } = thread;
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messages: CopilotMessage[] = conversation?.messages ?? [];
  const empty = messages.length === 0 && !pending && !failed;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length, pending, failed]);

  async function send(text: string) {
    const turn: Turn =
      context?.kind === 'dashboard'
        ? { text, content: text, context: context.context }
        : { text, content: (context ? `[About: ${context.label}] ` : '') + text };
    await thread.send(turn);
    inputRef.current?.focus();
  }

  // A label context can be dropped; on the dashboard only a focus can, never the screen.
  const removable = context !== null && (context.kind === 'label' || context.context.focus !== null);
  const glass = variant === 'glass';

  return (
    <aside aria-label={label} className={`${className} shrink-0 flex flex-col h-full min-h-0 ${glass ? 'gap-3' : 'rounded-xl border border-line bg-surface'}`}>
      {top}
      <section className={`flex-1 min-h-0 flex flex-col overflow-hidden ${glass ? 'rv-card-glass' : ''}`} aria-label={`${label} conversation`}>
        <div role="log" aria-label={`${label} messages`} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
          {empty ? (
            <p className="m-auto text-[13px] text-ink-faint text-center max-w-[24ch]">
              Ask about what is in front of you. Answers use your accounts, mail and tickets.
            </p>
          ) : null}
          {messages.map((m) =>
            m.role === 'user' ? (
              <UserTurn key={m.id} text={m.content} />
            ) : (
              <div key={m.id} className="self-start max-w-[92%] text-[13px] leading-relaxed text-ink">
                <p className="whitespace-pre-wrap">{m.content}</p>
                <MessageSources sources={m.sources} />
              </div>
            ),
          )}
          {pending ? (
            <>
              <UserTurn text={pending.text} />
              <Thinking />
            </>
          ) : null}
          {failed ? (
            <>
              <UserTurn text={failed.text} />
              <div role="alert" className={`self-start flex flex-wrap items-center gap-2 text-[13px] ${failed.budget ? 'text-ink-muted' : 'text-danger'}`}>
                <span>{failed.message}</span>
                {failed.budget ? null : (
                  <button
                    type="button"
                    onClick={thread.retry}
                    className="min-h-9 px-3 rounded-lg border border-line bg-surface text-[13px] font-semibold text-ink hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Retry
                  </button>
                )}
              </div>
            </>
          ) : null}
          <div ref={endRef} />
        </div>
        <div className="p-2 pt-0">
          {context ? (
            <div className="px-1 pb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-subtle border border-line px-2 py-0.5 text-[11px] text-ink">
                {context.kind === 'label' ? context.icon : null}
                {context.label}
                {removable ? (
                  <button
                    type="button"
                    onClick={onClearContext}
                    aria-label={context.kind === 'label' ? 'Remove context' : 'Remove focus'}
                    className="text-ink-faint hover:text-ink rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                ) : null}
              </span>
            </div>
          ) : null}
          <AskRevenactBox inputRef={inputRef} onSend={(text) => void send(text)} disabled={Boolean(pending)} />
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
  const [scheduledOpen, setScheduledOpen] = useState(true);
  const [recentsOpen, setRecentsOpen] = useState(true);
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
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const shown = (recents ?? []).filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="History"
      className="absolute right-0 top-[calc(100%+10px)] w-[340px] h-[min(70vh,640px)] rv-card p-4 z-30 shadow-md flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-ink">History</h2>
        <button type="button" onClick={onClose} aria-label="Close history" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-subtle">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <label className="relative block">
        <span className="sr-only">Search chats</span>
        <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chats…"
          className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface border border-line text-[13px] text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-line-strong"
        />
      </label>

      <section className="rounded-xl bg-subtle/60 border border-line-subtle" aria-labelledby="scheduled-heading">
        <div className="flex items-center gap-1 pl-4 pr-2 py-2.5">
          <h3 id="scheduled-heading" className="flex-1 text-[13.5px] font-medium text-ink">Scheduled tasks</h3>
          {/* Scheduling arrives with the agents phase; until then the plus
              says so rather than opening a form that saves nothing. */}
          <button type="button" disabled title="Scheduling arrives with agents" aria-label="New scheduled task (coming soon)" className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint disabled:opacity-50">
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setScheduledOpen((o) => !o)} aria-expanded={scheduledOpen} aria-label={scheduledOpen ? 'Collapse scheduled tasks' : 'Expand scheduled tasks'} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink">
            <ChevronDown className={`w-4 h-4 transition-transform duration-[var(--dur-fast)] ${scheduledOpen ? '' : '-rotate-90'}`} aria-hidden="true" />
          </button>
        </div>
        {scheduledOpen ? (
          <p className="flex items-center gap-2.5 px-4 pb-3.5 text-[13px] text-ink-muted">
            <Clock className="w-4 h-4" aria-hidden="true" />
            No scheduled tasks yet
          </p>
        ) : null}
      </section>

      <section className={`rounded-xl bg-subtle/60 border border-line-subtle min-h-0 flex flex-col ${recentsOpen ? 'flex-1' : ''}`} aria-labelledby="recents-heading">
        <div className="flex items-center gap-1 pl-4 pr-2 py-2.5">
          <h3 id="recents-heading" className="flex-1 text-[13.5px] font-medium text-ink">Recents</h3>
          <button type="button" onClick={() => setRecentsOpen((o) => !o)} aria-expanded={recentsOpen} aria-label={recentsOpen ? 'Collapse recents' : 'Expand recents'} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink">
            <ChevronDown className={`w-4 h-4 transition-transform duration-[var(--dur-fast)] ${recentsOpen ? '' : '-rotate-90'}`} aria-hidden="true" />
          </button>
        </div>
        {recentsOpen ? (
          recents === null ? (
            <p className="px-4 pb-3.5 text-[13px] text-ink-faint">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="flex items-center gap-2.5 px-4 pb-3.5 text-[13px] text-ink-muted">
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              {query ? 'No chats match' : 'No chats yet'}
            </p>
          ) : (
            <ul className="flex-1 min-h-0 px-2 pb-2 overflow-y-auto custom-scrollbar flex flex-col">
              {shown.map((c) => (
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
                    className="w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] text-ink hover:bg-surface"
                  >
                    <MessageSquare className="w-4 h-4 text-ink-faint shrink-0" aria-hidden="true" />
                    <span className="truncate">{c.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </div>
  );
}
