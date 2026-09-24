import { Calendar } from 'lucide-react';

/** The Next event card above Communications' Copilot rail. */
export function NextEventCard() {
  return (
    <section className="rv-card-glass p-3" aria-labelledby="next-event-heading">
      <div className="flex items-center justify-between px-1 pb-1.5">
        <span id="next-event-heading" className="text-[12px] font-medium text-ink">Next event</span>
        <Calendar className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
      </div>
      {/* No endpoint serves "my next event" yet; this says so rather than inventing one. */}
      <div className="bg-[var(--rv-event-card-bg)] border border-[var(--rv-event-card-border)] rounded-xl p-3">
        <div className="text-[12px] font-medium text-[var(--rv-event-title)]">Nothing scheduled</div>
        <div className="text-[11px] text-[var(--rv-event-sub)] mt-0.5">Your next meeting will show here.</div>
      </div>
    </section>
  );
}
