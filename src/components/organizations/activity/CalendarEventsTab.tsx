import { Calendar, Clock, Users, MoreHorizontal, Phone, BarChart2, Monitor } from 'lucide-react';
import { CALENDAR_EVENTS_DATA, type CalendarEventItem } from '../activityData';

import type { LucideIcon } from 'lucide-react';

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  meeting: { icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  call: { icon: Phone, color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-100' },
  review: { icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  demo: { icon: Monitor, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
};

export function CalendarEventsTab({ entityId }: { entityId: number | string }) {
  const events = CALENDAR_EVENTS_DATA.filter(e => e.orgId == entityId);

  const grouped = events.reduce<Record<string, CalendarEventItem[]>>((acc, ev) => {
    if (!acc[ev.group]) acc[ev.group] = [];
    acc[ev.group].push(ev);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <Calendar className="w-10 h-10 text-gray-300 mb-2" />
        <span className="text-sm font-semibold text-gray-400">No calendar events</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sortedGroups.map(([group, items]) => (
        <div key={group}>
          <div className="px-6 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{group}</span>
          </div>
          {items.map(ev => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EventCard({ event }: { event: CalendarEventItem }) {
  const cfg = typeConfig[event.type] || typeConfig.meeting;
  const TypeIcon = cfg.icon;

  return (
    <div className="px-6 py-4 border-b border-gray-50 hover:bg-indigo-50/20 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color} ${cfg.border} border flex items-center justify-center shrink-0`}>
            <TypeIcon className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[14px] font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{event.title}</h4>
        </div>
        <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[12.5px] text-gray-500 mb-2 pl-[38px]">{event.description}</p>
      <div className="flex items-center gap-4 pl-[38px]">
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{event.startTime} — {event.endTime}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <Users className="w-3 h-3" />
          <span>{event.attendees.length} attendees</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.bg} ${cfg.color} border ${cfg.border} capitalize`}>{event.type}</span>
      </div>
    </div>
  );
}
