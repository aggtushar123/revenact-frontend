import { Sparkles, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PresenceStrip } from '../../shared';
import { formatRelativeTime } from '../../../features/customers/formatters';
import type { CopilotSession } from '../../../features/copilotSessions/types';

export interface SessionsTabProps {
  sessions: CopilotSession[];
}

const STATUS_LABEL: Record<CopilotSession['status'], string> = {
  private: 'Private',
  live: 'Live',
  'awaiting-handoff': 'Awaiting hand-off',
  closed: 'Closed',
};

const STATUS_STYLE: Record<CopilotSession['status'], string> = {
  private: 'text-ink-faint bg-subtle',
  live: 'text-danger bg-danger-dim',
  'awaiting-handoff': 'text-warning bg-warning-dim',
  closed: 'text-ink-faint bg-subtle',
};

// Multiplayer Copilot sessions about this company — a first-class
// Activity Feed item, same as Activities/Emails/Tasks/etc (FR1.3). Reads
// straight from the copilotSessions Redux slice (already filtered by
// ActivityFeed.tsx itself) rather than fetching — there's no backend
// for this slice yet (see the plan this was built from), so unlike every
// sibling tab there's no isLoading/error state to thread through.
export function SessionsTab({ sessions }: SessionsTabProps) {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <Sparkles className="w-10 h-10 text-ink-faint mb-2" />
        <span className="text-sm font-semibold text-ink-faint">No Copilot sessions yet</span>
      </div>
    );
  }

  const sorted = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {sorted.map((session) => (
        <div
          key={session.id}
          onClick={() => navigate(`/copilot?session=${session.id}`)}
          className="px-6 py-4 border-b border-line-subtle hover:bg-accent-dim/20 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {session.isLive && <Radio className="w-3.5 h-3.5 text-danger shrink-0" />}
              <h4 className="text-[14px] font-semibold text-ink truncate">
                {session.transcript.find((e) => e.kind === 'query')?.text ?? session.accountName}
              </h4>
            </div>
            <span className={`text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[session.status]}`}>
              {STATUS_LABEL[session.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 pl-1">
            <PresenceStrip participants={session.participants} max={4} />
            <span className="text-[12px] font-medium text-ink-muted">{session.ownerName}</span>
            <span className="text-[11px] text-ink-faint">{formatRelativeTime(session.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
