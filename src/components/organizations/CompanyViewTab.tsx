import { useEffect, useState, type FormEvent } from 'react';
import { Users } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import {
  addContribution,
  deleteContribution,
  fetchContributions,
  fetchResponsible,
  setResponsible,
} from '../../features/knowledge/knowledgeSlice';
import type { Contribution } from '../../features/knowledge/knowledgeSlice';
import { FUNCTION_LABELS } from '../../features/auth/authSlice';
import type { User, UserFunction } from '../../features/auth/authSlice';
import { apiFetch } from '../../lib/apiClient';
import { formatDate } from '../../features/customers/formatters';
import { QuestionsPanel } from './QuestionsPanel';

const FUNCTION_TONE: Record<UserFunction, string> = {
  cs: 'bg-info-dim text-info',
  engineering: 'bg-accent-dim text-accent',
  sales: 'bg-success-dim text-success',
  analytics: 'bg-warning-dim text-warning',
  leadership: 'bg-subtle text-ink',
  other: 'bg-subtle text-ink-muted',
};

/**
 * What the whole company knows about this customer — every function's
 * contributions, newest first, and who answers for the account in each
 * function. Company-wide by design: any member reads and writes here,
 * whatever their book; the author's function is stamped from their
 * profile. The Copilot reads the same rows, so what is written here is
 * what it answers from.
 */
