import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircleQuestion } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { useCapability } from '../../hooks';
import type { Question } from '../../features/knowledge/knowledgeSlice';
import { FUNCTION_LABELS } from '../../features/auth/authSlice';

const STALE_DAYS = 3;

/**
 * Where the company is slow to answer itself: every open question, the
 * oldest first, with the ones past three days marked. A question here is
 * a promise someone has not kept; the person asked is reminded daily by
 * the maintenance job, and answering is the only thing that clears it.
 */
export function QuestionsWaitingPanel() {
  const canSeeAll = useCapability('view_all_accounts');
  const [rows, setRows] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canSeeAll) return;
    apiFetch<Question[]>('/questions/?status=open')
      .then((data) => setRows([...data].sort((a, b) => b.days_open - a.days_open)))
      .catch(() => setError('Could not load the open questions.'));
  }, [canSeeAll]);

  // Organisation-wide: hidden rather than shown empty for a role that cannot load it.
  if (!canSeeAll) return null;

  const stale = (rows ?? []).filter((q) => q.days_open >= STALE_DAYS).length;

  return (
    <section className="flex flex-col gap-2" aria-label="Questions waiting">
      <div>
        <h2 className="text-[15px] font-bold text-ink flex items-center gap-2">
          <MessageCircleQuestion className="w-4 h-4 text-accent" />
          Questions waiting
          {rows && rows.length > 0 && (
            <span className="text-[12px] font-semibold text-ink-faint">
              · {rows.length} open{stale > 0 && <span className="text-warning"> · {stale} over {STALE_DAYS} days</span>}
            </span>
          )}
        </h2>
        <p className="text-[11.5px] text-ink-faint">
          Questions routed to people that nobody has answered yet — oldest first.
        </p>
      </div>
      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      {rows && rows.length === 0 && (
        <p className="text-[12px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-3 py-2">
          Nothing waiting. Every question asked has been answered.
        </p>
      )}
      {rows && rows.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {rows.map((q) => {
            const isStale = q.days_open >= STALE_DAYS;
            return (
              <li
                key={q.id}
                className={`bg-surface border border-line-subtle rounded-lg px-[13px] py-[9px] border-l-[3px] ${isStale ? 'border-l-warning' : 'border-l-info'} flex items-baseline justify-between gap-3 flex-wrap`}
                aria-label={`Question for ${q.assignee.name}`}
              >
                <div className="min-w-0">
                  <div className="text-[12.5px] text-ink truncate">{q.text}</div>
                  <div className="text-[11px] text-ink-faint">
                    <span className="text-ink">{q.asked_by.name}</span> → <span className="text-ink">{q.assignee.name}</span> ({FUNCTION_LABELS[q.assignee.function]})
                    {q.customer && (
                      <>
                        {' '}· <Link to={`/organizations/${q.customer.id}`} className="text-accent hover:underline">{q.customer.name}</Link>
                      </>
                    )}
                  </div>
                </div>
                <span className={`text-[11px] font-bold tabular-nums shrink-0 ${isStale ? 'text-warning' : 'text-ink-faint'}`}>
                  {q.days_open === 0 ? 'today' : `${q.days_open} ${q.days_open === 1 ? 'day' : 'days'} waiting`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
