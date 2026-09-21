// The Communications group in the sidebar: the inbox, then every source
// connected to the platform, in a pill that opens and closes.
//
// Collapsed it shows the inbox, Gmail and a chevron;
// open, every channel the platform offers, the unconnected ones dimmed and
// leading to Integrations. The inbox goes to /communications; a source goes to
// /communications?source=<id>, which the page reads to narrow the inbox and
// to give the Copilot its context. Only what is actually connected appears.

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchConnectors } from '../../features/connectors/connectorsSlice';
import { fetchMailbox } from '../../features/mail/mailSlice';
import { sourcesFrom } from '../../pages/communications/sources';

const OPEN_KEY = 'revenact_sidebar_sources_open';

export function SourcesGroup({ isExpanded }: { isExpanded: boolean }) {
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
    <div
      className={`rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-1 flex flex-col gap-0.5 ${isExpanded ? '' : 'items-center'}`}
      role="group"
      aria-label="Communications"
    >
      {shown.map((source) => {
        const active = source.id === activeId;
        const name = source.id === 'all' ? 'Communications' : source.label;
        // A channel that is not connected leads to Integrations to connect it.
        const label = source.connected ? name : `Connect ${name}`;
        const to = !source.connected ? '/integrations' : source.id === 'all' ? '/communications' : `/communications?source=${encodeURIComponent(source.id)}`;
        return (
          <button
            key={source.id}
            type="button"
            onClick={() => navigate(to)}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            title={label}
            className={`flex items-center gap-3 rounded-xl transition-colors duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isExpanded ? 'w-full h-[38px] px-3' : 'w-10 h-10 justify-center'
            } ${active ? 'bg-surface border border-line text-ink shadow-xs' : 'border border-transparent text-ink-muted hover:bg-black/5 dark:hover:bg-white/[0.06]'} ${
              source.connected ? '' : 'opacity-40 hover:opacity-70'
            }`}
          >
            <span className="shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px]">{source.icon}</span>
            {isExpanded ? <span className="text-[13px] font-semibold truncate">{name}</span> : null}
          </button>
        );
      })}
      {hasMore ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Show fewer sources' : 'Show all sources'}
          className={`flex items-center justify-center rounded-xl text-ink-faint hover:text-ink transition-colors duration-[var(--dur-fast)] ${isExpanded ? 'w-full h-8' : 'w-10 h-8'}`}
        >
          {open ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
        </button>
      ) : null}
    </div>
  );
}
