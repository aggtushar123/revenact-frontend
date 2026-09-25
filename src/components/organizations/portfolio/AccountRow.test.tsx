import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AccountRow, LONG_PRESS_MS, type AccountRowProps } from './AccountRow';
import { pizzaHut } from '../../../features/organizations/testPortfolio';
import { resetViewport, setViewport } from '../../../test/viewport';

function renderRow(overrides: Partial<AccountRowProps> = {}) {
  const props: AccountRowProps = {
    row: pizzaHut,
    currency: 'USD',
    pins: [],
    selecting: false,
    selected: false,
    open: false,
    onToggleSelect: vi.fn(),
    onLongPress: vi.fn(),
    onToggleOpen: vi.fn(),
    ...overrides,
  };
  const view = render(
    <MemoryRouter>
      <ul>
        <AccountRow {...props} />
      </ul>
    </MemoryRouter>,
  );
  return { ...view, props, header: view.container.querySelector('[data-part="header"]') as HTMLElement };
}

describe('AccountRow', () => {
  afterEach(() => {
    vi.useRealTimers();
    resetViewport();
  });

  it('shows all eight row elements on desktop', () => {
    setViewport(1440);
    const { container } = renderRow();
    expect(screen.getByRole('link', { name: 'Pizza Hut' })).toHaveAttribute('href', '/organizations/7');
    expect(container).toHaveTextContent('Carl CSM · Live · Touched 33d ago');
    expect(screen.getByRole('img', { name: 'Health 4.9, Average' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Health falling from 6.2 to 4.9 over 6 months' })).toBeInTheDocument();
    expect(screen.getByText('47d overdue')).toBeInTheDocument();
    expect(screen.getByText('$69.6K')).toHaveClass('font-mono-brand', 'tabular-nums');
    expect(container).toHaveTextContent('AI 1 · CSM 3');
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('pulses disagree')).toBeInTheDocument();
    expect(screen.getByText('Renewal overdue')).toBeInTheDocument();
  });

  it('shows only the phone-card elements on phones, not the runway, pulse or pins', () => {
    // Default: jsdom has no matchMedia, so useMediaQuery reads false (phone).
    const { container } = renderRow({ pins: ['nps'] });
    expect(screen.getByRole('link', { name: 'Pizza Hut' })).toHaveAttribute('href', '/organizations/7');
    expect(container).toHaveTextContent('Carl CSM · Live · Touched 33d ago');
    expect(screen.getByRole('img', { name: 'Health 4.9, Average' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Health falling from 6.2 to 4.9 over 6 months' })).toBeInTheDocument();
    expect(screen.getByText('$69.6K')).toHaveClass('font-mono-brand', 'tabular-nums');
    expect(screen.getByText('Renewal overdue')).toBeInTheDocument();
    expect(screen.queryByText('47d overdue')).not.toBeInTheDocument();
    expect(screen.queryByText('High Risk')).not.toBeInTheDocument();
    expect(screen.queryByText('pulses disagree')).not.toBeInTheDocument();
    expect(container.querySelector('[data-pin="nps"]')).not.toBeInTheDocument();
  });

  it('opens from the row or the chevron, and the name navigates instead', async () => {
    const { props, header } = renderRow();
    await userEvent.click(header);
    expect(props.onToggleOpen).toHaveBeenCalledWith(pizzaHut);
    await userEvent.click(screen.getByRole('button', { name: 'Open Pizza Hut' }));
    expect(props.onToggleOpen).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole('link', { name: 'Pizza Hut' }));
    expect(props.onToggleOpen).toHaveBeenCalledTimes(2);
  });

  it('reports its open state on the chevron', () => {
    renderRow({ open: true, children: <div id="account-7-details">details</div> });
    const chevron = screen.getByRole('button', { name: 'Close Pizza Hut' });
    expect(chevron).toHaveAttribute('aria-expanded', 'true');
    expect(chevron).toHaveAttribute('aria-controls', 'account-7-details');
    expect(screen.getByText('details')).toBeInTheDocument();
  });

  it('selects from its checkbox, and a tap selects while in selection mode', async () => {
    const { props, header } = renderRow({ selecting: true });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Pizza Hut' }));
    expect(props.onToggleSelect).toHaveBeenCalledWith(7);
    await userEvent.click(header);
    expect(props.onToggleSelect).toHaveBeenCalledTimes(2);
    expect(props.onToggleOpen).not.toHaveBeenCalled();
  });

  it('shows pinned fields as chips on desktop', () => {
    setViewport(1440);
    const { container } = renderRow({ pins: ['nps', 'totalSeatUtilization'] });
    expect(container.querySelector('[data-pin="nps"]')).toHaveTextContent('NPS −80');
    expect(container.querySelector('[data-pin="totalSeatUtilization"]')).toHaveTextContent('Seats 16%');
  });

  it('starts selection on a long press and swallows the click that follows', () => {
    vi.useFakeTimers();
    const { props, header } = renderRow();
    fireEvent.pointerDown(header);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(props.onLongPress).toHaveBeenCalledWith(7);
    fireEvent.pointerUp(header);
    fireEvent.click(header);
    expect(props.onToggleOpen).not.toHaveBeenCalled();
  });

  it('treats a short press as a tap', () => {
    vi.useFakeTimers();
    const { props, header } = renderRow();
    fireEvent.pointerDown(header);
    vi.advanceTimersByTime(LONG_PRESS_MS - 300);
    fireEvent.pointerUp(header);
    fireEvent.click(header);
    expect(props.onLongPress).not.toHaveBeenCalled();
    expect(props.onToggleOpen).toHaveBeenCalledWith(pizzaHut);
  });

  it('clears the long-press timer on unmount so it never fires late', () => {
    vi.useFakeTimers();
    const { props, header, unmount } = renderRow();
    fireEvent.pointerDown(header);
    unmount();
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(props.onLongPress).not.toHaveBeenCalled();
  });

  it('reaches the chevron by Tab and toggles it with Enter and Space', async () => {
    const user = userEvent.setup();
    const { props } = renderRow();
    const chevron = screen.getByRole('button', { name: 'Open Pizza Hut' });
    for (let i = 0; i < 8 && document.activeElement !== chevron; i++) {
      await user.tab();
    }
    expect(chevron).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(props.onToggleOpen).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(props.onToggleOpen).toHaveBeenCalledTimes(2);
  });
});
