import { useEffect, useState, type FormEvent } from 'react';
import { Bot, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchUsage, setBudget } from '../../features/agents/agentsSlice';
import type { ModelCallRow, PurposeUsage } from '../../features/agents/agentsSlice';

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n);

const OUTCOME: Record<ModelCallRow['outcome'], { label: string; tone: string }> = {
  ok: { label: 'ok', tone: 'text-success' },
  failed: { label: 'failed', tone: 'text-danger' },
  unconfigured: { label: 'not configured', tone: 'text-warning' },
  over_budget: { label: 'over budget', tone: 'text-danger' },
};

function PurposeCard({ row, canManage }: { row: PurposeUsage; canManage: boolean }) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(row.budget));
  const share = row.budget > 0 ? Math.min(100, (row.spent / row.budget) * 100) : 0;
  const bar = share >= 90 ? 'bg-danger' : share >= 70 ? 'bg-warning' : 'bg-info/70';

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(draft);
    if (!Number.isFinite(n) || n < 0) return;
    await dispatch(setBudget({ purpose: row.purpose, monthly_tokens: Math.round(n) }));
    setEditing(false);
  }

  return (
    <div className="bg-surface border border-line-subtle rounded-lg px-4 py-3 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-bold text-ink">{row.label}</h3>
        <span className="text-[11px] text-ink-faint tabular-nums">
          {row.calls} {row.calls === 1 ? 'call' : 'calls'}
          {row.failed > 0 && <span className="text-danger"> · {row.failed} failed</span>}
        </span>
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2 text-[12px]">
          <span className="text-ink tabular-nums">
            <span className="font-semibold">{compact(row.spent)}</span>
            <span className="text-ink-faint"> of {compact(row.budget)} tokens this month</span>
          </span>
          <span className="text-ink-faint tabular-nums">{share.toFixed(0)}%</span>
        </div>
        <div className="mt-[3px] h-[8px] rounded-[3px] bg-subtle overflow-hidden">
          <div className={`h-full rounded-[3px] ${bar}`} style={{ width: `${share}%` }} />
        </div>
        <p className="text-[11px] text-ink-faint mt-1 tabular-nums">
          {compact(row.input_tokens)} in · {compact(row.output_tokens)} out ·{' '}
          {row.custom_budget ? 'budget set for this organisation' : 'default budget'}
        </p>
      </div>
      {canManage && !editing && (
        <div className="flex gap-3">
          <button type="button" onClick={() => { setDraft(String(row.budget)); setEditing(true); }} className="text-[12px] font-semibold text-accent hover:underline">
            Set budget
          </button>
          {row.custom_budget && (
            <button type="button" onClick={() => dispatch(setBudget({ purpose: row.purpose, monthly_tokens: null }))} className="text-[12px] font-semibold text-ink-muted hover:text-ink">
              Use default
            </button>
          )}
        </div>
      )}
      {canManage && editing && (
        <form onSubmit={submit} className="flex items-center gap-2">
          <label htmlFor={`budget-${row.purpose}`} className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Tokens / month
          </label>
          <input id={`budget-${row.purpose}`} type="number" min={0} step={1000} value={draft} onChange={(e) => setDraft(e.target.value)} className="w-32 px-2 py-1 bg-surface border border-line rounded text-[12px] text-ink focus:outline-none focus:border-accent" autoFocus />
          <button type="submit" className="px-2.5 py-1 bg-accent text-[#0D0F0E] rounded text-[12px] font-bold">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="text-[12px] font-semibold text-ink-muted">Cancel</button>
        </form>
      )}
    </div>
  );
}

/**
 * Agents: what the brain spends, and what it may spend.
 *
 * Every model call the product makes — the Copilot, Headlines, the
 * classifier, the brief, the Ops agent — goes through one function, and
 * that function logs one row per call. This page is that log this month,
 * per purpose against its budget, and the last fifty calls with who asked
 * for them. Budgets stop a runaway agent; they are generous by default so
 * a busy team is never throttled by accident.
 */
export function AgentsPage() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const canManage = useCapability('manage_org_settings');
  const { data, isLoading, error, saveError } = useAppSelector((s) => s.agents);

  useEffect(() => {
    if (canSeeAll) dispatch(fetchUsage());
  }, [dispatch, canSeeAll]);

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Company Brain</span>
        </div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Agents</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Every model call the brain makes — what it spent this month, against what it may spend.
        </p>
      </div>

      {!canSeeAll && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Model usage is organisation-wide, which needs the view-all-accounts capability.
        </div>
      )}

      {(error || saveError) && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error ?? saveError}
        </p>
      )}

      {data && (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
              This month, from {data.month_start}
              {!canManage && ' · budgets are set by organisation settings managers'}
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 ${isLoading ? 'opacity-60' : ''}`}>
              {data.purposes.map((row) => (
                <PurposeCard key={row.purpose} row={row} canManage={canManage} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Recent calls</h2>
            {data.recent.length === 0 ? (
              <p className="text-[12.5px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-4 py-3">
                No model calls yet.
              </p>
            ) : (
              <div className="bg-surface border border-line-subtle rounded-lg overflow-x-auto">
                <table className="w-full text-[12px] border-collapse min-w-[640px]">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                      <th className="text-left px-3 py-2">When</th>
                      <th className="text-left px-3 py-2">Purpose</th>
                      <th className="text-left px-3 py-2">Asked by</th>
                      <th className="text-right px-3 py-2">In</th>
                      <th className="text-right px-3 py-2">Out</th>
                      <th className="text-right px-3 py-2">Latency</th>
                      <th className="text-left px-3 py-2">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((call) => (
                      <tr key={call.id} className="border-t border-line-subtle">
                        <td className="px-3 py-1.5 text-ink-muted whitespace-nowrap">{call.created_at.slice(0, 16).replace('T', ' ')}</td>
                        <td className="px-3 py-1.5 text-ink">{call.purpose_label}</td>
                        <td className="px-3 py-1.5 text-ink-muted">{call.user ?? 'scheduled'}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">{call.input_tokens.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">{call.output_tokens.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-ink-muted">{(call.latency_ms / 1000).toFixed(1)}s</td>
                        <td className={`px-3 py-1.5 font-semibold ${OUTCOME[call.outcome].tone}`} title={call.error}>
                          {OUTCOME[call.outcome].label}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
