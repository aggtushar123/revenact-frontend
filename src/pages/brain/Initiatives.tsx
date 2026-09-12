import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Flag, Plus, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import {
  createInitiative,
  fetchInitiatives,
  updateInitiative,
} from '../../features/initiatives/initiativesSlice';
import type { Initiative, InitiativeWrite } from '../../features/initiatives/initiativesSlice';
import { fetchMetrics, fetchMetricSlice, sliceKey } from '../../features/metrics/metricsSlice';
import { apiFetch } from '../../lib/apiClient';
import type { User } from '../../features/auth/authSlice';
import { formatDate } from '../../features/customers/formatters';
import { formatMetricValue } from '../../components/brain/formatMetric';

const DIMENSION_LABELS: Record<string, string> = {
  owner: 'Owner',
  product: 'Product',
  segment: 'Size band',
  lifecycle: 'Lifecycle stage',
};

const inputClass =
  'w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent';

/**
 * Initiatives: decisions, judged against the numbers.
 *
 * The metric layer says what the numbers are and what moved them; this
 * page is where someone writes down what they decided to do about one —
 * a hypothesis, a target, a date, an owner — and watches it against the
 * same registry the overview reads. The starting line is captured when
 * the decision is written and never moves; "did it work" is then a fact.
 *
 * A decision can only target a number the registry can measure, whole-org
 * or one of the cuts it has. That is enforced on both ends: the form only
 * offers what exists, and the backend refuses anything else.
 */
export function InitiativesPage() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { items, isLoading, error, isSaving, saveError } = useAppSelector((s) => s.initiatives);
  const metrics = useAppSelector((s) => s.metrics.data);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (canSeeAll) {
      dispatch(fetchInitiatives());
      if (!metrics) dispatch(fetchMetrics());
    }
  }, [dispatch, canSeeAll, metrics]);

  const open = items.filter((i) => i.status === 'active' || i.status === 'planned');
  const closed = items.filter((i) => i.status === 'done' || i.status === 'abandoned');

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flag className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Company Brain
            </span>
          </div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Initiatives</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Decisions with a number attached — judged against the same figures as the overview.
          </p>
        </div>
        {canSeeAll && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New initiative
          </button>
        )}
      </div>

      {!canSeeAll && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Initiatives are judged against organisation-wide numbers, which need the view-all-accounts
          capability.
        </div>
      )}

      {canSeeAll && showForm && (
        <NewInitiativeForm
          onSaved={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
          isSaving={isSaving}
          saveError={saveError}
        />
      )}

      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      {canSeeAll && !isLoading && items.length === 0 && !showForm && (
        <p className="text-[12.5px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-4 py-3">
          No initiatives yet. The overview says what moved; this is where someone decides what to do
          about it.
        </p>
      )}

      {open.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
            In progress
          </h2>
          {open.map((item) => (
            <InitiativeCard key={item.id} initiative={item} />
          ))}
        </section>
      )}
      {closed.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Closed</h2>
          {closed.map((item) => (
            <InitiativeCard key={item.id} initiative={item} />
          ))}
        </section>
      )}
    </div>
  );
}

