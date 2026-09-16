import { useState } from 'react';
import { ArrowUp, Copy, ThumbsUp, ThumbsDown, Sparkles, AlertCircle, Users, Radio, UserPlus, ClipboardCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Proposal } from '../../features/proposals/proposalsSlice';
import { PresenceStrip } from '../../components/shared';
import { HandoffModal } from './HandoffModal';
import type { CopilotSession } from '../../features/copilotSessions/types';
import type { AskSuggestion, CopilotMessage } from './types';
import { MentionTextarea } from '../../components/shared/MentionTextarea';
import { FUNCTION_LABELS } from '../../features/auth/authSlice';
import type { UserFunction } from '../../features/auth/authSlice';
import { MessageSources } from './MessageSources';

interface Props {
  messages: CopilotMessage[];
  onSendPrompt: (prompt: string) => void;
  isEmpty?: boolean;
  isSending?: boolean;
  sendError?: string | null;
  /** Set once an "Ask Copilot about this account" entry point started
   * this conversation — kept around until a real CopilotSession exists
   * for it (see Index.tsx's own pendingAccountContext), since Phase 2a
   * only creates that row server-side once "Make this a live session"
   * is actually clicked, not automatically on the first message. */
  pendingAccountName?: string | null;
  session?: CopilotSession | null;
  currentUserId?: number | null;
  onMakeLive?: () => void;
  onHandOff?: (toUserId: number, toUserName: string, note: string) => void;
  /** What the facilitator has already written from this session — see
   * the backend's SessionDecisionsView. */
  decisions?: Proposal[];
  onCaptureDecisions?: () => void;
  isCapturing?: boolean;
  captureError?: string | null;
  /** Owner-only: close the session, capturing its decisions first or not. */
  onCloseSession?: (captureDecisions: boolean) => void;
  isClosing?: boolean;
  /** One click on a suggestion under an answer: ask that person, on the
   * customer the answer was about, keeping the user turn it came from. */
  onAskSuggested?: (userTurnId: number, suggestion: AskSuggestion) => void;
  /** "partial" when the viewer was only mentioned and sees a slice — see the backend's visible_messages. */
  visibility?: 'full' | 'partial';
}

