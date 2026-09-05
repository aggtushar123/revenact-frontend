import { useEffect, useState } from 'react';
import { ChevronDown, ClipboardList, Flag, CheckCircle2 } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { formatCompactMoney, formatDate } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';
import { fetchCockpitSummary, fetchMyTasks } from './cockpitApi';
import type { CockpitHealthBreakdown, CockpitSummary, CockpitTask } from './cockpitTypes';

// Real numbers throughout — see revenact-backend's CockpitSummaryView/
// TaskListView (docs/API_CONTRACTS.md -> customers). "My Tasks" used to
// read from features/tasks/tasksSlice.ts, an entirely separate local
// mock Redux list unrelated to the real customers.Task model — that
// mock list is untouched (still used by CallSenseTab's own, unrelated
// "Create Tasks from Actions" mockup); this page just no longer reads
// from it.

const PRIORITY_STYLES: Record<CockpitTask['priority'], { text: string; label: string }> = {
  high: { text: 'text-[#eec853]', label: 'High' },
  medium: { text: 'text-[#48baf4]', label: 'Medium' },
  low: { text: 'text-ink-faint', label: 'Low' },
};

const STATUS_STYLES: Record<'pending' | 'in-progress', { bg: string; text: string }> = {
  pending: { bg: 'bg-[#fff5e9]', text: 'text-[#ffd6ae]' },
  'in-progress': { bg: 'bg-[#f4ebfe]', text: 'text-[#af8dfb]' },
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
  const gradient = `conic-gradient(#34d399 0deg ${goodDeg}deg, #fbbf24 ${goodDeg}deg ${goodDeg + averageDeg}deg, #f87171 ${goodDeg + averageDeg}deg 360deg)`;
  return <div className="w-7 h-7 rounded-full mt-2" style={{ background: gradient }} />;
}

