import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, Mail, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchCommunications,
  fetchCommunicationsStats,
  resolveSelected,
  selectRow,
  setMode,
  setScope,
  setSearch,
  toggleKind,
} from '../../features/communications/communicationsSlice';
import type {
  CommunicationKind,
  CommunicationMode,
  CommunicationScope,
} from '../../features/communications/communicationsSlice';
import { BucketTiles } from './BucketTiles';
import { QueueList } from './QueueList';
import { DetailPane } from './DetailPane';

/**
 * Communications — the queue of things where a person is waiting on you.
 *
 * Built from `docs/design/communications.md`. The page answers three questions
 * with three controls and nothing else: whose (scope), what kind (the tiles),
 * and waiting or everything (the segmented control).
 *
 * Deliberately no archive or snooze in v1: a row leaves because the underlying
 * thing changed, never because it was dismissed. A queue you can clear without
 * acting stops being true within a week.
 */

const HEADINGS: Record<string, string> = {
  all: 'Everything waiting on you',
  email: 'Replies you owe',
  question: 'Questions for you',
  ticket: 'Open tickets in your department',
  call: 'Calls to wrap up',
};

function Subtitle({
  total,
  oldest,
  mode,
}: {
  total: number | null;
  oldest: number | null;
  mode: CommunicationMode;
}) {
  if (mode === 'everything') {
    return (
      <p className="text-[12.5px] text-ink-muted">
        Every conversation across the accounts you can see.
      </p>
    );
  }
  if (total === null) {
    return <p className="text-[12.5px] text-ink-muted">Working out what is waiting on you.</p>;
  }
  if (total === 0) {
    return <p className="text-[12.5px] text-ink-muted">Nobody is waiting on a reply from you.</p>;
  }
  const thing = total === 1 ? 'One thing is' : `${total} things are`;
  const tail = oldest === null ? '' : ` The oldest has waited ${oldest} ${oldest === 1 ? 'day' : 'days'}.`;
  return (
    <p className="text-[12.5px] text-ink-muted">
      {thing} waiting on you.{tail}
    </p>
  );
}

/** Empty is an achievement, not a blank: it says what is true, and offers the
 *  two places worth going next. */
