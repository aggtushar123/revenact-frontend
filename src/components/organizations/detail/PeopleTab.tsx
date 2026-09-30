import { useCallback, useId, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import {
  deleteContact,
  fetchContactsForAccount,
  fetchContactsForCustomer,
  type Account,
  type Contact,
} from '../../../features/customers/customersSlice';
import { awaitingAccount, byAccount, chosenAccount, scopeLabel } from '../../../features/organizations/accountScope';
import { resolveScope, scopeSlot, type ScopeProps } from '../../../features/organizations/detailScope';
import { peopleSummary } from '../../../features/organizations/listSummaries';
import { ContactFormModal } from '../../contacts/ContactFormModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { ErrorBlock } from '../portfolio/PortfolioSections';
import { BUTTON } from '../portfolio/styles';
import { AccountNames } from './accountNames';
import { AddPaused, ListSearch, ListSkeleton, NoMatch, ScopedEmpty, SummaryLine } from './ListParts';
import { LIST } from './listStyles';
import { PersonItem } from './PersonItem';

type PeopleTabProps = ScopeProps & {
  /** The chip: '' All, 'none' the organization itself, or an account id. Always '' on an account's page. */
  account: string;
  accounts: Account[];
  isSm: boolean;
  /** Clears the chip (the empty state's Show all accounts). */
  onShowAll: () => void;
};

/** People (spec 2026-09-27 §2; account spec §2.7): a list item per person —
 *  the organization's roll-up narrowed by the account chip, or one account's
 *  own — with a one-line summary and search. Add, Edit and Delete are the
 *  existing flows; Add saves on the chosen account, or on the page's account.
 *  Read when the tab first opens. */
export function PeopleTab(props: PeopleTabProps) {
  const { account, accounts, isSm, onShowAll } = props;
  const scope = resolveScope(props);
  const kind = scope.kind;
  const scopeId = scope.id;
  const dispatch = useAppDispatch();
  const { contacts, contactsLoading, contactsError, contactsFor } = useAppSelector((state) => state.customers);
  // The shared slot holds this page's people (not another's, left behind or on its way).
  const loaded = contactsFor === scopeSlot({ kind, id: scopeId });
  const [attempt, setAttempt] = useState(0);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const readPeople = useCallback(() => {
    if (kind === 'account') void dispatch(fetchContactsForAccount({ accountId: scopeId }));
    else void dispatch(fetchContactsForCustomer(scopeId));
  }, [dispatch, kind, scopeId]);

  // Read before paint: the read marks the shared slot loading at once, so
  // neither this list nor the chips show people another page left there.
  useLayoutEffect(() => {
    readPeople();
  }, [readPeople, attempt]);

  const inScope = useMemo(() => byAccount(contacts, account), [contacts, account]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return inScope;
    return inScope.filter((person) => `${person.name} ${person.role_display} ${person.email}`.toLowerCase().includes(needle));
  }, [inScope, q]);
  const target = chosenAccount(accounts, account);
  const paused = awaitingAccount(accounts, account);
  const pausedId = useId();
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
    <AccountNames.Provider value={accounts}>
      <div aria-busy={contactsLoading} className="flex flex-col gap-3">
        <div className={isSm ? 'flex items-center gap-2' : 'flex flex-col gap-2'}>
          <ListSearch label="Search people" value={q} onChange={setQ} isSm={isSm} />
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={paused}
            aria-describedby={paused ? pausedId : undefined}
            className={`${BUTTON} ${isSm ? 'ml-auto' : 'justify-center'}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {target ? `Add contact to ${target.name}` : 'Add contact'}
          </button>
        </div>
        {paused ? <AddPaused id={pausedId} /> : null}
        {loaded && !failed && inScope.length > 0 ? <SummaryLine parts={peopleSummary(inScope)} /> : null}
        {body}

        {adding ? (
          <ContactFormModal
            customerId={kind === 'organization' ? scopeId : undefined}
            accountId={kind === 'account' ? scopeId : target?.id}
            onClose={() => setAdding(false)}
            onSaved={readPeople}
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
    </AccountNames.Provider>
  );
}
