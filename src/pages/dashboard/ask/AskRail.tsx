import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { History, MessageSquarePlus, PanelRightClose, Sparkles, X } from 'lucide-react';
import { CopilotRail, HistoryPopover } from '../../../components/copilot/CopilotRail';
import { contextLabel } from '../../../components/copilot/dashboardLabels';
import type { RailContext } from '../../../components/copilot/railContext';
import { SUGGESTIONS } from '../../../components/copilot/suggestions';
import { trapTab } from '../../../lib/focusTrap';
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
 *  "Ask" tab when collapsed. Below `sm` it is a full-screen sheet opened
 *  from an Ask button; focus moves in, Tab is trapped, and Escape or Close
 *  returns focus to the button. */
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

  const askButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetOpen = !isSm && Boolean(ask?.open);
  const setOpen = ask?.setOpen;

  const closeSheet = useCallback(() => {
    setOpen?.(false);
    askButtonRef.current?.focus();
  }, [setOpen]);

  // Focus moves into the sheet when it opens: the composer (a prefilled
  // draft's autoFocus lands in the same place).
  useEffect(() => {
    if (sheetOpen) sheetRef.current?.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      const root = sheetRef.current;
      if (!root) return;
      // History's own Escape closes History first; the sheet stays.
      if (event.key === 'Escape' && !historyOpen) closeSheet();
      if (event.key === 'Tab') trapTab(event, root);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen, historyOpen, closeSheet]);

  if (!ask) return null;

  const toggle = (next: boolean) => {
    toggled.current = true;
    ask.setOpen(next);
  };

  const asked = context ? { ...context, focus: ask.focus } : null;
  const railContext: RailContext | null = asked ? { kind: 'dashboard', context: asked, label: contextLabel(asked, names) } : null;

  const renderRail = (className: string, closeLabel: string, closeIcon: ReactNode, onClose: () => void) => (
    <CopilotRail
      variant="plain"
      label="Ask Revenact"
      className={className}
      top={
        <RailHeader
          historyOpen={historyOpen}
          onToggleHistory={() => setHistoryOpen((o) => !o)}
          onCloseHistory={closeHistory}
          onNewChat={() => ask.setConversation(null)}
          onOpenConversation={ask.openFromHistory}
          closeLabel={closeLabel}
          closeIcon={closeIcon}
          onClose={onClose}
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
  );

  if (!isSm) {
    return (
      <>
        {/* First row of the frame on a phone, directly under the Navbar. */}
        <div className="order-first flex justify-end">
          <button
            ref={askButtonRef}
            type="button"
            onClick={() => ask.setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={ask.open}
            className="min-h-11 px-4 inline-flex items-center gap-2 rounded-lg border border-line bg-surface text-[13px] font-semibold text-ink hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Ask
          </button>
        </div>
        {ask.open ? (
          <div ref={sheetRef} role="dialog" aria-modal="true" aria-label="Ask Revenact" className="animate-slide-in-right fixed inset-0 z-40 bg-surface flex flex-col">
            {/* eslint-disable-next-line react-hooks/refs -- closeSheet only reads askButtonRef inside its own event-handler body, on click; the compiler can't see through renderRail's forwarding of onClose to RailHeader's button. */}
            {renderRail('w-full flex-1 !rounded-none !border-0', 'Close Ask Revenact', <X className="w-4 h-4" aria-hidden="true" />, closeSheet)}
          </div>
        ) : null}
      </>
    );
  }

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

  return (
    <div ref={railRef} className="shrink-0 flex min-h-0">
      {/* eslint-disable-next-line react-hooks/refs -- toggle(false) only writes toggled.current inside its own event-handler body, on click; the compiler can't see through renderRail's forwarding of onClose to RailHeader's button. */}
      {renderRail('w-[360px]', 'Collapse Ask Revenact', <PanelRightClose className="w-4 h-4" aria-hidden="true" />, () => toggle(false))}
    </div>
  );
}
