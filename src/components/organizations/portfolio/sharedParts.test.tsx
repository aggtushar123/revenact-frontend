import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCallback, useRef, useState } from 'react';
import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChipRow } from './FilterChips';
import { FilterSheet, GroupSortFields } from './filterParts';
import { MoveToMenu } from './MoveToMenu';
import { RowSkeleton } from './PortfolioSections';
import { TileButton, TilesSkeleton } from './tileParts';
import { useSearchText } from './useSearchText';

function SheetHarness({ isSm }: { isSm: boolean }) {
  const [open, setOpen] = useState(true);
  const close = useCallback(() => setOpen(false), []);
  const trigger = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLSelectElement>(null);
  return (
    <>
      <button ref={trigger} type="button">
        Open filters
      </button>
      {open ? (
        <FilterSheet isSm={isSm} onClose={close} triggerRef={trigger} initialFocusRef={first}>
          <select ref={first} aria-label="Owner">
            <option>Everyone</option>
          </select>
        </FilterSheet>
      ) : null}
    </>
  );
}

describe('the shared portfolio parts', () => {
  afterEach(() => vi.useRealTimers());

  it('TileButton is a pressed toggle named by its label; TilesSkeleton draws one placeholder per tile', async () => {
    const onClick = vi.fn();
    render(
      <>
        <TileButton pressed label="Overdue: 2" onClick={onClick}>
          <span>2</span>
        </TileButton>
        <TilesSkeleton count={3} />
      </>,
    );
    const button = screen.getByRole('button', { name: 'Overdue: 2' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveClass('bg-subtle');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('status', { name: 'Loading summary' }).children).toHaveLength(3);
  });

  it('FilterSheet focuses its first control, closes on Escape and hands focus back to the trigger', async () => {
    render(<SheetHarness isSm />);
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(within(dialog).getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(screen.getByRole('combobox', { name: 'Owner' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open filters' })).toHaveFocus();
  });

  it('FilterSheet is a modal bottom sheet below sm, closed by its button', async () => {
    render(<SheetHarness isSm={false} />);
    expect(screen.getByRole('dialog', { name: 'Filters' })).toHaveAttribute('aria-modal', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Close filters' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('GroupSortFields reports a group, a sort field kept in its direction, and a direction flip', async () => {
    const onGroup = vi.fn();
    const onSort = vi.fn();
    render(
      <GroupSortFields
        group="stage"
        sort="-mrr"
        groupOptions={[
          { value: 'none', label: 'None' },
          { value: 'stage', label: 'Stage' },
        ]}
        sortOptions={[
          { value: 'mrr', label: 'MRR' },
          { value: 'title', label: 'Title' },
        ]}
        onGroup={onGroup}
        onSort={onSort}
      />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'none');
    expect(onGroup).toHaveBeenCalledWith('none');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'title');
    expect(onSort).toHaveBeenCalledWith('-title');
    await userEvent.click(screen.getByRole('button', { name: 'Descending' }));
    expect(onSort).toHaveBeenLastCalledWith('mrr');
  });

  it('ChipRow removes a chip with its patch, clears all, and says the count', async () => {
    const onChange = vi.fn();
    const onClearAll = vi.fn();
    render(
      <ChipRow<{ q: string }>
        chips={[{ key: 'q', label: 'Search: emea', patch: { q: '' } }]}
        status="1 of 3 things"
        onChange={onChange}
        onClearAll={onClearAll}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Search: emea' }));
    expect(onChange).toHaveBeenCalledWith({ q: '' });
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onClearAll).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 things');
  });

  it('MoveToMenu lists the targets, chooses one and hands focus back to its button', async () => {
    const onChoose = vi.fn();
    render(
      <MoveToMenu
        name="EMEA seats"
        disabled={false}
        note={null}
        targets={[
          { value: 'closed_won', label: 'Closed Won' },
          { value: 'closed_lost', label: 'Closed Lost' },
        ]}
        onChoose={onChoose}
      />,
    );
    const button = screen.getByRole('button', { name: 'Move EMEA seats to…' });
    await userEvent.click(button);
    const menu = screen.getByRole('menu', { name: 'Move EMEA seats to' });
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Closed Won', 'Closed Lost']);
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Closed Lost' }));
    expect(onChoose).toHaveBeenCalledWith('closed_lost');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('useSearchText commits 300ms after typing stops, and follows a new committed value', () => {
    vi.useFakeTimers();
    const commit = vi.fn();
    const { result, rerender } = renderHook(({ committed }: { committed: string }) => useSearchText(committed, commit), {
      initialProps: { committed: '' },
    });
    act(() => result.current[1]('emea '));
    expect(result.current[0]).toBe('emea ');
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(commit).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(commit).toHaveBeenCalledWith('emea');
    rerender({ committed: 'globex' });
    expect(result.current[0]).toBe('globex');
  });

  it('RowSkeleton takes the label a caller gives it', () => {
    render(<RowSkeleton count={2} label="Loading risks" />);
    expect(screen.getByRole('status', { name: 'Loading risks' })).toBeInTheDocument();
  });
});
