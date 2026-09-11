import React from 'react';
import type { CsatBreakdown } from '../../features/customers/customersSlice';

interface CsatPopoverProps {
  /** The distribution of answered CSAT surveys, straight from the API. */
  breakdown: CsatBreakdown;
  style: React.CSSProperties;
}

/** Bands run best to worst; the tone follows the band, not the customer. */
const BAND_TONE: Record<string, { color: string; textClass: string }> = {
  very_satisfied: { color: 'var(--success)', textClass: 'text-success' },
  satisfied: { color: 'var(--success)', textClass: 'text-success' },
  neutral: { color: 'var(--warning)', textClass: 'text-warning' },
  dissatisfied: { color: 'var(--danger)', textClass: 'text-danger' },
  very_dissatisfied: { color: 'var(--danger)', textClass: 'text-danger' },
};

const FALLBACK_TONE = { color: 'var(--text-tertiary)', textClass: 'text-ink-faint' };

/**
 * How this customer's CSAT responses actually spread.
 *
 * Every row used to be hardcoded — the same "23 Responses" and the same five
 * counts for every customer in the table, with the bars drawn at `fill * 2`
 * because the real percentages "looked too tiny". It reads `csat_breakdown`
 * now: real answered surveys, bucketed into the five bands server-side, with
 * the bar widths being the percentages they're labelled with.
 */
export function CsatPopover({ breakdown, style }: CsatPopoverProps) {
  const { responses, bands } = breakdown;

  return (
    <div
      style={style}
      className="fixed z-[100] w-[340px] bg-elevated rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-line-strong p-5 text-[12px] font-medium pointer-events-none transition-opacity duration-200"
    >
      <div className="font-bold text-ink text-[13px] mb-4">
        {responses} {responses === 1 ? 'Response' : 'Responses'}
      </div>

      {responses === 0 ? (
        <p className="text-[12px] text-ink-faint">
          No CSAT survey has been answered for this account yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3 relative z-10 bg-elevated">
          {bands.map((band) => {
            const tone = BAND_TONE[band.key] ?? FALLBACK_TONE;
            return (
              <div key={band.key} className="flex items-center justify-between">
                <div className="w-[110px] text-ink-faint">{band.label}:</div>
                <div className="w-[16px] font-bold text-ink-muted text-right tabular-nums">
                  {band.count}
                </div>
                <div className="flex-1 h-[6px] bg-subtle rounded-full overflow-hidden mx-3">
                  {/* The width is the share. The old version doubled it so the
                      bars looked fuller, which made every bar overstate itself. */}
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${band.share}%`, backgroundColor: tone.color }}
                  />
                </div>
                <div className={`w-[45px] text-right font-bold tabular-nums ${tone.textClass}`}>
                  {band.share}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tooltip Arrow pointing down */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-elevated border-b border-r border-line-strong transform rotate-45"></div>
    </div>
  );
}