// Real messages only — no more hardcoded chatStep turns/fixed-timer
// "thinking" indicator. Plain text, no markdown rendering (an explicit
// scope cut — see docs/API_CONTRACTS.md's copilot section); `isSending`
// reflects the real in-flight POST /copilot/messages/ call.
//
// `session` (Multiplayer Copilot, Phase 2a — real cross-user sessions,
// see revenact-backend's services/copilot/models.py) is entirely
// optional — most conversations have none, and render exactly as
// before. When one exists, every message beyond the first (the
// session's own opening query) is, by definition, a real redirect into
// the same real conversation, tagged via a real `redirected` SessionEvent
// pointing at the exact Message it's about (not positional guessing).
//
// "Make this a live session" and "Invite" are real owner-only actions
// server-side (see SessionView/SessionInviteCreateView) — gated here to
// match, so a non-owner participant never sees a button that would just
// 404. "Hand off" stays available to any active participant, same as
// the backend's own SessionHandoffView.
export function ChatView({
  messages,
  onSendPrompt,
  isEmpty,
  isSending,
  sendError,
  pendingAccountName,
  session,
  currentUserId,
  onMakeLive,
  onHandOff,
  decisions = [],
  onCaptureDecisions,
  isCapturing,
  captureError,
  onCloseSession,
  isClosing,
  onAskSuggested,
  visibility,
}: Props) {
  const [inputText, setInputText] = useState('');
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const isOwner = !!session && !!currentUserId && session.owner.id === currentUserId;

  function submit() {
    if (inputText.trim() && !isSending) {
      onSendPrompt(inputText);
      setInputText('');
    }
  }

  function redirectFor(message: CopilotMessage) {
    if (!session) return null;
    return session.events.find((e) => e.kind === 'redirected' && e.message?.id === message.id) ?? null;
  }

  const activityEvents =
    session?.events.filter((e) => e.kind === 'joined' || e.kind === 'handed_off') ?? [];

  return (
    <div className="flex-1 h-full flex flex-col bg-surface relative">
      <div className="flex-1 overflow-y-auto px-6 py-8 w-full mx-auto pb-[180px] custom-scrollbar selection:bg-accent-dim">
        {(pendingAccountName || session) && (
          <div className="w-full max-w-[860px] mx-auto mb-6 flex flex-col gap-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-accent bg-accent-dim border border-accent/30 rounded-full px-3 py-1">
                <Sparkles className="w-3 h-3" />
                About: {session?.customer_name ?? session?.account_name ?? pendingAccountName}
              </span>

              {!isEmpty && (
                <div className="flex items-center gap-3">
                  {session && <PresenceStrip participants={session.participants} />}
                  {session?.status === 'live' || session?.status === 'awaiting_handoff' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-danger bg-danger-dim border border-danger/30 rounded-full px-2.5 py-1">
                      <Radio className="w-3 h-3" />
                      Live
                    </span>
                  ) : (
                    // Real, if this session doesn't exist server-side
                    // yet: clicking this is what actually creates it
                    // (see SessionView's own docstring) — the current
                    // viewer is implicitly its owner-to-be, since only
                    // the conversation's own creator ever has
                    // pendingAccountName set for it (see Index.tsx).
                    // Once a real session does exist, only its real
                    // owner may re-show this (a non-owner participant
                    // would just get a 404).
                    (!session || (isOwner && session.status === 'private')) && (
                      <button
                        onClick={onMakeLive}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted hover:text-accent border border-line hover:border-accent/30 rounded-full px-2.5 py-1 transition-colors"
                      >
                        <Users className="w-3 h-3" />
                        Make this a live session
                      </button>
                    )
                  )}
                  {(!session || session.status !== 'closed') && (
                    <button
                      onClick={() => setIsHandoffOpen(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted hover:text-accent border border-line hover:border-accent/30 rounded-full px-2.5 py-1 transition-colors"
                    >
                      <UserPlus className="w-3 h-3" />
                      Hand off to…
                    </button>
                  )}
                  {session && session.status !== 'private' && onCaptureDecisions && (
                    // The facilitator: writes what the people in this
                    // session decided into the Brain's review queue as
                    // proposals. Any active participant may ask; nothing
                    // runs until someone approves it there.
                    <button
                      onClick={onCaptureDecisions}
                      disabled={isCapturing}
                      title="Reads this session and writes what was decided into the review queue. This makes a paid model call."
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted hover:text-accent border border-line hover:border-accent/30 rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
                    >
                      <ClipboardCheck className="w-3 h-3" />
                      {isCapturing ? 'Reading the session…' : 'Capture decisions'}
                    </button>
                  )}
                  {isOwner && (session.status === 'live' || session.status === 'awaiting_handoff') && onCloseSession && !isClosingOpen && (
                    <button
                      onClick={() => setIsClosingOpen(true)}
                      disabled={isClosing}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted hover:text-danger border border-line hover:border-danger/30 rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      {isClosing ? 'Closing…' : 'Close session'}
                    </button>
                  )}
                  {session?.status === 'awaiting_handoff' && (
                    <span className="text-[11px] font-bold text-warning">Awaiting hand-off</span>
                  )}
                  {session?.status === 'closed' && (
                    <span className="text-[11px] font-bold text-ink-faint">Closed</span>
                  )}
                </div>
              )}
            </div>

            {(session?.status === 'live' || session?.status === 'awaiting_handoff') && (
              <p className="text-[11px] text-ink-faint italic">
                Live — real, invited teammates can see and act in this conversation too, synced every
                few seconds.
              </p>
            )}

            {activityEvents.map((event) => (
              <div key={event.id} className="text-[11.5px] text-ink-faint font-medium pl-1">
                {event.kind === 'joined'
                  ? `${event.actor?.name ?? 'Someone'} joined the session`
                  : `${event.actor?.name ?? 'Someone'} → ${event.payload.to_user_name} — "${event.payload.note}"`}
              </div>
            ))}

            {isClosingOpen && onCloseSession && (
              // Closing is the moment decisions are most likely to be lost,
              // so the choice is put here rather than left to a button
              // someone has to remember afterwards.
              <div className="bg-subtle border border-line-subtle rounded-lg px-3 py-2.5 flex items-center gap-3 flex-wrap" role="group" aria-label="Close this session">
                <span className="text-[12px] text-ink">Close this session? Capture what was decided into the review queue first.</span>
                <button
                  type="button"
                  onClick={() => { setIsClosingOpen(false); onCloseSession(true); }}
                  className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold"
                >
                  Close and capture decisions
                </button>
                <button
                  type="button"
                  onClick={() => { setIsClosingOpen(false); onCloseSession(false); }}
                  className="text-[12px] font-semibold text-ink-muted hover:text-ink"
                >
                  Close without capturing
                </button>
                <button type="button" onClick={() => setIsClosingOpen(false)} className="text-[12px] font-semibold text-ink-faint hover:text-ink">
                  Cancel
                </button>
              </div>
            )}
            {captureError && (
              <p className="text-[11.5px] font-semibold text-danger pl-1" role="alert">
                {captureError}
              </p>
            )}
            {decisions.length > 0 && (
              <div className="bg-subtle border border-line-subtle rounded-lg px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
                    Decisions from this session
                  </span>
                  <Link to="/brain/review" className="text-[11px] font-semibold text-accent hover:underline">
                    Review queue
                  </Link>
                </div>
                <ul className="flex flex-col gap-1">
                  {decisions.map((d) => (
                    <li key={d.id} className="text-[12px] text-ink flex items-baseline gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint shrink-0">
                        {d.kind_display}
                      </span>
                      <span className="font-medium">{d.title}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ml-auto shrink-0 ${d.status === 'approved' ? 'text-success' : d.status === 'rejected' ? 'text-ink-faint' : 'text-info'}`}>
                        {d.status_display}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!isEmpty && visibility === 'partial' && (
          <div className="w-full max-w-[860px] mx-auto mb-6 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-info-dim border border-info/30 text-[12.5px] text-ink-muted" role="note">
            <Users className="w-4 h-4 shrink-0 text-info mt-0.5" />
            <span>
              You were not in this conversation from the start. You are seeing the parts shared with you — messages from your team and from leadership above you, the questions routed to you or to people who report to you, their replies, and the Copilot's responses to those — not the whole thread.
            </span>
          </div>
        )}
        {!isEmpty && (
          <div className="flex flex-col gap-10 w-full max-w-[860px] mx-auto">
            {messages.map((message) => {
              const redirect = redirectFor(message);
              return message.role === 'user' ? (
                <div key={message.id} className="flex flex-col items-end gap-1">
                  {redirect && (
                    <span className="text-[11px] font-bold text-accent pr-1">
                      ↳ Redirected by {redirect.actor?.name ?? 'Someone'}
                    </span>
                  )}
                  {!redirect && message.author && message.author.id !== currentUserId && (() => {
                    // Who wrote this, and — when it answers a question routed
                    // to them earlier in the thread — whose question. A manager
                    // reading a sliced thread sees "Dana CSM · Customer Success,
                    // replying to Alice Admin", not an unlabelled bubble.
                    const index = messages.findIndex((m) => m.id === message.id);
                    const asked = [...messages.slice(0, index)]
                      .reverse()
                      .find((m) => m.role === 'user' && (m.questions ?? []).some((q) => q.assignee.id === message.author?.id));
                    return (
                      <span className="text-[11px] font-semibold text-ink-faint pr-1">
                        <span className="text-ink">{message.author.name}</span>
                        {message.author.function && FUNCTION_LABELS[message.author.function as UserFunction] && (
                          <span> · {FUNCTION_LABELS[message.author.function as UserFunction]}</span>
                        )}
                        {asked && asked.author && asked.author.id !== message.author.id && (
                          <span>, replying to {asked.author.name}</span>
                        )}
                      </span>
                    );
                  })()}
                  <div className="max-w-[65%] bg-accent-dim border border-accent/30 rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] text-ink-muted font-medium leading-[1.65] shadow-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {(message.questions ?? []).length > 0 && (
                    // The @mentions in this turn became routed questions
                    // (services.knowledge): the person is notified and their
                    // answer becomes knowledge the Copilot reads.
                    <span className="text-[11px] font-semibold text-ink-faint pr-1">
                      Asked{' '}
                      {message.questions.map((q, i) => (
                        <span key={q.id}>
                          {i > 0 ? ', ' : ''}
                          <span className="text-ink">{q.assignee.name}</span>
                          <span className={q.status === 'answered' ? 'text-success' : 'text-warning'}> · {q.status}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              ) : (
                <div key={message.id} className="flex flex-col gap-1 border-l-2 border-accent/30 pl-7 py-1">
                  <p className="text-[13.5px] text-ink font-medium leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <MessageSources sources={message.sources} />
                  {(message.ask_suggestions ?? []).length > 0 && onAskSuggested && (() => {
                    // The question this answer replied to — the user turn just
                    // before it — is what a one-click ask sends on.
                    const index = messages.findIndex((m) => m.id === message.id);
                    const userTurn = [...messages.slice(0, index)].reverse().find((m) => m.role === 'user');
                    if (!userTurn) return null;
                    const already = new Set(userTurn.questions.map((q) => q.assignee.id));
                    const offered = message.ask_suggestions!.filter((s) => !already.has(s.user_id));
                    if (offered.length === 0) return null;
                    return (
                      <div className="flex items-center gap-2 flex-wrap mt-2 text-[11.5px] text-ink-faint">
                        <span>Not answered? Ask</span>
                        {offered.map((s) => (
                          <button
                            key={s.user_id}
                            type="button"
                            onClick={() => onAskSuggested(userTurn.id, s)}
                            className="inline-flex items-center gap-1 font-bold text-accent border border-accent/30 bg-accent-dim rounded-full px-2 py-0.5 hover:bg-accent-dim/70"
                          >
                            {s.name}
                            <span className="font-medium text-ink-faint">· {s.function_display}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-[18px] mt-4 text-ink-faint">
                    <button className="hover:text-ink-muted hover:bg-subtle rounded-md p-1.5 transition-colors -ml-1.5">
                      <Copy className="w-4 h-4 stroke-[2px]" />
                    </button>
                    <button className="hover:text-ink-muted hover:bg-subtle rounded-md p-1.5 transition-colors">
                      <ThumbsUp className="w-4 h-4 stroke-[2px]" />
                    </button>
                    <button className="hover:text-ink-muted hover:bg-subtle rounded-md p-1.5 transition-colors">
                      <ThumbsDown className="w-4 h-4 stroke-[2px]" />
                    </button>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex flex-col gap-1 border-l-2 border-accent/30 pl-7 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 text-[var(--accent)]">
                  <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white shadow-[0_2px_8px_rgba(45,212,168,0.4)] animate-pulse">
                    <Sparkles className="w-[12px] h-[12px]" />
                  </div>
                  <span className="text-[13.5px] font-bold tracking-tight">Copilot is thinking...</span>
                  <div className="flex items-center gap-1 ml-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {sendError && (
              <div className="flex items-center gap-2 pl-7 text-[13px] text-danger font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {sendError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating input */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-10 px-6">
        <div className="w-full max-w-[860px] mx-auto relative pl-4">
          <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-accent/20 to-accent-hover/20 blur-sm pointer-events-none"></div>
          <div className="relative bg-surface border-2 border-accent/30 rounded-xl flex items-end min-h-[72px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] focus-within:ring-4 focus-within:ring-accent/10 transition-shadow">
            <MentionTextarea
              className="w-full h-full min-h-[64px] bg-transparent resize-none outline-none border-none p-4 text-[15px] placeholder:text-ink-faint placeholder:italic text-ink-muted font-medium leading-relaxed"
              placeholder="Ask anything — @mention a colleague or a function to route a question to them"
              aria-label="Message Copilot"
              value={inputText}
              onChange={setInputText}
              onSubmit={submit}
            />
            <button
              onClick={submit}
              disabled={isSending}
              className="absolute right-3.5 bottom-3.5 w-[26px] h-[26px] bg-subtle hover:bg-accent hover:text-[#0D0F0E] rounded-full flex items-center justify-center text-white shadow-sm transition-all cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-[14px] h-[14px] stroke-[3.5px] text-ink-faint group-hover:text-[#0D0F0E]" />
            </button>
          </div>
        </div>
      </div>

      {isHandoffOpen && onHandOff && (
        <HandoffModal onHandOff={onHandOff} onClose={() => setIsHandoffOpen(false)} />
      )}
    </div>
  );
}
