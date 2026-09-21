// Communications, arranged as an inbox.
//
//   [sources rail] [ inbox: folders + filters | grouped list or the open item ] [ Copilot rail ]
//
// with its own top bar (search everything, compose, new chat, history, and
// the switch that hides the Copilot). No Navbar above it, nothing framing
// it; it sits on the canvas like the home page does.
//
// Everything in the list is real: the four kinds of waiting the backend
// computes (questions for you, replies owed, open tickets, calls to wrap up),
// the counts beside the folders, the two filters (the queue versus everything;
// mine versus my team). The sources rail shows only what is connected. The
// Copilot in the rail is the same Copilot, with the source you picked as its
// context.

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ChevronUp, History, MessageSquarePlus, PenSquare, Search, Sparkles, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchCommunications,
  fetchCommunicationsStats,
  selectRow,
  setMode,
  setScope,
  setSearch,
  toggleKind,
} from '../../features/communications/communicationsSlice';
import type { CommunicationKind } from '../../features/communications/communicationsSlice';
import { fetchConnectors } from '../../features/connectors/connectorsSlice';
import { fetchMailbox } from '../../features/mail/mailSlice';
import type { Conversation } from '../copilot/types';
import { ComposeEmailModal } from '../../components/shared/ComposeEmailModal';
import { DetailPane } from './DetailPane';
import { InboxList, InboxZero } from './InboxList';
import { InboxPanel } from './InboxPanel';
import { SourcesRail } from './SourcesRail';
import { sourcesFrom } from './sources';
import { CopilotRail, HistoryPopover } from './CopilotRail';

const COPILOT_KEY = 'revenact_comms_copilot';

function readCopilotPreference(): boolean {
  try {
    return localStorage.getItem(COPILOT_KEY) !== 'off';
  } catch {
    return true;
  }
}

