import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { History, MessageSquarePlus, PanelRightClose, Sparkles } from 'lucide-react';
import { CopilotRail, HistoryPopover } from '../../../components/copilot/CopilotRail';
import { contextLabel } from '../../../components/copilot/dashboardLabels';
import type { RailContext } from '../../../components/copilot/railContext';
import { SUGGESTIONS } from '../../../components/copilot/suggestions';
import { SM, useMediaQuery } from '../../../lib/useMediaQuery';
import type { Conversation } from '../../copilot/types';
import { useFilterNames } from './filterNames';
import { useAsk } from './useAsk';
import { useDashboardContext } from './useDashboardContext';

const ICON_BUTTON =
  'min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

function RailHeader({
  historyOpen,
  onToggleHistory,
  onCloseHistory,
  onNewChat,
  onOpenConversation,
  closeLabel,
  closeIcon,
  onClose,
}: {
  historyOpen: boolean;
  onToggleHistory: () => void;
  onCloseHistory: () => void;
  onNewChat: () => void;
  onOpenConversation: (conversation: Conversation) => void;
  closeLabel: string;
  closeIcon: ReactNode;
  onClose: () => void;
}) {
  return (
    <header className="relative flex items-center gap-1 px-3 py-2 border-b border-line">
      <h2 className="flex-1 text-[15px] font-semibold text-ink">Ask Revenact</h2>
      <button type="button" onClick={onNewChat} aria-label="New chat" title="New chat" className={ICON_BUTTON}>
        <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onToggleHistory} aria-label="History" aria-expanded={historyOpen} title="History" className={ICON_BUTTON}>
        <History className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={onClose} aria-label={closeLabel} title={closeLabel} className={ICON_BUTTON}>
        {closeIcon}
      </button>
      {historyOpen ? <HistoryPopover onClose={onCloseHistory} onOpen={onOpenConversation} /> : null}
    </header>
  );
}

/** The Ask rail beside the dashboard: a 360px column when open, a slim
 *  "Ask" tab when collapsed. Below sm it is a sheet (Task 8). */
export function AskRail() {
  const ask = useAsk();
  const isSm = useMediaQuery(SM);
  const { context } = useDashboardContext();
  const names = useFilterNames();
  const [historyOpen, setHistoryOpen] = useState(false);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const tabRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const toggled = useRef(false);
  const railOpen = isSm && Boolean(ask?.open);

  // Only the person's own expand/collapse moves focus: collapsing hands it to
  // the tab, expanding to the composer. A viewport change or an entry point
  // opening the rail does not.
  useEffect(() => {
    if (!toggled.current) return;
    toggled.current = false;
    if (railOpen) railRef.current?.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
    else tabRef.current?.focus();
  }, [railOpen]);

  if (!ask || !isSm) return null;

  const toggle = (next: boolean) => {
    toggled.current = true;
    ask.setOpen(next);
  };

  if (!ask.open) {
    return (
      <button
        ref={tabRef}
        type="button"
        onClick={() => toggle(true)}
        aria-label="Open Ask Revenact"
        aria-expanded={false}
        className="shrink-0 w-10 self-stretch flex flex-col items-center gap-2 py-3 rounded-xl border border-line bg-surface text-ink-muted hover:text-ink hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        <span className="text-[11px] font-semibold [writing-mode:vertical-rl]">Ask</span>
      </button>
    );
  }

  const asked = context ? { ...context, focus: ask.focus } : null;
  const railContext: RailContext | null = asked ? { kind: 'dashboard', context: asked, label: contextLabel(asked, names) } : null;

  return (
    <div ref={railRef} className="shrink-0 flex min-h-0">
      <CopilotRail
        variant="plain"
        label="Ask Revenact"
        className="w-[360px]"
        top={
          <RailHeader
            historyOpen={historyOpen}
            onToggleHistory={() => setHistoryOpen((o) => !o)}
            onCloseHistory={closeHistory}
            onNewChat={() => ask.setConversation(null)}
            onOpenConversation={ask.openFromHistory}
            closeLabel="Collapse Ask Revenact"
            closeIcon={<PanelRightClose className="w-4 h-4" aria-hidden="true" />}
            onClose={() => toggle(false)}
          />
        }
        context={railContext}
        onClearContext={ask.clearFocus}
        conversation={ask.conversation}
        onConversation={ask.setConversation}
        thread={ask.thread}
        names={names}
        suggestions={context ? SUGGESTIONS[context.area] : undefined}
        draft={ask.pendingDraft}
        onSent={ask.markSent}
      />
    </div>
  );
}
