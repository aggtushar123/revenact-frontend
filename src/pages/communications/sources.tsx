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

/** What the rail shows, from what is connected. */
export function sourcesFrom(mailbox: MailboxConnection | null, connectors: Connector[]): Source[] {
  const sources: Source[] = [{ id: 'all', label: 'Everything', kind: null, icon: <Inbox className="w-[18px] h-[18px]" aria-hidden="true" /> }];
  if (mailbox) {
    sources.push({
      id: `mailbox:${mailbox.provider}`,
      label: mailbox.provider === 'google' ? 'Gmail' : mailbox.provider === 'microsoft' ? 'Outlook' : 'Mailbox',
      kind: 'email',
      icon: mailbox.provider === 'google' ? <GmailIcon className="w-5 h-5" /> : mailbox.provider === 'microsoft' ? <OutlookIcon className="w-5 h-5" /> : <Inbox className="w-[18px] h-[18px]" aria-hidden="true" />,
    });
  }
  for (const connector of Array.isArray(connectors) ? connectors : []) {
    if (!isConnected(connector)) continue;
    sources.push({
      id: `connector:${connector.id}`,
      label: connector.name || connector.provider_display,
      // What picking it narrows the inbox to; a CRM narrows nothing but still
      // gives the Copilot its context.
      kind: CALL_PROVIDERS.has(connector.provider) ? 'call' : TICKET_PROVIDERS.has(connector.provider) ? 'ticket' : null,
      icon: connectorIcon(connector.provider),
    });
  }
  sources.push({ id: 'calls', label: 'Calls', kind: 'call', icon: <Phone className="w-[18px] h-[18px]" aria-hidden="true" /> });
  return sources;
}
