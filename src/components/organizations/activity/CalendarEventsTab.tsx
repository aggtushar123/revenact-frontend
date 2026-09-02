import { Calendar, Clock, Users, MoreHorizontal, Phone, BarChart2, Monitor } from 'lucide-react';
import type { CalendarEvent } from '../../../features/customers/customersSlice';

import type { LucideIcon } from 'lucide-react';

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  meeting: { icon: Users, color: 'text-accent', bg: 'bg-accent-dim', border: 'border-accent/30' },
  call: { icon: Phone, color: 'text-success', bg: 'bg-success-dim', border: 'border-success/30' },
  review: { icon: BarChart2, color: 'text-accent', bg: 'bg-accent-dim', border: 'border-accent/30' },
  demo: { icon: Monitor, color: 'text-warning', bg: 'bg-warning-dim', border: 'border-warning/30' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-03-15" -> "Mar 15, 2026" — the day-group header, derived from
// event_date at render time (no separate stored "group" field).
function formatGroupHeader(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// "14:00:00" (Django's default TimeField serialization) -> "2:00 PM".
function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = Number(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

export interface CalendarEventsTabProps {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
}

export function CalendarEventsTab({ events, isLoading, error }: CalendarEventsTabProps) {
  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.event_date]) acc[ev.event_date] = [];
    acc[ev.event_date].push(ev);
    return acc;
  }, {});

  // event_date is already "YYYY-MM-DD" — sorts correctly as a plain
  // string, no need to go through Date.
  const sortedGroups = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading calendar events…</span>
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

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <Calendar className="w-10 h-10 text-ink-faint mb-2" />
        <span className="text-sm font-semibold text-ink-faint">No calendar events</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sortedGroups.map(([day, items]) => (
        <div key={day}>
          <div className="px-6 py-2 bg-subtle/80 border-b border-line-subtle sticky top-0 z-10">
            <span className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">{formatGroupHeader(day)}</span>
          </div>
          {items.map(ev => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const cfg = typeConfig[event.type] || typeConfig.meeting;
  const TypeIcon = cfg.icon;

  return (
    <div className="px-6 py-4 border-b border-line-subtle hover:bg-accent-dim/20 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color} ${cfg.border} border flex items-center justify-center shrink-0`}>
            <TypeIcon className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[14px] font-semibold text-ink group-hover:text-accent transition-colors">{event.title}</h4>
        </div>
        <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-ink-muted">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[12.5px] text-ink-muted mb-2 pl-[38px]">{event.description}</p>
      <div className="flex items-center gap-4 pl-[38px]">
        <div className="flex items-center gap-1 text-[11px] text-ink-faint">
          <Clock className="w-3 h-3" />
          <span>{formatTime(event.start_time)} — {formatTime(event.end_time)}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-faint">
          <Users className="w-3 h-3" />
          <span>{event.attendee_count} attendees</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border} capitalize`}>{event.type}</span>
      </div>
    </div>
  );
}
