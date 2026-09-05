import { useEffect, useState } from 'react';
import { HomeView } from './HomeView';
import { ChatView } from './ChatView';
import { CopilotSidebar } from './CopilotSidebar';
import { CockpitView } from './CockpitView';
import { fetchConversation, fetchConversations, sendMessage } from './copilotApi';
import { ApiError } from '../../lib/apiClient';
import type { ConversationSummary, CopilotMessage } from './types';

export function CopilotIndex() {
  const [view, setView] = useState<'home' | 'chat' | 'empty-chat'>('home');
  const [activeTab, setActiveTab] = useState<'copilot' | 'cockpit'>('copilot');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Loads the caller's own real chat history once, for the sidebar —
  // same "fetch on mount" convention as ScenariosList/CampaignsList's own.
  useEffect(() => {
    fetchConversations()
      .then(setConversations)
      .catch(() => {
        // The sidebar's own "no chats yet" empty state covers a failed
        // load the same as a genuinely empty list — nothing to start a
        // conversation from is not itself worth a blocking error banner.
      });
  }, []);

  async function handleSendPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed || isSending) return;

    setView('chat');
    setSendError(null);
    setIsSending(true);
    // Optimistic bubble — replaced wholesale by the server's own real
    // messages (including its own id) once the send resolves, same
    // "adopt the real response" convention as CampaignEditor's own send.
    const optimisticId = -Date.now();
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: 'user', content: trimmed, created_at: new Date().toISOString() },
    ]);

    try {
      const conversation = await sendMessage({
        conversationId: activeConversationId ?? undefined,
        content: trimmed,
      });
      setActiveConversationId(conversation.id);
      setMessages(conversation.messages);
      setConversations((prev) => {
        const withoutThisOne = prev.filter((c) => c.id !== conversation.id);
        return [
          { id: conversation.id, title: conversation.title, created_at: conversation.created_at, updated_at: conversation.updated_at },
          ...withoutThisOne,
        ];
      });
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'Could not reach Copilot.');
    } finally {
      setIsSending(false);
    }
  }

  function handleSelectSkill(skill: string | null) {
    setSelectedSkill(skill);
    if (skill) {
      setView('home');
    }
  }

  async function handleSelectChat(conversationId: number) {
    setView('chat');
    setActiveConversationId(conversationId);
    setSendError(null);
    setMessages([]);
    try {
      const conversation = await fetchConversation(conversationId);
      setMessages(conversation.messages);
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'Could not load this conversation.');
    }
  }

  function handleNewChat() {
    setView('empty-chat');
    setSelectedSkill(null);
    setActiveConversationId(null);
    setMessages([]);
    setSendError(null);
    setIsSending(false);
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface">
      {/* Top Tabs */}
      <div className="h-[56px] border-b border-line-subtle flex items-center px-6 shrink-0">
        <div className="flex items-center rounded-md border border-accent/30 bg-surface h-[34px] overflow-hidden">
          <button
            onClick={() => {
              setActiveTab('copilot');
              setView('home');
            }}
            className={`h-full flex items-center gap-1.5 px-3.5 text-[13.5px] font-bold transition-colors ${activeTab === 'copilot' ? 'border border-accent text-accent bg-accent-dim shadow-sm relative z-10 -mr-[1px]' : 'text-accent hover:bg-accent-dim opacity-80 border border-transparent'}`}
          >
            <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-current"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>
            Copilot
          </button>
          <div className="w-[1px] h-[22px] bg-accent/20 my-auto z-0"></div>
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`h-full flex items-center gap-1.5 px-3.5 text-[13.5px] font-bold transition-colors ${activeTab === 'cockpit' ? 'border border-line-strong text-ink bg-subtle shadow-sm relative z-10 -ml-[1px]' : 'text-ink-muted hover:text-ink hover:bg-subtle border border-transparent'}`}
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

      <div className="flex-1 w-full h-[calc(100%-56px)] flex relative overflow-hidden bg-surface">
        {activeTab === 'copilot' ? (
          <>
            <CopilotSidebar
              isExpanded={isSidebarExpanded}
              setIsExpanded={setIsSidebarExpanded}
              conversations={conversations}
              activeConversationId={activeConversationId}
              onNewChat={handleNewChat}
              onSelectChat={handleSelectChat}
              onSelectSkill={handleSelectSkill}
            />
            <div className="flex-1 overflow-hidden relative bg-surface border border-line/80 shadow-[0px_4px_24px_rgba(0,0,0,0.04)] rounded-[20px] m-1 mt-4 mr-4 mb-4 flex">
              {view === 'home' ? (
                <HomeView onSendPrompt={handleSendPrompt} selectedSkill={selectedSkill} onSelectSkill={handleSelectSkill} />
              ) : (
                <ChatView
                  onSendPrompt={handleSendPrompt}
                  isEmpty={view === 'empty-chat'}
                  messages={messages}
                  isSending={isSending}
                  sendError={sendError}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden bg-base p-6 pt-5">
            <CockpitView />
          </div>
        )}
      </div>
    </div>
  );
}
