import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ClipboardList, Flag, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { formatCompactMoney, formatDate } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';
import { fetchCockpitSummary, fetchMyTasks } from './cockpitApi';
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
  if (total === 0) {
    return <div className="w-7 h-7 rounded-full border-[4px] border-line-subtle mt-2" />;
  }
  const goodDeg = (health.good / total) * 360;
  const averageDeg = (health.average / total) * 360;
  const gradient = `conic-gradient(var(--success) 0deg ${goodDeg}deg, var(--warning) ${goodDeg}deg ${goodDeg + averageDeg}deg, var(--danger) ${goodDeg + averageDeg}deg 360deg)`;
  return <div className="w-7 h-7 rounded-full mt-2" style={{ background: gradient }} />;
}

export function CockpitView() {
  const navigate = useNavigate();
  const [taskTab, setTaskTab] = useState<'upcoming' | 'overdue'>('overdue');
  const currency = useAppSelector((state) => state.auth.user?.organisation.currency ?? 'USD');

  const [summary, setSummary] = useState<CockpitSummary | null>(null);
  const [tasks, setTasks] = useState<CockpitTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [renewalWindow, setRenewalWindow] = useState<RenewalWindowDays>(30);
  const [isWindowMenuOpen, setIsWindowMenuOpen] = useState(false);
  const windowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (windowMenuRef.current && !windowMenuRef.current.contains(e.target as Node)) {
        setIsWindowMenuOpen(false);
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

  function goToRenewalItem(item: { id: number; type: 'customer' | 'account' }) {
    navigate(item.type === 'customer' ? `/organizations/${item.id}` : `/accounts/${item.id}`);
  }

  if (isLoading && !summary) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[13px] text-ink-faint">
        Loading…
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[13px] text-danger">
        {error ?? 'Could not load your Cockpit.'}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 h-full">
      {/* Top Split Sections */}
      <div className="grid grid-cols-3 gap-5 shrink-0 items-start">
        {/* Left: My Portfolio Summary */}
        <div className="col-span-2 bg-surface rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6">
          <h2 className="text-[14.5px] font-bold text-accent tracking-tight mb-7">My Portfolio Summary</h2>

          <div className="flex gap-16">
            {/* Organizations */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-ink-muted tracking-tight">
                <div className="text-danger flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                </div>
                Organizations
              </div>
              <div className="flex gap-8 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-ink leading-none">{summary.customers.count}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Portfolio Value</div>
                  <div className="text-[22px] font-bold text-ink leading-none">
                    {formatCompactMoney(summary.customers.value, currency)}
                  </div>
                </div>
                <div className="ml-2">
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Health Distribution</div>
                  <HealthRing health={summary.customers.health} />
                </div>
              </div>
            </div>

            {/* Accounts */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-ink-muted tracking-tight">
                <div className="text-info flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                Accounts
              </div>
              <div className="flex gap-8 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-ink leading-none">{summary.accounts.count}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Portfolio Value</div>
                  <div className="text-[22px] font-bold text-ink leading-none">
                    {formatCompactMoney(summary.accounts.value, currency)}
                  </div>
                </div>
                <div className="ml-2">
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Health Distribution</div>
                  <HealthRing health={summary.accounts.health} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Renewals */}
        <div className="col-span-1 bg-surface rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 relative">
          <h2 className="text-[14.5px] font-bold text-accent tracking-tight mb-7">Renewals</h2>

          <div className="absolute top-5 right-5" ref={windowMenuRef}>
            <button
              onClick={() => setIsWindowMenuOpen((open) => !open)}
              className="border border-line rounded-md px-2 py-1 text-[11px] text-ink-muted font-bold flex items-center gap-1 hover:bg-subtle transition-colors cursor-pointer"
            >
              Next {renewalWindow} Days <ChevronDown className="w-3.5 h-3.5 stroke-[2.5px]" />
            </button>
            {isWindowMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] w-32 bg-elevated border border-line rounded-lg shadow-xl overflow-hidden z-10">
                {RENEWAL_WINDOW_OPTIONS.map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      setRenewalWindow(days);
                      setIsWindowMenuOpen(false);
                      loadSummary(days);
                    }}
                    className={`w-full text-left px-3 py-2 text-[11.5px] font-semibold transition-colors ${days === renewalWindow ? 'text-accent bg-accent-dim' : 'text-ink-muted hover:bg-subtle hover:text-ink'}`}
                  >
                    Next {days} Days
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-10 mb-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-ink-muted tracking-tight">
                <div className="text-danger flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                </div>
                Organizations
              </div>
              <div className="flex gap-6 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-ink leading-none">
                    {summary.renewals.customers.count}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Value</div>
                  <div className="text-[22px] font-bold text-ink leading-none">
                    {formatCompactMoney(summary.renewals.customers.value, currency)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-ink-muted tracking-tight">
                <div className="text-info flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                Accounts
              </div>
              <div className="flex gap-6 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-ink leading-none">
                    {summary.renewals.accounts.count}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-ink-faint mb-1.5">Value</div>
                  <div className="text-[22px] font-bold text-ink leading-none">
                    {formatCompactMoney(summary.renewals.accounts.value, currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real drill-down — every renewing Customer/Account, soonest-first */}
          {summary.renewals.items.length > 0 && (
            <div className="border-t border-line-subtle pt-3 flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar">
              {summary.renewals.items.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => goToRenewalItem(item)}
                  className="w-full flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-md hover:bg-subtle transition-colors text-left cursor-pointer"
                >
                  <div className={item.type === 'customer' ? 'text-danger' : 'text-info'}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[9px] h-[9px]">
                      {item.type === 'customer' ? <path d="M12 2L2 22h20L12 2z" /> : <rect x="3" y="3" width="18" height="18" rx="2" />}
                    </svg>
                  </div>
                  <span className="text-[12px] font-bold text-ink truncate flex-1">{item.name}</span>
                  <span className="text-[11px] font-semibold text-ink-muted shrink-0">
                    {formatCompactMoney(item.value, currency)}
                  </span>
                  <span className="text-[11px] text-ink-faint shrink-0 w-[64px] text-right">
                    {formatDate(item.renewal_date)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: My Tasks */}
      <div className="bg-surface rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] pt-5 pb-2 relative flex-1 min-h-0 flex flex-col">
        <div className="px-6 flex items-center gap-2 mb-6 shrink-0">
          <div className="bg-accent p-[2px] rounded-md text-[#0D0F0E]">
            <ClipboardList className="w-[14px] h-[14px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[14.5px] font-bold text-accent tracking-tight">My Tasks</h2>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-6 border-b border-line-subtle mb-1 shrink-0">
          <div
            onClick={() => setTaskTab('upcoming')}
            className={`pb-3.5 text-[12.5px] tracking-tight font-bold cursor-pointer border-b-2 transition-colors relative top-[1px] ${taskTab === 'upcoming' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
          >
            Upcoming ({upcomingTasks.length})
          </div>
          <div
            onClick={() => setTaskTab('overdue')}
            className={`pb-3.5 text-[12.5px] tracking-tight font-bold cursor-pointer border-b-2 transition-colors relative top-[1px] ${taskTab === 'overdue' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
          >
            Overdue ({overdueTasks.length})
          </div>
        </div>

        {/* Tab Content */}
        {displayedTasks.length === 0 ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-16 pb-20 pt-20">
            <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M50 160 C 50 110, 80 50, 80 90" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7"/>
               <path d="M50 160 C 50 120, 40 100, 30 110" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7"/>
               <path d="M190 160 C 190 110, 160 50, 160 90" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7"/>
               <path d="M190 160 C 190 120, 200 100, 210 110" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7"/>

               <path d="M70 100 Q 120 160 170 100" stroke="var(--accent-dim)" strokeWidth="24" fill="none" strokeLinecap="round"/>
               <path d="M85 110 Q 120 140 160 105" stroke="var(--accent)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.5"/>

               <path d="M80 90 Q 60 70 40 80" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6"/>
               <path d="M80 90 Q 70 50 85 40" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6"/>
               <path d="M80 90 Q 100 70 110 85" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6"/>

               <path d="M160 90 Q 180 70 200 80" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6"/>
               <path d="M160 90 Q 170 50 155 40" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6"/>
               <path d="M160 90 Q 140 70 130 85" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6"/>

               <circle cx="120" cy="50" r="16" fill="var(--bg-subtle)" opacity="0.8"/>
            </svg>
            <p className="text-ink-faint text-[13px] font-bold tracking-tight opacity-70 mt-6">Nothing here right now!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6">
            {displayedTasks.map((task) => {
              const priority = PRIORITY_STYLES[task.priority];
              const statusStyle = STATUS_STYLES[task.status as 'pending' | 'in-progress'];
              const StatusIcon = statusStyle.icon;
              return (
                <div key={task.id} className="flex items-center py-4 border-b border-line-subtle last:border-0 hover:bg-subtle/50 transition-colors -mx-4 px-4 rounded-lg shrink-0">
                  <div className="w-10 flex-shrink-0 flex justify-center">
                    <CheckCircle2 className="w-[18px] h-[18px] text-ink-faint/50" strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-[13px] font-bold text-accent truncate mb-[1px]">{task.title}</h4>
                    <div className="text-[10.5px] text-ink-faint font-bold uppercase tracking-wider">TASK-{task.id}</div>
                  </div>

                  <div className="w-[180px] flex items-center gap-3">
                    <ClipboardList className="w-[15px] h-[15px] text-ink-faint" strokeWidth={2.5} />
                    <span className="text-[12.5px] font-bold text-ink-muted truncate">{task.parent_name}</span>
                  </div>

                  <div className="w-[48px] flex justify-center border-l border-transparent">
                    {task.parent_type === 'customer' ? (
                      <div className="text-danger flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                      </div>
                    ) : (
                      <div className="text-info flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                      </div>
                    )}
                  </div>

                  <div className={`w-[110px] flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${priority.bg} ${priority.border}`}>
                    <Flag className={`w-3 h-3 ${priority.color}`} />
                    <span className={`text-[11px] font-bold ${priority.color}`}>
                      {task.priority_display}
                    </span>
                  </div>

                  <div className="w-[110px] flex items-center gap-1.5 pl-3">
                    <StatusIcon className={`w-3.5 h-3.5 ${statusStyle.color}`} />
                    <span className={`text-[11.5px] font-semibold ${statusStyle.color}`}>{task.status_display}</span>
                  </div>

                  <div className="w-[90px] text-right text-[12.5px] text-ink-muted font-bold tracking-tight">
                    {formatDate(task.due_date)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
