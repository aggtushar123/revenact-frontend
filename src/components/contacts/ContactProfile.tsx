import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { SENTIMENT_DOT, placeOf, sentimentWhy } from '../../features/contacts/contactsFormat';
import { deleteContact, fetchContactById, fetchContactHistory } from '../../features/customers/customersSlice';
import { formatRelativeTime, initials } from '../../features/customers/formatters';
import { mailtoHref, telHref } from '../../lib/contactLinks';
import { ErrorState } from '../../pages/dashboard/shared/DataState';
import { ConfirmDialog } from '../organizations/ConfirmDialog';
import { ListSkeleton } from '../organizations/detail/ListParts';
import { ITEM_LINK, META, SECTION_HEADING } from '../organizations/detail/listStyles';
import { BUTTON, QUIET } from '../organizations/portfolio/styles';
import { ContactFormModal } from './ContactFormModal';
import { HistoryCallItem, HistoryEmailItem, HistoryTicketItem } from './HistoryItems';

function Section({ title, count, shown, empty, children }: { title: string; count: number; shown: number; empty: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-1">
      <h3 id={id} className={`${SECTION_HEADING} flex items-baseline gap-2`}>
        {title}
        <span className="font-mono-brand tabular-nums">{count}</span>
      </h3>
      {shown === 0 ? (
        <p className="py-2 text-[13px] text-ink-muted">{empty}</p>
      ) : (
        <>
          <ul className="divide-y divide-line-subtle">{children}</ul>
          {count > shown ? <p className="text-[11px] text-ink-muted">The newest {shown} of {count}.</p> : null}
        </>
      )}
    </section>
  );
}

/** The selected person (spec 2026-09-28 §3): who they are and how to reach
 *  them, where they sit (each linking to the organisation page, the account
 *  with its chip chosen), their sentiment and why, then their calls newest
 *  first, emails and tickets. Edit and Delete are the existing flows.
 *  "Why this sentiment?" arrives with Ask on Contacts (delivery 2, §4). */
