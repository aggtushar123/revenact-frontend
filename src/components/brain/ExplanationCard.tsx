import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchExplanation, generateExplanation } from '../../features/metrics/metricsSlice';
import { formatDate } from '../../features/customers/formatters';

/**
 * Why is this number where it is — one metric, in Claude's words.
 *
 * Reads the latest stored explanation for free on mount; writing a new
 * one is an explicit, paid click. The explanation carries the figures it
 * cited and the day it describes, so a stale one says so rather than
 * passing as current.
 */
export function ExplanationCard({ metricKey, asOf }: { metricKey: string; asOf?: string }) {
  const dispatch = useAppDispatch();
  const explanation = useAppSelector((s) => s.metrics.explanations[metricKey]);
  const explaining = useAppSelector((s) => s.metrics.explaining === metricKey);
  const error = useAppSelector((s) => s.metrics.explainErrors[metricKey]);

  useEffect(() => {
    if (explanation === undefined) dispatch(fetchExplanation(metricKey));
  }, [dispatch, metricKey, explanation]);

  const stale = explanation && asOf && explanation.as_of !== asOf;
  const button = (
    <button
      type="button"
      onClick={() => dispatch(generateExplanation(metricKey))}
      disabled={explaining}
      title="Asks Claude why this number is where it is, from the figures. This makes a paid model call."
      className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-accent hover:underline disabled:opacity-50"
    >
      <Sparkles className="w-3 h-3" />
      {explaining ? 'Reading the figures…' : explanation ? 'Explain again' : 'Ask Claude why'}
    </button>
  );

  return (
    <div className="bg-subtle border border-line-subtle rounded-lg px-3 py-2.5 flex flex-col gap-1.5" aria-label={`Why ${metricKey}`}>
      {error && (
        <p className="text-[12px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      {explanation === undefined && !error && <p className="text-[12px] text-ink-faint">Loading…</p>}
      {explanation === null && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[12px] text-ink-faint">Nobody has asked why yet.</p>
          {button}
        </div>
      )}
      {explanation && (
        <>
          <p className="text-[12.5px] text-ink leading-relaxed">{explanation.text}</p>
          {explanation.evidence.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {explanation.evidence.map((line) => (
                <li key={line} className="text-[11.5px] text-ink-faint font-mono truncate" title={line}>
                  · {line}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className={`text-[11px] ${stale ? 'text-warning font-semibold' : 'text-ink-faint'}`}>
              {stale ? `Explains ${formatDate(explanation.as_of)}, not today` : `As of ${formatDate(explanation.as_of)}`}
              {explanation.generated_by ? ` · asked by ${explanation.generated_by}` : ''}
            </span>
            {button}
          </div>
        </>
      )}
    </div>
  );
}
