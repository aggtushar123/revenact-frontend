import { Fragment, useId } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import type { AccountPortfolioRow } from '../../../features/accounts/portfolioTypes';
import { useMembers } from '../../../features/knowledge/useMembers';
import { CsatSpread } from '../../organizations/detail/CustomerFacts';
import { BUTTON, FOCUS, QUIET } from '../../organizations/portfolio/styles';
import { AIAttributesPanel } from '../../shared/AIAttributesPanel';
import { OwnerTile, type OwnerSummary } from '../../shared/OwnerTile';
import { AccountPanels } from '../portfolio/AccountPanels';
import { useAccountCsat } from './useAccountCsat';

const HEADING = 'text-[11px] font-semibold uppercase tracking-wider text-ink-muted';
const LINK = `inline-flex min-h-11 items-center rounded-sm text-ink underline sm:min-h-0 ${FOCUS}`;

/** Company knowledge is per organisation (spec Decisions): one link per
 *  linked organisation the viewer may open, and none named otherwise. */
function KnowledgeLine({ organisations }: { organisations: { id: number; name: string }[] }) {
  if (organisations.length === 0) {
    return (
      <p className="text-[13px] text-ink-muted">
        Company knowledge is kept on organization pages, and there is none for this account that you can open.
      </p>
    );
  }
  const links = organisations.map((organisation, index) => (
    <Fragment key={organisation.id}>
      {index > 0 ? ', ' : null}
      <Link to={`/organizations/${organisation.id}?tab=knowledge`} className={LINK}>
        {organisation.name}
      </Link>
    </Fragment>
  ));
  return organisations.length === 1 ? (
    <p className="text-[13px] text-ink-muted">Knowledge for this account lives on {links}'s page.</p>
  ) : (
    <p className="text-[13px] text-ink-muted">Knowledge for this account lives on its organizations' pages: {links}.</p>
  );
}

/** Details (spec 2026-09-29 §2.6): who owns the account (hand over with a
 *  note), the four panels from the Accounts list with Edit details on the
 *  heading row, how its CSAT answers spread, its AI attributes, and where
 *  its company knowledge lives. One surface, divided, never boxed twice. */
export function AccountDetailsTab({
  row,
  currency,
  isSm,
  owner,
  mayChangeOwner,
  onSaveOwner,
  onEdit,
}: {
  row: AccountPortfolioRow;
  currency: CurrencyCode;
  isSm: boolean;
  /** From GET /accounts/<id>/ (with their function); undefined while it loads. */
  owner: OwnerSummary | null | undefined;
  mayChangeOwner: boolean;
  onSaveOwner: (userId: number | null, note: string) => Promise<boolean>;
  /** Absent until the account record has landed. */
  onEdit?: () => void;
}) {
  const headingId = useId();
  const csatId = useId();
  const knowledgeId = useId();
  const members = useMembers();
  const csat = useAccountCsat(row.id);

  return (
    <section aria-labelledby={headingId} className="rounded-xl bg-surface">
      <div data-part="details-heading" className="flex items-center justify-between gap-2 px-3 pt-2 pb-2">
        <h2 id={headingId} className={HEADING}>
          Account details
        </h2>
        {onEdit ? (
          <button type="button" onClick={() => onEdit()} className={BUTTON}>
            <Pencil className="w-4 h-4" aria-hidden="true" />
            Edit details
          </button>
        ) : null}
      </div>
      <div className="px-3 pb-3">
        {owner === undefined ? (
          <div role="status" aria-label="Loading the owner" className="border-t border-line-subtle pt-3">
            <span aria-hidden="true" className="block h-3 w-40 animate-pulse rounded bg-subtle" />
          </div>
        ) : (
          <OwnerTile owner={owner} members={members} mayChange={mayChangeOwner} onSave={onSaveOwner} plain />
        )}
      </div>
      <AccountPanels row={row} currency={currency} stacked={!isSm} />
      <section aria-labelledby={csatId} className="flex flex-col gap-3 border-t border-line-subtle px-3 pt-3 pb-4">
        <h3 id={csatId} className={HEADING}>
          CSAT responses
        </h3>
        {csat.error ? (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p className="text-[13px] text-danger">{csat.error}</p>
            <button type="button" onClick={csat.retry} className={`${QUIET} border border-line`}>
              Try again
            </button>
          </div>
        ) : !csat.breakdown ? (
          <div role="status" aria-label="Loading CSAT responses" className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden="true" className="block h-3 w-full animate-pulse rounded bg-subtle" />
            ))}
          </div>
        ) : (
          <CsatSpread breakdown={csat.breakdown} />
        )}
      </section>
      <div className="px-3 pb-4">
        <AIAttributesPanel accountId={row.id} />
      </div>
      <section aria-labelledby={knowledgeId} className="flex flex-col gap-2 border-t border-line-subtle px-3 pt-3 pb-4">
        <h3 id={knowledgeId} className={HEADING}>
          Knowledge
        </h3>
        <KnowledgeLine organisations={row.details.profile.organisations} />
      </section>
    </section>
  );
}
