// Brain > Feature Requests: what customers keep asking for, ranked by the
// revenue behind it rather than by who shouted loudest.
//
// Every row is a cluster of classified asks (see revenact-backend
// services/requests). The figures are the reader's own: a CSM sees the
// weight of their book behind an ask, leadership sees all of it.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Inbox, Sparkles } from 'lucide-react';
import { useAppSelector, useCapability } from '../../hooks';
import { ApiError } from '../../lib/apiClient';
import { formatCompactMoney, formatMoney } from '../../features/customers/formatters';
import { fetchRequest, fetchRequests, gatherRequests, updateRequest } from '../../features/requests/requestsApi';
import { STATUS_LABELS } from '../../features/requests/types';
import type { FeatureRequestFull, FeatureRequestRow, RequestStatus } from '../../features/requests/types';
import type { CurrencyCode } from '../../features/auth/authSlice';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const FILTERS: (RequestStatus | 'all')[] = ['all', 'open', 'planned', 'shipped', 'declined'];
const STATUS_PILL: Record<RequestStatus, string> = {
  open: 'bg-subtle text-ink-muted',
  planned: 'bg-info-dim text-info',
  shipped: 'bg-success-dim text-success',
  declined: 'bg-subtle text-ink-faint',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-15T09:00:00Z" → "15 Sep 2026", read off the string so the day never shifts. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function trend(row: Pick<FeatureRequestRow, 'last_90_days' | 'previous_90_days'>): string {
  const { last_90_days: now, previous_90_days: before } = row;
  if (now === 0 && before === 0) return 'No asks in six months';
  if (before === 0) return `${now} in the last 90 days`;
  const change = now - before;
  if (change === 0) return `${now} in the last 90 days, steady`;
  return `${now} in the last 90 days, ${change > 0 ? 'up' : 'down'} from ${before}`;
}

