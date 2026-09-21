// Account settings › Plan & billing: what this organisation has and has used.
//
// Every number here is the server's. Seats are people (an active member
// holds one); credits are AI (one per model call). A new workspace starts on
// the trial. Buying a plan goes through the payment provider once that phase
// lands; until then the page says how to upgrade rather than pretending.

import { useEffect } from 'react';
import { AlertCircle, Sparkles, Users, CalendarClock } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchBillingLedger, fetchBillingSummary, fetchPlans } from '../../features/billing/billingSlice';

function when(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null;
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100);
}

const KIND_LABEL: Record<string, string> = {
  grant: 'Granted',
  consume: 'Model call',
  refund: 'Refunded',
  adjust: 'Adjusted by Revenact',
  expire: 'Expired',
};

export function BillingSettingsPage() {
  const dispatch = useAppDispatch();
  const { summary, ledger, plans, error } = useAppSelector((state) => state.billing);
  const canSeeLedger = useCapability('manage_org_settings');

  useEffect(() => {
    dispatch(fetchBillingSummary());
    dispatch(fetchPlans());
    if (canSeeLedger) dispatch(fetchBillingLedger());
  }, [dispatch, canSeeLedger]);

  const seatPct = summary && summary.seats.limit > 0 ? Math.min(100, Math.round((summary.seats.used / summary.seats.limit) * 100)) : 0;
  const trialEnds = when(summary?.trial_ends_at ?? null);

  return (
    <div className="flex flex-col gap-4" aria-label="Plan and Billing Settings">
      <div>
        <h1 className="text-[14px] font-semibold text-[var(--rv-text)] tracking-tight">Plan & billing</h1>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 text-[12px] text-danger p-3 bg-danger-dim rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {summary && (
        <>
          <section className="rv-card p-5 md:p-6 flex flex-col gap-4" aria-labelledby="plan-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="plan-heading" className="text-[14px] font-semibold text-[var(--rv-text)] tracking-tight">
                  {summary.plan.name} plan
                </h2>
                <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
                  {summary.plan.is_trial
                    ? trialEnds
                      ? `Free until ${trialEnds}. Seats stay at ${summary.plan.seats_included} until a plan is bought.`
                      : 'Free while you evaluate.'
                    : `${money(summary.plan.price_cents, summary.plan.currency)} a month · ${summary.plan.seats_included} seats · ${summary.plan.monthly_credits} AI credits a month`}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                summary.status === 'active' ? 'bg-success-dim text-success' : summary.status === 'trialing' ? 'bg-warning-dim text-warning' : 'bg-danger-dim text-danger'
              }`}>
                {summary.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--rv-card-border)] p-3.5">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--rv-text-muted)]">
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  Seats
                </div>
                <div className="text-[22px] font-semibold text-[var(--rv-text)] mt-1 tabular-nums">
                  {summary.seats.used} <span className="text-[13px] text-[var(--rv-text-muted)] font-medium">of {summary.seats.limit}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--rv-input-bg)] mt-2 overflow-hidden" aria-hidden="true">
                  <div className={`h-full rounded-full ${seatPct >= 100 ? 'bg-danger' : 'bg-accent'}`} style={{ width: `${seatPct}%` }} />
                </div>
                <p className="text-[11px] text-[var(--rv-text-muted)] mt-1.5">
                  {summary.seats.used >= summary.seats.limit ? 'Every seat is taken. Free one, or upgrade, before approving anyone else.' : `${summary.seats.limit - summary.seats.used} free.`}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--rv-card-border)] p-3.5">
                <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--rv-text-muted)]">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  AI credits
                </div>
                <div className="text-[22px] font-semibold text-[var(--rv-text)] mt-1 tabular-nums">{summary.credits.balance}</div>
                <p className="text-[11px] text-[var(--rv-text-muted)] mt-1.5">
                  One credit per Copilot or agent call. A failed call costs nothing.
                  {summary.credits.balance === 0 ? ' None left: the Copilot will refuse until credits are added.' : ''}
                </p>
              </div>
            </div>

            {summary.current_period_end && (
              <p className="text-[11.5px] text-[var(--rv-text-muted)] flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                Current period ends {when(summary.current_period_end)}.
              </p>
            )}
            {!summary.enforced && (
              <p className="text-[11.5px] text-[var(--rv-text-muted)]">Limits are being recorded but not enforced during the beta.</p>
            )}
          </section>

          <section className="rv-card p-5 md:p-6 flex flex-col gap-3" aria-labelledby="plans-heading">
            <div>
              <h2 id="plans-heading" className="text-[13.5px] font-semibold text-[var(--rv-text)]">Plans</h2>
              <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
                Online checkout is coming. To change plans today, contact Revenact and it is applied to your account the same day.
              </p>
            </div>
            {plans.length > 0 ? (
              <ul className="grid sm:grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <li key={plan.code} className={`rounded-xl border p-3.5 ${plan.code === summary.plan.code ? 'border-accent' : 'border-[var(--rv-card-border)]'}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-semibold text-[var(--rv-text)]">{plan.name}</span>
                      <span className="text-[13px] text-[var(--rv-text)] tabular-nums">{money(plan.price_cents, plan.currency)}<span className="text-[11px] text-[var(--rv-text-muted)]">/mo</span></span>
                    </div>
                    <p className="text-[11.5px] text-[var(--rv-text-muted)] mt-1">{plan.seats_included} seats · {plan.monthly_credits} AI credits a month</p>
                    {plan.code === summary.plan.code && <p className="text-[11px] font-semibold text-accent mt-1.5">Current plan</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-[var(--rv-text-muted)]">No plans are published yet.</p>
            )}
          </section>

          {canSeeLedger && (
            <section className="rv-card p-5 md:p-6 flex flex-col gap-3" aria-labelledby="ledger-heading">
              <div>
                <h2 id="ledger-heading" className="text-[13.5px] font-semibold text-[var(--rv-text)]">Credit history</h2>
                <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">Every movement, newest first. This is the record your balance is computed from.</p>
              </div>
              {ledger.length === 0 ? (
                <p className="text-[12px] text-[var(--rv-text-muted)]">Nothing yet.</p>
              ) : (
                <table className="w-full text-[12px]">
                  <thead className="text-[10.5px] uppercase tracking-[0.08em] text-[var(--rv-text-faint)] text-left">
                    <tr>
                      <th className="py-1.5 font-semibold">When</th>
                      <th className="py-1.5 font-semibold">What</th>
                      <th className="py-1.5 font-semibold text-right">Change</th>
                      <th className="py-1.5 font-semibold text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--rv-card-border)]">
                    {ledger.map((row) => (
                      <tr key={row.id}>
                        <td className="py-1.5 text-[var(--rv-text-muted)] whitespace-nowrap">{new Date(row.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className="py-1.5 text-[var(--rv-text)]">
                          {KIND_LABEL[row.kind] ?? row.kind}
                          {row.reason && <span className="text-[var(--rv-text-muted)]"> · {row.reason}</span>}
                        </td>
                        <td className={`py-1.5 text-right tabular-nums ${row.amount < 0 ? 'text-[var(--rv-text-muted)]' : 'text-success'}`}>{row.amount > 0 ? `+${row.amount}` : row.amount}</td>
                        <td className="py-1.5 text-right tabular-nums text-[var(--rv-text)]">{row.balance_after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default BillingSettingsPage;
