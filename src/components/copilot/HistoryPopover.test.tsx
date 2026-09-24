import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { HistoryPopover } from './CopilotRail';
import { stubCopilot } from './testCopilot';

const origin = { surface: 'dashboard', area: 'revenue', view: 'forecast', filters: { owner: '2', lifecycle: '', customer: '' } };

describe('HistoryPopover', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('tags each dashboard conversation with where it started, and nothing else', async () => {
    stubCopilot({
      conversations: [
        { id: 1, title: 'Why is at-risk ARR up?', created_at: '', updated_at: '', origin },
        { id: 2, title: 'What is going on with Pizza Hut?', created_at: '', updated_at: '', origin: null },
      ],
    });
    render(<HistoryPopover onClose={() => {}} onOpen={() => {}} />);
    const tagged = await screen.findByRole('button', { name: /Why is at-risk ARR up\?/ });
    expect(within(tagged).getByText('Revenue › Forecast')).toBeInTheDocument();
    expect(tagged).toHaveAccessibleName(/Why is at-risk ARR up\?\s*Started on the dashboard: Revenue › Forecast/);
    expect(screen.getByRole('button', { name: 'What is going on with Pizza Hut?' })).toBeInTheDocument();
  });
});
