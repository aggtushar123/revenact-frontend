import { useId, useState, type FormEvent } from 'react';
import { CheckCircle, Clock, AlertCircle, MoreHorizontal, Flag } from 'lucide-react';
import type { Task } from '../../../features/customers/customersSlice';
import { useMembers } from '../../../features/knowledge/useMembers';
import { ApiError } from '../../../lib/apiClient';
import { PRIMARY } from '../portfolio/styles';
import { Field } from './FormField';
import { CONTROL, FORM_ERROR, FORM_GRID } from './formStyles';

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
  /** Saves a new task on this record; absent when the record cannot take one (mock data). */
  onCreate?: (task: { title: string; due_date: string; priority: Task['priority']; assignee_id?: number | null }) => Promise<boolean>;
}

export type NewTask = { title: string; due_date: string; priority: Task['priority']; assignee_id?: number | null };

/** The new-task form on its own, so the organization page's "+ Add" can show
 *  it in a sheet. It clears itself and calls `onDone` once the task is saved. */
export function TaskForm({ onCreate, onDone }: { onCreate: (task: NewTask) => Promise<boolean>; onDone?: () => void }) {
  const members = useMembers();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [assignee, setAssignee] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    setError(null);
    setSaving(true);
    try {
      const ok = await onCreate({ title: title.trim(), due_date: dueDate, priority, assignee_id: assignee ? Number(assignee) : null });
      setSaving(false);
      if (ok) {
        setTitle('');
        setDueDate('');
        setAssignee('');
        onDone?.();
      } else {
        setError('Could not save that task.');
      }
    } catch (err) {
      setSaving(false);
      setError(err instanceof ApiError ? err.message : 'Could not save that task.');
    }
  }

  return (
    <form onSubmit={submit} aria-label="New task" className="@container flex flex-col gap-3">
      <div className={FORM_GRID}>
        <Field id={`${ids}-title`} label="Task title" wide>
          <input id={`${ids}-title`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" className={CONTROL} />
        </Field>
        <Field id={`${ids}-due`} label="Due date">
          <input id={`${ids}-due`} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={CONTROL} />
        </Field>
        <Field id={`${ids}-priority`} label="Priority">
          <select id={`${ids}-priority`} value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} className={CONTROL}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
        <Field id={`${ids}-assignee`} label="Assignee" wide>
          <select id={`${ids}-assignee`} value={assignee} onChange={(e) => setAssignee(e.target.value)} className={CONTROL}>
            <option value="">Assign to me</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <button type="submit" disabled={saving} className={PRIMARY}>
          {saving ? 'Saving…' : 'Save task'}
        </button>
      </div>
      {error && <p className={FORM_ERROR} role="alert">{error}</p>}
    </form>
  );
}

function NewTaskForm({ onCreate }: { onCreate: (task: NewTask) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-6 py-2 border-b border-line-subtle flex flex-col gap-2 bg-surface">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-ink-faint">A task is seen by its creator, its assignee and their management chains.</span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="px-3 py-1.5 bg-accent text-on-accent rounded-lg text-[13px] font-bold">
          {open ? 'Cancel' : 'New task'}
        </button>
      </div>
      {open && <TaskForm onCreate={onCreate} onDone={() => setOpen(false)} />}
    </div>
  );
}

export function TasksTab({ tasks, isLoading, error, onCreate }: TasksTabProps) {
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
        <span className="text-[13px] font-semibold text-ink-faint">Loading tasks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16">
        <span className="text-[13px] font-semibold text-danger">{error}</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col flex-1">
        {onCreate && <NewTaskForm onCreate={onCreate} />}
        <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
          <CheckCircle className="w-10 h-10 text-ink-faint mb-2" />
          <span className="text-[13px] font-semibold text-ink-faint">No tasks found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {onCreate && <NewTaskForm onCreate={onCreate} />}
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
          <h4 className="text-[13px] font-semibold text-ink group-hover:text-accent transition-colors">{task.title}</h4>
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
          <span className="text-[13px] font-medium text-ink-muted">{task.assignee_name}</span>
        </div>
        <span className="text-[11px] text-ink-faint">Due: {formatDueDate(task.due_date)}</span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${priority.bg} ${priority.border} ${priority.color} border`}>
          <Flag className="w-2.5 h-2.5" />
          {priority.label}
        </div>
        <span className={`text-[11px] font-semibold ${status.color}`}>{status.label}</span>
      </div>
    </div>
  );
}
