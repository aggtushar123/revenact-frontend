import { Ellipsis, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Contact } from '../../../features/customers/customersSlice';
import { capitalize, formatRelativeTime, initials } from '../../../features/customers/formatters';
import { mailtoHref, telHref } from '../../../lib/contactLinks';
import { AccountTag } from './ListParts';
import { ITEM_LINK, META, ROW_ACTION, ROW_ICON, TITLE_BUTTON } from './listStyles';
import { Menu } from './Menu';

const SENTIMENT_TONE: Record<Contact['sentiment'], string> = {
  positive: 'bg-success-dim text-success',
  neutral: 'bg-subtle text-ink-muted',
  negative: 'bg-danger-dim text-danger',
};

/** How to reach a person: an address that could carry its own mailto query
 *  is shown as text, never linked. */
function Links({ contact }: { contact: Contact }) {
  const email = contact.email ? mailtoHref(contact.email) : null;
  const phone = contact.phone ? telHref(contact.phone) : null;
  return (
    <>
      {contact.email && email ? (
        <a href={email} className={ITEM_LINK}>
          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{contact.email}</span>
        </a>
      ) : contact.email ? (
        <span className="truncate">{contact.email}</span>
      ) : null}
      {contact.phone && phone ? (
        <a href={phone} className={ITEM_LINK}>
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="font-mono-brand tabular-nums">{contact.phone}</span>
        </a>
      ) : null}
    </>
  );
}

/** One person (spec 2026-09-27 §2): initials, name and role, how to reach
 *  them, the account tag, status, sentiment and when they were last
 *  contacted; ⋯ edits or deletes through the existing flows. Phones put the
 *  links on their own line, as 44px targets. The name opens their profile
 *  on the Contacts page (spec 2026-09-28 §5). */
export function PersonItem({
  contact,
  isSm,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  isSm: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const contacted = contact.last_contacted_at ? `Contacted ${formatRelativeTime(contact.last_contacted_at)}` : 'Not contacted yet';
  const active = contact.status === 'active';
  return (
    <li data-person={contact.id} className="flex gap-3 px-3 py-2.5">
      <span aria-hidden="true" className={`${ROW_ICON} font-mono-brand text-[11px] font-semibold text-ink`}>
        {initials(contact.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3 className="min-w-0 truncate text-[13px] font-semibold text-ink">
            <Link to={`/contacts/${contact.id}`} className={TITLE_BUTTON}>
              {contact.name}
            </Link>
          </h3>
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-muted">{contact.role_display}</span>
          {isSm ? <span className="shrink-0 text-[11px] text-ink-muted">{contacted}</span> : null}
        </div>
        <p className={META}>
          <AccountTag record={contact} />
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-success' : 'bg-line-strong'}`} />
            {capitalize(contact.status)}
          </span>
          <span className={`rounded-full px-2 py-0.5 ${SENTIMENT_TONE[contact.sentiment]}`}>{capitalize(contact.sentiment)} sentiment</span>
          {isSm ? <Links contact={contact} /> : <span>{contacted}</span>}
        </p>
        {isSm ? null : (
          <div data-links="" className="flex min-w-0 flex-col text-[13px]">
            <Links contact={contact} />
          </div>
        )}
      </div>
      <Menu
        label={`Actions for ${contact.name}`}
        trigger={<Ellipsis className="h-4 w-4" aria-hidden="true" />}
        triggerClassName={ROW_ACTION}
        items={[
          { key: 'edit', label: 'Edit', onSelect: onEdit },
          { key: 'delete', label: 'Delete', onSelect: onDelete, danger: true },
        ]}
      />
    </li>
  );
}
