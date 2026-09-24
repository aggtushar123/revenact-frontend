import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetViewport } from '../../../test/viewport';
import { stubCopilot } from '../../../components/copilot/testCopilot';
import { renderDashboard, Where } from './testAsk';
import { ASK_PREFERENCE_KEY } from './askPreference';

describe('the Ask sheet on a phone', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => resetViewport());

  it('has no rail, only an Ask button, even when the rail was left open on a desktop', () => {
    stubCopilot();
    localStorage.setItem(ASK_PREFERENCE_KEY, 'open');
    renderDashboard('/dashboard/overview', () => <Where />, 375);
    expect(screen.queryByRole('complementary', { name: 'Ask Revenact' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens full screen with focus inside, and gives focus back on Escape and on close', async () => {
    stubCopilot();
    renderDashboard('/dashboard/overview', () => <Where />, 375);
    const button = screen.getByRole('button', { name: 'Ask' });
    await userEvent.click(button);
    const sheet = screen.getByRole('dialog', { name: 'Ask Revenact' });
    expect(sheet).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByPlaceholderText('Ask Revenact')).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Ask Revenact' })).not.toBeInTheDocument();
    expect(button).toHaveFocus();

    await userEvent.click(button);
    await userEvent.click(screen.getByRole('button', { name: 'Close Ask Revenact' }));
    expect(screen.queryByRole('dialog', { name: 'Ask Revenact' })).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('keeps Tab inside the sheet', async () => {
    stubCopilot();
    renderDashboard('/dashboard/overview', () => <Where />, 375);
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    screen.getByRole('button', { name: 'New chat' }).focus();
    await userEvent.tab({ shift: true });
    const sheet = screen.getByRole('dialog', { name: 'Ask Revenact' });
    expect(sheet).toContainElement(document.activeElement as HTMLElement);
  });
});
