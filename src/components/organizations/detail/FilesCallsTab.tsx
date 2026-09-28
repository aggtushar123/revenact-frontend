import type { Account } from '../../../features/customers/customersSlice';
import { CallsSection } from './CallsSection';
import { FilesSection } from './FilesSection';

/** Files (spec 2026-09-27 §4): two sections, Files then Calls, each holding
 *  the organization's own records and every visible account's, tagged and
 *  narrowed by the account chip. */
export function FilesCallsTab({
  customerId,
  account,
  accounts,
  isSm,
  active,
  callsVersion = 0,
  onCallLogged,
  onShowAll,
}: {
  customerId: number;
  account: string;
  accounts: Account[];
  isSm: boolean;
  /** Whether this tab is showing (it stays mounted, hidden, once visited). */
  active: boolean;
  /** Bumped when the Story's + Add logs a call, so the calls read again. */
  callsVersion?: number;
  /** A call was logged on this tab. */
  onCallLogged: () => void;
  onShowAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <FilesSection customerId={customerId} account={account} accounts={accounts} isSm={isSm} onShowAll={onShowAll} />
      <CallsSection
        customerId={customerId}
        account={account}
        accounts={accounts}
        isSm={isSm}
        active={active}
        version={callsVersion}
        onLogged={onCallLogged}
        onShowAll={onShowAll}
      />
    </div>
  );
}
