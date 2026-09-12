import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { fetchUsageStats } from '../../../../features/usage/usageSlice';
import { formatCompactMoney } from '../../../../features/customers/formatters';
import { UtilisationBandChart } from './charts/UtilisationBandChart';
import { UsageScatter } from './charts/UsageScatter';
import { AccountUsageList } from './charts/AccountUsageList';
import { AdoptionBreadthChart } from './charts/AdoptionBreadthChart';

/** The filter query string, handed down by UsageOverviewContainer's own bar. */
export interface UsageOverviewContext {
  query: string;
}

interface TileProps {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'danger' | 'info';
}

function Tile({ label, value, detail, tone = 'neutral' }: TileProps) {
  const accent = { neutral: 'border-l-line-strong', danger: 'border-l-danger', info: 'border-l-info' }[
    tone
  ];
  const figure = { neutral: 'text-ink', danger: 'text-danger', info: 'text-info' }[tone];

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
 * Usage Overview: what the book pays for, against what it uses.
 *
 * Four tiles for the size of the question, then the shape of the book, then
 * the two lists that do something about it — fix the shelfware, sell into the
 * capacity. Every figure comes from the server (see `/customers/usage/`), so
 * the charts and the lists can't disagree about a threshold.
 */
export function ControlsView() {
  const dispatch = useAppDispatch();
  const { stats, isLoading, error } = useAppSelector((state) => state.usage);

  const context = useOutletContext<UsageOverviewContext | undefined>();
  const query = context?.query ?? '';

  useEffect(() => {
    dispatch(fetchUsageStats(query));
  }, [dispatch, query]);

  const kpis = stats?.kpis;
  const currency = stats?.currency ?? 'USD';
  const money = (value: number) => formatCompactMoney(value, currency);

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

      {/* Dimmed rather than replaced while a refetch runs: changing a filter
          shouldn't blank the dashboard, and the numbers on screen are still
          the last true ones. */}
      <div
        className={`w-full flex flex-col gap-4 transition-opacity ${
          isLoading && stats ? 'opacity-60' : ''
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Tile
            label="Seat utilisation"
            value={kpis?.utilisation === null || kpis === undefined ? '—' : `${kpis.utilisation}%`}
            detail={
              kpis
                ? `${kpis.active_seats.toLocaleString()} of ${kpis.contracted_seats.toLocaleString()} seats active`
                : 'loading'
            }
          />
          <Tile
            label="Shelfware"
            value={kpis ? money(kpis.shelfware_arr) : '—'}
            detail={
              kpis ? `${kpis.idle_seats.toLocaleString()} idle seats, below 75% used` : 'loading'
            }
            tone="danger"
          />
          <Tile
            label="At capacity"
            value={kpis ? money(kpis.at_capacity_arr) : '—'}
            detail={
              kpis
                ? `${kpis.at_capacity_count} ${kpis.at_capacity_count === 1 ? 'account is' : 'accounts are'} out of room`
                : 'loading'
            }
            tone="info"
          />
          <Tile
            label="No seat data"
            value={kpis ? String(kpis.unmeasured_count) : '—'}
            detail={
              kpis
                ? `of ${kpis.accounts} accounts · absent from every figure here`
                : 'loading'
            }
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden h-[320px]">
            <UtilisationBandChart
              bands={stats?.bands ?? []}
              currency={currency}
              unmeasured={kpis?.unmeasured_count ?? 0}
            />
          </div>
          <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden h-[320px]">
            <UsageScatter points={stats?.scatter ?? []} currency={currency} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden">
            <AccountUsageList
              title="Shelfware — what to fix"
              subtitle="Most ARR attached to seats nobody uses, biggest first"
              rows={stats?.shelfware ?? []}
              currency={currency}
              moneyColumn="shelfware"
              emptyMessage="Nothing in this selection is below 75% used."
            />
          </div>
          <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden max-h-[420px]">
            <AccountUsageList
              title="At capacity — what to sell"
              subtitle="Accounts out of seats, largest first"
              rows={stats?.at_capacity ?? []}
              currency={currency}
              moneyColumn="arr"
              emptyMessage="Nobody in this selection is near their seat count."
              showOwner={false}
            />
          </div>
        </div>

        <div className="bg-surface border border-line-subtle rounded-lg shadow-sm overflow-hidden">
          <AdoptionBreadthChart buckets={stats?.adoption ?? []} currency={currency} />
        </div>
      </div>
    </div>
  );
}
