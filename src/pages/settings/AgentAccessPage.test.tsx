import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentAccessPage } from './AgentAccessPage';

// Integration tier: the real page against the fetch boundary.

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

const existing = { id: 1, label: 'Claude Desktop', hint: '…7fQx', last_used_at: '2026-09-22T09:00:00Z', created_at: '2026-09-01T09:00:00Z' };

describe('AgentAccessPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('lists the keys with what they are and when they were last used', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [existing]));
    render(<AgentAccessPage />);
    const row = await screen.findByRole('listitem');
    expect(within(row).getByText('Claude Desktop')).toBeInTheDocument();
    expect(within(row).getByText(/…7fQx/)).toBeInTheDocument();
    expect(within(row).getByText(/Last used/)).toBeInTheDocument();
  });

  it('issues one and shows the secret exactly once', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, []))
      .mockResolvedValueOnce(jsonResponse(201, { ...existing, id: 2, label: 'My agent', token: 'rvn_mcp_secret-value' }))
      .mockResolvedValueOnce(jsonResponse(200, [{ ...existing, id: 2, label: 'My agent' }]));
    render(<AgentAccessPage />);
    expect(await screen.findByText(/No agent has access/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('What is it for'), 'My agent');
    await userEvent.click(screen.getByRole('button', { name: 'Create a key' }));
    expect(await screen.findByText('rvn_mcp_secret-value')).toBeInTheDocument();
    expect(screen.getByText(/only time/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('rvn_mcp_secret-value')).not.toBeInTheDocument();
  });

  it('needs a name before it will make one', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    render(<AgentAccessPage />);
    await screen.findByText(/No agent has access/);
    expect(screen.getByRole('button', { name: 'Create a key' })).toBeDisabled();
  });

  it('revokes one after confirming', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [existing]))
      .mockResolvedValueOnce(jsonResponse(204, null))
      .mockResolvedValueOnce(jsonResponse(200, []));
    render(<AgentAccessPage />);
    await screen.findByText('Claude Desktop');
    await userEvent.click(screen.getByRole('button', { name: 'Revoke Claude Desktop' }));
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(await screen.findByText(/No agent has access/)).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/mcp\/tokens\/1\/$/);
  });

  it('shows the error with a retry', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(500, { detail: 'Boom' }))
      .mockResolvedValueOnce(jsonResponse(200, [existing]));
    render(<AgentAccessPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Claude Desktop')).toBeInTheDocument();
  });

  it('tells you where to point the agent', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, []));
    render(<AgentAccessPage />);
    expect(await screen.findByText(/\/api\/v1\/mcp\//)).toBeInTheDocument();
  });
});
