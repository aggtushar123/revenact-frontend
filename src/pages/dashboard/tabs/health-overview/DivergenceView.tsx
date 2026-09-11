import { useMemo, useState } from 'react';
import { useHealthOverview } from './useHealthOverview';
import { HealthEmpty, HealthError, HealthLoading, HealthTruncatedNotice } from './HealthDataState';
import { layOut, splitDivergent, summariseDivergence, DIVERGENCE_THRESHOLD } from './divergence';
import { PulseDivergenceScatter } from './charts/PulseDivergenceScatter';
import { DivergenceList } from './charts/DivergenceList';

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

  const { rows, error, truncated, isInitialLoad, hasLoaded } = useHealthOverview();

  const laid = useMemo(() => layOut(rows, now), [rows, now]);
  const summary = useMemo(() => summariseDivergence(laid), [laid]);
  const { aiColder, csmColder } = useMemo(() => splitDivergent(laid), [laid]);

  if (isInitialLoad) return <HealthLoading />;
  if (error) return <HealthError message={error} />;
  if (hasLoaded && rows.length === 0) return <HealthEmpty />;

  return (
    <div className="w-full flex flex-col gap-4 pb-12">
      {truncated && <HealthTruncatedNotice />}
      <p className="px-2 text-[11.5px] text-ink-muted">
        <span className="font-bold text-ink">{summary.disagreeing}</span> of {summary.total} accounts
        have a CSM and AI pulse {DIVERGENCE_THRESHOLD}+ points apart
        {summary.urgentBlindSpots > 0 && (
          <>
            {' '}— <span className="font-bold text-danger">{summary.urgentBlindSpots}</span> of those
            renew inside 90 days with the AI reading colder
          </>
        )}
        .
        {summary.unrated > 0 && (
          <>
            {' '}
            <span className="text-ink-faint">
              {summary.unrated} not plotted — one side hasn’t rated them.
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
            tone="info"
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
