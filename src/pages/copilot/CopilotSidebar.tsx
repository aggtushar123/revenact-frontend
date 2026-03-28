import { ChevronRight, ChevronLeft, Edit, ChevronDown } from 'lucide-react';

interface Props {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
}

export function CopilotSidebar({ isExpanded, setIsExpanded }: Props) {
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
        <button className="flex items-center gap-2 text-[13px] font-bold text-gray-700 hover:text-indigo-600 transition-colors bg-white hover:bg-gray-50 px-3 py-2 rounded-md border border-gray-200 shadow-sm">
          <Edit className="w-3.5 h-3.5" />
          <span>New chat</span>
        </button>
        <button onClick={() => setIsExpanded(false)} className="p-1 mr-2 hover:bg-gray-200/60 rounded text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-[18px] h-[18px] stroke-[2.5px]" />
        </button>
      </div>

      <div className="px-5 py-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
        <div>
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[13px] cursor-pointer group">
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
            Built-in Skills
            <div className="w-3.5 h-3.5 bg-gray-800 rounded-full text-white flex items-center justify-center text-[9px] font-bold tracking-tighter">i</div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-gray-700 font-bold text-[13px] cursor-pointer group mb-2.5">
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
            Chat history
            <div className="w-3.5 h-3.5 bg-gray-800 rounded-full text-white flex items-center justify-center text-[9px] font-bold tracking-tighter">i</div>
          </div>
          
          <div className="flex flex-col gap-[2px] ml-2 border-l-2 border-gray-100/60 pl-2">
             <ChatItem text="Digital Operations Internal Busi..." />
             <ChatItem text="Team Focus Accounts Risk Ma..." />
             <ChatItem text="Top 10 Accounts Onboarding P..." />
             <ChatItem text="Top 5 MRR Accounts Onboardi..." />
             <ChatItem text="Apple QBR Deck with Tables an..." />
             <ChatItem text="Apple QBR Client Deck with Ta..." />
             <ChatItem text="Apple QBR Deck Client Present..." />
             <ChatItem text="Internal Business Review Apple..." />
             <ChatItem text="Focus Accounts for Risk and Gr..." isActive />
             <ChatItem text="High-Impact Revenue Account..." />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatItem({ text, isActive }: { text: string, isActive?: boolean }) {
  return (
    <div className={`text-[12.5px] py-[6px] px-2.5 rounded-md cursor-pointer truncate transition-colors font-medium border border-transparent ${
      isActive ? 'bg-[#f4effc] text-[#6b47ed] font-bold border-[#e1d5f8] shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`}>
      {text}
    </div>
  );
}
