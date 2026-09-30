import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { accountBase } from '../../../lib/accountPaths';
import { apiFetch } from '../../../lib/apiClient';
import { clearCallSaveError, logCall, type LogCallInput } from '../../../features/calls/callsSlice';
import { createNote, createTask, type Contact } from '../../../features/customers/customersSlice';
import type { FileParent } from '../../../features/files/filesSlice';
import { ADD_FLOWS, type AddKind } from '../../../features/organizations/storyKinds';
import { CallForm } from '../activity/CallSenseTab';
import { NoteForm } from '../activity/NotesTab';
import { LogSurveyForm } from '../activity/SurveysTab';
import { TaskForm } from '../activity/TasksTab';
import { Sheet } from './Sheet';

/** "+ Add" (spec §1.6): one of the existing create flows in a sheet, saved on
 *  the organization, on the chosen account when an account chip is on, or,
 *  on an account's own page (no `customerId`), on that account through its
 *  flat routes. */
export function AddFlow({
  what,
  customerId,
  accountId,
  accountName,
  isSm,
  onAdded,
  onClose,
}: {
  what: AddKind;
  /** The organization; absent on the account page, where `accountId` is the account itself. */
  customerId?: number;
  accountId?: number;
  accountName?: string;
  isSm: boolean;
  onAdded: () => void;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const { saving, saveError } = useAppSelector((state) => state.calls);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const parent: FileParent = accountId
    ? { entityType: 'account', customerId: customerId ?? null, accountId }
    : { entityType: 'organization', customerId: customerId ?? null };

  // The calls slice is global: an earlier sheet's (or CallSense's) failure
  // must not greet this one.
  useEffect(() => {
    if (what === 'call') dispatch(clearCallSaveError());
  }, [dispatch, what]);

  // A call offers the company's contacts as participants, as CallSense does.
  useEffect(() => {
    if (what !== 'call') return;
    let cancelled = false;
    const path = accountId ? `${accountBase(accountId, customerId)}/contacts/` : `/customers/${customerId}/contacts/`;
    apiFetch<Contact[]>(path).then(
      (rows) => {
        if (!cancelled) setContacts(Array.isArray(rows) ? rows : []);
      },
      () => {
        if (!cancelled) setContacts([]);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [what, customerId, accountId]);

  const title = ADD_FLOWS.find((flow) => flow.key === what)?.label ?? 'Add';
  return (
    <Sheet title={title} description={`On ${accountName ?? 'the organization'}`} isSm={isSm} onClose={onClose}>
      {what === 'task' ? (
        <TaskForm
          onCreate={async (task) =>
            createTask.fulfilled.match(
              await dispatch(
                accountId != null ? createTask({ customerId, accountId, ...task }) : createTask({ customerId: customerId as number, ...task }),
              ),
            )
          }
          onDone={onAdded}
        />
      ) : null}
      {what === 'note' ? (
        <NoteForm
          onCreate={async (note) =>
            createNote.fulfilled.match(
              await dispatch(
                accountId != null ? createNote({ customerId, accountId, ...note }) : createNote({ customerId: customerId as number, ...note }),
              ),
            )
          }
          onDone={onAdded}
        />
      ) : null}
      {what === 'call' ? (
        <CallForm
          contacts={contacts}
          saving={saving}
          error={saveError}
          onLog={async (input: LogCallInput) => logCall.fulfilled.match(await dispatch(logCall({ ...parent, input })))}
          onDone={onAdded}
        />
      ) : null}
      {what === 'survey' ? (
        <LogSurveyForm customerId={customerId} accountId={accountId} allowCes={!accountId} onLogged={onAdded} onCancel={onClose} />
      ) : null}
    </Sheet>
  );
}
