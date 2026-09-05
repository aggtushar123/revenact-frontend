import { useState } from 'react';
import { ArrowUp, Copy, ThumbsUp, ThumbsDown, Sparkles, AlertCircle } from 'lucide-react';
import type { CopilotMessage } from './types';

interface Props {
  messages: CopilotMessage[];
  onSendPrompt: (prompt: string) => void;
  isEmpty?: boolean;
  isSending?: boolean;
  sendError?: string | null;
}

// Real messages only — no more hardcoded chatStep turns/fixed-timer
// "thinking" indicator. Plain text, no markdown rendering (an explicit
// scope cut — see docs/API_CONTRACTS.md's copilot section); `isSending`
// reflects the real in-flight POST /copilot/messages/ call.
export function ChatView({ messages, onSendPrompt, isEmpty, isSending, sendError }: Props) {
  const [inputText, setInputText] = useState('');

  function submit() {
    if (inputText.trim() && !isSending) {
      onSendPrompt(inputText);
      setInputText('');
    }
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-surface relative">
      <div className="flex-1 overflow-y-auto px-6 py-8 w-full mx-auto pb-[180px] custom-scrollbar selection:bg-accent-dim">
        {!isEmpty && (
          <div className="flex flex-col gap-10 w-full max-w-[860px] mx-auto">
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[65%] bg-accent-dim border border-accent/30 rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] text-ink-muted font-medium leading-[1.65] shadow-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex flex-col gap-1 border-l-2 border-accent/30 pl-7 py-1">
                  <p className="text-[13.5px] text-ink font-medium leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <div className="flex items-center gap-[18px] mt-4 text-ink-faint">
                    <button className="hover:text-ink-muted hover:bg-subtle rounded-md p-1.5 transition-colors -ml-1.5">
                      <Copy className="w-4 h-4 stroke-[2px]" />
                    </button>
                    <button className="hover:text-ink-muted hover:bg-subtle rounded-md p-1.5 transition-colors">
                      <ThumbsUp className="w-4 h-4 stroke-[2px]" />
                    </button>
                    <button className="hover:text-ink-muted hover:bg-subtle rounded-md p-1.5 transition-colors">
                      <ThumbsDown className="w-4 h-4 stroke-[2px]" />
                    </button>
                  </div>
                </div>
              )
            )}

            {isSending && (
              <div className="flex flex-col gap-1 border-l-2 border-accent/30 pl-7 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 text-[var(--accent)]">
                  <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white shadow-[0_2px_8px_rgba(45,212,168,0.4)] animate-pulse">
                    <Sparkles className="w-[12px] h-[12px]" />
                  </div>
                  <span className="text-[13.5px] font-bold tracking-tight">Copilot is thinking...</span>
                  <div className="flex items-center gap-1 ml-1 mt-1">
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {sendError && (
              <div className="flex items-center gap-2 pl-7 text-[13px] text-danger font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {sendError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating input */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-10 px-6">
        <div className="w-full max-w-[860px] mx-auto relative pl-4">
          <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-accent/20 to-accent-hover/20 blur-sm pointer-events-none"></div>
          <div className="relative bg-surface border-2 border-accent/30 rounded-xl flex items-end min-h-[72px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] focus-within:ring-4 focus-within:ring-accent/10 transition-shadow">
            <textarea
              className="w-full h-full min-h-[64px] bg-transparent resize-none outline-none border-none p-4 text-[15px] placeholder:text-ink-faint placeholder:italic text-ink-muted font-medium leading-relaxed"
              placeholder="Type '/' to add variables, like {Account} and {Organization}"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              onClick={submit}
              disabled={isSending}
              className="absolute right-3.5 bottom-3.5 w-[26px] h-[26px] bg-subtle hover:bg-accent hover:text-[#0D0F0E] rounded-full flex items-center justify-center text-white shadow-sm transition-all cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-[14px] h-[14px] stroke-[3.5px] text-ink-faint group-hover:text-[#0D0F0E]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
