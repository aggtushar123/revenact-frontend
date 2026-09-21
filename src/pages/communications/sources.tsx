// What the sources rail shows, from what is connected. Kept apart from the
// rail component so fast refresh works.

import { Inbox, Phone, Plug } from 'lucide-react';
import { FreshdeskIcon, GmailIcon, JiraIcon, OutlookIcon, SlackIcon, ZendeskIcon } from '../onboarding/sources';
import type { Connector } from '../../features/connectors/connectorsSlice';
import type { MailboxConnection } from '../../features/mail/mailSlice';
import type { CommunicationKind } from '../../features/communications/communicationsSlice';

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
    if (connector.status !== 'connected') continue;
    sources.push({
      id: `connector:${connector.id}`,
      label: connector.name || connector.provider_display,
      kind: connector.provider === 'zoom' || connector.provider === 'ms_teams' ? 'call' : 'ticket',
      icon: connectorIcon(connector.provider),
    });
  }
  sources.push({ id: 'calls', label: 'Calls', kind: 'call', icon: <Phone className="w-[18px] h-[18px]" aria-hidden="true" /> });
  return sources;
}
