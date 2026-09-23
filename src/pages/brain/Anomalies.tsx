// Brain > Anomalies: what suddenly started going wrong at several
// companies at once.
//
// One fault reported by eight accounts reads as eight tickets everywhere
// else in this product (see revenact-backend services/anomalies). Here it
// is one row, ranked by the revenue behind it, and every figure is the
// reader's own: their companies, and the reports they may read.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivitySquare, ArrowLeft, Radar } from 'lucide-react';
import { useAppSelector, useCapability } from '../../hooks';
import { ApiError } from '../../lib/apiClient';
import { formatCompactMoney, formatMoney } from '../../features/customers/formatters';
import type { CurrencyCode } from '../../features/auth/authSlice';
import {
  STATUS_LABELS,
  detectAnomalies,
  fetchAnomalies,
  fetchAnomaly,
  setAnomalyStatus,
} from '../../features/anomalies/anomaliesApi';
import type { AnomalyDetail, AnomalyRow, AnomalyStatus } from '../../features/anomalies/anomaliesApi';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const FILTERS: (AnomalyStatus | 'all')[] = ['all', 'live', 'acknowledged', 'resolved'];
const STATUS_PILL: Record<AnomalyStatus, string> = {
  live: 'bg-danger-dim text-danger',
  acknowledged: 'bg-warning-dim text-warning',
  resolved: 'bg-success-dim text-success',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-22T09:00:00Z" → "22 Sep", read off the string so the day never shifts. */
function shortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return iso;
  return `${d} ${MONTHS[m - 1]}`;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function found(created: number, attached: number): string {
  const clusters = created === 1 ? '1 new cluster' : `${created} new clusters`;
  const reports = attached === 1 ? '1 report attached' : `${attached} reports attached`;
  return `${clusters}, ${reports}`;
}

/** What a stopped run still managed to find, if anything. */
function partial(err: unknown): string {
  if (!(err instanceof ApiError) || typeof err.body !== 'object' || err.body === null) return '';
  const body = err.body as { found?: number };
  if (!body.found) return '';
  return ` ${body.found === 1 ? '1 new cluster was' : `${body.found} new clusters were`} still found.`;
}

export function AnomaliesPage() {
  const currency = useAppSelector((s) => s.auth.user?.organisation.currency ?? 'USD');
  const mayAct = useCapability('view_all_accounts');
  const [filter, setFilter] = useState<AnomalyStatus | 'all'>('all');
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; rows: AnomalyRow[] } | null>(null);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [looking, setLooking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [lookError, setLookError] = useState<string | null>(null);

  const key = `${filter}#${attempt}`;
  const rows = loaded?.key === key ? loaded.rows : null;
  const error = failed?.key === key ? failed.message : null;

  useEffect(() => {
    let cancelled = false;
    fetchAnomalies(filter)
      .then((next) => {
        if (cancelled) return;
        if (!Array.isArray(next)) throw new Error('unexpected response');
        setLoaded({ key, rows: next });
      })
      .catch((err) => {
        if (!cancelled) setFailed({ key, message: errorText(err, 'Could not load anomalies.') });
      });
    return () => {
      cancelled = true;
    };
  }, [filter, key]);

  async function look() {
    setLooking(true);
    setNote(null);
    setLookError(null);
    try {
      const result = await detectAnomalies();
      setNote(found(result.found, result.attached));
    } catch (err) {
      setLookError(`${errorText(err, 'Could not look now.')}${partial(err)}`);
    } finally {
      setLooking(false);
      // Either way the picture may have moved on.
      setAttempt((n) => n + 1);
    }
  }

  if (openId !== null) {
    return (
      <AnomalyPane
        key={openId}
        id={openId}
        currency={currency}
        mayAct={mayAct}
        onBack={() => setOpenId(null)}
        onChanged={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Anomalies</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            The same thing going wrong at several companies at once, found in the last fortnight of classified emails,
            tickets and calls.
          </p>
        </div>
        {mayAct && (
          <button
            type="button"
            onClick={look}
            disabled={looking}
            className={`flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold shadow-sm transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
          >
            <Radar className="w-4 h-4" aria-hidden="true" />
            {looking ? 'Looking…' : 'Look now'}
          </button>
        )}
      </div>

      {!mayAct && (
        <p className="text-[12.5px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-4 py-2.5">
          These figures count only the companies you can open and the reports you can read.
        </p>
      )}
      {note && <p className="text-[12.5px] text-ink-muted" role="status">{note}</p>}
      {lookError && <p className="text-[12.5px] text-danger" role="alert">{lookError}</p>}

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
        <div className="flex flex-col gap-2" role="status" aria-label="Loading anomalies">
          <div className="h-10 rounded-lg bg-subtle animate-pulse" />
          <div className="h-10 rounded-lg bg-subtle animate-pulse" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-1.5 text-center bg-surface border border-line-subtle rounded-xl">
          <ActivitySquare className="w-5 h-5 text-ink-faint" aria-hidden="true" />
          <p className="text-[14px] font-semibold text-ink-muted">Nothing unusual right now.</p>
          <p className="text-[12.5px] text-ink-faint max-w-sm">
            A cluster shows here when the same report reaches at least three companies and clearly more often than the
            fortnight before. A cluster made only of personal mail is named from its shape rather than its words.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                {['What is happening', 'Revenue hit', 'Spread', 'Seen', 'Status'].map((heading) => (
                  <th key={heading} className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {rows.map((anomaly) => (
                <tr key={anomaly.id} className="hover:bg-subtle/40 transition-colors align-top">
                  <td className="px-5 py-3 max-w-[340px]">
                    <button
                      type="button"
                      onClick={() => setOpenId(anomaly.id)}
                      aria-label={`Open ${anomaly.title}`}
                      className={`text-[13px] font-bold text-ink hover:text-accent transition-colors text-left rounded-sm ${FOCUS}`}
                    >
                      {anomaly.title}
                    </button>
                    {anomaly.summary && <p className="text-[12px] text-ink-faint mt-0.5 line-clamp-2">{anomaly.summary}</p>}
                  </td>
                  <td
                    className="px-5 py-3 text-[13px] font-semibold text-ink font-mono-brand tabular-nums"
                    title={formatMoney(anomaly.arr, currency)}
                  >
                    {formatCompactMoney(anomaly.arr, currency)}
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-ink-muted">
                    <span>{anomaly.companies === 1 ? '1 company' : `${anomaly.companies} companies`}</span>
                    <span className="block text-ink-faint">
                      {anomaly.interactions === 1 ? '1 report' : `${anomaly.interactions} reports`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-ink-muted">
                    {shortDate(anomaly.first_seen_at)} to {shortDate(anomaly.last_seen_at)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_PILL[anomaly.status]}`}>
                      {STATUS_LABELS[anomaly.status]}
                    </span>
                    {anomaly.acknowledged_by && (
                      <span className="block text-[11px] text-ink-faint mt-1">{anomaly.acknowledged_by.name}</span>
                    )}
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

function AnomalyPane({
  id,
  currency,
  mayAct,
  onBack,
  onChanged,
}: {
  id: number;
  currency: CurrencyCode;
  mayAct: boolean;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<AnomalyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    fetchAnomaly(id)
      .then((next) => {
        if (alive.current) {
          setDetail(next);
          setError(null);
        }
      })
      .catch((err) => {
        if (alive.current) setError(errorText(err, 'Could not load this cluster.'));
      });
    return () => {
      alive.current = false;
    };
  }, [id]);

  async function change(status: AnomalyStatus) {
    setSaving(true);
    setError(null);
    try {
      const next = await setAnomalyStatus(id, status);
      if (alive.current) setDetail(next);
      onChanged();
    } catch (err) {
      if (alive.current) setError(errorText(err, 'Could not save.'));
    } finally {
      if (alive.current) setSaving(false);
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
        All anomalies
      </button>

      {error && <p className="text-[12.5px] text-danger" role="alert">{error}</p>}

      {detail === null ? (
        !error && (
          <div className="flex flex-col gap-2" role="status" aria-label="Loading the cluster">
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
            {mayAct ? (
              <div className="flex flex-col gap-1 shrink-0">
                <label htmlFor="anomaly-status" className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                  Status
                </label>
                <select
                  id="anomaly-status"
                  value={detail.status}
                  disabled={saving}
                  onChange={(e) => change(e.target.value as AnomalyStatus)}
                  className={`px-3 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent disabled:opacity-50 ${FOCUS}`}
                >
                  {(Object.keys(STATUS_LABELS) as AnomalyStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${STATUS_PILL[detail.status]}`}>
                {STATUS_LABELS[detail.status]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 bg-surface border border-line-subtle rounded-xl px-5 py-4">
            <Figure label="Revenue hit" value={formatMoney(detail.arr, currency)} />
            <Figure label="Companies" value={String(detail.companies)} />
            <Figure label="Reports" value={String(detail.interactions)} />
            <Figure label="First seen" value={shortDate(detail.first_seen_at)} />
            <Figure label="Latest" value={shortDate(detail.last_seen_at)} />
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Companies hit</h2>
            <ul aria-label="Companies hit" className="flex flex-wrap gap-2">
              {detail.companies_hit.map((company) => (
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
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Reports</h2>
            <ul aria-label="Reports" className="flex flex-col bg-surface border border-line-subtle rounded-xl divide-y divide-line-subtle">
              {detail.evidence.map((report) => (
                <li key={report.id} className="px-5 py-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="uppercase font-bold text-ink-faint">{report.kind}</span>
                    <Link
                      to={report.company.type === 'account' ? `/accounts/${report.company.id}` : `/organizations/${report.company.id}`}
                      className={`font-semibold text-ink-muted hover:text-accent rounded-sm ${FOCUS}`}
                    >
                      {report.company.name}
                    </Link>
                    <span className="text-ink-faint">{shortDate(report.occurred_at)}</span>
                  </div>
                  <p className="text-[12.5px] text-ink leading-relaxed">{report.snippet}</p>
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
