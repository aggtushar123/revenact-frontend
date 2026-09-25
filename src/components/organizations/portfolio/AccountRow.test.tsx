import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AccountRow, LONG_PRESS_MS, type AccountRowProps } from './AccountRow';
import { pizzaHut } from '../../../features/organizations/testPortfolio';

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
  afterEach(() => vi.useRealTimers());

  it('shows the eight row elements', () => {
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

  it('shows pinned fields as chips', () => {
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
});
