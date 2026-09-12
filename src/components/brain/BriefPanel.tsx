import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchBrief, generateBrief } from '../../features/metrics/metricsSlice';
import { formatDate } from '../../features/customers/formatters';
import { monthName } from './formatMetric';

/**
 * The management brief: the metric layer, written out by Claude.
 *
 * Shows the last brief written, never regenerates on load — a brief costs
 * a real model call, and last month's brief is itself a record. Writing a
 * new one is a button, and the button says what it costs.
 *
 * Every sentence was written from exactly the figures the panels below
 * show, and the backend stores that evidence beside the text; the footer
 * says which day's figures and which month-end they were compared with.
 */
export function BriefPanel() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { brief, briefGenerating, briefError } = useAppSelector((state) => state.metrics);

  useEffect(() => {
    if (canSeeAll) dispatch(fetchBrief());
  }, [dispatch, canSeeAll]);

  if (!canSeeAll) return null;

  const button = (
    <button
      type="button"
      onClick={() => dispatch(generateBrief())}
      disabled={briefGenerating}
      title="Writes a new brief from today's figures. This makes a paid model call."
      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Sparkles className="w-3.5 h-3.5" />
      {briefGenerating ? 'Writing…' : brief ? 'Write a new brief' : 'Write the first brief'}
    </button>
  );

  return (
    <section className="flex flex-col gap-2" aria-label="Management brief">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-ink">Management brief</h2>
          <p className="text-[11.5px] text-ink-faint">
            The figures below, written out — every sentence grounded in them, and stored with them.
          </p>
        </div>
        {button}
      </div>

      {briefError && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {briefError}
        </p>
      )}

      {brief === null && !briefGenerating && (
        <p className="text-[12px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-3 py-2">
          No brief written yet.
        </p>
      )}

      {brief && (
        <article className="bg-surface border border-line-subtle rounded-lg px-5 py-4 flex flex-col gap-3">
          <h3 className="text-[15px] font-bold text-ink leading-snug">{brief.headline}</h3>
          <div className="flex flex-col gap-2.5">
            {brief.body.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index} className="text-[13px] text-ink-muted leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          {brief.watch.length > 0 && (
            <div>
              <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint mb-1">
                Watch next month
              </h4>
              <ul className="list-disc pl-5 flex flex-col gap-1">
                {brief.watch.map((item) => (
                  <li key={item} className="text-[12.5px] text-ink-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[11px] text-ink-faint border-t border-line-subtle pt-2">
            Written {formatDate(brief.generated_at.slice(0, 10))}
            {brief.generated_by ? ` by ${brief.generated_by}` : ''} from the figures as of{' '}
            {formatDate(brief.as_of)}
            {brief.baseline
              ? `, compared with ${monthName(brief.baseline)} end.`
              : '. No earlier month-end existed to compare against.'}
          </p>
        </article>
      )}
    </section>
  );
}
