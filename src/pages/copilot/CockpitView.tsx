import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Flag, Clock, AlertCircle, Circle, CheckCircle2, Building2, Layers } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { formatCompactMoney, formatDate } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';
import { fetchCockpitSummary, fetchMyTasks, updateTaskStatus } from './cockpitApi';
import { RENEWAL_WINDOW_OPTIONS } from './cockpitTypes';
import type { CockpitHealthBreakdown, CockpitSummary, CockpitTask, RenewalWindowDays } from './cockpitTypes';

// Real numbers throughout — see revenact-backend's CockpitSummaryView/
// TaskListView (docs/API_CONTRACTS.md -> customers). "My Tasks" used to
// read from features/tasks/tasksSlice.ts, an entirely separate local
// mock Redux list unrelated to the real customers.Task model — that
// mock list is untouched (still used by CallSenseTab's own, unrelated
// "Create Tasks from Actions" mockup); this page just no longer reads
// from it. Colors use the app's own theme tokens (bg-surface, text-ink,
// text-danger/warning/info/success, ...) throughout, not one-off hex
// values — same tokens Navbar/ChatView/TasksTab.tsx already use.

// Same priority/status vocabulary and colors as TasksTab.tsx's own
// priorityConfig/statusConfig — the exact same Task model, so the same
// pills mean the same thing wherever a Task is rendered.
const PRIORITY_STYLES: Record<CockpitTask['priority'], { color: string; bg: string; border: string }> = {
  high: { color: 'text-danger', bg: 'bg-danger-dim', border: 'border-danger/30' },
  medium: { color: 'text-warning', bg: 'bg-warning-dim', border: 'border-warning/30' },
  low: { color: 'text-info', bg: 'bg-info-dim', border: 'border-info/30' },
};

const STATUS_STYLES: Record<'pending' | 'in-progress', { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'text-ink-faint' },
  'in-progress': { icon: AlertCircle, color: 'text-accent' },
};

// "2026-03-15" -> a real Date at local midnight, same manual-parse
// reasoning as TasksTab.tsx's own bucketFor (avoids a UTC/local
// timezone day-shift `new Date(iso)` would risk).
function isOverdue(dueIso: string): boolean {
  const [y, m, d] = dueIso.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due < today;
}

function HealthRing({ health }: { health: CockpitHealthBreakdown }) {
  const total = health.good + health.average + health.poor;
  const label = total === 0 ? 'No health data' : `${health.good} good, ${health.average} average, ${health.poor} poor`;
  if (total === 0) {
    return <div className="w-8 h-8 rounded-full border-[5px] border-line-subtle" role="img" aria-label={label} />;
  }
  const goodDeg = (health.good / total) * 360;
  const averageDeg = (health.average / total) * 360;
  const gradient = `conic-gradient(var(--success) 0deg ${goodDeg}deg, var(--warning) ${goodDeg}deg ${goodDeg + averageDeg}deg, var(--danger) ${goodDeg + averageDeg}deg 360deg)`;
  return (
    <div className="w-8 h-8 rounded-full" style={{ background: gradient }} role="img" aria-label={label}>
      <div className="w-full h-full rounded-full border-[5px] border-transparent" style={{ background: 'var(--bg-surface)', backgroundClip: 'padding-box' }} />
    </div>
  );
}

/** One number with its eyebrow. Numbers in DM Mono with tabular figures. */
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-mono-brand text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">{label}</div>
      <div className="font-mono-brand text-[22px] text-ink leading-none mt-1.5">{value}</div>
    </div>
  );
}

function ParentIcon({ type, className = 'w-3.5 h-3.5' }: { type: 'customer' | 'account'; className?: string }) {
  return type === 'customer' ? (
    <Building2 className={`${className} text-ink-muted`} aria-label="Organisation" />
  ) : (
    <Layers className={`${className} text-ink-muted`} aria-label="Account" />
  );
}

