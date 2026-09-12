import { useEffect, useState, type FormEvent } from 'react';
import { Search, CheckCircle2, SlidersHorizontal, GitBranch, PenTool, Users, MessageCircle, Video } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { createConnector, fetchConnectors, updateConnector } from '../../features/connectors/connectorsSlice';
import type { Connector, Provider } from '../../features/connectors/connectorsSlice';
import { formatDate } from '../../features/customers/formatters';

const GMAIL_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="#EA4335"/>
  </svg>
);

const SALESFORCE_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M16.963 8.16C16.897 8.157 16.837 8.163 16.772 8.17C16.591 6.305 14.896 4.869 12.872 4.869C11.332 4.869 9.972 5.753 9.324 7.026C9.079 6.892 8.802 6.819 8.51 6.819C7.456 6.819 6.578 7.568 6.354 8.536C4.846 8.784 3.737 10.046 3.737 11.597C3.737 13.268 5.167 14.629 6.914 14.629H16.845C18.667 14.629 20.145 13.197 20.145 11.439C20.145 9.721 18.73 8.32 16.963 8.16Z" fill="#00A1E0"/>
  </svg>
);

const SLACK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.528 2.528 0 0 1 2.521-2.523 2.528 2.528 0 0 1 2.521 2.523v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
    <path d="M8.835 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.835 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.835zM8.835 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.313z" fill="#36C5F0"/>
    <path d="M18.958 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.52 2.521h-2.522V8.835zM17.687 8.835a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.522-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.313z" fill="#2EB67D"/>
    <path d="M15.165 18.958a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.165 24a2.528 2.528 0 0 1-2.522-2.52hv-2.522h2.522zM15.165 17.687a2.528 2.528 0 0 1-2.522-2.522 2.528 2.528 0 0 1 2.522-2.522h6.313A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.52 2.521h-6.315z" fill="#ECB22E"/>
  </svg>
);

const JIRA_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M21.75 3C22.9926 3 24 4.00736 24 5.25V18.75C24 19.9926 22.9926 21 21.75 21H2.25C1.00736 21 0 19.9926 0 18.75V5.25C0 4.00736 1.00736 3 2.25 3H21.75Z" fill="#0052CC"/>
    <path d="M11 7H13.5C14.8807 7 16 8.11929 16 9.5V17H13.5C12.1193 17 11 15.8807 11 14.5V7Z" fill="white"/>
    <path d="M6 10.5H8.5C9.88071 10.5 11 11.6193 11 13V17H8.5C7.11929 17 6 15.8807 6 14.5V10.5Z" fill="white"/>
  </svg>
);

const ZENDESK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M12.91 16.59L17.5 21H12.91V16.59ZM21 16.59H16.41L11.82 21H21V16.59ZM12.91 3V7.41L17.5 3H12.91ZM21 3H16.41L11.82 7.41H21V3ZM3 16.59V21H7.59L3 16.59ZM11.09 16.59H6.5L11.09 21V16.59ZM3 3V7.41V3ZM11.09 3V7.41H6.5L11.09 3ZM3 7.41H7.59L3 12V7.41ZM11.09 7.41V12H6.5L11.09 7.41Z" fill="#03363D"/>
  </svg>
);

const HUBSPOT_SVG = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
    <path d="M24 10.457v3.085c0 .416-.339.755-.755.755h-2.186a9.074 9.074 0 0 1-1.391 3.327l1.527 1.527a.754.754 0 0 1 0 1.066l-2.181 2.181a.754.754 0 0 1-1.066 0l-1.527-1.527a9.074 9.074 0 0 1-3.327 1.391v2.186c0 .416-.339.755-.755.755h-3.085c-.416 0-.755-.339-.755-.755v-2.186a9.071 9.071 0 0 1-3.328-1.392l-1.526 1.528a.755.755 0 0 1-1.066 0L.498 19.617a.754.754 0 0 1 0-1.066l1.527-1.527A9.072 9.072 0 0 1 .634 13.7H-1.55a.755.755 0 0 1-.755-.755v-3.085c0-.416.339-.755.755-.755h2.186A9.074 9.074 0 0 1 2.027 5.78L.5 4.253a.754.754 0 0 1 0-1.066L2.681 1.006a.754.754 0 0 1 1.066 0l1.527 1.527A9.074 9.074 0 0 1 8.598 1.144V-1.04c0-.416.339-.755.755-.755h3.085c.416 0 .755.339.755.755v2.186a9.072 9.072 0 0 1 3.327 1.391l1.527-1.527a.754.754 0 0 1 1.066 0l2.181 2.181a.754.754 0 0 1 0 1.066L19.767 5.78a9.074 9.074 0 0 1 1.391 3.328h2.186c.417 0 .755.338.755.755zm-11.954 6.74c2.817 0 5.1-2.283 5.1-5.1 0-2.817-2.283-5.1-5.1-5.1-2.817 0-5.1 2.283-5.1 5.1 0 2.817 2.283 5.1 5.1 5.1z" fill="#FF7A59"/>
  </svg>
);



