import { useState } from 'react';
import { ChevronRight, ChevronLeft, Edit, ChevronDown } from 'lucide-react';

interface Props {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  onNewChat?: () => void;
  onSelectChat?: () => void;
  onSelectSkill?: (skill: string) => void;
}

export function CopilotSidebar({ isExpanded, setIsExpanded, onNewChat, onSelectChat, onSelectSkill }: Props) {
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <div className="h-full w-[46px] flex flex-col items-center py-4 bg-transparent shrink-0 z-10 transition-all">
        <button onClick={() => setIsExpanded(true)} className="p-1 hover:bg-gray-200/60 rounded text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronRight className="w-[18px] h-[18px] stroke-[2.5px] -ml-0.5 mt-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-[320px] pb-4 flex flex-col bg-transparent shrink-0 z-10 transition-all pr-3">
      <div className="p-3.5 pt-4 pl-5 flex items-center justify-between border-b border-transparent shrink-0">
        <button onClick={onNewChat} className="flex items-center gap-2 text-[13px] font-bold text-gray-700 hover:text-indigo-600 transition-colors bg-white hover:bg-gray-50 px-3 py-2 rounded-md border border-gray-200 shadow-sm">
          <Edit className="w-3.5 h-3.5" />
          <span>New chat</span>
        </button>
        <button onClick={() => setIsExpanded(false)} className="p-1 mr-2 hover:bg-gray-200/60 rounded text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-[18px] h-[18px] stroke-[2.5px]" />
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
        <div>
          <div 
            onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
            className="flex items-center gap-2 text-gray-700 font-bold text-[13px] cursor-pointer group mb-2.5"
          >
            {isSkillsExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
            )}
            Built-in Skills
            <div className="w-3.5 h-3.5 bg-gray-800 rounded-full text-white flex items-center justify-center text-[9px] font-bold tracking-tighter">i</div>
          </div>
          
          {isSkillsExpanded && (
            <div className="flex flex-col gap-[2px] ml-2 border-l-2 border-gray-100/60 pl-2 mb-2">
              <ChatItem text="Internal Business Review" onClick={() => onSelectSkill?.("Internal Business Review")} />
              <ChatItem text="Quick Start Brief" onClick={() => onSelectSkill?.("Quick Start Brief")} />
              <ChatItem text="Overview of strategy to de-risk" onClick={() => onSelectSkill?.("Overview of strategy to de-risk")} />
              <ChatItem text="Prep weekly customer sync" onClick={() => onSelectSkill?.("Prep weekly customer sync")} />
              <ChatItem text="One liner update" onClick={() => onSelectSkill?.("One liner update")} />
              <ChatItem text="Onboarding Status Report" onClick={() => onSelectSkill?.("Onboarding Status Report")} />
              <ChatItem text="CSM performance review" onClick={() => onSelectSkill?.("CSM performance review")} />
              <ChatItem text="Onboarding Accounts Status..." onClick={() => onSelectSkill?.("Onboarding Accounts Status...")} />
              <ChatItem text="Deep dive on product..." onClick={() => onSelectSkill?.("Deep dive on product...")} />
              <ChatItem text="Features most requested by..." onClick={() => onSelectSkill?.("Features most requested by...")} />
            </div>
          )}
        </div>

        <div>
          <div 
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            className="flex items-center gap-2 text-gray-700 font-bold text-[13px] cursor-pointer group mb-2.5"
          >
            {isHistoryExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
            )}
            Chat history
            <div className="w-3.5 h-3.5 bg-gray-800 rounded-full text-white flex items-center justify-center text-[9px] font-bold tracking-tighter">i</div>
          </div>
          
          {isHistoryExpanded && (
            <div className="flex flex-col gap-[2px] ml-2 border-l-2 border-gray-100/60 pl-2">
               <ChatItem text="Digital Operations Internal Busi..." onClick={onSelectChat} />
               <ChatItem text="Team Focus Accounts Risk Ma..." onClick={onSelectChat} />
               <ChatItem text="Top 10 Accounts Onboarding P..." onClick={onSelectChat} />
               <ChatItem text="Top 5 MRR Accounts Onboardi..." onClick={onSelectChat} />
               <ChatItem text="Apple QBR Deck with Tables an..." onClick={onSelectChat} />
               <ChatItem text="Apple QBR Client Deck with Ta..." onClick={onSelectChat} />
               <ChatItem text="Apple QBR Deck Client Present..." onClick={onSelectChat} />
               <ChatItem text="Internal Business Review Apple..." onClick={onSelectChat} />
               <ChatItem text="Focus Accounts for Risk and Gr..." isActive onClick={onSelectChat} />
               <ChatItem text="High-Impact Revenue Account..." onClick={onSelectChat} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatItem({ text, isActive, onClick }: { text: string, isActive?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`text-[12.5px] py-[6px] px-2.5 rounded-md cursor-pointer truncate transition-colors font-medium border border-transparent ${
      isActive ? 'bg-[#f4effc] text-[#6b47ed] font-bold border-[#e1d5f8] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`}>
      {text}
    </div>
  );
}
