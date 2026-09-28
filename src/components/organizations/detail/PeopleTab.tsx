import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { deleteContact, fetchContactsForCustomer, type Account, type Contact } from '../../../features/customers/customersSlice';
import { byAccount, chosenAccount, scopeLabel } from '../../../features/organizations/accountScope';
import { peopleSummary } from '../../../features/organizations/listSummaries';
import { ContactFormModal } from '../../contacts/ContactFormModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { ErrorBlock } from '../portfolio/PortfolioSections';
import { BUTTON } from '../portfolio/styles';
import { ListSearch, ListSkeleton, NoMatch, ScopedEmpty, SummaryLine } from './ListParts';
import { LIST } from './listStyles';
import { PersonItem } from './PersonItem';

/** People (spec 2026-09-27 §2): a list item per person the organization's
 *  roll-up holds, narrowed by the account chip, with a one-line summary and
 *  search. Add, Edit and Delete are the existing flows; with an account
 *  chosen, Add saves on it. Read when the tab first opens. */
export function PeopleTab({
  customerId,
  account,
  accounts,
  isSm,
  onShowAll,
}: {
  customerId: number;
  /** The chip: '' All, 'none' the organization itself, or an account id. */
  account: string;
  accounts: Account[];
  isSm: boolean;
  /** Clears the chip (the empty state's Show all accounts). */
  onShowAll: () => void;
}) {
  const dispatch = useAppDispatch();
  const { contacts, contactsLoading, contactsError } = useAppSelector((state) => state.customers);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  // Read before paint: the read marks the shared slot loading at once, so
  // neither this list nor the chips show people another page left there.
  useLayoutEffect(() => {
    void dispatch(fetchContactsForCustomer(customerId)).then(() => setLoaded(true));
  }, [dispatch, customerId, attempt]);

  const inScope = useMemo(() => byAccount(contacts, account), [contacts, account]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return inScope;
    return inScope.filter((person) => `${person.name} ${person.role_display} ${person.email}`.toLowerCase().includes(needle));
  }, [inScope, q]);
  const target = chosenAccount(accounts, account);
  const failed = contactsError !== null && !contactsLoading;

  let body: ReactNode;
  if (failed) body = <ErrorBlock message={contactsError} onRetry={() => setAttempt((n) => n + 1)} />;
  else if (!loaded) body = <ListSkeleton label="Loading people" />;
  else if (inScope.length === 0) {
    body = (
      <ScopedEmpty
        what="people"
        scope={scopeLabel(accounts, account)}
        detail="Add the people you work with here, or they arrive from calls and email."
        onShowAll={onShowAll}
      />
    );
  } else if (shown.length === 0) body = <NoMatch q={q} onClear={() => setQ('')} />;
  else {
    body = (
      <ul aria-label="People" className={LIST}>
        {shown.map((person) => (
          <PersonItem key={person.id} contact={person} isSm={isSm} onEdit={() => setEditing(person)} onDelete={() => setDeleting(person)} />
        ))}
      </ul>
    );
  }

  return (
    <div aria-busy={contactsLoading} className="flex flex-col gap-3">
      <div className={isSm ? 'flex items-center gap-2' : 'flex flex-col gap-2'}>
        <ListSearch label="Search people" value={q} onChange={setQ} isSm={isSm} />
        <button type="button" onClick={() => setAdding(true)} className={`${BUTTON} ${isSm ? 'ml-auto' : 'justify-center'}`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {target ? `Add contact to ${target.name}` : 'Add contact'}
        </button>
      </div>
      {loaded && !failed && inScope.length > 0 ? <SummaryLine parts={peopleSummary(inScope)} /> : null}
      {body}

      {adding ? (
        <ContactFormModal
          customerId={customerId}
          accountId={target?.id}
          onClose={() => setAdding(false)}
          onSaved={() => void dispatch(fetchContactsForCustomer(customerId))}
        />
      ) : null}
      {editing ? <ContactFormModal contact={editing} onClose={() => setEditing(null)} onSaved={() => {}} /> : null}
      {deleting ? (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteContact(deleting.id)).unwrap();
          }}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}
