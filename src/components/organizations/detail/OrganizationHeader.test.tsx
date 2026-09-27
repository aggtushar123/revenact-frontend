import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { initech, pizzaHut } from '../../../features/organizations/testPortfolio';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { OrganizationHeader } from './OrganizationHeader';

function renderHeader(row: PortfolioRow = pizzaHut, canEdit = true) {
  const handlers = { onEdit: vi.fn(), onArchive: vi.fn(), onChurn: vi.fn() };
  render(<OrganizationHeader row={row} canEdit={canEdit} {...handlers} />);
  return handlers;
}

describe('OrganizationHeader (spec §1.2)', () => {
  it('shows initials and no image, the name, owner · lifecycle · last touch, and the signal', () => {
    renderHeader();
    expect(screen.getByRole('heading', { level: 1, name: 'Pizza Hut' })).toHaveAttribute('data-field', 'organization');
    expect(screen.getByText('PH')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('Carl CSM').closest('p')).toHaveTextContent('Carl CSM · Live · Touched 33d ago');
    expect(screen.getByText('Renewal overdue')).toBeInTheDocument();
  });

  it('Edit opens the edit form once the record is there', async () => {
    const { onEdit } = renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('Edit waits while the record loads', () => {
    renderHeader(pizzaHut, false);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says why Edit is off when the record could not load, and tries again', async () => {
    const onRetryEdit = vi.fn();
    render(
      <OrganizationHeader
        row={pizzaHut}
        canEdit={false}
        editError="Try later."
        onRetryEdit={onRetryEdit}
        onEdit={vi.fn()}
        onArchive={vi.fn()}
        onChurn={vi.fn()}
      />,
    );
    const edit = screen.getByRole('button', { name: 'Edit' });
    expect(edit).toBeDisabled();
    expect(edit).toHaveAccessibleDescription('Edit is unavailable: Try later.');
    expect(screen.getByRole('alert')).toHaveTextContent('Edit is unavailable: Try later.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetryEdit).toHaveBeenCalledOnce();
  });

  it('⋯ holds Archive and Churn', async () => {
    const { onArchive, onChurn } = renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));
    expect(onArchive).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Pizza Hut' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Churn' }));
    expect(onChurn).toHaveBeenCalledOnce();
  });

  it('offers only what still applies: a churned account cannot churn again', async () => {
    renderHeader(initech);
    expect(screen.getByText('Churned')).toBeInTheDocument();
    expect(screen.getByText('Unassigned').closest('p')).toHaveTextContent('Unassigned · Churn · Never contacted');
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Initech' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Archive']);
  });

  it('has no ⋯ when nothing applies (churned and archived)', () => {
    renderHeader({ ...initech, is_archived: true });
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More actions for Initech' })).not.toBeInTheDocument();
  });
});
