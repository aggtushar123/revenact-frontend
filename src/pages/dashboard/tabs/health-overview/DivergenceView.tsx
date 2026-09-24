import { useMemo, useState } from 'react';
import { useHealthOverview } from './useHealthOverview';
import { HealthEmpty, HealthError, HealthLoading, HealthTruncatedNotice } from './HealthDataState';
import { layOut, splitDivergent, summariseDivergence, DIVERGENCE_THRESHOLD } from './divergence';
import { PulseDivergenceScatter } from './charts/PulseDivergenceScatter';
import { DivergenceList } from './charts/DivergenceList';
import { useDrill } from '../../drill/useDrill';
import { fromHealthRows } from '../../drill/rows';

/** Underlined, inline with the sentence, same colour as the number it
 *  replaces — a drill trigger, not a link, so it gets an explicit
 *  accessible name rather than relying on visible digits alone. */
const NUMBER_BUTTON = 'underline underline-offset-2 rounded-sm hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/**
 * Health Overview asked the other way round: not how the book is doing, but
 * where the team's read on it might be wrong.
 *
 * Everything here comes off `csmPulseScore` and `aiPulseScore`, both of which
 * the Controls tab already renders — as two separate bar charts that never
 * touch. Putting them on the same pair of axes is the entire feature.
 */
export function DivergenceView() {
  // Pinned at mount so renewal countdowns don't drift between renders.
  const [now] = useState(() => new Date());
  const { open } = useDrill();

  const { rows, error, truncated, isInitialLoad, hasLoaded } = useHealthOverview();

  const laid = useMemo(() => layOut(rows, now), [rows, now]);
  const summary = useMemo(() => summariseDivergence(laid), [laid]);
  const { aiColder, csmColder } = useMemo(() => splitDivergent(laid), [laid]);

  // Same three predicates the headline sentence counts, kept as row lists so
  // each number can open exactly the accounts it counted.
  const disagreeingRows = useMemo(
    () => laid.filter((d) => d.kind === 'ai-colder' || d.kind === 'csm-colder'),
    [laid],
  );
  const urgentBlindSpotRows = useMemo(
    () => laid.filter((d) => d.kind === 'ai-colder' && d.daysToRenewal !== null && d.daysToRenewal <= 90),
    [laid],
  );
  const unratedRows = useMemo(() => laid.filter((d) => d.kind === 'unrated'), [laid]);

  if (isInitialLoad) return <HealthLoading />;
  if (error) return <HealthError message={error} />;
  if (hasLoaded && rows.length === 0) return <HealthEmpty />;

  return (
    <div className="w-full flex flex-col gap-4 pb-12">
      {truncated && <HealthTruncatedNotice />}
      <p className="px-2 text-[11.5px] text-ink-muted">
        <button
          type="button"
          aria-label={`Disagreeing ${summary.disagreeing}, show accounts`}
          onClick={(e) =>
            open(
              {
                title: 'Disagreeing',
                figure: String(summary.disagreeing),
                source: { kind: 'rows', rows: fromHealthRows(disagreeingRows.map((d) => d.row)) },
              },
              e.currentTarget,
            )
          }
          className={`font-bold text-ink ${NUMBER_BUTTON}`}
        >
          {summary.disagreeing}
        </button>{' '}
        of {summary.total} accounts have a CSM and AI pulse {DIVERGENCE_THRESHOLD}+ points apart
        {summary.urgentBlindSpots > 0 && (
          <>
            {' '}—{' '}
            <button
              type="button"
              aria-label={`Urgent blind spots ${summary.urgentBlindSpots}, show accounts`}
              onClick={(e) =>
                open(
                  {
                    title: 'Urgent blind spots',
                    figure: String(summary.urgentBlindSpots),
                    source: { kind: 'rows', rows: fromHealthRows(urgentBlindSpotRows.map((d) => d.row)) },
                  },
                  e.currentTarget,
                )
              }
              className={`font-bold text-danger ${NUMBER_BUTTON}`}
            >
              {summary.urgentBlindSpots}
            </button>{' '}
            of those renew inside 90 days with the AI reading colder
          </>
        )}
        .
        {summary.unrated > 0 && (
          <>
            {' '}
            <span className="text-ink-faint">
              <button
                type="button"
                aria-label={`Unrated ${summary.unrated}, show accounts`}
                onClick={(e) =>
                  open(
                    {
                      title: 'Unrated',
                      figure: String(summary.unrated),
                      source: { kind: 'rows', rows: fromHealthRows(unratedRows.map((d) => d.row)) },
                    },
                    e.currentTarget,
                  )
                }
                className={NUMBER_BUTTON}
              >
                {summary.unrated}
              </button>{' '}
              not plotted — one side hasn’t rated them.
            </span>
          </>
        )}
      </p>

      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        {/* Definite height, not min-height: the scatter's ResponsiveContainer
            asks for height="100%", and a percentage can't resolve against a
            parent whose height comes only from min-height — the chart collapses
            to zero and renders nothing. Every working chart on the Controls tab
            sits in a fixed-height card for the same reason. */}
        <div className="xl:flex-[1.35] h-[460px] bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden flex flex-col">
          <PulseDivergenceScatter laid={laid} />
        </div>

        <div className="xl:flex-1 xl:h-[460px] bg-surface border border-line-subtle rounded-lg shadow-sm overflow-y-auto flex flex-col divide-y divide-line-subtle">
          <DivergenceList
            tone="danger"
            title="AI sees risk the CSM doesn’t"
            caption="The model is reading these colder than the person who owns them. Worth a look before the renewal conversation."
            rows={aiColder}
            emptyMessage="No account currently has an AI Pulse that far below its CSM Pulse."
          />
          <DivergenceList
            tone="ink"
            title="CSM sees risk the AI doesn’t"
            caption="The owner is reading these colder than the model. Usually something the CSM knows that hasn’t reached the data yet."
            rows={csmColder}
            emptyMessage="No account currently has a CSM Pulse that far below its AI Pulse."
          />
        </div>
      </div>
    </div>
  );
}