/**
 * The systems this product can attribute a record to — the backend's
 * `Connector.Provider` list, one card each, with the artwork the page has
 * always carried. The mock advertised nine more (Stripe, Notion, …) that
 * nothing in the product could ever read from; they are gone rather than
 * shown as "Not Setup" forever.
 */
const PROVIDERS: { id: Provider; name: string; category: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', desc: 'The CRM your accounts and opportunities live in.', icon: SALESFORCE_SVG },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', desc: 'Marketing leads and the sales pipeline.', icon: HUBSPOT_SVG },
  { id: 'zendesk', name: 'Zendesk', category: 'Support', desc: 'Support tickets, attributed to the accounts they came from.', icon: ZENDESK_SVG },
  { id: 'intercom', name: 'Intercom', category: 'Support', desc: 'Customer chats and support conversations.', icon: <MessageCircle className="w-10 h-10 text-info" /> },
  { id: 'jira', name: 'Jira Software', category: 'Productivity', desc: 'Issues and epics linked to customer feedback.', icon: JIRA_SVG },
  { id: 'github', name: 'GitHub', category: 'Productivity', desc: 'Commits, pull requests and issues on customer work.', icon: <GitBranch className="w-10 h-10 text-ink" /> },
  { id: 'figma', name: 'Figma', category: 'Productivity', desc: 'Designs referenced from customer records.', icon: <PenTool className="w-10 h-10 text-accent" /> },
  { id: 'gmail', name: 'Gmail', category: 'Communication', desc: 'Emails logged as activity on the account.', icon: GMAIL_SVG },
  { id: 'slack', name: 'Slack', category: 'Communication', desc: 'Alerts and health changes, where the team already is.', icon: SLACK_SVG },
  { id: 'ms_teams', name: 'Microsoft Teams', category: 'Communication', desc: 'Notifications and alerts in channels.', icon: <Users className="w-10 h-10 text-accent" /> },
  { id: 'zoom', name: 'Zoom', category: 'Communication', desc: 'Recorded calls, attributed to the account they were with.', icon: <Video className="w-10 h-10 text-info" /> },
];

const CATEGORIES = ['All', 'CRM', 'Communication', 'Productivity', 'Support'];

function scopeLabel(c: Connector): string {
  if (c.is_organisation_wide) return 'whole organisation';
  const parts = [
    c.customers.length ? `${c.customers.length} ${c.customers.length === 1 ? 'organization' : 'organizations'}` : '',
    c.accounts.length ? `${c.accounts.length} ${c.accounts.length === 1 ? 'account' : 'accounts'}` : '',
  ].filter(Boolean);
  return parts.join(', ');
}

function ingestedLabel(c: Connector): string {
  const parts = [
    c.ticket_count ? `${c.ticket_count} ${c.ticket_count === 1 ? 'ticket' : 'tickets'}` : '',
    c.call_count ? `${c.call_count} ${c.call_count === 1 ? 'call' : 'calls'}` : '',
  ].filter(Boolean);
  if (parts.length === 0) return 'no records yet';
  return `${parts.join(', ')}${c.last_record_at ? ` · last ${formatDate(c.last_record_at)}` : ''}`;
}

function ConnectorRow({ connector, canManage }: { connector: Connector; canManage: boolean }) {
  const dispatch = useAppDispatch();
  return (
    <li className="flex items-center justify-between gap-2 text-[12px]">
      <div className="min-w-0">
        <span className={`font-semibold ${connector.is_enabled ? 'text-ink' : 'text-ink-faint line-through'}`}>{connector.name}</span>
        <span className="text-ink-faint"> · {scopeLabel(connector)}</span>
        <div className="text-[11px] text-ink-faint tabular-nums">{ingestedLabel(connector)}</div>
      </div>
      {canManage && (
        <button
          type="button"
          onClick={() => dispatch(updateConnector({ id: connector.id, is_enabled: !connector.is_enabled }))}
          className="text-[11px] font-bold text-ink-muted hover:text-accent shrink-0"
        >
          {connector.is_enabled ? 'Disable' : 'Enable'}
        </button>
      )}
    </li>
  );
}

