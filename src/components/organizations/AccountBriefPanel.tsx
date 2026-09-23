// The standing brief on one account, and what nobody here can answer.
//
// The brief says what they use the product for, who cares about what, and
// what is still open (see revenact-backend services/knowledge/brief.py).
// It is written when someone asks, never on a schedule, so it carries the
// date it was written and who asked for it.
//
// Under it, the gaps: questions asked of the Copilot that had nothing to
// answer from, and routed questions nobody answered. Writing the answer
// here records it as an ordinary contribution and closes the loop.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Sparkles, X } from 'lucide-react';
import { answerGap, dismissGap, fetchBrief, generateBrief } from '../../features/knowledge/briefApi';
import type { AccountBrief, BriefGap } from '../../features/knowledge/briefApi';
import { hrefOf } from '../../pages/copilot/sourceHref';
import { ApiError } from '../../lib/apiClient';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-22T09:00:00Z" → "22 Sep 2026", read off the string so the day never shifts. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function AccountBriefPanel({ customerId, customerName }: { customerId: number; customerName: string }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; brief: AccountBrief } | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [writing, setWriting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const key = `${customerId}#${attempt}`;
  const brief = loaded?.key === key ? loaded.brief : null;
  const error = failed?.key === key ? failed.message : null;

  useEffect(() => {
    let cancelled = false;
    fetchBrief(customerId)
      .then((next) => {
        if (cancelled) return;
        // A wrong shape must not take the company page down with it.
        if (!next || !Array.isArray(next.use_cases)) throw new Error('unexpected response');
        setLoaded({ key, brief: next });
      })
      .catch((err) => {
        if (!cancelled) setFailed({ key, message: errorText(err, 'Could not load the brief.') });
      });
    return () => {
      cancelled = true;
    };
  }, [customerId, key]);

  async function write() {
    setWriting(true);
    setActionError(null);
    try {
      setLoaded({ key, brief: await generateBrief(customerId) });
    } catch (err) {
      setActionError(errorText(err, 'Could not write the brief.'));
    } finally {
      setWriting(false);
    }
  }

  const written = brief?.generated_at !== null && brief !== null;

  return (
    <section
      aria-label="Account brief"
      className="bg-surface rounded-xl border border-line-subtle shadow-sm px-5 py-4 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-bold text-ink flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-ink-faint" aria-hidden="true" />
            What {customerName} does with us
          </h2>
          {written && brief.generated_at ? (
            <p className="text-[12px] text-ink-faint mt-0.5">
              Written by {brief.generated_by?.name ?? 'the Copilot'} on {shortDate(brief.generated_at)}
            </p>
          ) : null}
        </div>
        {brief ? (
          <button
            type="button"
            onClick={write}
            disabled={writing}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold bg-accent hover:bg-accent-hover text-on-accent shadow-sm transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
          >
            {writing ? 'Writing…' : written ? 'Rewrite' : 'Write the brief'}
          </button>
        ) : null}
      </div>

      {actionError ? <p className="text-[12.5px] text-danger" role="alert">{actionError}</p> : null}

      {error ? (
        <p className="text-[12.5px] text-danger" role="alert">
          {error}{' '}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`underline rounded-sm ${FOCUS}`}>
            Retry
          </button>
        </p>
      ) : brief === null ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading the brief">
          <div className="h-4 w-48 rounded bg-subtle animate-pulse" />
          <div className="h-4 w-72 rounded bg-subtle animate-pulse" />
        </div>
      ) : (
        <>
          {written ? (
            <div className="flex flex-col gap-4">
              <Lines title="Use cases" items={brief.use_cases} empty="Nothing on record says what they use it for." />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Stakeholders</h3>
                {brief.stakeholders.length === 0 ? (
                  <p className="text-[12.5px] text-ink-faint">Nobody named yet.</p>
                ) : (
                  <ul aria-label="Stakeholders" className="flex flex-col gap-1">
                    {brief.stakeholders.map((person) => (
                      <li key={person.name} className="text-[13px] text-ink">
                        <span className="font-semibold">{person.name}</span>
                        {person.cares_about ? <span className="text-ink-muted"> — {person.cares_about}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Lines title="Still open" items={brief.open_threads} empty="Nothing open on record." />
              {brief.sources.length > 0 || brief.hidden_sources > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Written from</h3>
                  <ul className="flex flex-wrap gap-1.5" aria-label="Sources">
                    {brief.sources.map((source) => (
                      <li key={`${source.type}:${source.id}`}>
                        <Link
                          to={hrefOf(source)}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-subtle text-[11.5px] text-ink hover:bg-line-subtle ${FOCUS}`}
                        >
                          <span className="uppercase text-[9.5px] font-bold text-ink-faint">{source.type}</span>
                          <span className="truncate max-w-[180px]">{source.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {brief.hidden_sources > 0 ? (
                    <p className="text-[12px] text-ink-faint">
                      {brief.hidden_sources === 1
                        ? 'And 1 record you cannot see.'
                        : `And ${brief.hidden_sources} records you cannot see.`}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[12.5px] text-ink-faint">
              No brief yet. The Copilot can read what the company knows about {customerName} and write one.
            </p>
          )}

          <Gaps
            gaps={brief.gaps}
            onChanged={() => setAttempt((n) => n + 1)}
            onError={(message) => setActionError(message)}
          />
        </>
      )}
    </section>
  );
}

function Lines({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1 list-disc pl-4">
          {items.map((item) => (
            <li key={item} className="text-[13px] text-ink leading-relaxed">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Gaps({ gaps, onChanged, onError }: { gaps: BriefGap[]; onChanged: () => void; onError: (message: string) => void }) {
  const [answering, setAnswering] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(gap: BriefGap) {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await answerGap(gap.id, draft.trim());
      setAnswering(null);
      setDraft('');
      onChanged();
    } catch (err) {
      onError(errorText(err, 'Could not save the answer.'));
    } finally {
      setBusy(false);
    }
  }

  async function drop(gap: BriefGap) {
    setBusy(true);
    try {
      await dismissGap(gap.id);
      onChanged();
    } catch (err) {
      onError(errorText(err, 'Could not dismiss it.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-line-subtle">
      <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
        What we cannot answer
      </h3>
      {gaps.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">Nothing unanswered right now.</p>
      ) : (
        <ul aria-label="What we cannot answer" className="flex flex-col divide-y divide-line-subtle">
          {gaps.map((gap) => (
            <li key={gap.id} className="py-2.5 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-ink">{gap.subject}</p>
                  <p className="text-[11.5px] text-ink-faint mt-0.5">
                    Asked {gap.times_asked === 1 ? 'once' : `${gap.times_asked} times`}
                    {gap.function ? ` · ${gap.function}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAnswering(answering === gap.id ? null : gap.id);
                      setDraft('');
                    }}
                    disabled={busy}
                    aria-label={`Answer ${gap.subject}`}
                    className={`px-2.5 py-1 rounded-md text-[12px] font-semibold text-ink-muted hover:text-ink hover:bg-subtle disabled:opacity-50 ${FOCUS}`}
                  >
                    Answer
                  </button>
                  <button
                    type="button"
                    onClick={() => drop(gap)}
                    disabled={busy}
                    aria-label={`Dismiss ${gap.subject}`}
                    className={`p-1.5 rounded-md text-ink-faint hover:text-ink hover:bg-subtle disabled:opacity-50 ${FOCUS}`}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {answering === gap.id ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    save(gap);
                  }}
                >
                  <label htmlFor={`gap-answer-${gap.id}`} className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                    Your answer
                  </label>
                  <textarea
                    id={`gap-answer-${gap.id}`}
                    rows={3}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="What you know, in your own words."
                    className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent resize-y"
                  />
                  <p className="text-[12px] text-ink-faint">
                    This is recorded as your contribution on the account, so the Copilot answers from it next time.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!draft.trim() || busy}
                      className={`px-3 py-1.5 rounded-md bg-accent text-on-accent text-[12.5px] font-bold disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
                    >
                      Save answer
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswering(null)}
                      className={`text-[12.5px] font-semibold text-ink-muted hover:text-ink rounded-sm ${FOCUS}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