export function CockpitView() {
  const [taskTab, setTaskTab] = useState<'upcoming' | 'overdue'>('overdue');
  const currency = useAppSelector((state) => state.auth.user?.organisation.currency ?? 'USD');

  const [summary, setSummary] = useState<CockpitSummary | null>(null);
  const [tasks, setTasks] = useState<CockpitTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCockpitSummary(), fetchMyTasks()])
      .then(([summaryData, tasksData]) => {
        setSummary(summaryData);
        setTasks(tasksData);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load your Cockpit.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const overdueTasks = activeTasks.filter((t) => isOverdue(t.due_date));
  const upcomingTasks = activeTasks.filter((t) => !isOverdue(t.due_date));
  const displayedTasks = taskTab === 'upcoming' ? upcomingTasks : overdueTasks;

  if (isLoading) {
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
      <div className="grid grid-cols-3 gap-5 shrink-0">
        {/* Left: My Portfolio Summary */}
        <div className="col-span-2 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6">
          <h2 className="text-[14.5px] font-bold text-[#5c4ce3] tracking-tight mb-7">My Portfolio Summary</h2>

          <div className="flex gap-16">
            {/* Organizations */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-rose-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                </div>
                Organizations
              </div>
              <div className="flex gap-8 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">{summary.customers.count}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Portfolio Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">
                    {formatCompactMoney(summary.customers.value, currency)}
                  </div>
                </div>
                <div className="ml-2">
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Health Distribution</div>
                  <HealthRing health={summary.customers.health} />
                </div>
              </div>
            </div>

            {/* Accounts */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-blue-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                Accounts
              </div>
              <div className="flex gap-8 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">{summary.accounts.count}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Portfolio Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">
                    {formatCompactMoney(summary.accounts.value, currency)}
                  </div>
                </div>
                <div className="ml-2">
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Health Distribution</div>
                  <HealthRing health={summary.accounts.health} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Renewals */}
        <div className="col-span-1 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] p-6 relative">
          <h2 className="text-[14.5px] font-bold text-[#5c4ce3] tracking-tight mb-7">Renewals</h2>
          <div className="absolute top-5 right-5 border border-gray-200 rounded-md px-2 py-1 text-[11px] text-gray-400 font-bold flex items-center gap-1">
            Next 30 Days <ChevronDown className="w-3.5 h-3.5 stroke-[2.5px]" />
          </div>

          <div className="flex gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-rose-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                </div>
                Organizations
              </div>
              <div className="flex gap-6 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">
                    {summary.renewals_next_30_days.customers.count}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">
                    {formatCompactMoney(summary.renewals_next_30_days.customers.value, currency)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-gray-700 tracking-tight">
                <div className="text-blue-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </div>
                Accounts
              </div>
              <div className="flex gap-6 items-end">
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Count</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">
                    {summary.renewals_next_30_days.accounts.count}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-gray-500 mb-1.5">Value</div>
                  <div className="text-[22px] font-bold text-gray-800 leading-none">
                    {formatCompactMoney(summary.renewals_next_30_days.accounts.value, currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: My Tasks */}
      <div className="bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.02)] pt-5 pb-2 relative flex-1 min-h-0 flex flex-col">
        <div className="px-6 flex items-center gap-2 mb-6 shrink-0">
          <div className="bg-[#6b47ed] p-[2px] rounded-md text-white">
            <ClipboardList className="w-[14px] h-[14px]" strokeWidth={2.5} />
          </div>
          <h2 className="text-[14.5px] font-bold text-[#5c4ce3] tracking-tight">My Tasks</h2>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-6 border-b border-gray-100 mb-1 shrink-0">
          <div
            onClick={() => setTaskTab('upcoming')}
            className={`pb-3.5 text-[12.5px] tracking-tight font-bold cursor-pointer border-b-2 transition-colors relative top-[1px] ${taskTab === 'upcoming' ? 'text-[#5c4ce3] border-[#5c4ce3]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            Upcoming ({upcomingTasks.length})
          </div>
          <div
            onClick={() => setTaskTab('overdue')}
            className={`pb-3.5 text-[12.5px] tracking-tight font-bold cursor-pointer border-b-2 transition-colors relative top-[1px] ${taskTab === 'overdue' ? 'text-[#5c4ce3] border-[#5c4ce3]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            Overdue ({overdueTasks.length})
          </div>
        </div>

        {/* Tab Content */}
        {displayedTasks.length === 0 ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center p-16 pb-20 pt-20">
            <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M50 160 C 50 110, 80 50, 80 90" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
               <path d="M50 160 C 50 120, 40 100, 30 110" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
               <path d="M190 160 C 190 110, 160 50, 160 90" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>
               <path d="M190 160 C 190 120, 200 100, 210 110" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.9"/>

               <path d="M70 100 Q 120 160 170 100" stroke="#c4b5fd" strokeWidth="24" fill="none" strokeLinecap="round"/>
               <path d="M85 110 Q 120 140 160 105" stroke="#a78bfa" strokeWidth="8" fill="none" strokeLinecap="round"/>

               <path d="M80 90 Q 60 70 40 80" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M80 90 Q 70 50 85 40" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M80 90 Q 100 70 110 85" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>

               <path d="M160 90 Q 180 70 200 80" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M160 90 Q 170 50 155 40" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>
               <path d="M160 90 Q 140 70 130 85" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.8"/>

               <circle cx="120" cy="50" r="16" fill="#e2e8f0" opacity="0.8"/>
            </svg>
            <p className="text-gray-400 text-[13px] font-bold tracking-tight opacity-70 mt-6">Nothing here right now!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6">
            {displayedTasks.map((task) => {
              const priority = PRIORITY_STYLES[task.priority];
              const statusStyle = STATUS_STYLES[task.status as 'pending' | 'in-progress'];
              return (
                <div key={task.id} className="flex items-center py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors -mx-4 px-4 rounded-lg shrink-0">
                  <div className="w-10 flex-shrink-0 flex justify-center">
                    <CheckCircle2 className="w-[18px] h-[18px] text-gray-200" strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-[13px] font-bold text-[#5c4ce3] truncate mb-[1px]">{task.title}</h4>
                    <div className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">TASK-{task.id}</div>
                  </div>

                  <div className="w-[180px] flex items-center gap-3">
                    <ClipboardList className="w-[15px] h-[15px] text-[#4f7ee9]" strokeWidth={2.5} />
                    <span className="text-[12.5px] font-bold text-gray-700 truncate">{task.parent_name}</span>
                  </div>

                  <div className="w-[48px] flex justify-center border-l border-transparent">
                    {task.parent_type === 'customer' ? (
                      <div className="text-rose-500 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><path d="M12 2L2 22h20L12 2z"/></svg>
                      </div>
                    ) : (
                      <div className="text-blue-500 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px]"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                      </div>
                    )}
                  </div>

                  <div className="w-[110px] flex items-center gap-1.5">
                    <Flag className={`w-3.5 h-3.5 ${priority.text}`} fill="currentColor" />
                    <span className={`text-[12px] font-bold ${priority.text}`}>{priority.label}</span>
                  </div>

                  <div className="w-[110px]">
                    <span className={`px-[18px] py-[3px] rounded-sm tracking-tight text-[11px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`}>
                      {task.status_display}
                    </span>
                  </div>

                  <div className="w-[90px] text-right text-[12.5px] text-gray-500 font-bold tracking-tight">
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
