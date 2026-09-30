import { useState } from 'react';
import { FUNCTION_LABELS, type User, type UserFunction } from '../../features/auth/authSlice';

export type OwnerSummary = { id: number; name: string; function: UserFunction | null };

type Props = {
  title?: string;
  owner: OwnerSummary | null;
  members: User[];
  /** Whether the viewer may assign or hand over (the backend decides for real). */
  mayChange: boolean;
  /** Save the new owner (null clears) with a handover note; resolve null on
   *  success, or the rejection's message to show inline. */
  onSave: (userId: number | null, note: string) => Promise<string | null>;
  /** A row divided from what is above it, not a tinted box: for a card
   *  that already has its own surface (no card in a card). Off by default. */
  plain?: boolean;
};

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const CONTROL = `min-h-11 rounded-lg border border-line bg-surface px-2 text-[15px] text-ink sm:min-h-9 sm:text-[13px] ${FOCUS}`;

/**
 * One accountable person, from any function, for an organisation or an
 * account: who it is, and "Assign" / "Hand over" with a note that is written
 * down for the record. The same tile on both pages so ownership reads and
 * behaves the same wherever it appears. House type sizes (11/13, 15 in
 * phone inputs) and 44px targets below sm.
 */
export function OwnerTile({ title = 'Account owner', owner, members, mayChange, onSave, plain = false }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (pending === null) return;
    const rejection = await onSave(pending ? Number(pending) : null, note);
    if (rejection === null) {
      setPending(null);
      setNote('');
      setError(null);
    } else {
      setError(rejection);
    }
  }

  return (
    <div
      data-owner-tile={plain ? 'row' : 'tile'}
      className={plain ? 'border-t border-line-subtle pt-3 flex flex-col gap-1.5' : 'border border-accent/30 bg-accent-dim/40 rounded-lg px-3 py-2 flex flex-col gap-1.5'}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className={`text-[11px] font-semibold uppercase tracking-wider ${plain ? 'text-ink-muted' : 'text-accent'}`}>{title}</div>
          <div className="text-[13px] font-semibold text-ink">
            {owner ? `${owner.name}${owner.function ? ` · ${FUNCTION_LABELS[owner.function]}` : ''}` : 'Nobody yet'}
          </div>
        </div>
        {mayChange && pending === null && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setPending(owner ? String(owner.id) : '');
            }}
            className={`inline-flex min-h-11 items-center rounded-lg px-2 text-[13px] font-semibold text-ink hover:bg-subtle active:bg-line-subtle sm:min-h-9 ${FOCUS}`}
          >
            {owner ? 'Hand over' : 'Assign'}
          </button>
        )}
      </div>
      {pending !== null && (
        <div className="flex flex-col gap-1.5">
          <select aria-label="New account owner" value={pending} onChange={(e) => setPending(e.target.value)} className={CONTROL}>
            <option value="">Nobody</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.function ? ` · ${FUNCTION_LABELS[m.function]}` : ''}
              </option>
            ))}
          </select>
          <input
            aria-label="Handover note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why is it moving? (written down for the record)"
            className={CONTROL}
          />
          {error ? (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className={`inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-[13px] font-semibold text-on-accent hover:bg-accent-hover sm:min-h-9 ${FOCUS}`}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPending(null);
              }}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 text-[13px] font-semibold text-ink-muted hover:bg-subtle sm:min-h-9 ${FOCUS}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
