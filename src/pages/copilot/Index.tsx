import { useState } from 'react';
import { HomeView } from './HomeView';
import { ChatView } from './ChatView';
import { CopilotSidebar } from './CopilotSidebar';

export function CopilotIndex() {
  const [view, setView] = useState<'home' | 'chat'>('home');
  const [activeTab, setActiveTab] = useState<'copilot' | 'cockpit'>('copilot');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handleSendPrompt = (prompt: string) => {
    if (prompt.trim()) {
      setView('chat');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Top Tabs */}
      <div className="h-[56px] border-b border-gray-100 flex items-center px-6 shrink-0">
        <div className="flex items-center rounded-md border border-indigo-500/30 bg-white h-[34px] overflow-hidden">
          <button 
            onClick={() => setActiveTab('copilot')}
            className={`h-full flex items-center gap-1.5 px-3.5 text-[13.5px] font-bold transition-colors ${activeTab === 'copilot' ? 'border border-[#6b47ed] text-[#6b47ed] bg-[#fcfbfe] shadow-sm relative z-10 -mr-[1px]' : 'text-[#6b47ed] hover:bg-[#f4f2ff] opacity-80 border border-transparent'}`}
          >
            <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-current"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>
            Copilot
          </button>
          <div className="w-[1px] h-[22px] bg-indigo-500/20 my-auto z-0"></div>
          <button 
            onClick={() => setActiveTab('cockpit')}
            className={`h-full flex items-center gap-1.5 px-3.5 text-[13.5px] font-bold transition-colors ${activeTab === 'cockpit' ? 'border border-gray-300 text-gray-800 bg-gray-50 shadow-sm relative z-10 -ml-[1px]' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-transparent'}`}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="7" height="6" rx="1.5" opacity="0.9" />
              <rect x="1" y="9" width="7" height="5" rx="1.5" opacity="0.9" />
              <rect x="9" y="2" width="6" height="12" rx="1.5" />
            </svg>
            Cockpit
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-[calc(100%-56px)] flex relative overflow-hidden bg-white">
        {activeTab === 'copilot' ? (
          <>
            <CopilotSidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />
            <div className="flex-1 overflow-hidden relative bg-white border border-gray-200/80 shadow-[0px_4px_24px_rgba(0,0,0,0.04)] rounded-[20px] m-1 mt-4 mr-4 mb-4 flex">
              {view === 'home' ? (
                <HomeView onSendPrompt={handleSendPrompt} />
              ) : (
                <ChatView onSendPrompt={handleSendPrompt} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 bg-transparent">
            <div className="w-full h-full max-w-[800px] border border-gray-200 shadow-[0px_4px_24px_rgba(0,0,0,0.04)] bg-white rounded-[20px] flex items-center justify-center">
               <p className="text-gray-400 font-medium tracking-wide">Cockpit Blank Card</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
