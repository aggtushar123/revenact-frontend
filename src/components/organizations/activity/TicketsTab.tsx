import { AlertTriangle, MoreHorizontal } from 'lucide-react';
import { TICKETS_DATA, type TicketItem } from '../activityData';

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  'open': { bg: 'bg-red-50', text: 'text-red-600', label: 'Open' },
  'in-progress': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'In Progress' },
  'resolved': { bg: 'bg-teal-50', text: 'text-teal-600', label: 'Resolved' },
  'closed': { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Closed' },
};

const priorityStyle: Record<string, { bg: string; text: string; border: string }> = {
  'critical': { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
  'high': { bg: 'bg-orange-50', text: 'text-orange-500', border: 'border-orange-100' },
  'medium': { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100' },
  'low': { bg: 'bg-blue-50', text: 'text-blue-400', border: 'border-blue-100' },
};

export function TicketsTab({ entityId }: { entityId: number | string }) {
  const tickets = TICKETS_DATA.filter(t => t.orgId == entityId);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <AlertTriangle className="w-10 h-10 text-gray-300 mb-2" />
        <span className="text-sm font-semibold text-gray-400">No tickets found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: TicketItem }) {
  const st = statusStyle[ticket.status] || statusStyle.open;
  const pr = priorityStyle[ticket.priority] || priorityStyle.medium;

  return (
    <div className="px-6 py-4 border-b border-gray-50 hover:bg-indigo-50/20 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{ticket.ticketId}</span>
          <h4 className="text-[14px] font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{ticket.title}</h4>
        </div>
        <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[12.5px] text-gray-500 leading-relaxed mb-2.5 pl-[70px] line-clamp-1">{ticket.description}</p>
      <div className="flex items-center gap-3 pl-[70px]">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>{st.label}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pr.bg} ${pr.text} ${pr.border}`}>{ticket.priority}</span>
        <span className="text-[11px] text-gray-400">{ticket.assignee}</span>
        <span className="text-[11px] text-gray-400 ml-auto">{ticket.date}</span>
      </div>
    </div>
  );
}
