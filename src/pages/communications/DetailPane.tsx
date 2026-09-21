import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { CommunicationRow } from '../../features/communications/communicationsSlice';
import { waitingTone } from '../../features/communications/communicationsSlice';

/**
 * The detail pane: what is waiting, the account it is waiting on, and the
 * composer that clears it.
 *
 * The account context strip between the message and the composer is the reason
 * this page exists rather than a mail client. Answering a renewal question
 * without the renewal date in view is the mistake it prevents, so health, ARR,
 * renewal and owner sit above the box a person types into, not on another page.
 */

const WAIT_CHIP = {
  danger: 'bg-danger-dim text-danger',
  warning: 'bg-warning-dim text-warning',
  muted: 'bg-subtle text-ink-muted',
} as const;

/** What the composer is called, per channel. One place, so the label, the
 *  button and the hint cannot drift apart. */
const COMPOSER: Record<
  CommunicationRow['action'],
  { label: string; placeholder: string; send: string; hint: string } | null
> = {
  reply: {
    label: 'Reply',
    placeholder: 'Write your reply.',
    send: 'Send reply',
    hint: 'Sends from your connected mailbox',
  },
  answer: {
    label: 'Answer',
    placeholder: 'Your answer is kept as company knowledge on this account.',
    send: 'Send answer',
    hint: 'Stored as a contribution',
  },
  summarise: {
    label: 'Summary',
    placeholder: 'What was decided, and what happens next.',
    send: 'Save summary',
    hint: 'Classifies the call',
  },
  open_external: null,
  none: null,
};

function money(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function ContextStrip({ row }: { row: CommunicationRow }) {
  const context = row.context;
  if (!context || !row.account) return null;

  const renewalTone =
    context.days_to_renewal === null
      ? 'text-ink'
      : context.days_to_renewal <= 45
        ? 'text-danger'
        : context.days_to_renewal <= 90
          ? 'text-warning'
          : 'text-ink';

  const healthTone =
    context.health_category === 'poor'
      ? 'text-danger'
      : context.health_category === 'average'
        ? 'text-warning'
        : 'text-success';

  const cells = [
    { label: 'Health', value: context.health_score?.toFixed(1) ?? '—', tone: healthTone },
    { label: 'ARR', value: money(context.arr), tone: 'text-ink' },
    {
      label: 'Renews in',
      value: context.days_to_renewal === null ? '—' : `${context.days_to_renewal}d`,
      tone: renewalTone,
    },
    { label: 'Owner', value: context.owner || 'Unassigned', tone: 'text-ink' },
  ];

  const href =
    row.account.type === 'customer'
      ? `/organizations/${row.account.id}`
      : `/accounts/${row.account.id}`;

  return (
    <div className="mt-3 flex items-stretch border border-line-subtle rounded-lg overflow-hidden bg-base">
      {cells.map((cell) => (
        <span key={cell.label} className="grow px-3 py-2 border-r border-line-subtle flex flex-col gap-0.5">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-ink-muted">
            {cell.label}
          </span>
          <span className={`font-mono-brand tabular-nums text-[13px] font-medium ${cell.tone}`}>
            {cell.value}
          </span>
        </span>
      ))}
      <Link
        to={href}
        className="shrink-0 px-3.5 flex items-center gap-1.5 text-[11.5px] font-bold text-accent bg-surface hover:bg-accent-dim transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        Open account
        <ArrowUpRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
}

/**
 * The composer, split out so it can be keyed on the row.
 *
 * A draft belongs to the row it was typed under: carrying a half-written reply
 * across to another customer would be the worst bug this page could have. The
 * fix is identity, not an effect — `key={row.id}` at the call site remounts
 * this component with an empty draft, which is what React recommends over
 * resetting state from an effect.
 */
function Composer({
  spec,
}: {
  spec: { label: string; placeholder: string; send: string; hint: string };
}) {
  const [draft, setDraft] = useState('');

  return (
    <div className="shrink-0 px-4.5 pb-4">
      <div className="border border-line rounded-lg overflow-hidden">
        <label
          htmlFor="communications-draft"
          className="block px-3.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted"
        >
          {spec.label}
        </label>
        <textarea
          id="communications-draft"
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={spec.placeholder}
          className="w-full px-3.5 pt-1.5 pb-2.5 text-[13px] leading-snug text-ink resize-none outline-none"
        />
        <div className="px-3 py-2 border-t border-line-subtle bg-base flex items-center gap-2">
          <button
            type="button"
            className="h-[30px] px-2.5 rounded-md border border-line bg-surface text-[11.5px] font-bold text-ink flex items-center gap-1.5 hover:border-line-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Sparkles size={13} aria-hidden="true" />
            Draft with Copilot
          </button>
          <span className="grow" />
          <span className="text-[11px] text-ink-muted">{spec.hint}</span>
          <button
            type="button"
            disabled={draft.trim().length === 0}
            className="h-[30px] px-3.5 rounded-md bg-accent text-surface text-[12px] font-bold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {spec.send}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DetailPane({ row }: { row: CommunicationRow | null }) {
  if (!row) {
    return (
      <section
        aria-label="Selected item"
        className="hidden lg:flex grow min-w-0 rv-glass-inner border border-line rounded-xl items-center justify-center"
      >
        <p className="text-[12.5px] text-ink-muted">Choose something from the queue to read it.</p>
      </section>
    );
  }

  const composer = COMPOSER[row.action];

  return (
    <section
      aria-label="Selected item"
      aria-live="polite"
      className="hidden lg:flex grow min-w-0 rv-glass-inner border border-line rounded-xl flex-col overflow-hidden"
    >
      <div className="shrink-0 px-4.5 pt-4 pb-3.5 border-b border-line-subtle">
        <div className="flex items-start gap-3">
          <div className="grow min-w-0">
            <h2 className="text-[16.5px] font-bold text-ink tracking-tight mb-1.5">{row.subject}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12.5px] font-bold text-ink">{row.who}</span>
              {row.detail ? <span className="text-[12px] text-ink-muted">{row.detail}</span> : null}
              {row.account ? (
                <>
                  <span className="text-line-strong" aria-hidden="true">
                    /
                  </span>
                  <span className="text-[12.5px] font-bold text-accent">{row.account.name}</span>
                </>
              ) : null}
            </div>
          </div>
          <span
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11.5px] font-bold ${
              WAIT_CHIP[waitingTone(row.waiting_days)]
            }`}
          >
            Waiting {row.waiting_days} {row.waiting_days === 1 ? 'day' : 'days'}
          </span>
        </div>

        <ContextStrip row={row} />
      </div>

      <div className="grow overflow-y-auto px-4.5 py-3.5">
        <p className="text-[13px] leading-relaxed text-ink max-w-[68ch] whitespace-pre-line">
          {row.preview}
        </p>
      </div>

      {composer ? (
        <Composer key={row.id} spec={composer} />
      ) : row.action === 'open_external' && row.external_url ? (
        <div className="shrink-0 px-4.5 pb-4">
          <a
            href={row.external_url}
            target="_blank"
            rel="noreferrer"
            className="h-[34px] px-3.5 rounded-lg border border-line bg-surface text-[12.5px] font-bold text-ink inline-flex items-center gap-1.5 hover:border-line-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Open in the source system
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </section>
  );
}
