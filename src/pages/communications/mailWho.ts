// Who a mail row is with: the sender, or for sent mail the people it went to.

import type { MailMessage } from '../../features/mail/mailboxSlice';

export function who(row: MailMessage): string {
  if (row.direction === 'sent') {
    const names = row.to.map(([name, address]) => name || address).filter(Boolean);
    return names.length ? `To ${names.join(', ')}` : 'To nobody';
  }
  return row.from_name || row.from_address;
}
