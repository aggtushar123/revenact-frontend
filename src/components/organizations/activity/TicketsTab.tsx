import { AlertTriangle, MoreHorizontal, Ticket as TicketIcon, Circle, Flag, Settings, CornerUpLeft } from 'lucide-react';
import type { Ticket } from '../../../features/customers/customersSlice';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-03-03" -> "Mar 3, 2026" — the card's own date display, and the
// group-header text, both derived from the one real opened_at field.
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// The flag icon's color by priority — the mock carried real priority
// values but never actually used them to style this icon (it rendered
// identically for every ticket); this wires it up for real.
const PRIORITY_COLOR: Record<Ticket['priority'], string> = {
  critical: 'text-danger border-danger/30 bg-danger-dim',
  high: 'text-warning border-warning/30 bg-warning-dim',
  medium: 'text-info border-info/30 bg-info-dim',
  low: 'text-ink-faint border-line-subtle bg-subtle',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export interface TicketsTabProps {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
}

export function TicketsTab({ tickets, isLoading, error }: TicketsTabProps) {
  const grouped = tickets.reduce<Record<string, Ticket[]>>((acc, ticket) => {
    if (!acc[ticket.opened_at]) acc[ticket.opened_at] = [];
    acc[ticket.opened_at].push(ticket);
    return acc;
  }, {});

  // opened_at is already "YYYY-MM-DD" — sorts correctly as a plain
  // string, no need to go through Date.
  const sortedGroups = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading tickets…</span>
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

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <AlertTriangle className="w-10 h-10 text-ink-faint mb-2" />
        <span className="text-sm font-semibold text-ink-faint">No tickets found</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar relative px-8 py-6 bg-subtle/40 font-sans">
      {/* Global Timeline Vertical Line */}
      <div className="absolute left-[44px] top-6 bottom-0 w-px bg-accent-dim z-0"></div>

      {sortedGroups.map(([day, items]) => (
        <div key={day} className="relative z-10 mb-8">
          {/* Group Date Pill */}
          <div className="mb-6 inline-block bg-subtle rounded-full px-4 py-1.5 text-[11.5px] font-bold text-ink-muted border border-line/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative z-10 transition-colors">
            {formatDate(day)}
          </div>

          <div className="flex flex-col gap-6">
            {items.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  // Determine assignee color arbitrarily based on first letter for variety
  const initial = getInitials(ticket.assignee_name);
  const isYellow = initial.includes('N');
  const avatarBg = isYellow ? 'bg-warning' : 'bg-info';

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
  const statusBg = isResolved ? 'bg-line-strong' : 'bg-info';

  const priorityClasses = PRIORITY_COLOR[ticket.priority];

  return (
    <div className="relative flex items-start gap-5 z-10 group">
      {/* Timeline Squircle Icon */}
      <div className="w-[24px] h-[24px] rounded-md bg-subtle border border-accent/30 text-accent flex items-center justify-center shrink-0 mt-5 relative z-10 shadow-sm">
        <TicketIcon className="w-3.5 h-3.5" />
      </div>

      {/* Main card content */}
      <div className="flex-1 bg-surface border border-line/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className={`w-[22px] h-[22px] rounded-full ${avatarBg} text-white flex items-center justify-center text-[10px] font-bold`}>
              {initial}
            </div>
            <span className="text-[12.5px] font-bold text-ink-muted">{ticket.assignee_name}</span>
            <div className="w-[18px] h-[18px] bg-black text-white rounded-[4px] flex items-center justify-center font-bold text-[10px] ml-1 opacity-80">
              Z
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-ink-muted">{formatDate(ticket.opened_at)}</span>
            <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-ink-muted ml-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h4 className="text-[14.5px] font-extrabold text-ink mb-4 leading-snug group-hover:text-accent transition-colors">
          {ticket.title} <span className="text-accent font-bold text-[13px] ml-1">#{ticket.ticket_number.replace('TKT-', '')}</span>
        </h4>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-[26px] h-[26px] rounded-[6px] ${statusBg} text-white flex items-center justify-center`} title={ticket.status}>
              <Circle className="w-3.5 h-3.5" />
            </div>
            <div className={`w-[26px] h-[26px] rounded-[6px] border flex items-center justify-center ${priorityClasses}`} title={`Priority: ${ticket.priority}`}>
              <Flag className="w-3.5 h-3.5" />
            </div>
            <div className="w-[26px] h-[26px] rounded-[6px] border border-line-subtle bg-subtle text-ink-faint flex items-center justify-center">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div className="h-[26px] px-2 rounded-[6px] border border-line-subtle bg-subtle text-ink-muted flex items-center gap-1">
              <CornerUpLeft className="w-3 h-3" />
              <span className="text-[11px] font-semibold">0</span>
            </div>
          </div>

          {ticket.links > 0 && (
            <div className="flex justify-end">
              <span className="text-[11.5px] font-bold text-accent cursor-pointer hover:underline">
                {ticket.links} Links
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
