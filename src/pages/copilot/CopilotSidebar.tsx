import { useState } from 'react';
import { ChevronRight, ChevronLeft, Edit, ChevronDown } from 'lucide-react';
import { formatRelativeTime } from '../../features/customers/formatters';
import type { ConversationSummary } from './types';

interface Props {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  onNewChat?: () => void;
  onSelectChat?: (conversationId: number) => void;
  onSelectSkill?: (skill: string) => void;
}

export function CopilotSidebar({
  isExpanded,
  setIsExpanded,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectChat,
  onSelectSkill,
}: Props) {
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <div className="h-full w-[46px] flex flex-col items-center py-4 bg-transparent shrink-0 z-10 transition-all">
        <button
          onClick={() => setIsExpanded(true)}
          aria-label="Expand sidebar"
          className="p-1 hover:bg-line/60 rounded text-ink-muted hover:text-ink transition-colors"
        >
          <ChevronRight className="w-[18px] h-[18px] stroke-[2.5px] -ml-0.5 mt-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-[320px] pb-4 flex flex-col bg-transparent shrink-0 z-10 transition-all pr-3">
      <div className="p-3.5 pt-4 pl-5 flex items-center justify-between border-b border-transparent shrink-0">
        <button onClick={onNewChat} className="flex items-center gap-2 text-[13px] font-bold text-ink-muted hover:text-accent transition-colors bg-surface hover:bg-subtle px-3 py-2 rounded-md border border-line shadow-sm">
          <Edit className="w-3.5 h-3.5" />
          <span>New chat</span>
        </button>
        <button onClick={() => setIsExpanded(false)} className="p-1 mr-2 hover:bg-line/60 rounded text-ink-muted hover:text-ink transition-colors">
          <ChevronLeft className="w-[18px] h-[18px] stroke-[2.5px]" />
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
        <div>
          <div
            onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
            className="flex items-center gap-2 text-ink-muted font-bold text-[13px] cursor-pointer group mb-2.5"
          >
            {isSkillsExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-ink-faint group-hover:text-ink-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-ink-muted" />
            )}
            Built-in Skills
            <div className="w-3.5 h-3.5 bg-line-strong rounded-full text-white flex items-center justify-center text-[9px] font-bold tracking-tighter">i</div>
          </div>

          {isSkillsExpanded && (
            <div className="flex flex-col gap-[2px] ml-2 border-l-2 border-line-subtle/60 pl-2 mb-2">
              <ChatItem text="Internal Business Review" onClick={() => onSelectSkill?.('Internal Business Review')} />
              <ChatItem text="Quick Start Brief" onClick={() => onSelectSkill?.('Quick Start Brief')} />
              <ChatItem text="Overview of strategy to de-risk" onClick={() => onSelectSkill?.('Overview of strategy to de-risk')} />
              <ChatItem text="Prep weekly customer sync" onClick={() => onSelectSkill?.('Prep weekly customer sync')} />
              <ChatItem text="One liner update" onClick={() => onSelectSkill?.('One liner update')} />
              <ChatItem text="Onboarding Status Report" onClick={() => onSelectSkill?.('Onboarding Status Report')} />
              <ChatItem text="CSM performance review" onClick={() => onSelectSkill?.('CSM performance review')} />
              <ChatItem text="Onboarding Accounts Status..." onClick={() => onSelectSkill?.('Onboarding Accounts Status...')} />
              <ChatItem text="Deep dive on product..." onClick={() => onSelectSkill?.('Deep dive on product...')} />
              <ChatItem text="Features most requested by..." onClick={() => onSelectSkill?.('Features most requested by...')} />
            </div>
          )}
        </div>

        <div>
          <div
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center gap-2 text-ink-muted font-bold text-[13px] cursor-pointer group mb-2.5"
          >
            {isHistoryExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-ink-faint group-hover:text-ink-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-ink-muted" />
            )}
            Chat history
          </div>

          {isHistoryExpanded && (
            <div className="flex flex-col gap-[2px] ml-2 border-l-2 border-line-subtle/60 pl-2">
              {conversations.length === 0 ? (
                <p className="text-[12px] text-ink-faint font-medium px-2.5 py-1.5">No chats yet.</p>
              ) : (
                conversations.map((conversation) => (
                  <ChatItem
                    key={conversation.id}
                    text={conversation.title}
                    subtext={formatRelativeTime(conversation.updated_at)}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onSelectChat?.(conversation.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatItem({
  text,
  subtext,
  isActive,
  onClick,
}: {
  text: string;
  subtext?: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`text-[12.5px] py-[6px] px-2.5 rounded-md cursor-pointer transition-colors font-medium border border-transparent ${
        isActive ? 'bg-accent-dim text-accent font-bold border-accent/30 shadow-sm' : 'text-ink-muted hover:bg-subtle hover:text-ink'
      }`}
    >
      <div className="truncate">{text}</div>
      {subtext && <div className="text-[11px] text-ink-faint font-medium truncate">{subtext}</div>}
    </div>
  );
}
