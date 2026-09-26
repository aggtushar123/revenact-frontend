import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from './Menu';

function renderMenu() {
  const onArchive = vi.fn();
  const onChurn = vi.fn();
  render(
    <>
      <Menu
        label="More actions for Pizza Hut"
        trigger="More"
        triggerClassName=""
        items={[
          { key: 'archive', label: 'Archive', onSelect: onArchive },
          { key: 'churn', label: 'Churn', onSelect: onChurn, danger: true },
        ]}
      />
      <p>Outside</p>
    </>,
  );
  return { onArchive, onChurn, button: screen.getByRole('button', { name: 'More actions for Pizza Hut' }) };
}

describe('Menu', () => {
  it('opens with the first item focused; arrows, Home and End move and wrap', async () => {
    const { button } = renderMenu();
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'More actions for Pizza Hut' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Churn' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Churn' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  });

  it('closes on Escape and gives focus back to the button', async () => {
    const { button } = renderMenu();
    await userEvent.click(button);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('runs the chosen item, closes, and focuses the button', async () => {
    const { button, onChurn } = renderMenu();
    await userEvent.click(button);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Churn' }));
    expect(onChurn).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('closes on a press outside, and opens from the keyboard with ArrowDown', async () => {
    const { button } = renderMenu();
    await userEvent.click(button);
    await userEvent.click(screen.getByText('Outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    button.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  });
});
