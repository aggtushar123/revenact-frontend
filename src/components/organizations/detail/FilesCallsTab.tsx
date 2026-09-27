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
  const callsId = useId();
  return (
    <div className="flex flex-col gap-6">
      {/* FilesTab titles itself "Files": one heading, not a label above it. */}
      <section aria-label="Files" className="flex flex-col">
        <FilesTab entityType="organization" entityId={customerId} />
      </section>
      <section aria-labelledby={callsId} className="flex flex-col gap-2">
        <h2 id={callsId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Calls
        </h2>
        <CallSenseTab entityType="organization" entityId={customerId} version={callsVersion} embedded />
      </section>
    </div>
  );
}
