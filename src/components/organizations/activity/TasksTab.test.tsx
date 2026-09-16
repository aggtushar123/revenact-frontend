import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TasksTab } from './TasksTab';
import { resetMembersCache } from '../../../features/knowledge/useMembers';

describe('TasksTab', () => {
  beforeEach(() => {
    resetMembersCache();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => [{ id: 5, name: 'Priya Nair', function: 'engineering' }] })));
  });

  it('lets the viewer create a task for a teammate and says who will see it', async () => {
    const onCreate = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    render(<TasksTab tasks={[]} isLoading={false} error={null} onCreate={onCreate} />);

    expect(screen.getByText(/seen by its creator, its assignee and their management chains/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New task' }));
    await user.type(screen.getByLabelText('Task title'), 'Ship the SSO fix');
    await user.type(screen.getByLabelText('Due date'), '2026-09-30');
    await user.selectOptions(screen.getByLabelText('Priority'), 'high');
    await user.selectOptions(await screen.findByLabelText('Assignee'), '5');
    await user.click(screen.getByRole('button', { name: 'Save task' }));

    expect(onCreate).toHaveBeenCalledWith({ title: 'Ship the SSO fix', due_date: '2026-09-30', priority: 'high', assignee_id: 5 });
    await waitFor(() => expect(screen.queryByLabelText('Task title')).not.toBeInTheDocument());
  });

  it('has no form for a record that cannot take a task', () => {
    render(<TasksTab tasks={[]} isLoading={false} error={null} />);
    expect(screen.queryByRole('button', { name: 'New task' })).not.toBeInTheDocument();
  });
});
