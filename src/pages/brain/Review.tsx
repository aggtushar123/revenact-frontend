import { useEffect, useState } from 'react';
import { CheckSquare, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import {
  decideProposal,
  fetchProposals,
  generateProposals,
} from '../../features/proposals/proposalsSlice';
import type { InitiativeAction, Proposal, TaskAction } from '../../features/proposals/proposalsSlice';
import { formatDate } from '../../features/customers/formatters';

const inputClass =
  'w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent';

/**
 * The review queue — real, this time.
 *
 * The mock page of this name listed invented "knowledge nodes pending
 * review". This one lists what the Ops agent proposed from the brain's own
 * figures, and nothing on it runs until a person approves it. Approval
 * executes through the same paths a person uses by hand — a task on the
 * account, an initiative on a number — so the agent can never do anything
 * a person couldn't.
 *
 * Every proposal carries the figures it cited, so the reviewer judges the
 * reasoning against the numbers rather than trusting the prose.
 */
export function ReviewQueuePage() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { items, pending, isLoading, error, isGenerating, generateError } = useAppSelector(
    (s) => s.proposals
  );

  useEffect(() => {
    if (canSeeAll) dispatch(fetchProposals());
  }, [dispatch, canSeeAll]);

  const queue = items.filter((p) => p.status === 'proposed');
  const decided = items.filter((p) => p.status !== 'proposed');

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Company Brain
            </span>
          </div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Review queue</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            What the Ops agent proposes from the figures, and what your sessions decided. Nothing runs until you approve it.
          </p>
        </div>
        {canSeeAll && (
          <button
            type="button"
            onClick={() => dispatch(generateProposals())}
            disabled={isGenerating}
            title="Asks the agent for new proposals from today's figures. This makes a paid model call."
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? 'Asking…' : 'Ask the agent'}
          </button>
        )}
      </div>

      {!canSeeAll && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          The review queue acts on organisation-wide figures, which need the view-all-accounts
          capability.
        </div>
      )}

      {(error || generateError) && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error ?? generateError}
        </p>
      )}

      {canSeeAll && !isLoading && queue.length === 0 && (
        <p className="text-[12.5px] text-ink-faint bg-subtle border border-line-subtle rounded-lg px-4 py-3">
          Nothing waiting for a decision. Ask the agent, and it will propose from what the brain
          knows right now.
        </p>
      )}

      {queue.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
            Waiting for a decision · {pending}
          </h2>
          {queue.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </section>
      )}
      {decided.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">Decided</h2>
          {decided.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </section>
      )}
    </div>
  );
}

function ActionLine({ proposal }: { proposal: Proposal }) {
  if (proposal.kind === 'task') {
    const a = proposal.action as TaskAction;
    return (
      <p className="text-[12px] text-ink-muted">
        <span className="text-ink-faint">Approving creates a task: </span>
        <span className="font-medium text-ink">{a.title}</span> on{' '}
        <span className="font-medium text-ink">{a.customer_name}</span>, for {a.assignee_name}, due{' '}
        {formatDate(a.due_date)}, {a.priority} priority.
      </p>
    );
  }
  const a = proposal.action as InitiativeAction;
  return (
    <p className="text-[12px] text-ink-muted">
      <span className="text-ink-faint">Approving opens an initiative: </span>
      <span className="font-medium text-ink">{a.metric_label}</span>
      {a.member_label ? ` · ${a.member_label}` : ' · whole organisation'} to {a.target_value} by{' '}
      {formatDate(a.target_by)}.
    </p>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const dispatch = useAppDispatch();
  const { decidingId, decideError } = useAppSelector((s) => s.proposals);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const isPending = proposal.status === 'proposed';
  const busy = decidingId === proposal.id;
  const pill = {
    proposed: 'bg-info-dim text-info',
    approved: 'bg-success-dim text-success',
    rejected: 'bg-subtle text-ink-faint',
  }[proposal.status];

  return (
    <article className="bg-surface border border-line-subtle rounded-lg px-4 py-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint bg-subtle px-1.5 py-0.5 rounded">
              {proposal.kind_display}
            </span>
            <h3 className="text-[14px] font-bold text-ink">{proposal.title}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${pill}`}>
              {proposal.status_display}
            </span>
          </div>
          {proposal.source && (
            <p className="text-[11.5px] text-ink-faint mt-0.5">
              Decided in session{' '}
              <Link to="/copilot" className="text-accent hover:underline">
                {proposal.source.title}
              </Link>
            </p>
          )}
          {proposal.initiative && (
            <p className="text-[11.5px] text-ink-faint mt-0.5">
              Serves{' '}
              <Link to="/brain/initiatives" className="text-accent hover:underline">
                {proposal.initiative.title}
              </Link>
            </p>
          )}
        </div>
      </div>

      <p className="text-[12.5px] text-ink-muted">{proposal.rationale}</p>

      {proposal.evidence.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {proposal.evidence.map((line) => (
            <li key={line} className="text-[11.5px] text-ink-faint font-mono truncate" title={line}>
              · {line}
            </li>
          ))}
        </ul>
      )}

      <ActionLine proposal={proposal} />

      {decideError && busy === false && decidingId === null && (
        <p className="text-[12px] text-danger" role="alert">
          {decideError}
        </p>
      )}

      {isPending && !rejecting && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => dispatch(decideProposal({ id: proposal.id, decision: 'approve' }))}
            className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Approve'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting(true)}
            className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
          >
            Reject
          </button>
        </div>
      )}
      {isPending && rejecting && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch(decideProposal({ id: proposal.id, decision: 'reject', note }));
            setRejecting(false);
          }}
        >
          <label htmlFor={`note-${proposal.id}`} className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Why not? (optional)
          </label>
          <input id={`note-${proposal.id}`} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} autoFocus />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 bg-danger text-white rounded-lg text-[12px] font-bold">
              Reject
            </button>
            <button type="button" onClick={() => setRejecting(false)} className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!isPending && (
        <p className="text-[11px] text-ink-faint">
          {proposal.status_display}
          {proposal.decided_by ? ` by ${proposal.decided_by}` : ''}
          {proposal.decided_at ? ` on ${formatDate(proposal.decided_at.slice(0, 10))}` : ''}
          {proposal.decision_note ? ` — “${proposal.decision_note}”` : ''}
          {proposal.status === 'approved' && proposal.result.task_id ? ` · task #${proposal.result.task_id} created` : ''}
          {proposal.status === 'approved' && proposal.result.initiative_id ? ' · initiative opened' : ''}
        </p>
      )}
    </article>
  );
}
