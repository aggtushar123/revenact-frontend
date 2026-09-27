import { useId } from 'react';
import { CallSenseTab } from '../activity/CallSenseTab';
import { FilesTab } from '../activity/FilesTab';

/** Files (spec §1.8): today's Files and CallSense sub-tabs inside the new
 *  frame. The story already carries each call's summary; here are the
 *  recordings, participants and transcripts. */
export function FilesCallsTab({
  customerId,
  callsVersion = 0,
}: {
  customerId: number;
  /** Bumped when + Add logs a call, so the list reads again. */
  callsVersion?: number;
}) {
  const filesId = useId();
  const callsId = useId();
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby={filesId} className="flex flex-col gap-2">
        <h2 id={filesId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Files
        </h2>
        <FilesTab entityType="organization" entityId={customerId} />
      </section>
      <section aria-labelledby={callsId} className="flex flex-col gap-2">
        <h2 id={callsId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Calls
        </h2>
        <CallSenseTab entityType="organization" entityId={customerId} version={callsVersion} />
      </section>
    </div>
  );
}
