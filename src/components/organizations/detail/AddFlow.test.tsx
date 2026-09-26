import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { AddKind } from '../../../features/organizations/storyKinds';
import { postBodies, stubOrganizationPage } from '../../../features/organizations/testStory';
import { makeDetailStore } from '../../../pages/organizations/testDetail';
import { AddFlow } from './AddFlow';

function renderAdd(what: AddKind, accountId?: number) {
  const onAdded = vi.fn();
  const onClose = vi.fn();
  render(
    <Provider store={makeDetailStore()}>
      <MemoryRouter>
        <AddFlow
          what={what}
          customerId={7}
          accountId={accountId}
          accountName={accountId ? 'EMEA' : undefined}
          isSm
          onAdded={onAdded}
          onClose={onClose}
        />
      </MemoryRouter>
    </Provider>,
  );
  return { onAdded, onClose };
}

describe('AddFlow (spec §1.6 "+ Add")', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.style.overflow = '';
  });

  it('creates a task on the organization with the existing form', async () => {
    const spy = stubOrganizationPage();
    const { onAdded } = renderAdd('task');
    const dialog = screen.getByRole('dialog', { name: 'New task' });
    expect(dialog).toHaveAccessibleDescription('On the organization');
    const title = within(dialog).getByRole('textbox', { name: 'Task title' });
    expect(title).toHaveFocus();
    await userEvent.type(title, 'Book the retraining');
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2026-10-01' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save task' }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    expect(postBodies(spy, '/customers/7/tasks/')).toEqual([
      { title: 'Book the retraining', due_date: '2026-10-01', priority: 'medium', assignee_id: null },
    ]);
  });

  it('creates a note on the chosen account', async () => {
    const spy = stubOrganizationPage();
    const { onAdded } = renderAdd('note', 31);
    const dialog = screen.getByRole('dialog', { name: 'New note' });
    expect(dialog).toHaveAccessibleDescription('On EMEA');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Note title' }), 'Kickoff');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Note body' }), 'Met the new admin.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    expect(postBodies(spy, '/customers/7/accounts/31/notes/')).toEqual([{ title: 'Kickoff', body: 'Met the new admin.' }]);
  });

  it('logs a call with the CallSense form', async () => {
    const spy = stubOrganizationPage();
    const { onAdded } = renderAdd('call');
    const dialog = screen.getByRole('dialog', { name: 'Log a call' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Call title' }), 'Renewal check-in');
    fireEvent.change(within(dialog).getByLabelText('When'), { target: { value: '2026-09-25T10:00' } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log call' }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    expect(postBodies(spy, '/customers/7/calls/')[0]).toMatchObject({ title: 'Renewal check-in' });
  });

  it('logs a survey, and its own Cancel closes the sheet', async () => {
    const spy = stubOrganizationPage();
    const { onAdded, onClose } = renderAdd('survey');
    const dialog = screen.getByRole('dialog', { name: 'Log survey' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Log' }));
    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    expect(postBodies(spy, '/customers/7/surveys/')[0]).toMatchObject({ survey_type: 'nps' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes from Close without saving', async () => {
    const spy = stubOrganizationPage();
    const { onAdded, onClose } = renderAdd('task');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onAdded).not.toHaveBeenCalled();
    expect(postBodies(spy, '/customers/7/tasks/')).toEqual([]);
  });
});
