// Who a mail row is with: the sender, or for sent mail the people it went to
// (names only; the caller adds "To" where it reads as a heading).

import type { MailMessage } from '../../features/mail/mailboxSlice';

export function who(row: MailMessage): string {
  if (row.direction === 'sent') {
    const names = row.to.map(([name, address]) => name || address).filter(Boolean);
    return names.length ? names.join(', ') : 'nobody';
  }
  return row.from_name || row.from_address;
}