export default function CommunicationsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { page, isLoading, error, stats, scope, mode, kind, search, selectedId } = useAppSelector((state) => state.communications);
  const mailbox = useAppSelector((state) => state.mail?.connection ?? null);
  const connectors = useAppSelector((state) => state.connectors?.items ?? []);

  const [searchDraft, setSearchDraft] = useState(search);
  const [source, setSource] = useState('all');
  const [panelOpen, setPanelOpen] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(readCopilotPreference);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [composing, setComposing] = useState(false);
  const [contextCleared, setContextCleared] = useState(false);

  useEffect(() => {
    dispatch(fetchCommunications({ scope, mode, kind, search }));
  }, [dispatch, scope, mode, kind, search]);

  useEffect(() => {
    dispatch(fetchCommunicationsStats(scope));
  }, [dispatch, scope]);

  useEffect(() => {
    dispatch(fetchMailbox());
    dispatch(fetchConnectors());
  }, [dispatch]);

  useEffect(() => {
    try {
      localStorage.setItem(COPILOT_KEY, copilotOpen ? 'on' : 'off');
    } catch {
      /* a private window forgets; the default is on */
    }
  }, [copilotOpen]);

  const sources = useMemo(() => sourcesFrom(mailbox, connectors), [mailbox, connectors]);
  const activeSource = sources.find((s) => s.id === source) ?? sources[0];

  const rows = useMemo(() => page?.results ?? [], [page]);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  function chooseSource(id: string) {
    setSource(id);
    setContextCleared(false);
    const next = sources.find((s) => s.id === id);
    // The rail's sources map to a kind; picking one narrows the folder too.
    if (next && next.kind !== kind) dispatch(toggleKind(next.kind ?? (kind as CommunicationKind)));
    if (next && next.kind === null && kind !== null) dispatch(toggleKind(kind));
  }

  function chooseFolder(next: CommunicationKind | null) {
    if (next === kind) return;
    if (next === null) dispatch(toggleKind(kind as CommunicationKind));
    else dispatch(toggleKind(next));
    setSource('all');
  }

  const context = activeSource && activeSource.id !== 'all' && !contextCleared ? { label: activeSource.label, icon: <span className="w-3.5 h-3.5 inline-flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">{activeSource.icon}</span> } : null;
  const showConnectNote = stats !== null && !stats.has_mailbox && mode === 'needs' && (kind === null || kind === 'email');

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Top bar */}
      <header className="h-16 shrink-0 flex items-center gap-3 px-4">
        <form
          className="relative flex-1 max-w-[720px]"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            dispatch(setSearch(searchDraft));
          }}
        >
          <Search className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <label htmlFor="comms-search" className="sr-only">
            Search all conversations
          </label>
          <input
            id="comms-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search all conversations"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface border border-line text-[13.5px] text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-line-strong"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono-brand text-[10px] text-ink-faint border border-line rounded px-1.5 py-0.5">/</kbd>
        </form>
        <button
          type="button"
          onClick={() => setComposing(true)}
          disabled={!selected?.account || !mailbox}
          title={!mailbox ? 'Connect a mailbox to compose' : !selected?.account ? 'Open a conversation to compose to its account' : 'Compose'}
          className="h-11 px-4 rounded-xl bg-accent text-on-accent text-[13px] font-semibold inline-flex items-center gap-2 disabled:opacity-40 hover:opacity-90 transition-opacity duration-[var(--dur-fast)]"
        >
          Compose
          <PenSquare className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="ml-auto flex items-center gap-1 rounded-xl bg-surface/70 border border-line p-1 relative">
          <button
            type="button"
            onClick={() => {
              setConversation(null);
              setCopilotOpen(true);
            }}
            aria-label="New chat"
            title="New chat"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-subtle"
          >
            <MessageSquarePlus className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            aria-label="History"
            aria-expanded={historyOpen}
            title="History"
            className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-subtle ${historyOpen ? 'bg-subtle text-ink' : 'text-ink-muted hover:text-ink'}`}
          >
            <History className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCopilotOpen((o) => !o)}
            aria-label={copilotOpen ? 'Hide Copilot' : 'Show Copilot'}
            aria-pressed={copilotOpen}
            title={copilotOpen ? 'Hide Copilot' : 'Show Copilot'}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-[var(--dur-fast)] ${copilotOpen ? 'bg-accent text-on-accent' : 'text-ink-muted hover:text-ink hover:bg-subtle'}`}
          >
            <Sparkles className="w-[18px] h-[18px]" aria-hidden="true" />
          </button>
          {historyOpen ? (
            <HistoryPopover
              onClose={() => setHistoryOpen(false)}
              onOpen={(c) => {
                setConversation(c);
                setCopilotOpen(true);
              }}
            />
          ) : null}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex gap-3 px-4 pb-4">
        <SourcesRail sources={sources} active={activeSource?.id ?? 'all'} onSelect={chooseSource} />

        {/* Inbox */}
        <section aria-label="Inbox" className="flex-1 min-w-0 rv-card flex flex-col overflow-hidden">
          <div className="h-14 shrink-0 flex items-center gap-2 px-3">
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              aria-label={panelOpen ? 'Hide folders' : 'Show folders'}
              aria-expanded={panelOpen}
              className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-ink-muted hover:text-ink hover:bg-subtle"
            >
              <ChevronUp className={`w-4 h-4 transition-transform duration-[var(--dur-fast)] ${panelOpen ? '' : 'rotate-180'}`} aria-hidden="true" />
            </button>
            <h1 className="text-[15px] font-semibold text-ink">Inbox</h1>
            {mode === 'needs' ? (
              <button type="button" onClick={() => dispatch(setMode('everything'))} className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-[12px] text-ink hover:bg-line-subtle">
                Needs you
                <X className="w-3 h-3 text-ink-muted" aria-hidden="true" />
              </button>
            ) : null}
            {search.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft('');
                  dispatch(setSearch(''));
                }}
                className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-[12px] text-ink hover:bg-line-subtle"
              >
                “{search}”
                <X className="w-3 h-3 text-ink-muted" aria-hidden="true" />
              </button>
            ) : null}
            <span className="ml-auto font-mono-brand text-[11.5px] tabular-nums text-ink-faint">
              {page ? (page.truncated && stats ? `${rows.length} shown of ${stats.total} waiting` : `${rows.length} of ${page.count}`) : ''}
            </span>
          </div>

          <div className="flex-1 min-h-0 flex px-3 pb-3">
            {panelOpen ? (
              <InboxPanel
                kind={kind}
                stats={stats}
                needsOnly={mode === 'needs'}
                mineOnly={scope === 'mine'}
                hasMailbox={stats?.has_mailbox ?? true}
                onKind={chooseFolder}
                onNeedsOnly={(next) => dispatch(setMode(next ? 'needs' : 'everything'))}
                onMineOnly={(next) => dispatch(setScope(next ? 'mine' : 'team'))}
              />
            ) : null}

            <div className="flex-1 min-w-0 min-h-0 overflow-y-auto custom-scrollbar pl-1" role="region" aria-label={selected ? 'Conversation' : 'Queue'}>
              {error ? (
                <div role="alert" className="flex items-start gap-3 p-4 border border-danger/30 rounded-xl bg-danger-dim">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-[13px] font-semibold text-danger">Could not load your inbox</h3>
                    <p className="text-[12.5px] text-danger mt-0.5">{error} Nothing is shown rather than part of it, so you do not act on half a picture.</p>
                    <button type="button" onClick={() => dispatch(fetchCommunications({ scope, mode, kind, search }))} className="mt-2 h-8 px-3 rounded-md border border-danger bg-surface text-[12px] font-semibold text-danger">
                      Try again
                    </button>
                  </div>
                </div>
              ) : selected ? (
                <div className="h-full flex flex-col">
                  <button type="button" onClick={() => dispatch(selectRow(''))} className="self-start inline-flex items-center gap-1 text-[12.5px] text-ink-muted hover:text-ink mb-2">
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    Inbox
                  </button>
                  <div className="flex-1 min-h-0 flex">
                    <DetailPane row={selected} />
                  </div>
                </div>
              ) : (
                <>
                  {showConnectNote ? (
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                      <p className="text-[12.5px] text-ink-muted">
                        <span className="font-semibold text-ink">Connect your mailbox to see replies you owe.</span> Questions, tickets and calls already work without it.
                      </p>
                      <button type="button" onClick={() => navigate('/integrations')} className="rv-pill-primary shrink-0">
                        Connect mailbox
                      </button>
                    </div>
                  ) : null}
                  {page?.truncated ? <p className="mb-3 text-[11.5px] text-warning">More than we show is outstanding in one of these. Clear some, or narrow the inbox.</p> : null}
                  <InboxList
                    rows={rows}
                    selectedId={null}
                    isLoading={isLoading}
                    onSelect={(id) => dispatch(selectRow(id))}
                    emptyState={
                      search.trim() ? (
                        <InboxZero title={`No match for “${search}”`} line="Try an account name, or search everything instead of the queue." />
                      ) : mode === 'needs' ? (
                        <InboxZero />
                      ) : (
                        <InboxZero title="Nothing here" line="No conversations across the accounts you can see." />
                      )
                    }
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {copilotOpen ? (
          <CopilotRail context={context} onClearContext={() => setContextCleared(true)} conversation={conversation} onConversation={setConversation} />
        ) : null}
      </div>

      {composing && selected?.account ? (
        <ComposeEmailModal
          customerId={selected.account.type === 'customer' ? selected.account.id : selected.account.id}
          accountId={selected.account.type === 'account' ? selected.account.id : undefined}
          recordName={selected.account.name}
          onClose={() => setComposing(false)}
          onSent={() => {
            setComposing(false);
            dispatch(fetchCommunications({ scope, mode, kind, search }));
          }}
        />
      ) : null}
    </div>
  );
}
