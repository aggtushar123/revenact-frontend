import { Link, type To } from 'react-router-dom';
import {
  SENTIMENT_DOT,
  SENTIMENT_LABEL,
  SENTIMENT_TEXT,
  callsLabel,
  placeLabel,
  placeOf,
} from '../../features/contacts/contactsFormat';
import type { Contact } from '../../features/customers/customersSlice';
import { formatRelativeTime, initials } from '../../features/customers/formatters';
import { META, ROW_ICON } from '../organizations/detail/listStyles';
import { FOCUS } from '../organizations/portfolio/styles';

/** One person in the Contacts list (spec 2026-09-28 §3), never a table row:
 *  initials, name and role, "Organisation › Account", sentiment in words
 *  and its colour with "n calls" beside it, when they were last
 *  contacted, and whether they are active. The whole item opens their profile. */
export function ContactListItem({ contact, to, selected }: { contact: Contact; to: To; selected: boolean }) {
  const place = placeLabel(placeOf(contact));
  const contacted = contact.last_contacted_at ? `Contacted ${formatRelativeTime(contact.last_contacted_at)}` : 'Not contacted yet';
  return (
    <li data-contact={contact.id}>
      <Link
        to={to}
        aria-current={selected ? 'page' : undefined}
        className={`flex min-h-11 gap-3 px-3 py-2.5 hover:bg-subtle active:bg-line-subtle ${selected ? 'bg-subtle' : ''} ${FOCUS}`}
      >
        <span aria-hidden="true" className={`${ROW_ICON} font-mono-brand text-[11px] font-semibold text-ink`}>
          {initials(contact.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="min-w-0 truncate text-[13px] font-semibold text-ink">{contact.name}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink-muted">{contact.role_display}</span>
          </span>
          {place ? <span className="block truncate text-[11px] text-ink-muted">{place}</span> : null}
          <span className={META}>
            <span data-sentiment={contact.sentiment} className={`inline-flex items-center gap-1 font-semibold ${SENTIMENT_TEXT[contact.sentiment]}`}>
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${SENTIMENT_DOT[contact.sentiment]}`} />
              {SENTIMENT_LABEL[contact.sentiment]}
            </span>
            <span className="font-mono-brand tabular-nums">{callsLabel(contact)}</span>
            <span>{contacted}</span>
            <span>{contact.status === 'inactive' ? 'Inactive' : 'Active'}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}