function ProviderCard({
  provider,
  connectors,
  canManage,
}: {
  provider: (typeof PROVIDERS)[number];
  connectors: Connector[];
  canManage: boolean;
}) {
  const dispatch = useAppDispatch();
  const saving = useAppSelector((s) => s.connectors.saving);
  const [connecting, setConnecting] = useState(false);
  const [name, setName] = useState(provider.name);
  const connected = connectors.some((c) => c.is_enabled);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await dispatch(createConnector({ provider: provider.id, name: name.trim() }));
    if (createConnector.fulfilled.match(result)) setConnecting(false);
  }

  return (
    <div className="group bg-surface rounded-2xl p-6 border border-line-subtle shadow-sm flex flex-col overflow-hidden relative" aria-label={provider.name}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-subtle/50 rounded-2xl flex items-center justify-center shadow-inner border border-line-subtle/60 p-2">
          {provider.icon}
        </div>
        {connected ? (
          <div className="flex items-center gap-1.5 bg-success-dim text-success px-2.5 py-1 rounded-full border border-success/40 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Connected</span>
          </div>
        ) : (
          <div className="text-xs font-semibold text-ink-faint uppercase tracking-wider bg-subtle px-2.5 py-1 rounded-full border border-line-subtle">
            {connectors.length ? 'Disabled' : 'Not set up'}
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-ink tracking-tight mb-1">{provider.name}</h3>
      <p className="text-sm text-ink-muted font-medium leading-relaxed mb-4">{provider.desc}</p>

      {connectors.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {connectors.map((c) => (
            <ConnectorRow key={c.id} connector={c} canManage={canManage} />
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-line-subtle gap-3">
        <span className="text-[11px] font-bold text-ink-faint tracking-wider uppercase">{provider.category}</span>
        {canManage && !connecting && (
          <button
            type="button"
            onClick={() => setConnecting(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm ${
              connectors.length ? 'bg-surface text-ink-muted border border-line hover:bg-subtle' : 'bg-accent text-[#0D0F0E] hover:bg-accent-hover'
            }`}
          >
            {connectors.length ? 'Add another' : 'Connect'}
          </button>
        )}
      </div>
      {canManage && connecting && (
        <form onSubmit={submit} className="flex items-center gap-2 mt-3">
          <label htmlFor={`name-${provider.id}`} className="sr-only">
            Name for {provider.name}
          </label>
          <input
            id={`name-${provider.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${provider.name} (EU)`}
            className="flex-1 min-w-0 px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
            autoFocus
          />
          <button type="submit" disabled={saving} className="px-3 py-1.5 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={() => setConnecting(false)} className="text-[12px] font-semibold text-ink-muted">
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

/**
 * Integrations, on the real connectors.
 *
 * A connector records that this organisation uses a system and which
 * companies it covers, so tickets and calls already here can say where
 * they came from; each card shows its connectors, their scope and what
 * they have brought in. Anyone may read; connecting, enabling and
 * disabling need manage_integrations, the same capability as webhooks.
 * There is no OAuth or sync behind "Connect" — the backend's own docstring
 * is explicit that a real sync needs credentials and a queue this codebase
 * does not have — so the button says what it does and nothing more.
 */
export function Integrations() {
  const dispatch = useAppDispatch();
  const canManage = useCapability('manage_integrations');
  const { items, error, saveError } = useAppSelector((s) => s.connectors);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    dispatch(fetchConnectors());
  }, [dispatch]);

  const byProvider = new Map<Provider, Connector[]>();
  items.forEach((c) => byProvider.set(c.provider, [...(byProvider.get(c.provider) ?? []), c]));

  const shown = PROVIDERS.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    const matchesCat = activeTab === 'All' || p.category === activeTab;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col h-full w-full bg-base text-ink overflow-y-auto">
      <div className="px-8 pt-10 pb-6 w-full max-w-7xl mx-auto shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar fade-edges">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap border ${
                activeTab === cat
                  ? 'bg-accent-dim text-accent border-accent/30 shadow-sm'
                  : 'bg-surface text-ink-muted border-line hover:border-line-strong hover:bg-subtle'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-faint" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-line rounded-xl leading-5 bg-surface placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all sm:text-sm font-medium shadow-sm"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-8 pb-12 w-full max-w-7xl mx-auto">
        {(error || saveError) && (
          <p className="text-[12.5px] font-semibold text-danger mb-4" role="alert">
            {error ?? saveError}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} connectors={byProvider.get(provider.id) ?? []} canManage={canManage} />
          ))}
          {shown.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-line rounded-3xl bg-surface/50">
              <SlidersHorizontal className="w-12 h-12 text-ink-faint mb-3" />
              <h3 className="text-lg font-bold text-ink">No integrations found</h3>
              <p className="text-ink-muted font-medium">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
