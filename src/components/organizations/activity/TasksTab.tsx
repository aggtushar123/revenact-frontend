import { CheckCircle, Clock, AlertCircle, MoreHorizontal, Flag } from 'lucide-react';
import { TASKS_DATA, type TaskItem } from '../activityData';

const priorityConfig: Record<TaskItem['priority'], { color: string; bg: string; border: string; label: string }> = {
  high: { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', label: 'High' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Medium' },
  low: { color: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Low' },
};

const statusConfig: Record<TaskItem['status'], { icon: typeof Clock; color: string; label: string }> = {
  'pending': { icon: Clock, color: 'text-gray-400', label: 'Pending' },
  'in-progress': { icon: AlertCircle, color: 'text-indigo-500', label: 'In Progress' },
  'completed': { icon: CheckCircle, color: 'text-teal-500', label: 'Completed' },
};

export function TasksTab({ orgId }: { orgId: number }) {
  const tasks = TASKS_DATA.filter(t => t.orgId === orgId);

  const grouped = tasks.reduce<Record<string, TaskItem[]>>((acc, task) => {
    if (!acc[task.group]) acc[task.group] = [];
    acc[task.group].push(task);
    return acc;
  }, {});

  const groupOrder = ['Overdue', 'This Week', 'Next Week', 'Later'];
  const sortedGroups = Object.entries(grouped).sort(
    (a, b) => groupOrder.indexOf(a[0]) - groupOrder.indexOf(b[0])
  );

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <CheckCircle className="w-10 h-10 text-gray-300 mb-2" />
        <span className="text-sm font-semibold text-gray-400">No tasks found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sortedGroups.map(([group, items]) => (
        <div key={group}>
          <div className="px-6 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${group === 'Overdue' ? 'text-red-400' : 'text-gray-400'}`}>
              {group}
            </span>
          </div>
          {items.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: TaskItem }) {
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  return (
    <div className="px-6 py-4 border-b border-gray-50 hover:bg-indigo-50/20 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <StatusIcon className={`w-5 h-5 shrink-0 ${status.color}`} />
          <h4 className="text-[14px] font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{task.title}</h4>
        </div>
        <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-4 pl-8">
        <div className="flex items-center gap-1.5">
          <img src={task.assigneeAvatar} alt={task.assignee} className="w-5 h-5 rounded-full border border-gray-100 object-cover" />
          <span className="text-[12px] font-medium text-gray-500">{task.assignee}</span>
        </div>
        <span className="text-[11px] text-gray-400">Due: {task.dueDate}</span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${priority.bg} ${priority.border} ${priority.color} border`}>
          <Flag className="w-2.5 h-2.5" />
          {priority.label}
        </div>
        <span className={`text-[11px] font-semibold ${status.color}`}>{status.label}</span>
      </div>
    </div>
  );
}