export function FeatureRequestsPage() {
  const currency = useAppSelector((s) => s.auth.user?.organisation.currency ?? 'USD');
  const mayCurate = useCapability('view_all_accounts');
  const [filter, setFilter] = useState<RequestStatus | 'all'>('all');
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; rows: FeatureRequestRow[] } | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [gathering, setGathering] = useState(false);
  const [gatherNote, setGatherNote] = useState<string | null>(null);
  const [gatherError, setGatherError] = useState<string | null>(null);

  const key = `${filter}#${attempt}`;
  const rows = loaded?.key === key ? loaded.rows : null;
  const error = failed?.key === key ? failed.message : null;

  useEffect(() => {
    let cancelled = false;
    fetchRequests(filter)
      .then((next) => {
        if (cancelled) return;
        if (!Array.isArray(next)) throw new Error('unexpected response');
        setLoaded({ key, rows: next });
      })
      .catch((err) => {
        if (!cancelled) setFailed({ key, message: errorText(err, 'Could not load feature requests.') });
      });
    return () => {
      cancelled = true;
    };
  }, [filter, key]);

  async function gather() {
    setGathering(true);
    setGatherNote(null);
    setGatherError(null);
    try {
      const result = await gatherRequests();
      const made = result.created === 1 ? '1 new request' : `${result.created} new requests`;
      const from = result.linked === 1 ? '1 ask' : `${result.linked} asks`;
      setGatherNote(result.remaining > 0 ? `${made} from ${from}, ${result.remaining} left for tonight` : `${made} from ${from}`);
      setAttempt((n) => n + 1);
    } catch (err) {
      setGatherError(errorText(err, 'Could not gather asks.'));
    } finally {
      setGathering(false);
    }
  }

  if (openId !== null) {
    return (
      <RequestDetail
        id={openId}
        currency={currency}
        mayCurate={mayCurate}
        onBack={() => setOpenId(null)}
        onChanged={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Feature Requests</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            What customers keep asking for, with the revenue behind it. Built from the asks the classifier already found in
            your emails, tickets and calls.
          </p>
        </div>
        {mayCurate && (
          <button
            type="button"
            onClick={gather}
            disabled={gathering}
            className={`flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {gathering ? 'Gathering…' : 'Gather asks'}
          </button>
        )}
      </div>

      {!mayCurate && (
        <p className="text-[12.5px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-4 py-2.5">
          These figures count only the companies you can open, so they are the weight of your own book behind each ask.
        </p>
      )}
      {gatherNote && <p className="text-[12.5px] text-ink-muted" role="status">{gatherNote}</p>}
      {gatherError && <p className="text-[12.5px] text-danger" role="alert">{gatherError}</p>}

      <div className="flex items-center gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${FOCUS} ${
              filter === option ? 'bg-accent text-on-accent' : 'bg-subtle text-ink-muted hover:text-ink'
            }`}
          >
            {option === 'all' ? 'All' : STATUS_LABELS[option]}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-[12.5px] text-danger" role="alert">
          {error}{' '}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`underline rounded-sm ${FOCUS}`}>
            Retry
          </button>
        </p>
      ) : rows === null ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading feature requests">
          <div className="h-10 rounded-lg bg-subtle animate-pulse" />
          <div className="h-10 rounded-lg bg-subtle animate-pulse" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-1.5 text-center bg-surface border border-line-subtle rounded-xl">
          <Inbox className="w-5 h-5 text-ink-faint" aria-hidden="true" />
          <p className="text-[14px] font-semibold text-ink-muted">No feature requests yet.</p>
          <p className="text-[12.5px] text-ink-faint max-w-sm">
            {mayCurate
              ? 'Gather the asks the classifier tagged and they will be grouped and named here.'
              : 'Nothing has been gathered yet, or none of the asks came from companies you can open.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                {['Request', 'Revenue asking', 'Who', 'Trend', 'Status'].map((heading) => (
                  <th key={heading} className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-subtle/40 transition-colors align-top">
                  <td className="px-5 py-3 max-w-[340px]">
                    <button
                      type="button"
                      onClick={() => setOpenId(row.id)}
                      aria-label={`Open ${row.title}`}
                      className={`text-[13px] font-bold text-ink hover:text-accent transition-colors text-left rounded-sm ${FOCUS}`}
                    >
                      {row.title}
                    </button>
                    {row.summary && <p className="text-[12px] text-ink-faint mt-0.5 line-clamp-2">{row.summary}</p>}
                  </td>
                  <td
                    className="px-5 py-3 text-[13px] font-semibold text-ink font-mono-brand tabular-nums"
                    title={formatMoney(row.arr, currency)}
                  >
                    {formatCompactMoney(row.arr, currency)}
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-ink-muted">
                    <span>{row.companies === 1 ? '1 company' : `${row.companies} companies`}</span>
                    <span className="block text-ink-faint">
                      {row.interactions === 1 ? '1 ask' : `${row.interactions} asks`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-ink-muted">{trend(row)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_PILL[row.status]}`}>
                      {STATUS_LABELS[row.status]}
                    </span>
                    {row.owner && <span className="block text-[11px] text-ink-faint mt-1">{row.owner.name}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RequestDetail({
  id,
  currency,
  mayCurate,
  onBack,
  onChanged,
}: {
  id: number;
  currency: CurrencyCode;
  mayCurate: boolean;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<FeatureRequestFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    fetchRequest(id)
      .then((next) => {
        if (!cancelled) {
          setDetail(next);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, 'Could not load this request.'));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(load, [load]);

  async function setStatus(status: RequestStatus) {
    setSaving(true);
    setError(null);
    try {
      setDetail(await updateRequest(id, { status }));
      onChanged();
    } catch (err) {
      setError(errorText(err, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5 max-w-4xl">
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted hover:text-ink w-fit rounded-sm ${FOCUS}`}
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        All feature requests
      </button>

      {error && <p className="text-[12.5px] text-danger" role="alert">{error}</p>}

      {detail === null ? (
        !error && (
          <div className="flex flex-col gap-2" role="status" aria-label="Loading request">
            <div className="h-6 w-64 rounded bg-subtle animate-pulse" />
            <div className="h-20 rounded-lg bg-subtle animate-pulse" />
          </div>
        )
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-bold text-ink tracking-tight">{detail.title}</h1>
              {detail.summary && <p className="text-[13px] text-ink-muted mt-1 max-w-[70ch]">{detail.summary}</p>}
            </div>
            {mayCurate && (
              <div className="flex flex-col gap-1 shrink-0">
                <label htmlFor="request-status" className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                  Status
                </label>
                <select
                  id="request-status"
                  value={detail.status}
                  disabled={saving}
                  onChange={(e) => setStatus(e.target.value as RequestStatus)}
                  className={`px-3 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent disabled:opacity-50 ${FOCUS}`}
                >
                  {(Object.keys(STATUS_LABELS) as RequestStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 bg-surface border border-line-subtle rounded-xl px-5 py-4">
            <Figure label="Revenue asking" value={formatMoney(detail.arr, currency)} />
            <Figure label="Companies" value={String(detail.companies)} />
            <Figure label="Asks" value={String(detail.interactions)} />
            <Figure label="Last 90 days" value={String(detail.last_90_days)} />
            {!mayCurate && (
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_PILL[detail.status]}`}>
                {STATUS_LABELS[detail.status]}
              </span>
            )}
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Companies asking</h2>
            <ul aria-label="Companies asking" className="flex flex-wrap gap-2">
              {detail.companies_asking.map((company) => (
                <li key={company.id}>
                  <Link
                    to={`/organizations/${company.id}`}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-line-subtle text-[12.5px] hover:border-accent/40 hover:bg-subtle/50 transition-colors ${FOCUS}`}
                  >
                    <span className="font-semibold text-ink">{company.name}</span>
                    <span className="text-ink-faint font-mono-brand tabular-nums">{formatCompactMoney(company.arr, currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Evidence</h2>
            <ul aria-label="Evidence" className="flex flex-col bg-surface border border-line-subtle rounded-xl divide-y divide-line-subtle">
              {detail.evidence.map((row) => (
                <li key={row.id} className="px-5 py-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="uppercase font-bold text-ink-faint">{row.kind}</span>
                    <Link
                      to={row.company.type === 'account' ? `/accounts/${row.company.id}` : `/organizations/${row.company.id}`}
                      className={`font-semibold text-ink-muted hover:text-accent rounded-sm ${FOCUS}`}
                    >
                      {row.company.name}
                    </Link>
                    <span className="text-ink-faint">{shortDate(row.occurred_at)}</span>
                  </div>
                  <p className="text-[12.5px] text-ink leading-relaxed">{row.snippet}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint">{label}</span>
      <span className="text-[15px] font-bold text-ink font-mono-brand tabular-nums">{value}</span>
    </div>
  );
}
