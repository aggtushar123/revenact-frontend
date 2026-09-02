import { CheckCircle, Clock, AlertCircle, MoreHorizontal, Flag } from 'lucide-react';
import type { Task } from '../../../features/customers/customersSlice';

const priorityConfig: Record<Task['priority'], { color: string; bg: string; border: string; label: string }> = {
  high: { color: 'text-danger', bg: 'bg-danger-dim', border: 'border-danger/30', label: 'High' },
  medium: { color: 'text-warning', bg: 'bg-warning-dim', border: 'border-warning/30', label: 'Medium' },
  low: { color: 'text-info', bg: 'bg-info-dim', border: 'border-info/30', label: 'Low' },
};

const statusConfig: Record<Task['status'], { icon: typeof Clock; color: string; label: string }> = {
  'pending': { icon: Clock, color: 'text-ink-faint', label: 'Pending' },
  'in-progress': { icon: AlertCircle, color: 'text-accent', label: 'In Progress' },
  'completed': { icon: CheckCircle, color: 'text-success', label: 'Completed' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-09-05" -> "Sep 5, 2026" — the card's own due-date display.
// Parsed manually (not via `Date`) to avoid a local-timezone day
// shift, same reasoning as formatDate in
// features/customers/formatters.ts.
function formatDueDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

type WeekBucket = 'Overdue' | 'This Week' | 'Next Week' | 'Later';
const BUCKET_ORDER: WeekBucket[] = ['Overdue', 'This Week', 'Next Week', 'Later'];

function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  return monday;
}

// Buckets a due_date against *today*, computed fresh on every render —
// not a stored field. See the Task model's own docstring: a due date
// is inherently relative to "now" in a way a stored bucket can't stay
// in sync with once a week rolls over.
function bucketFor(dueIso: string): WeekBucket {
  const [y, m, d] = dueIso.split('-').map(Number);
  const due = new Date(y, m - 1, d);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (due < today) return 'Overdue';

  const thisWeekStart = startOfWeek(today);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  if (due <= thisWeekEnd) return 'This Week';

  const nextWeekEnd = new Date(thisWeekEnd);
  nextWeekEnd.setDate(thisWeekEnd.getDate() + 7);
  if (due <= nextWeekEnd) return 'Next Week';

  return 'Later';
}

export interface TasksTabProps {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

export function TasksTab({ tasks, isLoading, error }: TasksTabProps) {
  const grouped = tasks.reduce<Record<WeekBucket, Task[]>>(
    (acc, task) => {
      acc[bucketFor(task.due_date)].push(task);
      return acc;
    },
    { Overdue: [], 'This Week': [], 'Next Week': [], Later: [] }
  );

  const sortedGroups = BUCKET_ORDER.map((bucket) => [bucket, grouped[bucket]] as const).filter(
    ([, items]) => items.length > 0
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading tasks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16">
        <span className="text-sm font-semibold text-danger">{error}</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <CheckCircle className="w-10 h-10 text-ink-faint mb-2" />
        <span className="text-sm font-semibold text-ink-faint">No tasks found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sortedGroups.map(([group, items]) => (
        <div key={group}>
          <div className="px-6 py-2 bg-subtle/80 border-b border-line-subtle sticky top-0 z-10">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${group === 'Overdue' ? 'text-danger' : 'text-ink-faint'}`}>
              {group}
            </span>
          </div>
          {[...items]
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  return (
    <div className="px-6 py-4 border-b border-line-subtle hover:bg-accent-dim/20 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <StatusIcon className={`w-5 h-5 shrink-0 ${status.color}`} />
          <h4 className="text-[14px] font-semibold text-ink group-hover:text-accent transition-colors">{task.title}</h4>
        </div>
        <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-ink-muted">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-4 pl-8">
        <div className="flex items-center gap-1.5">
          <img
            src={`https://i.pravatar.cc/150?u=${encodeURIComponent(task.assignee_name)}`}
            alt={task.assignee_name}
            className="w-5 h-5 rounded-full border border-line-subtle object-cover"
          />
          <span className="text-[12px] font-medium text-ink-muted">{task.assignee_name}</span>
        </div>
        <span className="text-[11px] text-ink-faint">Due: {formatDueDate(task.due_date)}</span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${priority.bg} ${priority.border} ${priority.color} border`}>
          <Flag className="w-2.5 h-2.5" />
          {priority.label}
        </div>
        <span className={`text-[11px] font-semibold ${status.color}`}>{status.label}</span>
      </div>
    </div>
  );
}
