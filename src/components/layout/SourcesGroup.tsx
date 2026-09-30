// The Communications group in the sidebar: the inbox, then every source
// connected to the platform, in a pill that opens and closes. Icons only;
// a name shows in a pill beside the icon while the pointer rests on it.
//
// Closed it shows the inbox, Gmail and a chevron;
// open, every channel the platform offers, the unconnected ones dimmed and
// leading to Integrations. The inbox goes to /communications; a source goes to
// /communications?source=<id>, which the page reads to narrow the inbox and
// to give the Copilot its context. Only what is actually connected appears.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchConnectors } from '../../features/connectors/connectorsSlice';
import { fetchMailbox } from '../../features/mail/mailSlice';
import { sourcesFrom } from '../../pages/communications/sources';
import type { Source } from '../../pages/communications/sources';
import { useHoverLabel } from './useHoverLabel';

const OPEN_KEY = 'revenact_sidebar_sources_open';

export function SourcesGroup() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const mailbox = useAppSelector((state) => state.mail?.connection ?? null);
  const connectors = useAppSelector((state) => state.connectors?.items ?? []);
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(OPEN_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    dispatch(fetchMailbox());
    dispatch(fetchConnectors());
  }, [dispatch]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, String(open));
    } catch {
      /* a private window forgets; closed is the default */
    }
  }, [open]);

  const sources = useMemo(() => sourcesFrom(mailbox, connectors), [mailbox, connectors]);
  const onPage = location.pathname.startsWith('/communications');
  const activeId = onPage ? (params.get('source') ?? 'all') : null;
  // The inbox is always first and mail always second: closed, the group is
  // the inbox and Gmail, whatever else is connected. Unconnected, Gmail is
  // dimmed and leads to Integrations, which is where a mailbox connects.
  const shown = open ? sources : sources.slice(0, 2);
  const hasMore = sources.length > 2;

  return (
    <div className="rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-1 flex flex-col items-center gap-0.5" role="group" aria-label="Communications">
      {shown.map((source) => (
        <SourceButton key={source.id} source={source} active={source.id === activeId} onGo={navigate} />
      ))}
      {hasMore ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Show fewer sources' : 'Show all sources'}
          className="flex items-center justify-center rounded-xl w-11 min-h-11 sm:min-h-8 text-ink-faint hover:text-ink transition-colors duration-[var(--dur-fast)]"
        >
          {open ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}

function SourceButton({ source, active, onGo }: { source: Source; active: boolean; onGo: (to: string) => void }) {
  const name = source.id === 'all' ? 'Communications' : source.label;
  // A channel that is not connected leads to Integrations to connect it.
  const label = source.connected ? name : `Connect ${name}`;
  const to = !source.connected ? '/integrations' : source.id === 'all' ? '/communications' : `/communications?source=${encodeURIComponent(source.id)}`;
  const ref = useRef<HTMLButtonElement>(null);
  const hover = useHoverLabel(ref, label);
  return (
    <>
      <button
        ref={ref}
        {...hover.handlers}
        type="button"
        onClick={() => onGo(to)}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active ? 'bg-surface border border-line text-ink shadow-xs' : 'border border-transparent text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/[0.06]'
        } ${source.connected ? '' : 'opacity-40 hover:opacity-70'}`}
      >
        <span className="shrink-0 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">{source.icon}</span>
      </button>
      {hover.node}
    </>
  );
}