export function ContactProfile({ id, onDeleted, onSaved = () => {} }: { id: number; onDeleted: () => void; onSaved?: () => void }) {
  const dispatch = useAppDispatch();
  const { selectedContact, selectedContactHistory } = useAppSelector((state) => state.customers);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const [deleting, setDeleting] = useState(false);
  // Tied to `id` by the closure below, not read off the shared slice: two
  // requests for different people race through the same
  // selectedContactError/selectedContactHistoryError fields, so a
  // component still showing person A could otherwise paint B's error for a
  // tick, or A's late failure after B is already on screen (fix round 1,
  // 2026-09-28). `cancelled` drops a reply that arrives after `id` (or
  // `attempt`) has moved on, exactly as useOrganization does for the
  // organisation page. The failure carries the `id` and `attempt` it
  // belongs to, so moving on hides it without a reset inside the effect.
  const [failure, setFailure] = useState<{ id: number; attempt: number; message: string } | null>(null);
  const error = failure?.id === id && failure.attempt === attempt ? failure.message : null;

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([dispatch(fetchContactById(id)).unwrap(), dispatch(fetchContactHistory(id)).unwrap()]).then(
      ([byId, history]) => {
        if (cancelled) return;
        const failed = byId.status === 'rejected' ? byId.reason : history.status === 'rejected' ? history.reason : null;
        if (failed !== null) setFailure({ id, attempt, message: typeof failed === 'string' ? failed : 'Something went wrong.' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [dispatch, id, attempt]);

  const contact = selectedContact?.id === id ? selectedContact : null;
  const history = selectedContactHistory?.contact_id === id ? selectedContactHistory : null;

  if (error) {
    return (
      <div className="rounded-xl bg-surface">
        <ErrorState message="Could not open this person" detail={error} />
        <div className="flex justify-center pb-6">
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`${QUIET} border border-line`}>
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (!contact || !history) return <ListSkeleton label="Loading this person" rows={4} />;

  const { organisation, account } = placeOf(contact);
  const email = contact.email ? mailtoHref(contact.email) : null;
  const phone = contact.phone ? telHref(contact.phone) : null;

  return (
    <article aria-label={contact.name} className="flex flex-col gap-5 rounded-xl bg-surface p-4">
      <header className="flex flex-wrap items-start gap-3">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-subtle font-mono-brand text-[13px] font-semibold text-ink">
          {initials(contact.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[22px] font-semibold text-ink">{contact.name}</h2>
          <p className="text-[13px] text-ink-muted">
            {contact.role_display}
            <span aria-hidden="true"> · </span>
            <span>{contact.status === 'inactive' ? 'Inactive' : 'Active'}</span>
          </p>
          {organisation ? (
            <p className="flex min-w-0 flex-wrap items-center gap-x-1 text-[13px]">
              <Link to={`/organizations/${organisation.id}`} className={ITEM_LINK}>
                {organisation.name}
              </Link>
              {account ? (
                <>
                  <span aria-hidden="true" className="text-ink-muted">
                    ›
                  </span>
                  <Link to={`/organizations/${organisation.id}?account=${account.id}`} className={ITEM_LINK}>
                    {account.name}
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <p className="flex min-w-0 flex-col text-[13px] sm:flex-row sm:flex-wrap sm:gap-x-3">
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
            ) : contact.phone ? (
              <span className="font-mono-brand tabular-nums">{contact.phone}</span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <button ref={editButton} type="button" onClick={() => setEditing(true)} className={BUTTON}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>
          <button type="button" onClick={() => setDeleting(true)} className={`${BUTTON} text-danger`}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      </header>

      <section aria-label="Sentiment" className="flex items-start gap-2 text-[13px] text-ink">
        <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SENTIMENT_DOT[history.sentiment]}`} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p>
            {sentimentWhy(
              history.sentiment,
              history.sentiment_source,
              history.sentiment_evidence,
              history.calls.filter((call) => call.analysis === 'analysed').length,
            )}
          </p>
          <p className={META}>
            <span>{contact.last_contacted_at ? `Last contacted ${formatRelativeTime(contact.last_contacted_at)}` : 'Not contacted yet'}</span>
            {history.sentiment_source === 'computed' && contact.sentiment_computed_at ? (
              <span>{`Sentiment read ${formatRelativeTime(contact.sentiment_computed_at)}`}</span>
            ) : null}
          </p>
        </div>
      </section>

      <Section title="Calls" count={history.counts.calls} shown={history.calls.length} empty="No calls with them yet.">
        {history.calls.map((call) => (
          <HistoryCallItem key={call.id} call={call} />
        ))}
      </Section>
      <Section title="Emails" count={history.counts.emails} shown={history.emails.length} empty="No emails from them you can see.">
        {history.emails.map((row) => (
          <HistoryEmailItem key={row.id} email={row} />
        ))}
      </Section>
      <Section title="Tickets" count={history.counts.tickets} shown={history.tickets.length} empty="No tickets from them you can see.">
        {history.tickets.map((row) => (
          <HistoryTicketItem key={row.id} ticket={row} />
        ))}
      </Section>

      {editing ? (
        <ContactFormModal
          contact={contact}
          onClose={() => {
            setEditing(false);
            // Back where the edit began, not lost to the page body.
            editButton.current?.focus();
          }}
          // updateContact's reducer patches every list the person is in; the
          // sentiment line and history are the server's reading, so they are
          // read again (a changed sentiment is now a hand-set one), and the
          // page refreshes its summary.
          onSaved={() => {
            setAttempt((n) => n + 1);
            onSaved();
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title={`Delete ${contact.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteContact(contact.id)).unwrap();
            onDeleted();
          }}
          onClose={() => setDeleting(false)}
        />
      ) : null}
    </article>
  );
}