export function CockpitView() {
  const navigate = useNavigate();
  const [taskTab, setTaskTab] = useState<'upcoming' | 'overdue'>('upcoming');
  const currency = useAppSelector((state) => state.auth.user?.organisation.currency ?? 'USD');

  const [summary, setSummary] = useState<CockpitSummary | null>(null);
  const [tasks, setTasks] = useState<CockpitTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [renewalWindow, setRenewalWindow] = useState<RenewalWindowDays>(30);
  const [isWindowMenuOpen, setIsWindowMenuOpen] = useState(false);
  const windowMenuRef = useRef<HTMLDivElement>(null);

  // The itemized drill-down list (every renewing Customer/Account) used to
  // sit inline under the org/account counts, which made this whole card
  // taller than My Portfolio Summary next to it — collapsed behind this
  // toggle instead, so the card's default height matches Portfolio's; the
  // full list is still one click away as a popover, same interaction
  // pattern as the window-size dropdown above it.
  const [isRenewalsListOpen, setIsRenewalsListOpen] = useState(false);
  const renewalsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (windowMenuRef.current && !windowMenuRef.current.contains(e.target as Node)) {
        setIsWindowMenuOpen(false);
      }
      if (renewalsListRef.current && !renewalsListRef.current.contains(e.target as Node)) {
        setIsRenewalsListOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Called on mount and again whenever the Renewals window dropdown
  // actually changes — a real, working selector backed by
  // CockpitSummaryView's own real `?days=` param, not a static label.
  // Triggered from the dropdown's own click handler (not a `useEffect`
  // keyed on `renewalWindow`) so setIsLoading isn't called synchronously
  // inside an effect body.
  async function loadSummary(days: RenewalWindowDays) {
    setIsLoading(true);
    try {
      setSummary(await fetchCockpitSummary(days));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your Cockpit.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary(30);
    fetchMyTasks()
      .then(setTasks)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load your Cockpit.');
      });
  }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const overdueTasks = activeTasks.filter((t) => isOverdue(t.due_date));
  const upcomingTasks = activeTasks.filter((t) => !isOverdue(t.due_date));
  const displayedTasks = taskTab === 'upcoming' ? upcomingTasks : overdueTasks;

  // Ticking a task off: optimistic removal from the list, put back if the
  // server says no. The row's status is the server's word; nothing here
  // decides it.
  async function completeTask(task: CockpitTask) {
    setTaskError(null);
    setCompleting(task.id);
    const before = tasks;
    setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, status: 'completed' } : t)));
    try {
      await updateTaskStatus(task.id, 'completed');
    } catch (err) {
      setTasks(before);
      setTaskError(err instanceof ApiError ? err.message : 'Could not complete that task.');
    } finally {
      setCompleting(null);
    }
  }

  function goToRenewalItem(item: { id: number; type: 'customer' | 'account' }) {
    setIsRenewalsListOpen(false);
    navigate(item.type === 'customer' ? `/organizations/${item.id}` : `/accounts/${item.id}`);
  }

  if (isLoading && !summary) {
    return (
      <div className="w-full max-w-[1100px] mx-auto px-6 pt-6 space-y-4" aria-busy="true" aria-label="Loading your Cockpit">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[132px] rounded-xl bg-surface/60 border border-line-subtle" />
          <div className="h-[132px] rounded-xl bg-surface/60 border border-line-subtle" />
        </div>
        <div className="h-[280px] rounded-xl bg-surface/60 border border-line-subtle" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[13px] text-danger" role="alert">
        {error ?? 'Could not load your Cockpit.'}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-[1100px] mx-auto px-6 pt-4 pb-16 flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* My book */}
          <section className="lg:col-span-2 bg-surface border border-line rounded-xl p-5" aria-labelledby="book-heading">
            <h2 id="book-heading" className="text-[13px] font-semibold text-ink">My book</h2>
            <div className="mt-5 grid grid-cols-2 gap-8">
              {(
                [
                  ['customer', 'Organizations', summary.customers],
                  ['account', 'Accounts', summary.accounts],
                ] as const
              ).map(([type, label, book]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
                    <ParentIcon type={type} />
                    {label}
                  </div>
                  <div className="mt-3 flex items-end gap-8">
                    <Stat label="Count" value={book.count} />
                    <Stat label="Portfolio value" value={formatCompactMoney(book.value, currency)} />
                    <div>
                      <div className="font-mono-brand text-[10.5px] uppercase tracking-[0.12em] text-ink-faint">Health</div>
                      <div className="mt-1.5"><HealthRing health={book.health} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Renewals */}
          <section className="bg-surface border border-line rounded-xl p-5 relative" aria-labelledby="renewals-heading">
            <div className="flex items-start justify-between gap-2">
              <h2 id="renewals-heading" className="text-[13px] font-semibold text-ink">Renewals</h2>
              <div ref={windowMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsWindowMenuOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={isWindowMenuOpen}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink-muted hover:text-ink hover:border-line-strong transition-colors duration-[var(--dur-fast)]"
                >
                  Next {renewalWindow} Days <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                {isWindowMenuOpen && (
                  <div role="listbox" className="absolute right-0 top-[calc(100%+4px)] w-36 bg-elevated border border-line rounded-lg shadow-md overflow-hidden z-10">
                    {RENEWAL_WINDOW_OPTIONS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        role="option"
                        aria-selected={days === renewalWindow}
                        onClick={() => {
                          setRenewalWindow(days);
                          setIsWindowMenuOpen(false);
                          loadSummary(days);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors duration-[var(--dur-fast)] ${days === renewalWindow ? 'bg-accent-dim text-ink' : 'text-ink-muted hover:bg-subtle hover:text-ink'}`}
                      >
                        Next {days} Days
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-6">
              {(
                [
                  ['customer', 'Organizations', summary.renewals.customers],
                  ['account', 'Accounts', summary.renewals.accounts],
                ] as const
              ).map(([type, label, book]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink-muted">
                    <ParentIcon type={type} />
                    {label}
                  </div>
                  <div className="mt-3 flex items-end gap-6">
                    <Stat label="Count" value={book.count} />
                    <Stat label="Value" value={formatCompactMoney(book.value, currency)} />
                  </div>
                </div>
              ))}
            </div>

            {summary.renewals.items.length > 0 && (
              <div className="mt-4" ref={renewalsListRef}>
                <button
                  type="button"
                  onClick={() => setIsRenewalsListOpen((open) => !open)}
                  aria-expanded={isRenewalsListOpen}
                  className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink transition-colors duration-[var(--dur-fast)]"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-[var(--dur-fast)] ${isRenewalsListOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  View {summary.renewals.items.length} renewing {summary.renewals.items.length === 1 ? 'item' : 'items'}
                </button>
                {isRenewalsListOpen && (
                  <ul className="absolute left-5 right-5 top-full mt-2 bg-elevated border border-line rounded-lg shadow-md z-20 max-h-[260px] overflow-y-auto custom-scrollbar p-1.5 divide-y divide-line-subtle">
                    {summary.renewals.items.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          onClick={() => goToRenewalItem(item)}
                          className="w-full flex items-center gap-2.5 py-2 px-2 rounded-md hover:bg-subtle transition-colors duration-[var(--dur-fast)] text-left"
                        >
                          <ParentIcon type={item.type} className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[12.5px] font-medium text-ink truncate flex-1">{item.name}</span>
                          <span className="font-mono-brand text-[11.5px] text-ink-muted shrink-0">{formatCompactMoney(item.value, currency)}</span>
                          <span className="font-mono-brand text-[11px] text-ink-faint shrink-0 w-[68px] text-right">{formatDate(item.renewal_date)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>

        {/* My tasks */}
        <section className="bg-surface border border-line rounded-xl" aria-labelledby="tasks-heading">
          <div className="px-5 pt-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="tasks-heading" className="text-[13px] font-semibold text-ink">My tasks</h2>
            <div role="tablist" aria-label="Task lists" className="inline-flex items-center gap-1 rounded-full border border-line p-0.5">
              {(
                [
                  ['upcoming', `Upcoming (${upcomingTasks.length})`],
                  ['overdue', `Overdue (${overdueTasks.length})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={taskTab === key}
                  onClick={() => setTaskTab(key)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors duration-[var(--dur-fast)] ${taskTab === key ? 'bg-accent text-on-accent' : 'text-ink-muted hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {taskError && (
            <p role="alert" className="mx-5 mt-3 text-[12px] text-danger bg-danger-dim rounded-lg px-3 py-2">
              {taskError}
            </p>
          )}

          {displayedTasks.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-[13px] text-ink-muted">
                {taskTab === 'overdue' ? 'Nothing overdue.' : 'Nothing coming up.'}
              </p>
              <p className="text-[12px] text-ink-faint mt-1">Tasks on the organisations and accounts you own appear here.</p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-line-subtle">
              {displayedTasks.map((task) => {
                const priority = PRIORITY_STYLES[task.priority];
                const statusStyle = STATUS_STYLES[task.status as 'pending' | 'in-progress'] ?? STATUS_STYLES.pending;
                const StatusIcon = statusStyle.icon;
                const busy = completing === task.id;
                return (
                  <li key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-subtle/60 transition-colors duration-[var(--dur-fast)]">
                    <button
                      type="button"
                      onClick={() => completeTask(task)}
                      disabled={busy}
                      aria-label={`Mark "${task.title}" complete`}
                      className="shrink-0 w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center text-ink-faint hover:text-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 group"
                    >
                      <Circle className="w-[18px] h-[18px] group-hover:hidden" strokeWidth={2} aria-hidden="true" />
                      <CheckCircle2 className="w-[18px] h-[18px] hidden group-hover:block" strokeWidth={2} aria-hidden="true" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink truncate">{task.title}</div>
                      <div className="flex items-center gap-1.5 text-[11.5px] text-ink-muted mt-0.5 min-w-0">
                        <ParentIcon type={task.parent_type} className="w-3 h-3" />
                        <span className="truncate">{task.parent_name}</span>
                        <span className="font-mono-brand text-[10.5px] text-ink-faint">· TASK-{task.id}</span>
                      </div>
                    </div>

                    <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${priority.bg} ${priority.border} ${priority.color}`}>
                      <Flag className="w-3 h-3" aria-hidden="true" />
                      {task.priority_display}
                    </span>

                    <span className={`hidden md:inline-flex items-center gap-1.5 w-[104px] text-[11.5px] ${statusStyle.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      {task.status_display}
                    </span>

                    <span className={`font-mono-brand text-[12px] w-[84px] text-right ${isOverdue(task.due_date) ? 'text-danger' : 'text-ink-muted'}`}>
                      {formatDate(task.due_date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
