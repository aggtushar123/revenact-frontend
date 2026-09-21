// What the sources rail shows, from what is connected. Kept apart from the
// rail component so fast refresh works.

import { Cloud, Code2, Hexagon, Inbox, MessageCircle, PenTool, Phone, Plug, Video } from 'lucide-react';
import { FreshdeskIcon, GmailIcon, JiraIcon, OutlookIcon, SlackIcon, ZendeskIcon } from '../onboarding/sources';
import type { Connector } from '../../features/connectors/connectorsSlice';
import type { MailboxConnection } from '../../features/mail/mailSlice';
import type { CommunicationKind } from '../../features/communications/communicationsSlice';

/** Providers that pull tickets: connected only once they hold credentials.
 *  Every other provider counts as connected when it is set up and enabled.
 *  The same rule the Integrations page uses for its "Connected" badge, so
 *  the sidebar never shows something Integrations calls not connected. */
const TICKET_PROVIDERS = new Set(['zendesk', 'freshdesk', 'webhook', 'jira', 'slack']);
const CALL_PROVIDERS = new Set(['zoom', 'ms_teams']);

export function isConnected(connector: Connector): boolean {
  if (connector.status === 'error') return false;
  if (!connector.is_enabled) return false;
  return TICKET_PROVIDERS.has(connector.provider) ? connector.has_credentials : true;
}

export interface Source {
  id: string;
  label: string;
  /** Which kind of row this source produces; the list filters on it. */
  kind: CommunicationKind | null;
  icon: React.ReactNode;
  /** False for a channel the platform offers but this organisation has not
   *  connected yet: shown dimmed, and it leads to Integrations. */
  connected: boolean;
}

function connectorIcon(provider: string) {
  switch (provider) {
    case 'slack':
      return <SlackIcon className="w-5 h-5" />;
    case 'zendesk':
      return <ZendeskIcon className="w-5 h-5" />;
    case 'jira':
      return <JiraIcon className="w-5 h-5" />;
    case 'freshdesk':
      return <FreshdeskIcon className="w-5 h-5" />;
    case 'gmail':
      return <GmailIcon className="w-5 h-5" />;
    case 'intercom':
      return <MessageCircle className="w-[18px] h-[18px]" aria-hidden="true" />;
    case 'salesforce':
      return <Cloud className="w-[18px] h-[18px]" aria-hidden="true" />;
    case 'hubspot':
      return <Hexagon className="w-[18px] h-[18px]" aria-hidden="true" />;
    case 'zoom':
    case 'ms_teams':
      return <Video className="w-[18px] h-[18px]" aria-hidden="true" />;
    case 'github':
      return <Code2 className="w-[18px] h-[18px]" aria-hidden="true" />;
    case 'figma':
      return <PenTool className="w-[18px] h-[18px]" aria-hidden="true" />;
    default:
      return <Plug className="w-[18px] h-[18px]" aria-hidden="true" />;
  }
}

/** The channels the platform offers, in the order the group shows them. */
const CATALOGUE: { provider: string; label: string }[] = [
  { provider: 'slack', label: 'Slack' },
  { provider: 'zendesk', label: 'Zendesk' },
  { provider: 'jira', label: 'Jira' },
  { provider: 'freshdesk', label: 'Freshdesk' },
  { provider: 'intercom', label: 'Intercom' },
  { provider: 'zoom', label: 'Zoom' },
  { provider: 'ms_teams', label: 'Teams' },
  { provider: 'salesforce', label: 'Salesforce' },
  { provider: 'hubspot', label: 'HubSpot' },
];

/**
 * What the group shows: everything, the mail providers, every channel in the
 * catalogue, calls. Connected ones carry the id the inbox filters on; the
 * rest are there so the group reads as the platform's channels, dimmed, and
 * lead to Integrations.
 */
export function sourcesFrom(mailbox: MailboxConnection | null, connectors: Connector[]): Source[] {
  const list = Array.isArray(connectors) ? connectors : [];
  const sources: Source[] = [
    { id: 'all', label: 'Everything', kind: null, icon: <Inbox className="w-[18px] h-[18px]" aria-hidden="true" />, connected: true },
  ];

  const google = mailbox?.provider === 'google';
  const microsoft = mailbox?.provider === 'microsoft';
  sources.push({ id: google ? 'mailbox:google' : 'provider:gmail', label: 'Gmail', kind: 'email', icon: <GmailIcon className="w-5 h-5" />, connected: google });
  sources.push({ id: microsoft ? 'mailbox:microsoft' : 'provider:outlook', label: 'Outlook', kind: 'email', icon: <OutlookIcon className="w-5 h-5" />, connected: microsoft });
  if (mailbox && !google && !microsoft) {
    sources.push({ id: `mailbox:${mailbox.provider}`, label: 'Mailbox', kind: 'email', icon: <Inbox className="w-[18px] h-[18px]" aria-hidden="true" />, connected: true });
  }

  for (const entry of CATALOGUE) {
    const connected = list.find((c) => c.provider === entry.provider && isConnected(c));
    sources.push({
      id: connected ? `connector:${connected.id}` : `provider:${entry.provider}`,
      label: connected?.name || entry.label,
      // What picking it narrows the inbox to; a CRM narrows nothing but still
      // gives the Copilot its context.
      kind: CALL_PROVIDERS.has(entry.provider) ? 'call' : TICKET_PROVIDERS.has(entry.provider) ? 'ticket' : null,
      icon: connectorIcon(entry.provider),
      connected: Boolean(connected),
    });
  }

  sources.push({ id: 'calls', label: 'Calls', kind: 'call', icon: <Phone className="w-[18px] h-[18px]" aria-hidden="true" />, connected: true });
  return sources;
}
