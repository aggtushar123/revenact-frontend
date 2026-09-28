import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountTag, ListSearch, ListSkeleton, NoMatch, ScopedEmpty, SummaryLine } from './ListParts';

describe('the list parts People, Deals & risks and Files share', () => {
  it('tags a record with its account, truncating a long name', () => {
    render(<AccountTag record={{ account_id: 31, account_name: "EMEA" }} />);
    expect(screen.getByText('EMEA')).toHaveClass('truncate', 'bg-subtle', 'rounded-full');
  });

  it('writes a summary as one line, its figures in DM Mono', () => {
    render(
      <SummaryLine
        parts={[
          { value: '3', label: 'people' },
          { value: '67%', label: 'positive sentiment' },
        ]}
      />,
    );
    expect(document.querySelector('[data-summary]')).toHaveTextContent('3 people · 67% positive sentiment');
    expect(screen.getByText('67%')).toHaveClass('font-mono-brand', 'tabular-nums');
  });

  it('shows a named skeleton list while loading', () => {
    render(<ListSkeleton label="Loading people" />);
    expect(screen.getByRole('status', { name: 'Loading people' })).toBeInTheDocument();
  });

  it('offers All when the chosen account has nothing, and says "yet" otherwise', async () => {
    const onShowAll = vi.fn();
    const { unmount } = render(<ScopedEmpty what="people" scope="EMEA" detail="Add the people you work with here." onShowAll={onShowAll} />);
    expect(screen.getByText('No people on EMEA')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show all accounts' }));
    expect(onShowAll).toHaveBeenCalledOnce();
    unmount();
    render(<ScopedEmpty what="people" scope={null} detail="Add the people you work with here." onShowAll={onShowAll} />);
    expect(screen.getByText('No people yet')).toBeInTheDocument();
    expect(screen.getByText('Add the people you work with here.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show all accounts' })).not.toBeInTheDocument();
  });

  it('says nothing matches a search, and clears it', async () => {
    const onClear = vi.fn();
    render(<NoMatch q=" zzz " onClear={onClear} />);
    expect(screen.getByText('Nothing matches “zzz”')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('labels its search, with a 44px field below sm', async () => {
    const onChange = vi.fn();
    render(<ListSearch label="Search people" value="" onChange={onChange} isSm={false} />);
    const box = screen.getByRole('searchbox', { name: 'Search people' });
    expect(box).toHaveClass('min-h-11', 'sm:min-h-9');
    await userEvent.type(box, 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
