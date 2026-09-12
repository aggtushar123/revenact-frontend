import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { fetchActivityStats } from '../../../../features/activity/activitySlice';
import { formatCompactMoney } from '../../../../features/customers/formatters';
import { TouchTimeline } from './charts/TouchTimeline';
import { CadenceChart } from './charts/CadenceChart';
import { OwnerCoverageList } from './charts/OwnerCoverageList';
import { GoingDarkTable } from './charts/GoingDarkTable';

/** The filter query string, handed down by ActivityContainer's own bar. */
export interface ActivityContext {
  query: string;
}

interface TileProps {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'danger' | 'success';
}

function Tile({ label, value, detail, tone = 'neutral' }: TileProps) {
  const accent = {
    neutral: 'border-l-info',
    danger: 'border-l-danger',
    success: 'border-l-success',
  }[tone];
  const figure = { neutral: 'text-ink', danger: 'text-danger', success: 'text-success' }[tone];

  return (
    <div
      className={`bg-surface border border-line-subtle rounded-lg shadow-sm px-[13px] py-[11px] border-l-[3px] ${accent}`}
    >
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={`text-[25px] font-semibold leading-tight tracking-tight mt-[3px] tabular-nums ${figure}`}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-muted mt-[1px]">{detail}</div>
    </div>
  );
}

/**
 * Activity Tracking: is the team working the book, and where isn't it?
 *
 * Volume first, then cadence, then the two views that assign it — per book,
 * and the accounts that have gone quiet. An operations review rather than a
 * voice-of-customer one: AI Trending Topics answers what customers are saying,
 * this answers what we did about it.
 */
export function ControlsView() {
  const dispatch = useAppDispatch();
  const { stats, isLoading, error } = useAppSelector((state) => state.activity);

  const context = useOutletContext<ActivityContext | undefined>();
  const query = context?.query ?? '';

  useEffect(() => {
    dispatch(fetchActivityStats(query));
  }, [dispatch, query]);

  const kpis = stats?.kpis;
  const currency = stats?.currency ?? 'USD';
  const windowDays = stats?.window_days ?? 90;
  const threshold = stats?.going_dark_threshold ?? 60;

  // The finding worth leading with when it's true: a team being pulled by
  // tickets rather than working a cadence.
  const reactive = kpis !== undefined && kpis.inbound > kpis.touches;

  return (
    <div className="w-full flex flex-col gap-4 pb-12">
      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {stats && kpis && kpis.accounts === 0 && !isLoading && (
        <p className="text-[12.5px] text-ink-faint">No accounts match these filters.</p>
      )}

      <div
        className={`w-full flex flex-col gap-4 transition-opacity ${
          isLoading && stats ? 'opacity-60' : ''
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Tile
            label="Touches logged"
            value={kpis ? kpis.touches.toLocaleString() : '—'}
            detail={
              kpis
                ? `${kpis.inbound.toLocaleString()} inbound tickets in the same ${windowDays} days`
                : 'loading'
            }
            tone={reactive ? 'danger' : 'neutral'}
          />
          <Tile
            label="Coverage"
            value={kpis?.coverage === null || kpis === undefined ? '—' : `${kpis.coverage}%`}
            detail={
              kpis
                ? `${kpis.touched_accounts} of ${kpis.accounts} accounts contacted`
                : 'loading'
            }
            tone={kpis && kpis.coverage !== null && kpis.coverage < 80 ? 'danger' : 'success'}
          />
          <Tile
            label="Gone quiet"
            value={kpis ? String(kpis.dark_accounts) : '—'}
            detail={
              kpis
                ? kpis.dark_accounts > 0
                  ? `${formatCompactMoney(kpis.dark_arr, currency)} with no contact in ${threshold} days`
                  : `everything contacted inside ${threshold} days`
                : 'loading'
            }
            tone={kpis && kpis.dark_accounts > 0 ? 'danger' : 'success'}
          />
          <Tile
            label="Overdue tasks"
            value={kpis ? String(kpis.overdue_tasks) : '—'}
            detail={
              kpis
                ? `of ${kpis.open_tasks} open · ${kpis.completed_tasks} completed`
                : 'loading'
            }
            tone={kpis && kpis.overdue_tasks > 0 ? 'danger' : 'success'}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden h-[320px]">
            <TouchTimeline
              weeks={stats?.timeline ?? []}
              sources={stats?.sources ?? []}
              inbound={kpis?.inbound ?? 0}
              windowDays={windowDays}
            />
          </div>
          <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden h-[320px]">
            <CadenceChart
              buckets={stats?.cadence ?? []}
              currency={currency}
              threshold={threshold}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden">
            <GoingDarkTable
              rows={stats?.going_dark ?? []}
              currency={currency}
              threshold={threshold}
            />
          </div>
          <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden max-h-[420px]">
            <OwnerCoverageList
              owners={stats?.by_owner ?? []}
              currency={currency}
              windowDays={windowDays}
              threshold={threshold}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