function InitiativeCard({ initiative }: { initiative: Initiative }) {
  const dispatch = useAppDispatch();
  const currency = useAppSelector((s) => s.metrics.data?.currency ?? 'USD');
  const [closing, setClosing] = useState<'done' | 'abandoned' | null>(null);
  const [outcome, setOutcome] = useState('');
  const p = initiative.progress;
  const unit = p.unit ?? 'count';
  const isClosed = initiative.status === 'done' || initiative.status === 'abandoned';
  const overdue = !isClosed && p.days_left < 0;
  const pill = {
    planned: 'bg-subtle text-ink-muted',
    active: 'bg-info-dim text-info',
    done: 'bg-success-dim text-success',
    abandoned: 'bg-subtle text-ink-faint line-through',
  }[initiative.status];

  return (
    <article className="bg-surface border border-line-subtle rounded-lg px-4 py-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-bold text-ink">{initiative.title}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${pill}`}>
              {initiative.status_display}
            </span>
          </div>
          <p className="text-[12px] text-ink-muted mt-0.5">
            {initiative.metric_label}
            {initiative.member_label ? ` · ${initiative.member_label}` : ' · whole organisation'}
            {initiative.owner ? ` · ${initiative.owner.name}` : ' · no owner'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[18px] font-semibold tabular-nums text-ink leading-tight">
            {formatMetricValue(unit, p.current, currency)}
            <span className="text-[12px] text-ink-faint font-normal">
              {' '}
              → {formatMetricValue(unit, p.target, currency)}
            </span>
          </div>
          <div className={`text-[11px] ${overdue ? 'text-danger font-semibold' : 'text-ink-faint'}`}>
            by {formatDate(initiative.target_by)}
            {isClosed ? '' : overdue ? ` · ${-p.days_left}d overdue` : ` · ${p.days_left}d left`}
          </div>
        </div>
      </div>

      {initiative.hypothesis && (
        <p className="text-[12.5px] text-ink-muted italic">{initiative.hypothesis}</p>
      )}

      <div>
        <div className="h-[8px] rounded-[3px] bg-subtle overflow-hidden">
          <div
            className={`h-full rounded-[3px] ${initiative.status === 'done' ? 'bg-success' : 'bg-info/70'}`}
            style={{ width: `${p.progress_pct ?? 0}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-faint mt-1">
          {p.progress_pct === null
            ? 'Progress unmeasurable — one end of the line has no figure.'
            : `${p.progress_pct}% of the way`}
          {p.baseline !== null &&
            ` · started at ${formatMetricValue(unit, p.baseline, currency)} on ${formatDate(initiative.baseline_as_of)}`}
        </p>
      </div>

      <div>
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted mb-1">
          Work under this decision
          {initiative.work.open + initiative.work.done > 0 && (
            <span className="text-ink-faint font-semibold tracking-normal normal-case">
              {' '}· {initiative.work.open} open · {initiative.work.done} done
            </span>
          )}
        </div>
        {initiative.work.tasks.length === 0 ? (
          <p className="text-[12px] text-ink-faint">
            Nothing yet. Approve a proposal that serves this decision in the{' '}
            <Link to="/brain/review" className="text-accent hover:underline">review queue</Link> and
            its task lands here.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {initiative.work.tasks.map((task) => (
              <li key={task.id} className="text-[12px] flex items-baseline gap-2">
                <span className={`font-medium ${task.status === 'completed' ? 'text-ink-faint line-through' : 'text-ink'}`}>
                  {task.title}
                </span>
                <span className="text-ink-faint">
                  on{' '}
                  <Link
                    to={task.parent_type === 'customer' ? `/organizations/${task.parent_id}` : `/accounts/${task.parent_id}`}
                    className="text-accent hover:underline"
                  >
                    {task.parent_name}
                  </Link>{' '}
                  · {task.assignee_name} · due {formatDate(task.due_date)}
                </span>
                <span className={`ml-auto text-[10px] font-bold uppercase tracking-wider shrink-0 ${task.status === 'completed' ? 'text-success' : task.status === 'in-progress' ? 'text-info' : 'text-ink-faint'}`}>
                  {task.status === 'in-progress' ? 'in progress' : task.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isClosed && initiative.outcome && (
        <p className="text-[12.5px] text-ink">
          <span className="text-ink-faint">Outcome: </span>
          {initiative.outcome}
        </p>
      )}

      {!isClosed && closing === null && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setClosing('done')}
            className="text-[12px] font-semibold text-success hover:underline"
          >
            Mark done
          </button>
          <button
            type="button"
            onClick={() => setClosing('abandoned')}
            className="text-[12px] font-semibold text-ink-muted hover:underline"
          >
            Abandon
          </button>
        </div>
      )}
      {isClosed && (
        <button
          type="button"
          onClick={() => dispatch(updateInitiative({ id: initiative.id, patch: { status: 'active' } }))}
          className="self-start text-[12px] font-semibold text-ink-muted hover:underline"
        >
          Reopen
        </button>
      )}
      {closing !== null && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(updateInitiative({ id: initiative.id, patch: { status: closing, outcome } }));
            setClosing(null);
          }}
        >
          <label className="text-[11px] font-bold uppercase tracking-wide text-ink-faint" htmlFor={`outcome-${initiative.id}`}>
            What happened?
          </label>
          <textarea
            id={`outcome-${initiative.id}`}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={2}
            className={inputClass}
            autoFocus
          />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold">
              {closing === 'done' ? 'Close as done' : 'Close as abandoned'}
            </button>
            <button type="button" onClick={() => setClosing(null)} className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted">
              Cancel
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function NewInitiativeForm({
  onSaved,
  onCancel,
  isSaving,
  saveError,
}: {
  onSaved: () => void;
  onCancel: () => void;
  isSaving: boolean;
  saveError: string | null;
}) {
  const dispatch = useAppDispatch();
  const metrics = useAppSelector((s) => s.metrics.data?.metrics ?? []);
  const slices = useAppSelector((s) => s.metrics.slices);
  const [members, setMembers] = useState<User[]>([]);
  const [form, setForm] = useState<InitiativeWrite>({
    title: '',
    hypothesis: '',
    metric: 'at_risk_arr',
    dimension: '',
    member: '',
    target_value: '',
    target_by: '',
    owner_id: null,
  });

  const metric = useMemo(() => metrics.find((m) => m.key === form.metric), [metrics, form.metric]);
  const cut = form.dimension ? slices[sliceKey(form.metric, form.dimension)] : undefined;

  useEffect(() => {
    apiFetch<User[]>('/auth/members/')
      .then(setMembers)
      .catch(() => {
        // A failed member list only means the owner dropdown is empty.
      });
  }, []);

  useEffect(() => {
    if (form.dimension && !cut) {
      dispatch(fetchMetricSlice({ metric: form.metric, dimension: form.dimension }));
    }
  }, [dispatch, form.metric, form.dimension, cut]);

  const set = <K extends keyof InitiativeWrite>(key: K, value: InitiativeWrite[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await dispatch(createInitiative(form));
    if (createInitiative.fulfilled.match(result)) onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-xl p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Title</span>
          <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Hypothesis</span>
          <textarea
            className={inputClass}
            rows={2}
            placeholder="If we …, then … because …"
            value={form.hypothesis}
            onChange={(e) => set('hypothesis', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Metric</span>
          <select
            className={inputClass}
            value={form.metric}
            onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value, dimension: '', member: '' }))}
          >
            {metrics.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Cut</span>
          <select
            className={inputClass}
            value={form.dimension}
            onChange={(e) => setForm((f) => ({ ...f, dimension: e.target.value, member: '' }))}
          >
            <option value="">Whole organisation</option>
            {(metric?.dimensions ?? []).map((d) => (
              <option key={d} value={d}>
                By {DIMENSION_LABELS[d]?.toLowerCase() ?? d}
              </option>
            ))}
          </select>
        </label>
        {form.dimension && (
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              {DIMENSION_LABELS[form.dimension] ?? form.dimension}
            </span>
            <select className={inputClass} value={form.member} onChange={(e) => set('member', e.target.value)} required>
              <option value="">{cut ? 'Select…' : 'Loading…'}</option>
              {(cut?.members ?? []).map((m) => (
                <option key={m.member} value={m.member}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Target value</span>
          <input
            className={inputClass}
            type="number"
            step="any"
            value={form.target_value}
            onChange={(e) => set('target_value', e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Target date</span>
          <input className={inputClass} type="date" value={form.target_by} onChange={(e) => set('target_by', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Owner</span>
          <select
            className={inputClass}
            value={form.owner_id ?? ''}
            onChange={(e) => set('owner_id', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">No owner</option>
            {members.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {saveError && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {saveError}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save initiative'}
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
