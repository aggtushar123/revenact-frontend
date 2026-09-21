import { Outlet, useNavigate } from 'react-router-dom';
import { SettingsSidebar } from '../components/settings/SettingsSidebar';
import { AskRevenactBox } from '../components/shared/AskRevenactBox';
import { Calendar } from 'lucide-react';

export function SettingsLayout() {
  // Not wired to the Copilot yet. Sending navigates to it with the question
  // prefilled, rather than dropping what someone typed on the floor.
  const navigate = useNavigate();
  const handleSendMessage = (text: string) => {
    navigate(`/copilot?ask=${encodeURIComponent(text)}`);
  };

  return (
    <div className="flex h-full w-full rv-canvas overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* SECTION 1: Left Navigation Sidebar (Account, Billing, Integrations, etc.)  */}
      {/* ========================================================================= */}
      <SettingsSidebar />

      {/* ========================================================================= */}
      {/* SECTION 2: Center Main Content Workspace                                  */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto rv-scrollbar p-4 md:p-6 min-w-0">
          <div className="max-w-4xl w-full mx-auto pb-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: Right Assistant & Calendar Rail (matching user screenshot)      */}
      {/* ========================================================================= */}
      <aside
        className="w-[290px] lg:w-[315px] xl:w-[330px] shrink-0 flex flex-col justify-between h-full p-3 sm:p-3.5 overflow-hidden border-l border-[var(--rv-sidebar-border)] select-none rv-rail transition-colors"
        aria-label="Calendar and Assistant Rail"
      >
        {/* Top: Next event card (matching user screenshot) */}
        <div className="shrink-0 mb-3">
          <div className="flex items-center justify-between px-1 pb-1.5">
            <span className="text-[12px] font-medium text-[var(--rv-text)]">Next event</span>
            <Calendar className="w-3.5 h-3.5 text-[var(--rv-text-muted)]" />
          </div>
          {/* No endpoint serves "my next event" yet — CalendarEvent is only
              readable per customer — so this says so instead of inventing one.
              Wire it to a personal calendar feed when one exists. */}
          <div className="bg-[var(--rv-event-card-bg)] border border-[var(--rv-event-card-border)] rounded-xl p-3 text-left">
            <div className="text-[12px] font-medium text-[var(--rv-event-title)] leading-tight">
              Nothing scheduled
            </div>
            <div className="text-[11px] text-[var(--rv-event-sub)] mt-1 leading-tight">
              Your next meeting will show here.
            </div>
          </div>
        </div>

        {/* Middle Area: Clean empty gradient space (No AI copilot chat/text) */}
        <div className="flex-1" />

        {/* Bottom: the docked Ask Revenact box */}
        <div className="shrink-0 pt-2">
          <AskRevenactBox onSend={handleSendMessage} />
        </div>
      </aside>
    </div>
  );
}
