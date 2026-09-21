import { useState } from 'react';
import { FUNCTION_LABELS, type User, type UserFunction } from '../../features/auth/authSlice';

export type OwnerSummary = { id: number; name: string; function: UserFunction | null };

type Props = {
  title?: string;
  owner: OwnerSummary | null;
  members: User[];
  /** Whether the viewer may assign or hand over (the backend decides for real). */
  mayChange: boolean;
  /** Save the new owner (null clears) with a handover note; resolve true on success. */
  onSave: (userId: number | null, note: string) => Promise<boolean>;
};

/**
 * One accountable person, from any function, for an organisation or an
 * account: who it is, and "Assign" / "Hand over" with a note that is written
 * down for the record. The same tile on both pages so ownership reads and
 * behaves the same wherever it appears.
 */
export function OwnerTile({ title = 'Account owner', owner, members, mayChange, onSave }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function save() {
    if (pending === null) return;
    if (await onSave(pending ? Number(pending) : null, note)) {
      setPending(null);
      setNote('');
    }
  }

  return (
    <div className="border border-accent/30 bg-accent-dim/40 rounded-lg px-3 py-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent">{title}</div>
          <div className="text-[13px] font-semibold text-ink">
            {owner ? `${owner.name}${owner.function ? ` · ${FUNCTION_LABELS[owner.function]}` : ''}` : 'Nobody yet'}
          </div>
        </div>
        {mayChange && pending === null && (
          <button type="button" onClick={() => setPending(owner ? String(owner.id) : '')} className="text-[12px] font-semibold text-accent hover:underline">
            {owner ? 'Hand over' : 'Assign'}
          </button>
        )}
      </div>
      {pending !== null && (
        <div className="flex flex-col gap-1.5">
          <select aria-label="New account owner" value={pending} onChange={(e) => setPending(e.target.value)} className="px-2 py-1 bg-surface border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent">
            <option value="">Nobody</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.function ? ` · ${FUNCTION_LABELS[m.function]}` : ''}
              </option>
            ))}
          </select>
          <input aria-label="Handover note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why is it moving? (written down for the record)" className="px-2 py-1 bg-surface border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent" />
          <div className="flex gap-2">
            <button type="button" onClick={save} className="px-3 py-1 bg-accent text-on-accent rounded-lg text-[12px] font-bold">Save</button>
            <button type="button" onClick={() => setPending(null)} className="text-[12px] font-semibold text-ink-muted">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
