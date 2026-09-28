import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Attachment } from '../../../features/files/filesSlice';
import { FILES } from '../../../features/organizations/testStory';
import { FileItem } from './FileItem';

function renderItem(file: Attachment, canDelete = true) {
  const handlers = { onDownload: vi.fn(), onDelete: vi.fn() };
  render(
    <ul>
      <FileItem file={file} canDelete={canDelete} {...handlers} />
    </ul>,
  );
  return handlers;
}

describe('FileItem (spec 2026-09-27 §4)', () => {
  it('shows name, size, description, account, uploader, source and date', () => {
    renderItem(FILES[0]);
    const item = screen.getByRole('listitem');
    expect(within(item).getByText('240 KB')).toHaveClass('font-mono-brand', 'tabular-nums');
    for (const text of ['Signed order form', 'EMEA', 'Alice · Upload', '20 Sep 2026']) expect(within(item).getByText(text)).toBeInTheDocument();
  });

  it('names a call transcript as such, and tags a file on the organization', () => {
    renderItem({ ...FILES[1], source: 'transcript' });
    expect(screen.getByText('Carl CSM · Call transcript')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
  });

  it('downloads from its name, and deletes only where allowed', async () => {
    const { onDownload, onDelete } = renderItem(FILES[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Order form.pdf' }));
    expect(onDownload).toHaveBeenCalledOnce();
    const del = screen.getByRole('button', { name: 'Delete Order form.pdf' });
    expect(del).toHaveClass('h-11', 'w-11', 'sm:h-9', 'sm:w-9');
    await userEvent.click(del);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('offers no delete to someone who may not', () => {
    renderItem(FILES[0], false);
    expect(screen.queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument();
  });
});
