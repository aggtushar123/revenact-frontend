import { useId, type ReactNode } from 'react';
import type { CsatBreakdown, Customer } from '../../../features/customers/customersSlice';
import { FOCUS, QUIET } from '../portfolio/styles';

/** Bands run best to worst; the tone follows the band, not the customer. */
const BAND_TONE: Record<string, string> = {
  very_satisfied: 'bg-success',
  satisfied: 'bg-success',
  neutral: 'bg-warning',
  dissatisfied: 'bg-danger',
  very_dissatisfied: 'bg-danger',
};

const LINK = `flex min-h-11 min-w-0 max-w-full items-center truncate rounded-sm text-ink underline sm:min-h-0 ${FOCUS}`;

/** An address with `?`, `&` or `#` anywhere could carry its own mailto
 *  query or fragment (cc=, bcc=, body=): it is shown as text, not linked. */
const UNSAFE_EMAIL = /[?&#]/;

/** Encodes only the local part (before the last `@`); the domain is never
 *  percent-encoded, and the visible link text stays the raw address. */
function mailtoHref(email: string): string {
  const at = email.lastIndexOf('@');
  if (at === -1) return `mailto:${encodeURIComponent(email)}`;
  return `mailto:${encodeURIComponent(email.slice(0, at))}@${email.slice(at + 1)}`;
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-ink-muted">{term}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </>
  );
}

function CsatSpread({ breakdown }: { breakdown: CsatBreakdown }) {
  const { responses, bands } = breakdown;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] text-ink">
        <span className="font-mono-brand tabular-nums">{responses}</span> <span>CSAT responses</span>
      </p>
      {responses === 0 ? (
        <p className="text-[13px] text-ink-muted">No CSAT survey has been answered yet.</p>
      ) : (
        <ul aria-label="CSAT responses by band" className="flex flex-col gap-1.5">
          {bands.map((band) => (
            <li key={band.key} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
              <span className="truncate text-ink-muted">{band.label}</span>
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-line">
                <span data-share="" className={`block h-full ${BAND_TONE[band.key] ?? 'bg-line-strong'}`} style={{ width: `${band.share}%` }} />
              </span>
              <span className="font-mono-brand tabular-nums text-ink">
                {band.count} · {band.share}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** What GET /customers/{id}/ adds to the List's row (spec §2) that none of
 *  the six panels shows: how to reach the organization, its industry, and
 *  how its answered CSAT surveys spread (the Voice panel has the score
 *  only). Under the panels, divided like them, in the same surface. */
export function CustomerFacts({
  customer,
  error,
  stacked,
  onRetry,
}: {
  customer: Customer | null;
  error: string | null;
  /** One column at every width (phones). */
  stacked: boolean;
  onRetry: () => void;
}) {
  const headingId = useId();
  const phoneHref = customer?.phone ? `tel:${customer.phone.replace(/[^\d+]/g, '')}` : '';
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 border-t border-line-subtle px-3 pt-3 pb-4">
      <h3 id={headingId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        Contact and CSAT
      </h3>
      {error ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="text-[13px] text-danger">{error}</p>
          <button type="button" onClick={onRetry} className={`${QUIET} border border-line`}>
            Try again
          </button>
        </div>
      ) : !customer ? (
        <div role="status" aria-label="Loading contact details and CSAT" className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} aria-hidden="true" className="block h-3 w-full animate-pulse rounded bg-subtle" />
          ))}
        </div>
      ) : (
        <div data-facts="" className={`grid gap-x-8 gap-y-4 ${stacked ? '' : 'md:grid-cols-2'}`}>
          <dl className="grid grid-cols-[6rem_minmax(0,1fr)] content-start gap-x-3 gap-y-1.5 text-[13px]">
            <Fact term="Email">
              {customer.email && UNSAFE_EMAIL.test(customer.email) ? (
                customer.email
              ) : customer.email ? (
                <a href={mailtoHref(customer.email)} className={LINK}>
                  {customer.email}
                </a>
              ) : (
                '—'
              )}
            </Fact>
            <Fact term="Phone">
              {customer.phone ? (
                <a href={phoneHref} className={LINK}>
                  {customer.phone}
                </a>
              ) : (
                '—'
              )}
            </Fact>
            <Fact term="Industry">{customer.industry || '—'}</Fact>
          </dl>
          <CsatSpread breakdown={customer.csat_breakdown} />
        </div>
      )}
    </section>
  );
}
