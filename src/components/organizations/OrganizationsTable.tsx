import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Customer, HealthCategory, LifecycleStage } from '../../features/customers/customersSlice';

const HEALTH_STYLES: Record<HealthCategory, string> = {
  good: 'bg-success-dim text-success',
  average: 'bg-warning-dim text-warning',
  poor: 'bg-danger-dim text-danger',
};

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  onboarding: 'Onboarding',
  kickoff: 'Kickoff',
  adoption: 'Adoption',
  live: 'Live',
  renewal: 'Renewal',
  churn: 'Churn',
  expansion: 'Expansion',
  other: 'Other',
};

const LIFECYCLE_STYLES: Record<LifecycleStage, string> = {
  onboarding: 'bg-info-dim text-info',
  kickoff: 'bg-info-dim text-info',
  adoption: 'bg-warning-dim text-warning',
  live: 'bg-success-dim text-success',
  renewal: 'bg-warning-dim text-warning',
  churn: 'bg-danger-dim text-danger',
  expansion: 'bg-accent-dim text-accent',
  other: 'bg-subtle text-ink-faint',
};

function formatArr(arr: string) {
  const value = Number(arr);
  return Number.isFinite(value)
    ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : arr;
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function OrganizationsTable({
  customers,
  isLoading,
  error,
  count,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  onEdit,
}: {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onEdit: (customer: Customer) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-surface border border-line rounded-xl overflow-hidden">
      {error && (
        <div className="px-4 py-2 text-[12px] text-danger bg-danger-dim border-b border-line-subtle">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-[13px] text-ink-muted">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-ink-muted">No organizations yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line-subtle">
                <Th>Name</Th>
                <Th>Health</Th>
                <Th>ARR</Th>
                <Th>Renewal Date</Th>
                <Th>Lifecycle Stage</Th>
                <Th>Owner</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-line-subtle last:border-0 hover:bg-subtle/50 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-semibold text-ink">{customer.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${HEALTH_STYLES[customer.health_category]}`}>
                      {customer.health_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-ink-muted">{formatArr(customer.arr)}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-muted">{formatDate(customer.renewal_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${LIFECYCLE_STYLES[customer.lifecycle_stage]}`}>
                      {LIFECYCLE_LABELS[customer.lifecycle_stage]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {customer.owner ? (
                      <div className="flex items-center gap-2">
                        <img src={customer.owner.avatar} alt={customer.owner.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                        <span className="text-[13px] text-ink-muted truncate">{customer.owner.name}</span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-ink-faint">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onEdit(customer)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink hover:bg-subtle rounded-md transition-all"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(hasNext || hasPrevious) && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-line-subtle text-[12px] text-ink-muted">
          <span>{count} organizations</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="p-1.5 rounded-md hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="p-1.5 rounded-md hover:bg-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}