function ClearedState({
  onEverything,
  onTeam,
  scope,
}: {
  onEverything: () => void;
  onTeam: () => void;
  scope: CommunicationScope;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-10 py-8 gap-3">
      <span className="w-11 h-11 rounded-full bg-success-dim text-success flex items-center justify-center">
        <Check size={22} aria-hidden="true" />
      </span>
      <h3 className="text-[16px] font-bold text-ink">You are clear</h3>
      <p className="text-[12.5px] leading-relaxed text-ink-muted max-w-[40ch]">
        Nobody is waiting on a reply from you right now.
      </p>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={onEverything}
          className="h-8 px-3.5 rounded-lg border border-line bg-surface text-[12.5px] font-bold text-ink hover:border-line-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          See everything
        </button>
        {scope === 'mine' ? (
          <button
            type="button"
            onClick={onTeam}
            className="h-8 px-3.5 rounded-lg border border-line bg-surface text-[12.5px] font-bold text-ink hover:border-line-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Check my team
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** First run: the three buckets that work still show real numbers, and only
 *  the one that cannot is explained. */
function ConnectMailboxNote() {
  return (
    <div className="flex items-start gap-3 p-4 border border-line rounded-xl bg-surface">
      <span className="w-8 h-8 shrink-0 rounded-lg bg-accent-dim text-accent flex items-center justify-center">
        <Mail size={16} aria-hidden="true" />
      </span>
      <div className="grow">
        <h3 className="text-[13.5px] font-bold text-ink mb-1">
          Connect your mailbox to see replies you owe
        </h3>
        <p className="text-[12.5px] leading-relaxed text-ink-muted mb-2.5">
          Only mail with people at your accounts is stored. Questions, tickets and calls already
          work without it.
        </p>
        <Link
          to="/integrations"
          className="h-8 px-3.5 rounded-lg bg-accent text-surface text-[12.5px] font-bold inline-flex items-center hover:bg-accent-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Connect mailbox
        </Link>
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  const dispatch = useAppDispatch();
  const { page, isLoading, error, stats, statsLoading, scope, mode, kind, search, selectedId } =
    useAppSelector((state) => state.communications);

  // Local, so typing does not refetch on every keystroke; committed to the
  // store (and the server) on submit.
  const [searchDraft, setSearchDraft] = useState(search);

  useEffect(() => {
    dispatch(fetchCommunications({ scope, mode, kind, search }));
  }, [dispatch, scope, mode, kind, search]);

  // The tiles only move when the scope does: narrowing to one bucket must not
  // change the other three counts underneath the cursor.
  useEffect(() => {
    dispatch(fetchCommunicationsStats(scope));
  }, [dispatch, scope]);

  const rows = useMemo(() => page?.results ?? [], [page]);
  const selected = useMemo(() => resolveSelected(rows, selectedId), [rows, selectedId]);

  const heading = HEADINGS[kind ?? 'all'];

  // When a channel hits the server's per-kind cap, the merged list's own count
  // is smaller than what is really outstanding, and "25 of 203" beside a tile
  // reading 280 is a number arguing with itself. Say what is shown and what is
  // waiting instead; the notice above explains the gap.
  const countLabel = !page
    ? ''
    : page.truncated && stats
      ? `${rows.length} shown of ${stats.total} waiting`
      : `${rows.length} of ${page.count}`;
  const showConnectNote = stats !== null && !stats.has_mailbox && mode === 'needs';

  return (
    <div className="h-full flex flex-col gap-3.5 px-6 pt-5 pb-6 min-h-0">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight mb-0.5">Communications</h1>
          <Subtitle total={stats?.total ?? null} oldest={stats?.oldest_waiting_days ?? null} mode={mode} />
        </div>
        <div className="grow" />
        <label htmlFor="comms-scope" className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Showing
        </label>
        <select
          id="comms-scope"
          value={scope}
          onChange={(event) => dispatch(setScope(event.target.value as CommunicationScope))}
          className="h-[34px] px-2.5 border border-line rounded-lg bg-surface text-[12.5px] font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value="mine">Mine</option>
          <option value="team">Mine and my team</option>
        </select>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex p-[3px] bg-subtle rounded-lg gap-0.5">
          {(['needs', 'everything'] as CommunicationMode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => dispatch(setMode(value))}
              aria-pressed={mode === value}
              className={`h-7 px-3.5 rounded-md text-[12.5px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                mode === value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {value === 'needs' ? 'Needs you' : 'Everything'}
            </button>
          ))}
        </div>

        <form
          className="relative flex items-center max-w-[340px] grow"
          onSubmit={(event) => {
            event.preventDefault();
            dispatch(setSearch(searchDraft));
          }}
        >
          <Search size={15} className="absolute left-2.5 text-ink-muted" aria-hidden="true" />
          <label htmlFor="comms-search" className="sr-only">
            Search communications
          </label>
          <input
            id="comms-search"
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search people, accounts, subjects"
            className="w-full h-[34px] pl-8 pr-2.5 border border-line rounded-lg bg-surface text-[12.5px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </form>
      </div>

      {mode === 'needs' ? (
        <BucketTiles
          stats={stats}
          active={kind}
          isLoading={statsLoading}
          onToggle={(value: CommunicationKind) => dispatch(toggleKind(value))}
        />
      ) : null}

      {showConnectNote ? <ConnectMailboxNote /> : null}

      {error ? (
        <div role="alert" className="flex items-start gap-3 p-4 border border-danger/30 rounded-xl bg-danger-dim">
          <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" aria-hidden="true" />
          <div className="grow">
            <h3 className="text-[13.5px] font-bold text-danger mb-1">Could not load your queue</h3>
            <p className="text-[12.5px] leading-relaxed text-danger mb-2.5">
              {error} Nothing is shown rather than part of it, so you do not act on half a picture.
            </p>
            <button
              type="button"
              onClick={() => dispatch(fetchCommunications({ scope, mode, kind, search }))}
              className="h-[30px] px-3 rounded-md border border-danger bg-surface text-[12px] font-bold text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {page?.truncated ? (
            <p className="text-[11.5px] text-warning">
              More than we show is outstanding in one of these. Clear some, or narrow the queue.
            </p>
          ) : null}

          <div className="grow flex gap-3.5 min-h-0">
            <QueueList
              rows={rows}
              selectedId={selected?.id ?? null}
              isLoading={isLoading}
              heading={heading}
              countLabel={countLabel}
              onSelect={(id) => dispatch(selectRow(id))}
              emptyState={
                search.trim() ? (
                  <div className="p-8 text-center">
                    <p className="text-[13px] font-bold text-ink mb-1">No match for “{search}”</p>
                    <p className="text-[12px] text-ink-muted">
                      Try an account name, or search everything instead of the queue.
                    </p>
                  </div>
                ) : (
                  <ClearedState
                    scope={scope}
                    onEverything={() => dispatch(setMode('everything'))}
                    onTeam={() => dispatch(setScope('team'))}
                  />
                )
              }
            />
            <DetailPane row={selected} />
          </div>
        </>
      )}
    </div>
  );
}