export function CompanyViewTab({ customerId, customerName }: { customerId: number; customerName: string }) {
  const dispatch = useAppDispatch();
  const me = useAppSelector((s) => s.auth.user);
  const canAssign = useCapability('view_all_accounts');
  const canManage = useCapability('manage_users');
  const rows = useAppSelector((s) => s.knowledge.contributions[customerId]);
  const responsible = useAppSelector((s) => s.knowledge.responsible[customerId]);
  const { error, saveError } = useAppSelector((s) => s.knowledge);
  const [body, setBody] = useState('');
  const [filter, setFilter] = useState<UserFunction | 'all'>('all');
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    dispatch(fetchContributions(customerId));
    dispatch(fetchResponsible(customerId));
  }, [dispatch, customerId]);

  useEffect(() => {
    apiFetch<User[]>('/auth/members/')
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const result = await dispatch(addContribution({ customerId, body: body.trim() }));
    if (addContribution.fulfilled.match(result)) setBody('');
  }

  const shown = (rows ?? []).filter((c) => filter === 'all' || c.function === filter);
  const counts = (rows ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.function] = (acc[c.function] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      <section className="bg-surface rounded-xl border border-line-subtle shadow-sm px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-accent" />
          <h2 className="text-[14px] font-bold text-ink">Who answers for {customerName}</h2>
        </div>
        <AccountOwnerTile customerId={customerId} members={members} canAssign={canAssign} />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mt-2">
          {(responsible ?? []).filter((r) => r.function !== 'cs').map((r) => (
            <div key={r.function} className="border border-line-subtle rounded-lg px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{r.function_display}</div>
              {canAssign ? (
                <select
                  aria-label={`${r.function_display} owner`}
                  value={r.user?.id ?? ''}
                  onChange={(e) =>
                    dispatch(setResponsible({ customerId, function: r.function, user_id: e.target.value ? Number(e.target.value) : null }))
                  }
                  className="mt-0.5 w-full bg-transparent text-[13px] font-semibold text-ink focus:outline-none"
                >
                  <option value="">Nobody yet</option>
                  {/* Only people in the function: the engineering owner is an engineer. */}
                  {members.filter((m) => m.function === r.function || m.id === r.user?.id).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`mt-0.5 text-[13px] font-semibold ${r.user ? 'text-ink' : 'text-ink-faint'}`}>{r.user?.name ?? 'Nobody yet'}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <QuestionsPanel customerId={customerId} customerName={customerName} members={members} />

      {(error || saveError) && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error ?? saveError}
        </p>
      )}

      <section className="bg-surface rounded-xl border border-line-subtle shadow-sm px-5 py-4 flex flex-col gap-3">
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor={`contribution-${customerId}`} className="text-[13px] font-bold text-ink">
            What do you know about {customerName}?
            {me && (
              <span className="text-[11px] font-semibold text-ink-faint">
                {' '}· filed under {FUNCTION_LABELS[me.function]} as {me.name}
              </span>
            )}
          </label>
          <textarea
            id={`contribution-${customerId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="A fact, a risk, a change — anything a colleague or the Copilot should know."
            className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-ink-faint">Visible to everyone in the company, and read by the Copilot.</span>
            <button type="submit" disabled={!body.trim()} className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50">
              Add
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1.5 flex-wrap border-t border-line-subtle pt-3">
          <button type="button" onClick={() => setFilter('all')} className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold border ${filter === 'all' ? 'bg-accent-dim text-accent border-accent/30' : 'text-ink-muted border-line'}`}>
            All ({rows?.length ?? 0})
          </button>
          {(Object.keys(FUNCTION_LABELS) as UserFunction[]).filter((k) => counts[k]).map((k) => (
            <button key={k} type="button" onClick={() => setFilter(k)} className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold border ${filter === k ? 'bg-accent-dim text-accent border-accent/30' : 'text-ink-muted border-line'}`}>
              {FUNCTION_LABELS[k]} ({counts[k]})
            </button>
          ))}
        </div>

        {rows && rows.length === 0 && (
          <p className="text-[12.5px] text-ink-faint">Nothing here that you can see yet — what your team, your reports and leadership write about this customer will appear here. Be the first.</p>
        )}
        <ul className="flex flex-col gap-2">
          {shown.map((c) => (
            <ContributionCard key={c.id} row={c} canRemove={me?.id === c.author.id || canManage} onRemove={() => dispatch(deleteContribution({ customerId, id: c.id }))} />
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * The one accountable person for this customer, from any function — the
 * account owner — with the team around them below. Changing it is an
 * event: it needs the current owner, someone above them, or an
 * org-settings manager, and the handover note is written down as a
 * contribution so the history of who held the account is knowledge.
 */
function AccountOwnerTile({ customerId, members, canAssign }: { customerId: number; members: User[]; canAssign: boolean }) {
  const dispatch = useAppDispatch();
  const me = useAppSelector((s) => s.auth.user);
  const owner = useAppSelector((s) => s.knowledge.accountOwner[customerId] ?? null);
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const mayChange = canAssign || (!!me && (!owner || owner.id === me.id));

  async function save() {
    if (pending === null) return;
    const result = await dispatch(setResponsible({ customerId, function: 'cs', user_id: pending ? Number(pending) : null, note }));
    if (setResponsible.fulfilled.match(result)) {
      setPending(null);
      setNote('');
    }
  }

  return (
    <div className="border border-accent/30 bg-accent-dim/40 rounded-lg px-3 py-2 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent">Account owner</div>
          <div className="text-[13px] font-semibold text-ink">
            {owner ? `${owner.name} · ${FUNCTION_LABELS[owner.function]}` : 'Nobody yet'}
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
            <button type="button" onClick={save} className="px-3 py-1 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold">Save</button>
            <button type="button" onClick={() => setPending(null)} className="text-[12px] font-semibold text-ink-muted">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContributionCard({ row, canRemove, onRemove }: { row: Contribution; canRemove: boolean; onRemove: () => void }) {
  return (
    <li className="border border-line-subtle rounded-lg px-3.5 py-2.5" aria-label={`${row.function_display} by ${row.author.name}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${FUNCTION_TONE[row.function]}`}>{row.function_display}</span>
          <span className="text-[12.5px] font-semibold text-ink">{row.author.name}</span>
          <span className="text-[11px] text-ink-faint">{formatDate(row.created_at.slice(0, 10))}</span>
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-[11px] font-semibold text-ink-faint hover:text-danger">
            Remove
          </button>
        )}
      </div>
      <p className="text-[13px] text-ink mt-1 leading-relaxed whitespace-pre-wrap">{row.body}</p>
    </li>
  );
}
