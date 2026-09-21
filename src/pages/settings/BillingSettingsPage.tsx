import { useState } from 'react';
import { CreditCard, ExternalLink, Check } from 'lucide-react';
import { useAppSelector } from '../../hooks';

export function BillingSettingsPage() {
  const billing = useAppSelector((state) => state.settings.billing);
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setModalNotice(msg);
    setTimeout(() => setModalNotice(null), 3000);
  };

  return (
    <div className="flex flex-col gap-4" aria-label="Plan and Billing Settings">
      <div>
        <h1 className="text-[14px] font-semibold text-[var(--rv-text)] tracking-tight">Plan & billing</h1>
      </div>

      {modalNotice && (
        <div className="bg-[var(--rv-input-bg)] text-[var(--rv-text)] border border-[var(--rv-card-border)] px-3.5 py-2 rounded-xl text-[12px] font-medium flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> {modalNotice}
          </span>
        </div>
      )}

      {/* Card 1: Plan Status */}
      <section className="rv-card p-5 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--rv-text)] tracking-tight">
              {billing.planName}
            </h2>
            {billing.isTrial && (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[var(--rv-pill-secondary-bg)] text-[var(--rv-text-muted)] border border-[var(--rv-card-border)]">
                Trial
              </span>
            )}
          </div>
          <p className="text-[12px] text-[var(--rv-text-muted)]">
            ${billing.pricePerMonth.toFixed(2)}/mo · Trial ends {billing.trialEndDate}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => showToast('Redirecting to plan selection...')}
            className="rv-pill-secondary text-[11.5px] cursor-pointer"
          >
            Change plan
          </button>
          <button
            type="button"
            onClick={() => showToast('Cancellation options modal will open.')}
            className="text-[11.5px] font-medium text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] px-2.5 py-1 transition-colors cursor-pointer"
          >
            Cancel plan
          </button>
        </div>

        <p className="text-[11.5px] text-[var(--rv-text-muted)] leading-relaxed pt-2 border-t border-[var(--rv-card-border)]">
          You have {billing.trialDaysRemaining} days remaining of your trial. On {billing.trialEndDate}, your Revenact plan will start and you will be charged ${billing.pricePerMonth.toFixed(2)} on a monthly basis.
        </p>
      </section>

      {/* Card 2: Payment Method */}
      <section className="rv-card p-5 md:p-6 flex flex-col gap-3">
        <div>
          <h2 className="text-[13.5px] font-semibold text-[var(--rv-text)]">Payment method</h2>
          <p className="text-[11.5px] text-[var(--rv-text-muted)] mt-0.5">The card we charge each period.</p>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-7 rounded-lg bg-[var(--rv-input-bg)] border border-[var(--rv-card-border)] flex items-center justify-center text-[var(--rv-text-muted)] shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-medium text-[var(--rv-text)]">
                Your card is stored securely with Stripe.
              </span>
              <span className="text-[11px] text-[var(--rv-text-faint)]">{billing.paymentMethodMask}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('Connecting to Stripe customer portal...')}
            className="rv-pill-secondary text-[11.5px] cursor-pointer"
          >
            Update card
          </button>
        </div>
      </section>

      {/* Card 3: Invoices */}
      <section className="rv-card p-5 md:p-6 flex flex-col gap-3">
        <div>
          <h2 className="text-[13.5px] font-semibold text-[var(--rv-text)]">Invoices</h2>
          <p className="text-[11.5px] text-[var(--rv-text-muted)] mt-0.5">Your billing history.</p>
        </div>

        <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
          <p className="text-[12px] text-[var(--rv-text-muted)]">
            Invoices are available in the secure Stripe billing portal.
          </p>

          <button
            type="button"
            onClick={() => showToast('Opening Stripe invoices view...')}
            className="rv-pill-secondary text-[11.5px] flex items-center gap-1.5 cursor-pointer"
          >
            <span>View invoices</span>
            <ExternalLink className="w-3 h-3 text-[var(--rv-text-muted)]" />
          </button>
        </div>
      </section>
    </div>
  );
}
