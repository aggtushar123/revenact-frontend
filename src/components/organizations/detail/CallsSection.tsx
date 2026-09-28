import { useId, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { fetchCalls } from '../../../features/calls/callsSlice';
import type { Account } from '../../../features/customers/customersSlice';
import { listScope } from '../../../lib/listScope';
import { awaitingAccount, byAccount, chosenAccount, scopeLabel } from '../../../features/organizations/accountScope';
import { callsSummary } from '../../../features/organizations/listSummaries';
import { dayLabel, groupByDay, localDay } from '../../../features/organizations/storyDays';
import { ErrorBlock } from '../portfolio/PortfolioSections';
import { BUTTON } from '../portfolio/styles';
import { AddFlow } from './AddFlow';
import { CallItem } from './CallItem';
import { AccountNames } from './accountNames';
import { AddPaused, ListSkeleton, ScopedEmpty, SummaryLine } from './ListParts';
import { LIST, SECTION_HEADING } from './listStyles';

/** Calls (spec 2026-09-27 §4): the organization's calls and every visible
 *  account's, narrowed by the account chip, as day-grouped plain rows like
 *  the Story's. No timeline rail and no scroll area of its own: the page
 *  scrolls. "Log a call" is the Story's + Add sheet, on the chosen account
 *  when there is one. */
export function CallsSection({
  customerId,
  account,
  accounts,
  isSm,
  active,
  version,
  onLogged,
  onShowAll,
}: {
  customerId: number;
  account: string;
  accounts: Account[];
  isSm: boolean;
  /** Whether the Files tab is showing: a hidden tab closes its sheet. */
  active: boolean;
  /** Bumped when the Story's + Add logs a call, so the list reads again. */
  version: number;
  /** A call was logged here; the page reads the story again. */
  onLogged: () => void;
  onShowAll: () => void;
}) {
  const dispatch = useAppDispatch();
  const { items, isLoading, error, scope } = useAppSelector((state) => state.calls);
  // The shared slot holds this organization's calls (not another's).
  const loaded = scope === listScope(customerId);
  const [attempt, setAttempt] = useState(0);
  const [logging, setLogging] = useState(false);
  if (!active && logging) setLogging(false);
  const headingId = useId();
  const pausedId = useId();

  // Before paint, as People does.
  useLayoutEffect(() => {
    void dispatch(fetchCalls({ entityType: 'organization', customerId }));
  }, [dispatch, customerId, version, attempt]);

  const target = chosenAccount(accounts, account);
  const paused = awaitingAccount(accounts, account);
  const shown = useMemo(() => byAccount(items, account), [items, account]);
  const days = useMemo(() => groupByDay(shown.map((call) => ({ ...call, all_day: false }))), [shown]);
  const today = localDay(new Date());
  const failed = error !== null && !isLoading;

  let body: ReactNode;
  if (failed) body = <ErrorBlock message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  else if (!loaded) body = <ListSkeleton label="Loading calls" />;
  else if (shown.length === 0) {
    body = (
      <ScopedEmpty
        what="calls"
        scope={scopeLabel(accounts, account)}
        detail="Calls logged here or from a recorder arrive with their summaries."
        onShowAll={onShowAll}
      />
    );
  } else {
    body = (
      <div className="flex flex-col gap-3">
        {days.map((day) => (
          <div key={day.key}>
            <h3 className={`mb-1.5 px-1 ${SECTION_HEADING}`}>{dayLabel(day.key, today)}</h3>
            <ul className={LIST}>
              {day.items.map((call) => (
                <CallItem key={call.id} call={call} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <AccountNames.Provider value={accounts}>
      <section aria-labelledby={headingId} aria-busy={isLoading} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={headingId} className={SECTION_HEADING}>
            Calls
          </h2>
          <button
            type="button"
            onClick={() => setLogging(true)}
            disabled={paused}
            aria-describedby={paused ? pausedId : undefined}
            className={BUTTON}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Log a call
          </button>
        </div>
        {paused ? <AddPaused id={pausedId} /> : null}
        {loaded && !failed && shown.length > 0 ? <SummaryLine parts={callsSummary(shown)} /> : null}
        {body}
        {active && logging ? (
          <AddFlow
            what="call"
            customerId={customerId}
            accountId={target?.id}
            accountName={target?.name}
            isSm={isSm}
            onClose={() => setLogging(false)}
            onAdded={() => {
              setLogging(false);
              onLogged();
            }}
          />
        ) : null}
      </section>
    </AccountNames.Provider>
  );
}
