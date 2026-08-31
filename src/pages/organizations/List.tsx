import { useEffect, useId, useState, type FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchCustomers,
  addCustomer,
  updateCustomer,
  type Customer,
  type LifecycleStage,
} from '../../features/customers/customersSlice';
import type { User } from '../../features/auth/authSlice';
import { apiFetch } from '../../lib/apiClient';
import { ActionBar } from '../../components/organizations/ActionBar';
import { OrganizationsTable } from '../../components/organizations/OrganizationsTable';

const LIFECYCLE_STAGES: LifecycleStage[] = [
  'onboarding',
  'kickoff',
  'adoption',
  'live',
  'renewal',
  'churn',
  'expansion',
  'other',
];

export function List() {
  const dispatch = useAppDispatch();
  const { customers, count, next, previous, isLoading, error } = useAppSelector((state) => state.customers);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full w-full bg-base text-ink px-6 py-5">
      <ActionBar search={search} onSearchChange={setSearch} onAddClick={() => setShowAddModal(true)} />

      <div className="flex-1 overflow-hidden">
        <OrganizationsTable
          customers={filtered}
          isLoading={isLoading}
          error={error}
          count={count}
          hasNext={!!next}
          hasPrevious={!!previous}
          onNext={() => next && dispatch(fetchCustomers(next))}
          onPrevious={() => previous && dispatch(fetchCustomers(previous))}
          onEdit={setEditingCustomer}
        />
      </div>

      {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} />}
      {editingCustomer && (
        <EditCustomerModal customer={editingCustomer} onClose={() => setEditingCustomer(null)} />
      )}
    </div>
  );
}

// Fetches the caller's org members for the owner-picker — see
// revenact-backend's GET /api/v1/auth/members/ (not admin-gated, unlike
// /csms/, since assigning a customer's owner isn't a User Management action).
function useOrgMembers() {
  const [members, setMembers] = useState<User[]>([]);
  useEffect(() => {
    apiFetch<User[]>('/auth/members/')
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);
  return members;
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-xl shadow-xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ModalError({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-danger">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {text}
    </div>
  );
}

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const members = useOrgMembers();
  const [name, setName] = useState('');
  const [healthScore, setHealthScore] = useState('50');
  const [arr, setArr] = useState('0');
  const [renewalDate, setRenewalDate] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('onboarding');
  const [ownerId, setOwnerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await dispatch(
        addCustomer({
          name,
          health_score: Number(healthScore),
          arr,
          renewal_date: renewalDate || null,
          lifecycle_stage: lifecycleStage,
          owner_id: ownerId ? Number(ownerId) : null,
        })
      ).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not add organization.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Add Organization" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Name" value={name} onChange={setName} />
        <TextField label="Health score (0-100)" value={healthScore} onChange={setHealthScore} type="number" />
        <TextField label="ARR" value={arr} onChange={setArr} type="number" />
        <TextField label="Renewal date" value={renewalDate} onChange={setRenewalDate} type="date" />
        <SelectField
          label="Lifecycle stage"
          value={lifecycleStage}
          onChange={(v) => setLifecycleStage(v as LifecycleStage)}
          options={LIFECYCLE_STAGES.map((stage) => ({ value: stage, label: stage }))}
        />
        <SelectField
          label="Owner"
          value={ownerId}
          onChange={setOwnerId}
          options={[{ value: '', label: 'Unassigned' }, ...members.map((m) => ({ value: String(m.id), label: m.name }))]}
        />
        {error && <ModalError text={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="px-3.5 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Adding…' : 'Add Organization'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditCustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const members = useOrgMembers();
  const [name, setName] = useState(customer.name);
  const [healthScore, setHealthScore] = useState(String(customer.health_score));
  const [arr, setArr] = useState(customer.arr);
  const [renewalDate, setRenewalDate] = useState(customer.renewal_date ?? '');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>(customer.lifecycle_stage);
  const [ownerId, setOwnerId] = useState(customer.owner ? String(customer.owner.id) : '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await dispatch(
        updateCustomer({
          id: customer.id,
          name,
          health_score: Number(healthScore),
          arr,
          renewal_date: renewalDate || null,
          lifecycle_stage: lifecycleStage,
          owner_id: ownerId ? Number(ownerId) : null,
        })
      ).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not update organization.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title={`Edit ${customer.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Name" value={name} onChange={setName} />
        <TextField label="Health score (0-100)" value={healthScore} onChange={setHealthScore} type="number" />
        <TextField label="ARR" value={arr} onChange={setArr} type="number" />
        <TextField label="Renewal date" value={renewalDate} onChange={setRenewalDate} type="date" />
        <SelectField
          label="Lifecycle stage"
          value={lifecycleStage}
          onChange={(v) => setLifecycleStage(v as LifecycleStage)}
          options={LIFECYCLE_STAGES.map((stage) => ({ value: stage, label: stage }))}
        />
        <SelectField
          label="Owner"
          value={ownerId}
          onChange={setOwnerId}
          options={[{ value: '', label: 'Unassigned' }, ...members.map((m) => ({ value: String(m.id), label: m.name }))]}
        />
        {error && <ModalError text={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="px-3.5 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
