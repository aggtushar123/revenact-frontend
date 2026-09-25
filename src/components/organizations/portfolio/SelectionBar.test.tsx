import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectionBar, type BulkReport } from './SelectionBar';
import { FILTER_OPTIONS } from '../../../features/organizations/testPortfolio';

function renderBar(count: number, report: BulkReport | null = null, busy = false) {
  const props = {
    count,
    owners: FILTER_OPTIONS.owners,
    lifecycles: FILTER_OPTIONS.lifecycles,
    busy,
    report,
    onSetOwner: vi.fn(),
    onSetLifecycle: vi.fn(),
    onExport: vi.fn(),
    onArchive: vi.fn(),
    onChurn: vi.fn(),
    onClose: vi.fn(),
  };
  const view = render(<SelectionBar {...props} />);
  return { ...props, ...view };
}

describe('SelectionBar', () => {
  it('renders nothing with no selection and no report', () => {
    const { container } = renderBar(0);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces the selected count politely as it changes', () => {
    const view = renderBar(2);
    const count = screen.getByText(/selected/).closest('p');
    expect(count).toHaveAttribute('aria-live', 'polite');
    view.rerender(<SelectionBar {...view} count={3} />);
    expect(count).toHaveTextContent('3 selected');
  });

  it('changes owner (Unassigned sends null) and lifecycle (never churn)', async () => {
    const { onSetOwner, onSetLifecycle } = renderBar(2);
    expect(screen.getByRole('region', { name: 'Selection' })).toHaveTextContent('2 selected');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Change owner' }), '3');
    expect(onSetOwner).toHaveBeenLastCalledWith(3);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Change owner' }), 'unassigned');
    expect(onSetOwner).toHaveBeenLastCalledWith(null);
    const stage = screen.getByRole('combobox', { name: 'Set lifecycle' });
    expect(within(stage).queryByRole('option', { name: 'Churn' })).not.toBeInTheDocument();
    await userEvent.selectOptions(stage, 'live');
    expect(onSetLifecycle).toHaveBeenCalledWith('live');
  });

  it('exports and archives; churn only for one account', async () => {
    const two = renderBar(2);
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    await userEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(two.onExport).toHaveBeenCalled();
    expect(two.onArchive).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Churn' })).not.toBeInTheDocument();
    two.unmount();

    const one = renderBar(1);
    await userEvent.click(screen.getByRole('button', { name: 'Churn' }));
    expect(one.onChurn).toHaveBeenCalled();
  });

  it('reports partial failures per account', () => {
    renderBar(1, { updated: 1, failed: [{ id: 1, name: 'Globex', reason: 'Not found.' }] });
    const bar = screen.getByRole('region', { name: 'Selection' });
    expect(bar).toHaveTextContent('Updated 1 organization. 1 failed:');
    expect(bar).toHaveTextContent('Globex: Not found.');
  });

  it('keeps the report after the selection empties, with a Dismiss', async () => {
    const { onClose } = renderBar(0, { updated: 2, failed: [] });
    expect(screen.getByRole('region', { name: 'Selection' })).toHaveTextContent('Updated 2 organizations.');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables actions while applying', () => {
    renderBar(2, null, true);
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Change owner' })).toBeDisabled();
    expect(screen.getByText('Applying…')).toBeInTheDocument();
  });
});
