// The reply box under an open conversation: what the person types, a draft
// from the Copilot when they ask for one, and the records that draft was
// built from, so they can check it before it goes out.
//
// The draft is grounded in the thread and the account's history (see
// revenact-backend `POST /copilot/draft-reply/`); it lands in the box as
// text the person edits and sends themselves. Nothing is sent by the AI.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Languages, Sparkles } from 'lucide-react';
import { draftReply } from '../copilot/copilotApi';
import { languageName, translateText } from '../../features/translation/translationApi';
import type { MessageSource } from '../copilot/types';
import { hrefOf } from '../copilot/sourceHref';
import { ApiError } from '../../lib/apiClient';

export interface ReplyBoxProps {
  label: string;
  placeholder: string;
  hint: string;
  sendLabel: string;
  /** What the Copilot drafts from; omit and the draft button is not shown. */
  draftSource?: { kind: 'email' | 'mail_message'; id: number };
  /** The language this person writes in, when it is known. Offers to put
   *  the reply into it before it is sent (see services/translation). */
  theirLanguage?: string;
  /** Omit when sending is not wired for this kind of item; the button then says so. */
  onSend?: (body: string) => void;
  sending?: boolean;
  sent?: boolean;
  error?: string | null;
}

export function ReplyBox({ label, placeholder, hint, sendLabel, draftSource, theirLanguage, onSend, sending = false, sent = false, error = null }: ReplyBoxProps) {
  const [draft, setDraft] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  // One thing may write to the draft at a time: two answers landing out of
  // order would silently throw one of them away.
  const busy = drafting || translating;
  const [sources, setSources] = useState<MessageSource[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const id = `reply-${draftSource?.kind ?? 'box'}-${draftSource?.id ?? 0}`;

  /** The draft, in the language they write in. The person still reads it
   *  and still presses send: nothing goes out because a model said so. */
  async function intoTheirLanguage() {
    if (!theirLanguage || !draft.trim() || busy) return;
    setTranslating(true);
    setDraftError(null);
    try {
      const asked = draft;
      const result = await translateText(asked, theirLanguage);
      // If they kept typing while this was in flight, their words win:
      // a translation of what they had a moment ago is not what they want.
      setDraft((current) => (current === asked ? result.text : current));
    } catch (err) {
      setDraftError(err instanceof ApiError ? err.message : 'Could not translate the draft.');
    } finally {
      setTranslating(false);
    }
  }

  async function askCopilot() {
    if (!draftSource || busy) return;
    setDrafting(true);
    setDraftError(null);
    try {
      const asked = draft;
      const result = await draftReply(draftSource);
      // A draft that arrives after the person has started typing does not
      // get to throw their words away.
      setDraft((current) => (current === asked ? result.draft : current));
      setSources(result.sources);
      setSourcesOpen(false);
    } catch (err) {
      setDraftError(err instanceof ApiError ? err.message : 'Could not draft a reply.');
    } finally {
      setDrafting(false);
    }
  }

  const status = error ? (
    <span role="alert" className="text-[11.5px] text-danger">
      {error}
    </span>
  ) : draftError ? (
    <span role="alert" className="text-[11.5px] text-danger">
      {draftError}
    </span>
  ) : sent ? (
    <span role="status" className="text-[11.5px] text-success">
      Sent from your mailbox.
    </span>
  ) : (
    <span className="text-[11px] text-ink-muted">{hint}</span>
  );

  return (
    <form
      className="shrink-0 px-4.5 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSend && draft.trim()) onSend(draft.trim());
      }}
    >
      <div className="border border-line rounded-lg overflow-hidden">
        <label htmlFor={id} className="block px-3.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          {label}
        </label>
        <textarea id={id} rows={sources.length ? 5 : 2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="w-full px-3.5 pt-1.5 pb-2.5 text-[13px] leading-snug text-ink resize-none outline-none bg-transparent" />
        {sources.length ? (
          <div className="px-3.5 pb-2 text-[11.5px] text-ink-muted">
            <span>{sources.length === 1 ? '1 source used' : `${sources.length} sources used`}</span>
            <button type="button" onClick={() => setSourcesOpen((o) => !o)} aria-expanded={sourcesOpen} className="ml-2 inline-flex items-center gap-0.5 text-accent hover:underline">
              {sourcesOpen ? 'Hide sources' : 'View sources'}
              <ChevronDown className={`w-3 h-3 transition-transform duration-[var(--dur-fast)] ${sourcesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {sourcesOpen ? (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {sources.map((source) => (
                  <li key={`${source.type}:${source.id}`}>
                    <Link to={hrefOf(source)} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-subtle text-[11.5px] text-ink hover:bg-line-subtle">
                      <span className="uppercase text-[9.5px] font-bold text-ink-faint">{source.type}</span>
                      <span className="truncate max-w-[220px]">{source.label}</span>
                      <span className="text-ink-faint">{source.date}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="px-3 py-2 border-t border-line-subtle rv-glass-inner flex items-center gap-2">
          {draftSource ? (
            <button type="button" onClick={askCopilot} disabled={busy} className="h-[30px] px-2.5 rounded-md border border-line bg-surface text-[11.5px] font-bold text-ink flex items-center gap-1.5 hover:border-line-strong disabled:opacity-50 transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Sparkles size={13} aria-hidden="true" />
              {drafting ? 'Drafting…' : 'Draft with Copilot'}
            </button>
          ) : null}
          {theirLanguage ? (
            <button type="button" onClick={intoTheirLanguage} disabled={busy || draft.trim().length === 0} title={`Put this reply into ${languageName(theirLanguage)}`} className="h-[30px] px-2.5 rounded-md border border-line bg-surface text-[11.5px] font-bold text-ink flex items-center gap-1.5 hover:border-line-strong disabled:opacity-50 transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Languages size={13} aria-hidden="true" />
              {translating ? 'Translating…' : `Write in ${languageName(theirLanguage)}`}
            </button>
          ) : null}
          {status}
          <span className="grow" />
          <button type="submit" disabled={!onSend || draft.trim().length === 0 || sending} title={onSend ? undefined : 'Not wired yet'} className="h-[30px] px-3.5 rounded-md bg-accent text-on-accent text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            {sending ? 'Sending…' : sendLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
