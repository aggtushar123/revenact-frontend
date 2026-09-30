import { useId, useState, type ReactNode } from 'react';
import type { Customer } from '../../../features/customers/customersSlice';
import { formatCompactMoney, formatDate } from '../../../features/customers/formatters';
import type { PanelKey } from '../../../features/organizations/portfolioFields';
import { HEALTH_LABEL } from '../../../features/organizations/portfolioLabels';
import type { PortfolioRow, PortfolioRowBase } from '../../../features/organizations/portfolioTypes';
import { HealthRing, PulsePair, RenewalRunway, TrendLine, renewalText } from '../portfolio/rowParts';
import { FOCUS } from '../portfolio/styles';
import { HealthBreakdown } from './HealthBreakdown';

const TILE = `flex min-w-[11rem] shrink-0 snap-start flex-col gap-2 rounded-xl bg-surface p-3 text-left hover:bg-subtle active:bg-line-subtle sm:min-w-0 ${FOCUS}`;

function Title({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{children}</span>;
}

/** The four tiles on either detail page (organisation spec §1.3; account
 *  spec §2.3). Health opens what the page breaks it into below them; ARR,
 *  Renewal and Pulse jump to their Details panel. From `sm` a grid that
 *  wraps to its own column, not the window (`@container`): four across once
 *  the column is 36rem wide, two beside the open rail on a narrow window. A
 *  strip that snaps sideways on phones. */
export function DetailTiles({
  row,
  arr,
  arrNote,
  renewalPanel,
  breakdownWord,
  breakdown,
  isSm,
  onJump,
}: {
  row: PortfolioRowBase;
  /** ARR as the page prints it, "—" when there is none. */
  arr: string;
  /** The line under it: which figure, in which currency. */
  arrNote: string;
  /** Where Renewal jumps: the organization's contract timeline, or the account's Commercial panel. */
  renewalPanel: 'contract' | 'commercial';
  /** What Health opens, in words: "breakdown", "account pulse". */
  breakdownWord: string;
  /** What Health opens, given the id its button controls. */
  breakdown: (id: string) => ReactNode;
  isSm: boolean;
  onJump: (panel: PanelKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const breakdownId = useId();
  const pulse = row.pulse;
  const pulseWords = `AI ${pulse.ai ?? 'not set'}, CSM ${pulse.csm ?? 'not set'}${pulse.disagree ? ', pulses disagree' : ''}`;
  const band = HEALTH_LABEL[row.health.category];
  const renewalHint = renewalPanel === 'contract' ? 'Show the contract timeline' : 'Show the renewal timeline';

  return (
    <div className="@container flex flex-col gap-3">
      <div
        className={
          isSm ? 'grid grid-cols-2 gap-3 @min-[36rem]:grid-cols-4' : '-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4'
        }
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={open ? breakdownId : undefined}
          aria-label={`Health ${row.health.score.toFixed(1)}, ${band}. ${open ? 'Hide' : 'Show'} the ${breakdownWord}`}
          className={TILE}
        >
          <Title>Health</Title>
          <span className="flex items-center gap-3">
            <HealthRing score={row.health.score} category={row.health.category} />
            <TrendLine trend={row.health.trend} category={row.health.category} />
          </span>
          <span className="text-[11px] text-ink-muted">
            {band} · {open ? 'Hide' : 'Show'} {breakdownWord}
          </span>
        </button>

        <button type="button" onClick={() => onJump('commercial')} aria-label={`ARR ${arr}. Show commercial details`} className={TILE}>
          <Title>ARR</Title>
          <span className="font-mono-brand text-[22px] leading-tight tabular-nums text-ink">{arr}</span>
          <span className="text-[11px] text-ink-muted">{arrNote}</span>
        </button>

        <button
          type="button"
          onClick={() => onJump(renewalPanel)}
          aria-label={`Renewal ${renewalText(row.renewal.days)}. ${renewalHint}`}
          className={TILE}
        >
          <Title>Renewal</Title>
          <RenewalRunway renewal={row.renewal} className="flex" />
          <span className="text-[11px] text-ink-muted">{row.renewal.date ? formatDate(row.renewal.date) : 'No renewal date'}</span>
        </button>

        <button type="button" onClick={() => onJump('voice')} aria-label={`Pulse ${pulseWords}. Show the voice of the customer`} className={TILE}>
          <Title>Pulse</Title>
          <PulsePair pulse={pulse} className="flex" />
        </button>
      </div>
      {open ? breakdown(breakdownId) : null}
    </div>
  );
}

/** The organization page's tiles (spec §1.3): ARR billed at the account in
 *  the customer's own currency; Health opens the five-part rubric. */
export function HeaderTiles({
  row,
  customer,
  customerError,
  isSm,
  onJump,
}: {
  row: PortfolioRow;
  customer: Customer | null;
  customerError: string | null;
  isSm: boolean;
  onJump: (panel: PanelKey) => void;
}) {
  const commercial = row.details.commercial;
  const arr = commercial.arr_billed_at_account == null ? '—' : formatCompactMoney(commercial.arr_billed_at_account, commercial.currency);
  return (
    <DetailTiles
      row={row}
      arr={arr}
      arrNote={`Billed at account, in ${commercial.currency}`}
      renewalPanel="contract"
      breakdownWord="breakdown"
      breakdown={(id) => <HealthBreakdown id={id} customer={customer} error={customerError} />}
      isSm={isSm}
      onJump={onJump}
    />
  );
}
